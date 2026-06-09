import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

dsn = os.getenv('CLOUD_SQL_DATABASE_URL')

tables = [
    'profiles', 'schools', 'students', 'teachers', 'parents', 
    'grades', 'subjects', 'academic_classes', 'attendance', 
    'slips', 'payments', 'announcements', 'messages', 
    'notifications', 'audit_logs'
]

async def main():
    conn = await asyncpg.connect(dsn)
    print('FULL NEON SCHEMA AUDIT:')
    for table in tables:
        # Check if table exists
        exists = await conn.fetchval('''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            );
        ''', table)
        
        if not exists:
            print(f'\\nTable: {table} -> DOES NOT EXIST')
            continue
            
        count = await conn.fetchval(f'SELECT COUNT(*) FROM {table};')
        
        # Get PK
        pk = await conn.fetch('''
            SELECT a.attname
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                 AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = $1::regclass
            AND    i.indisprimary;
        ''', table)
        pk_cols = [r['attname'] for r in pk]
        
        # Get FKs
        fks = await conn.fetch('''
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
        ''', table)
        
        fk_list = [f"{r['column_name']} -> {r['foreign_table_name']}({r['foreign_column_name']})" for r in fks]
        
        print(f'\\nTable: {table}')
        print(f'  Row count: {count}')
        print(f'  Primary Key: {pk_cols}')
        print(f'  Foreign Keys: {fk_list}')
        
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
