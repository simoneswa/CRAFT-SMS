"""
scripts/expanded_consistency.py

Phase B – Expanded Data Consistency Validation (9 tables)
==========================================================
Compares row counts and field sets returned by:
  A) SupabaseDatabaseProvider   (HTTP / PostgREST)
  B) CloudSQLDatabaseProvider   (asyncpg / raw SQL)

Tables checked:
  - schools, profiles, lesson_plans, slips          (core domain)
  - audit_logs, parent_student_links, messages,
    broadcasts, lesson_plan_comments, notifications  (Phase A additions)

Results are written to expanded_consistency_report.json.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

DIRECT_URL = os.environ.get(
    "CLOUD_SQL_DATABASE_URL",
    "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
)

TABLES = [
    "schools",
    "profiles",
    "lesson_plans",
    "slips",
    "audit_logs",
    "parent_student_links",
    "messages",
    "broadcasts",
    "lesson_plan_comments",
    "notifications",
]

LIMIT = 5  # rows to sample per table


async def check_cloudsql(dsn: str, table: str) -> dict[str, Any]:
    import asyncpg

    start = time.perf_counter()
    conn = await asyncpg.connect(dsn=dsn)
    count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
    rows  = await conn.fetch(f"SELECT * FROM {table} LIMIT {LIMIT}")
    await conn.close()
    latency_ms = (time.perf_counter() - start) * 1000

    sample = [dict(r) for r in rows]
    fields = set(sample[0].keys()) if sample else set()
    return {
        "row_count": count,
        "fields": sorted(fields),
        "latency_ms": round(latency_ms, 2),
        "error": None,
    }


def check_supabase(table: str) -> dict[str, Any]:
    from core.db import supabase_admin, supabase

    client = supabase_admin or supabase
    if client is None:
        return {"row_count": -1, "fields": [], "latency_ms": -1, "error": "No Supabase client"}

    start = time.perf_counter()
    try:
        # count via head request
        count_resp = client.table(table).select("*", count="exact").limit(0).execute()
        row_count  = count_resp.count if hasattr(count_resp, "count") and count_resp.count is not None else -1
        # sample rows
        sample_resp = client.table(table).select("*").limit(LIMIT).execute()
        latency_ms = (time.perf_counter() - start) * 1000
        data = sample_resp.data or []
        fields = set(data[0].keys()) if data else set()
        return {
            "row_count": row_count,
            "fields": sorted(fields),
            "latency_ms": round(latency_ms, 2),
            "error": None,
        }
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return {"row_count": -1, "fields": [], "latency_ms": round(latency_ms, 2), "error": str(e)}


async def main() -> None:
    print(f"\n{'='*70}")
    print("  CRAFT SMS — Expanded Data Consistency Validation (9 tables)")
    print(f"  Timestamp : {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*70}\n")

    report: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tables": {},
        "summary": {},
    }

    passed = failed = 0

    for table in TABLES:
        print(f"--- {table.upper()} ---")

        # Supabase (sync, runs in thread executor implicitly)
        loop = asyncio.get_event_loop()
        supa = await loop.run_in_executor(None, check_supabase, table)

        # Cloud SQL (async)
        try:
            csql = await check_cloudsql(DIRECT_URL, table)
        except Exception as e:
            csql = {"row_count": -1, "fields": [], "latency_ms": -1, "error": str(e)}

        # Compare
        row_match   = (supa["row_count"] == csql["row_count"]) if (supa["row_count"] != -1 and csql["row_count"] != -1) else None
        field_match = (set(supa["fields"]) == set(csql["fields"])) if (supa["fields"] and csql["fields"]) else None

        print(f"  Supabase   rows={supa['row_count']:>4}  latency={supa['latency_ms']:>7.2f}ms  err={supa['error']}")
        print(f"  CloudSQL   rows={csql['row_count']:>4}  latency={csql['latency_ms']:>7.2f}ms  err={csql['error']}")
        print(f"  Row count match : {'✓' if row_match else '✗' if row_match is False else 'N/A'}")
        print(f"  Field set match : {'✓' if field_match else '✗' if field_match is False else 'N/A'}")

        if supa["fields"] and csql["fields"] and supa["fields"] != csql["fields"]:
            print(f"  Supabase extra fields : {set(supa['fields']) - set(csql['fields'])}")
            print(f"  CloudSQL extra fields  : {set(csql['fields']) - set(supa['fields'])}")

        ok = (row_match is not False) and (field_match is not False) and csql["error"] is None
        print(f"  Status : {'PASS ✓' if ok else 'WARN ⚠'}\n")
        if ok:
            passed += 1
        else:
            failed += 1

        report["tables"][table] = {
            "supabase": supa,
            "cloudsql": csql,
            "row_count_match": row_match,
            "field_match": field_match,
            "status": "PASS" if ok else "WARN",
        }

    report["summary"] = {
        "tables_checked": len(TABLES),
        "passed": passed,
        "warnings": failed,
        "verdict": "PASS" if failed == 0 else f"WARN ({failed} tables need review)",
    }

    print("=" * 70)
    print(f"  Overall: {passed}/{len(TABLES)} tables — {report['summary']['verdict']}")
    print("=" * 70)

    out_path = os.path.join(os.path.dirname(__file__), "..", "expanded_consistency_report.json")
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n  Report written → {os.path.abspath(out_path)}\n")


if __name__ == "__main__":
    asyncio.run(main())
