import asyncio
import os
import uuid
import traceback
from dotenv import load_dotenv

load_dotenv()
os.environ["DB_PROVIDER"] = "cloudsql"

from repositories.cloudsql_provider import CloudSQLDatabaseProvider
from routes.tenants import get_school_metrics
from routes.parents import get_linked_students

async def run_tests():
    db = CloudSQLDatabaseProvider()
    
    # 1. Test get_school_metrics
    school_id = str(uuid.uuid4())
    user_mock = {"profile": {"role": "SUPER_ADMIN", "school_id": school_id, "id": str(uuid.uuid4())}}
    
    print("--- Testing get_school_metrics ---")
    try:
        metrics = await get_school_metrics(school_id=school_id, user=user_mock, db=db)
        print("Metrics:", metrics)
    except Exception as e:
        print("Error in get_school_metrics:")
        traceback.print_exc()

    # 2. Test get_linked_students
    print("\n--- Testing get_linked_students ---")
    try:
        students = await get_linked_students(user=user_mock, db=db)
        print("Students:", students)
    except Exception as e:
        print("Error in get_linked_students:")
        traceback.print_exc()

    await CloudSQLDatabaseProvider.close_pool()

if __name__ == "__main__":
    asyncio.run(run_tests())
