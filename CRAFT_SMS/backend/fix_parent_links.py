import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
dsn = os.getenv('CLOUD_SQL_DATABASE_URL')

async def run():
    conn = await asyncpg.connect(dsn)

    # Check if parent_student_links exists
    exists = await conn.fetchval("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'parent_student_links'
        );
    """)
    print(f"parent_student_links exists: {exists}")

    if not exists:
        print("Creating parent_student_links...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS public.parent_student_links (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
                parent_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                relationship    TEXT DEFAULT 'guardian',
                created_at      TIMESTAMPTZ DEFAULT now(),
                UNIQUE(parent_id, student_id)
            );
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_psl_school ON public.parent_student_links(school_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_psl_parent ON public.parent_student_links(parent_id);")
        print("parent_student_links created.")
    else:
        count = await conn.fetchval("SELECT COUNT(*) FROM parent_student_links;")
        print(f"parent_student_links rows: {count}")

    # Show schools
    schools = await conn.fetch("SELECT id, name, subdomain FROM schools LIMIT 5;")
    print("\nSchools in DB:")
    for s in schools:
        print(f"  {s['id']} | {s['name']} | {s['subdomain']}")

    await conn.close()

asyncio.run(run())
