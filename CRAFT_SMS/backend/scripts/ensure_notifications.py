"""Ensure the `notifications` table exists in the Postgres DB.

Usage:
  python backend/scripts/ensure_notifications.py

The script will: check for DATABASE_URL env; if present, attempt to connect
and run the CREATE TABLE / RLS policy statements from the local schema. If no
DATABASE_URL is present, it prints the SQL to run manually or via the SQL editor.
"""
from pathlib import Path
import os
import sys

SQL_SNIPPET = Path(__file__).resolve().parents[1] / "supabase" / "schema.sql"

CREATE_SQL = """
-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'ACADEMIC', 'FINANCE', 'SYSTEM')),
    read_at TIMESTAMPTZ,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
"""


def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("No DATABASE_URL found in environment. Please run the following SQL in your database (Supabase SQL editor):\n")
        print(CREATE_SQL)
        sys.exit(0)

    try:
        import psycopg2
    except Exception:
        print("psycopg2 is not installed. Install it with `pip install psycopg2-binary` or run the SQL manually.")
        print(CREATE_SQL)
        sys.exit(1)

    print("Connecting to database and ensuring notifications table exists...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(CREATE_SQL)
        print("✅ notifications table and policies applied (or already exist).")
    except Exception as e:
        print("Failed to apply migration:", str(e))
        print("You can run the SQL manually in the Supabase SQL editor.")
        sys.exit(1)
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


if __name__ == '__main__':
    main()
