import asyncio
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

NEON_DSN = os.environ.get("CLOUD_SQL_DATABASE_URL", "")
if not NEON_DSN:
    print("[FATAL] CLOUD_SQL_DATABASE_URL is not set.")
    sys.exit(1)

async def run():
    import asyncpg
    print(f"Connecting to Neon DB: {NEON_DSN.split('@')[-1]}")
    conn = await asyncpg.connect(dsn=NEON_DSN)
    
    try:
        await conn.execute("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;")
        print("[OK] Added email column to profiles table")
    except Exception as e:
        print(f"[ERROR] {e}")
        
    await conn.close()
    
if __name__ == "__main__":
    asyncio.run(run())
