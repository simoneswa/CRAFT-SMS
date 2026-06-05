"""
scripts/apply_schema_fixes.py

Applies the remaining schema remediation:
  1. FK: audit_logs.actor_id → profiles(id)
  2. Index: idx_audit_logs_school_id
  3. Index: idx_parent_student_links_school_id
  4. Index: idx_messages_school_id
  5. Index: idx_broadcasts_school_id

All statements are idempotent (IF NOT EXISTS / ALTER TABLE IF NOT VALID).
No destructive changes.
"""
from __future__ import annotations
import asyncio
import os

DIRECT_URL = os.environ.get(
    "CLOUD_SQL_DATABASE_URL",
    "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
)

STATEMENTS = [
    # --- Missing FK: audit_logs → profiles
    ("audit_logs FK actor_id → profiles",
     """
     DO $$
     BEGIN
         IF NOT EXISTS (
             SELECT 1 FROM information_schema.table_constraints tc
             JOIN information_schema.referential_constraints rc
               ON tc.constraint_name = rc.constraint_name
             JOIN information_schema.constraint_column_usage ccu
               ON rc.unique_constraint_name = ccu.constraint_name
             WHERE tc.table_name = 'audit_logs'
               AND ccu.table_name = 'profiles'
               AND tc.constraint_type = 'FOREIGN KEY'
         ) THEN
             ALTER TABLE public.audit_logs
                 ADD CONSTRAINT audit_logs_actor_id_fkey
                 FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
         END IF;
     END;
     $$;
     """),

    # --- Indexes (IF NOT EXISTS)
    ("idx_audit_logs_school_id",
     "CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON public.audit_logs(school_id);"),

    ("idx_parent_student_links_school_id",
     "CREATE INDEX IF NOT EXISTS idx_parent_student_links_school_id ON public.parent_student_links(school_id);"),

    ("idx_messages_school_id",
     "CREATE INDEX IF NOT EXISTS idx_messages_school_id ON public.messages(school_id);"),

    ("idx_broadcasts_school_id",
     "CREATE INDEX IF NOT EXISTS idx_broadcasts_school_id ON public.broadcasts(school_id);"),
]


async def main() -> None:
    import asyncpg
    conn = await asyncpg.connect(dsn=DIRECT_URL)

    print("\nApplying schema fixes...\n")
    for name, sql in STATEMENTS:
        try:
            await conn.execute(sql)
            print(f"  ✓ {name}")
        except Exception as e:
            print(f"  ✗ {name} — {e}")

    await conn.close()
    print("\nDone. Re-run backup_restore_validator.py to confirm.\n")


if __name__ == "__main__":
    asyncio.run(main())
