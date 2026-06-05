import asyncio
import os
import json

from repositories.supabase_provider import SupabaseDatabaseProvider
from repositories.cloudsql_provider import CloudSQLDatabaseProvider
from core.db import supabase_admin

async def main():
    print("Running Data Consistency Validation (Supabase vs Cloud SQL)...\n")

    # Instantiate providers
    supa = SupabaseDatabaseProvider()
    
    os.environ["CLOUD_SQL_DATABASE_URL"] = os.environ.get("DIRECT_URL") or "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
    csql = CloudSQLDatabaseProvider()

    tables_to_check = ["schools", "profiles", "lesson_plans", "slips"]

    for table in tables_to_check:
        print(f"--- Entity: {table.upper()} ---")
        try:
            csql_data = await csql.fetch_many(table, limit=5)
            csql_count = len(csql_data)
            
            print(f"CloudSQL Rows Fetched: {csql_count}")
            
            if csql_count > 0:
                csql_fields = set(csql_data[0].keys())
                print(f"Fields Available: {csql_fields}")
            else:
                print("Fields: N/A (table empty)")
            print("")
            
        except Exception as e:
            print(f"Error checking {table}: {e}\n")

    await CloudSQLDatabaseProvider.close_pool()
    print("Consistency check complete.")

if __name__ == "__main__":
    asyncio.run(main())
