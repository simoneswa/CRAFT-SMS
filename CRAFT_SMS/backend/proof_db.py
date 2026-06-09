import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
dsn = os.getenv('CLOUD_SQL_DATABASE_URL')

async def run():
    conn = await asyncpg.connect(dsn)
    
    tables = [
        "schools", "profiles", "grades", 
        "academic_classes", "subjects", 
        "academic_terms", "enrollments"
    ]
    
    print("--- DATABASE PROOF ---")
    for t in tables:
        try:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {t};")
            print(f"{t}: {count} rows")
        except Exception as e:
            print(f"{t}: ERROR - {e}")
            
    await conn.close()

asyncio.run(run())
