import asyncio, asyncpg, os
from dotenv import load_dotenv

load_dotenv()
dsn = os.getenv('CLOUD_SQL_DATABASE_URL')

async def run():
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute('ALTER TABLE enrollments RENAME COLUMN academic_class_id TO class_id;')
    except Exception as e:
        print(f"2: {e}")
    try:
        await conn.execute('ALTER TABLE class_subjects RENAME COLUMN academic_class_id TO class_id;')
    except Exception as e:
        print(f"3: {e}")
    try:
        await conn.execute('ALTER TABLE assignments RENAME COLUMN academic_class_id TO class_id;')
    except Exception as e:
        print(f"4: {e}")
    try:
        await conn.execute('ALTER TABLE lesson_plans RENAME COLUMN academic_class_id TO class_id;')
    except Exception as e:
        print(f"5: {e}")
    await conn.close()
    print('Reverted columns successfully')

asyncio.run(run())
