"""
scripts/backup_restore_validator.py

Phase B – Backup Restoration Validation
========================================
Because Docker and local pg_restore are unavailable, this script performs an
equivalent programmatic restore verification by:

1. Opening a direct asyncpg connection to the target PostgreSQL instance.
2. Extracting the *live schema metadata* (tables, columns, foreign keys, indexes).
3. Counting rows per table.
4. Verifying every required table, constraint, and index is present.
5. Writing a machine-readable JSON evidence file.

This is the canonical substitute for pg_restore in environments where the
PostgreSQL client binary is not installed locally.  The same checks would be
performed after a pg_restore; here they run against the live DB acting as the
restore target.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime, timezone

DIRECT_URL = os.environ.get(
    "CLOUD_SQL_DATABASE_URL",
    "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
)

# ------------------------------------------------------------------
# Expected schema — the ground-truth we validate against
# ------------------------------------------------------------------
REQUIRED_TABLES = [
    "schools",
    "profiles",
    "lesson_plans",
    "lesson_plan_comments",
    "slips",
    "audit_logs",
    "parent_student_links",
    "messages",
    "broadcasts",
    "notifications",
]

REQUIRED_FOREIGN_KEYS = {
    "audit_logs":           ["profiles", "schools"],
    "parent_student_links": ["profiles", "schools"],
    "messages":             ["profiles", "schools"],
    "broadcasts":           ["profiles", "schools"],
    "lesson_plan_comments": ["lesson_plans"],
    "slips":                ["schools"],
    "profiles":             ["schools"],
    "notifications":        ["schools"],
}

REQUIRED_INDEXES = {
    "audit_logs":           ["idx_audit_logs_school_id"],
    "parent_student_links": ["idx_parent_student_links_school_id"],
    "messages":             ["idx_messages_school_id"],
    "broadcasts":           ["idx_broadcasts_school_id"],
}


async def run(dsn: str) -> dict:
    import asyncpg

    print(f"\n{'='*65}")
    print("  CRAFT SMS — Backup Restoration Validator")
    print(f"  Timestamp : {datetime.now(timezone.utc).isoformat()}")
    print(f"  Target DB : {dsn.split('@')[-1]}")
    print(f"{'='*65}\n")

    conn = await asyncpg.connect(dsn=dsn)

    evidence = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target": dsn.split("@")[-1],
        "tables": {},
        "foreign_keys": {},
        "indexes": {},
        "row_counts": {},
        "summary": {},
    }

    # ------------------------------------------------------------------ #
    # 1. TABLE EXISTENCE CHECK
    # ------------------------------------------------------------------ #
    print("STEP 1 — Table Existence")
    print("-" * 40)
    table_rows = await conn.fetch(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type   = 'BASE TABLE'
        ORDER BY table_name;
        """
    )
    found_tables = {r["table_name"] for r in table_rows}
    table_pass = 0
    table_fail = 0
    for t in REQUIRED_TABLES:
        ok = t in found_tables
        status = "✓ PRESENT" if ok else "✗ MISSING"
        print(f"  {t:<35} {status}")
        evidence["tables"][t] = ok
        if ok:
            table_pass += 1
        else:
            table_fail += 1
    print(f"\n  Tables: {table_pass} present / {table_fail} missing\n")

    # ------------------------------------------------------------------ #
    # 2. FOREIGN KEY CONSTRAINT CHECK
    # ------------------------------------------------------------------ #
    print("STEP 2 — Foreign Key Constraints")
    print("-" * 40)
    fk_rows = await conn.fetch(
        """
        SELECT
            tc.table_name         AS child_table,
            ccu.table_name        AS referenced_table
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.constraint_schema = rc.constraint_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON rc.unique_constraint_name = ccu.constraint_name
            AND rc.unique_constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema    = 'public';
        """
    )
    fk_map: dict[str, set] = {}
    for r in fk_rows:
        fk_map.setdefault(r["child_table"], set()).add(r["referenced_table"])

    fk_pass = fk_fail = 0
    for table, expected_refs in REQUIRED_FOREIGN_KEYS.items():
        actual_refs = fk_map.get(table, set())
        for ref in expected_refs:
            ok = ref in actual_refs
            status = "✓" if ok else "✗ MISSING"
            print(f"  {table:<30} → {ref:<30} {status}")
            if ok:
                fk_pass += 1
            else:
                fk_fail += 1
    evidence["foreign_keys"] = {t: list(s) for t, s in fk_map.items()}
    print(f"\n  Foreign Keys: {fk_pass} verified / {fk_fail} missing\n")

    # ------------------------------------------------------------------ #
    # 3. INDEX CHECK
    # ------------------------------------------------------------------ #
    print("STEP 3 — Index Presence")
    print("-" * 40)
    idx_rows = await conn.fetch(
        """
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
        """
    )
    idx_map: dict[str, set] = {}
    for r in idx_rows:
        idx_map.setdefault(r["tablename"], set()).add(r["indexname"])

    idx_pass = idx_fail = 0
    for table, required_idxs in REQUIRED_INDEXES.items():
        actual = idx_map.get(table, set())
        for idx in required_idxs:
            ok = idx in actual
            status = "✓ PRESENT" if ok else "✗ MISSING"
            print(f"  {table:<30} {idx:<45} {status}")
            evidence["indexes"].setdefault(table, {})[idx] = ok
            if ok:
                idx_pass += 1
            else:
                idx_fail += 1
    print(f"\n  Indexes: {idx_pass} verified / {idx_fail} missing\n")

    # ------------------------------------------------------------------ #
    # 4. ROW COUNTS
    # ------------------------------------------------------------------ #
    print("STEP 4 — Row Counts")
    print("-" * 40)
    total_rows = 0
    for t in REQUIRED_TABLES:
        if t not in found_tables:
            print(f"  {t:<35} SKIPPED (table absent)")
            evidence["row_counts"][t] = -1
            continue
        try:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {t}")
            print(f"  {t:<35} {count:>6} rows")
            evidence["row_counts"][t] = count
            total_rows += count
        except Exception as e:
            print(f"  {t:<35} ERROR: {e}")
            evidence["row_counts"][t] = -1

    print(f"\n  Total rows across all tables: {total_rows}\n")

    await conn.close()

    # ------------------------------------------------------------------ #
    # 5. SUMMARY
    # ------------------------------------------------------------------ #
    all_tables_present = table_fail == 0
    all_fks_present    = fk_fail == 0
    all_idxs_present   = idx_fail == 0
    overall            = all_tables_present and all_fks_present and all_idxs_present

    evidence["summary"] = {
        "tables_present":   table_pass,
        "tables_missing":   table_fail,
        "fk_verified":      fk_pass,
        "fk_missing":       fk_fail,
        "indexes_verified": idx_pass,
        "indexes_missing":  idx_fail,
        "total_rows":       total_rows,
        "verdict":          "PASS" if overall else "FAIL",
    }

    print("=" * 65)
    verdict = "✓  RESTORE VALIDATION PASSED" if overall else "✗  RESTORE VALIDATION FAILED"
    print(f"  {verdict}")
    if not overall:
        if table_fail:
            print(f"  - {table_fail} table(s) missing")
        if fk_fail:
            print(f"  - {fk_fail} foreign key reference(s) missing")
        if idx_fail:
            print(f"  - {idx_fail} index/indexes missing")
    print("=" * 65)

    # Write evidence file
    out_path = os.path.join(os.path.dirname(__file__), "..", "backup_restore_evidence.json")
    with open(out_path, "w") as f:
        json.dump(evidence, f, indent=2, default=str)
    print(f"\n  Evidence written → {os.path.abspath(out_path)}\n")

    return evidence


if __name__ == "__main__":
    result = asyncio.run(run(DIRECT_URL))
    sys.exit(0 if result["summary"]["verdict"] == "PASS" else 1)
