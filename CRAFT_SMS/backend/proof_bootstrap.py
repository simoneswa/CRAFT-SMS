import asyncio
import os
from fastapi.testclient import TestClient
from main import app
from core.security import get_current_user
import asyncpg
from dotenv import load_dotenv

load_dotenv()
dsn = os.getenv('CLOUD_SQL_DATABASE_URL')

def mock_admin():
    return {"profile": {"id": "test_admin", "role": "SUPER_ADMIN", "school_id": "12345678-1234-5678-1234-567812345678"}}

app.dependency_overrides[get_current_user] = mock_admin
client = TestClient(app)

async def run():
    print("--- TENANT BOOTSTRAP PROOF ---")
    
    print("Creating temporary test school...")
    r = client.post("/api/tenants/schools", json={
        "name": "Validation Test School",
        "subdomain": "validation-test"
    })
    
    if r.status_code != 200:
        print(f"Failed to create school: {r.status_code} - {r.text}")
        return
        
    school_data = r.json()
    school_id = school_data["id"]
    print(f"Created School ID: {school_id}")
    
    await asyncio.sleep(2)
    
    conn = await asyncpg.connect(dsn)
    terms = await conn.fetchval("SELECT COUNT(*) FROM academic_terms WHERE school_id=$1", school_id)
    subjects = await conn.fetchval("SELECT COUNT(*) FROM subjects WHERE school_id=$1", school_id)
    classes = await conn.fetchval("SELECT COUNT(*) FROM academic_classes WHERE school_id=$1", school_id)
    
    print("\nBootstrap Process Verification:")
    print(f"academic_terms created: {terms}")
    print(f"subjects created: {subjects}")
    print(f"academic_classes created: {classes}")
    
    print("\nCleaning up test school...")
    await conn.execute("DELETE FROM schools WHERE id=$1", school_id)
    print("Test school deleted.")
    await conn.close()

asyncio.run(run())
