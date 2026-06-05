#!/usr/bin/env python3
"""
scripts/backup_postgres.py

Full pg_dump backup strategy for CRAFT SMS.

Usage:
  python scripts/backup_postgres.py [--verify] [--output-dir PATH]

Requirements:
  - pg_dump installed (PostgreSQL client tools)
  - DIRECT_URL environment variable set to Supabase direct connection string
  - (Optional) BACKUP_GCS_BUCKET — if set, uploads the dump to GCS after creation

Steps performed:
  1. pg_dump (custom format) from source (Supabase or Cloud SQL)
  2. Calculates SHA-256 checksum of dump file
  3. (Optional) Uploads to GCS
  4. (Optional) --verify: restores into a local PostgreSQL instance and
     checks table existence, index count, constraints, and row counts.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SOURCE_URL = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
GCS_BUCKET = os.environ.get("BACKUP_GCS_BUCKET")  # e.g. "gs://craft-sms-backups"

CRITICAL_TABLES = [
    "schools",
    "profiles",
    "slips",
    "lesson_plans",
    "lesson_plan_comments",
    "attendance",
    "grades",
    "notifications",
    "parent_student_links",
    "messages",
    "broadcasts",
    "audit_logs",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _require(binary: str) -> str:
    path = shutil.which(binary)
    if not path:
        print(f"[ERROR] '{binary}' not found on PATH. Install PostgreSQL client tools.")
        sys.exit(1)
    return path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# Step 1: pg_dump
# ---------------------------------------------------------------------------
def run_dump(output_dir: Path) -> Path:
    _require("pg_dump")
    if not SOURCE_URL:
        print("[ERROR] DIRECT_URL or DATABASE_URL environment variable is required.")
        sys.exit(1)

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dump_file = output_dir / f"craft_sms_backup_{ts}.dump"
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "pg_dump",
        "--format=custom",          # compressed binary format; best for pg_restore
        "--no-owner",               # don't dump ownership (avoids role issues on restore)
        "--no-acl",                 # skip GRANT/REVOKE (re-applied by app layer)
        f"--file={dump_file}",
        SOURCE_URL,
    ]
    print(f"[BACKUP] Running pg_dump → {dump_file}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] pg_dump failed:\n{result.stderr}")
        sys.exit(1)

    checksum = sha256(dump_file)
    checksum_file = dump_file.with_suffix(".sha256")
    checksum_file.write_text(f"{checksum}  {dump_file.name}\n")

    size_mb = dump_file.stat().st_size / (1024 ** 2)
    print(f"[BACKUP] ✓ Dump complete — {size_mb:.1f} MB | SHA-256: {checksum}")
    return dump_file


# ---------------------------------------------------------------------------
# Step 2: (Optional) GCS upload
# ---------------------------------------------------------------------------
def upload_to_gcs(dump_file: Path) -> None:
    _require("gsutil")
    dest = f"{GCS_BUCKET}/{dump_file.name}"
    print(f"[UPLOAD] Uploading to {dest}")
    result = subprocess.run(["gsutil", "cp", str(dump_file), dest], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[WARNING] GCS upload failed: {result.stderr}")
    else:
        print(f"[UPLOAD] ✓ Uploaded to {dest}")


# ---------------------------------------------------------------------------
# Step 3: Restore + Verify (--verify flag)
# ---------------------------------------------------------------------------
def verify_backup(dump_file: Path) -> None:
    """Restore into a temporary local DB and verify integrity."""
    _require("pg_restore")
    _require("psql")

    verify_db = "craft_sms_verify_temp"
    print(f"[VERIFY] Restoring dump into local DB '{verify_db}'")

    # Create temp database
    subprocess.run(["psql", "-c", f"DROP DATABASE IF EXISTS {verify_db};"], check=False)
    result = subprocess.run(["psql", "-c", f"CREATE DATABASE {verify_db};"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] Could not create verify DB: {result.stderr}")
        sys.exit(1)

    # Restore dump
    result = subprocess.run(
        ["pg_restore", "--no-owner", "--no-acl", "-d", verify_db, str(dump_file)],
        capture_output=True, text=True,
    )
    if result.returncode not in (0, 1):  # pg_restore returns 1 for warnings
        print(f"[ERROR] pg_restore failed: {result.stderr}")
        sys.exit(1)

    # Verify tables, indexes, constraints, row counts
    import psycopg2
    conn = psycopg2.connect(dbname=verify_db)
    cur  = conn.cursor()

    print("\n[VERIFY] Table row counts:")
    all_ok = True
    for table in CRITICAL_TABLES:
        try:
            cur.execute(f"SELECT COUNT(*) FROM public.{table}")
            count = cur.fetchone()[0]
            print(f"  {table:<30} {count:>8} rows")
        except Exception as e:
            print(f"  {table:<30} MISSING — {e}")
            all_ok = False

    cur.execute("""
        SELECT COUNT(*) FROM pg_indexes
        WHERE schemaname = 'public'
    """)
    idx_count = cur.fetchone()[0]
    print(f"\n[VERIFY] Total indexes in public schema: {idx_count}")

    cur.execute("""
        SELECT COUNT(*) FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
    """)
    con_count = cur.fetchone()[0]
    print(f"[VERIFY] Total constraints in public schema: {con_count}")

    conn.close()

    # Drop temp database
    subprocess.run(["psql", "-c", f"DROP DATABASE IF EXISTS {verify_db};"], check=False)

    if all_ok:
        print("\n[VERIFY] ✓ Backup verified — all critical tables present.")
    else:
        print("\n[VERIFY] ✗ Some tables are missing. Review dump before cutover.")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="CRAFT SMS PostgreSQL backup tool")
    parser.add_argument("--verify",     action="store_true", help="Restore and verify after dump")
    parser.add_argument("--output-dir", default="backups",   help="Local directory for dump files")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    dump_file  = run_dump(output_dir)

    if GCS_BUCKET:
        upload_to_gcs(dump_file)

    if args.verify:
        verify_backup(dump_file)

    print("\n[DONE] Backup strategy complete.")


if __name__ == "__main__":
    main()
