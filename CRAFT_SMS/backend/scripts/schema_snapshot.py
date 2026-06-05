#!/usr/bin/env python3
"""
scripts/schema_snapshot.py

Baseline snapshot tool for environments where pg_dump is not available
(e.g. Windows dev machines, CI without PG client tools).

Connects via psycopg2 and captures:
  - All table names in public schema
  - Row counts per table
  - Index count per table
  - Constraint count per table

Output is written to backups/schema_snapshot_<timestamp>.json
This snapshot is used as the data consistency baseline for Phase B
validation (Supabase row counts must match Cloud SQL row counts).
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import psycopg2


DIRECT_URL = (
    os.environ.get("DIRECT_URL")
    or "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
)

CRITICAL_TABLES = [
    "schools", "profiles", "slips", "lesson_plans", "lesson_plan_comments",
    "attendance", "grades", "notifications", "parent_student_links",
    "messages", "broadcasts", "audit_logs",
]


def main() -> None:
    output_dir = Path("backups")
    output_dir.mkdir(exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_file = output_dir / f"schema_snapshot_{ts}.json"

    print(f"[SNAPSHOT] Connecting to Supabase...")
    try:
        conn = psycopg2.connect(DIRECT_URL)
        cur  = conn.cursor()
    except Exception as e:
        print(f"[ERROR] Could not connect: {e}")
        sys.exit(1)

    snapshot: dict = {
        "captured_at": ts,
        "source": "supabase",
        "tables": {},
        "totals": {},
    }

    # ── Per-table stats ────────────────────────────────────────────────
    for table in CRITICAL_TABLES:
        entry: dict = {}

        # Row count
        try:
            cur.execute(f"SELECT COUNT(*) FROM public.{table}")
            entry["row_count"] = cur.fetchone()[0]
        except Exception as e:
            entry["row_count"] = f"ERROR: {e}"
            conn.rollback()

        # Index count
        try:
            cur.execute(
                "SELECT COUNT(*) FROM pg_indexes "
                "WHERE schemaname='public' AND tablename=%s",
                (table,),
            )
            entry["index_count"] = cur.fetchone()[0]
        except Exception as e:
            entry["index_count"] = f"ERROR: {e}"
            conn.rollback()

        # Constraint count
        try:
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.table_constraints "
                "WHERE constraint_schema='public' AND table_name=%s",
                (table,),
            )
            entry["constraint_count"] = cur.fetchone()[0]
        except Exception as e:
            entry["constraint_count"] = f"ERROR: {e}"
            conn.rollback()

        snapshot["tables"][table] = entry

    # ── Schema-wide totals ─────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'")
    snapshot["totals"]["total_indexes"] = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM information_schema.table_constraints "
        "WHERE constraint_schema='public'"
    )
    snapshot["totals"]["total_constraints"] = cur.fetchone()[0]

    cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
    )
    snapshot["totals"]["all_tables"] = [r[0] for r in cur.fetchall()]

    conn.close()

    # ── Write output ───────────────────────────────────────────────────
    out_file.write_text(json.dumps(snapshot, indent=2))
    print(f"[SNAPSHOT] OK — Written to {out_file}")

    # Pretty-print summary
    print(f"\n{'Table':<35} {'Rows':>8}  {'Indexes':>7}  {'Constraints':>11}")
    print("-" * 65)
    for t, data in snapshot["tables"].items():
        print(
            f"  {t:<33} {str(data.get('row_count','-')):>8}"
            f"  {str(data.get('index_count','-')):>7}"
            f"  {str(data.get('constraint_count','-')):>11}"
        )
    print(f"\n  Total public indexes:     {snapshot['totals']['total_indexes']}")
    print(f"  Total public constraints: {snapshot['totals']['total_constraints']}")
    print(f"  Total public tables:      {len(snapshot['totals']['all_tables'])}")
    print(f"\n[SNAPSHOT] Baseline captured. Use this file for Phase B consistency validation.")


if __name__ == "__main__":
    main()
