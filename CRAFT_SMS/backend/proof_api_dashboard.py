import asyncio
import uuid
from fastapi.testclient import TestClient
from main import app
from core.security import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DB_PROVIDER"] = "cloudsql"

print("--- DASHBOARD & API PROOF ---")

valid_school_id = str(uuid.uuid4())

# 1. API Route Validation
def get_mock_user(r="SUPER_ADMIN", s=valid_school_id):
    return {"profile": {"id": str(uuid.uuid4()), "role": r, "school_id": s}}

app.dependency_overrides[get_current_user] = lambda: get_mock_user("SUPER_ADMIN", valid_school_id)
client = TestClient(app)

print("\n--- API PROOF ---")
r = client.get("/api/auth/admin/stats")
print(f"GET /api/auth/admin/stats -> Status: {r.status_code}, Response: {r.json()}")

r = client.get("/api/academic/classes")
print(f"GET /api/academic/classes -> Status: {r.status_code}, Response type: {type(r.json())}")

r = client.get("/api/academic/terms")
print(f"GET /api/academic/terms -> Status: {r.status_code}, Response type: {type(r.json())}")

r = client.get("/api/messages/contacts")
print(f"GET /api/messages/contacts -> Status: {r.status_code}")

print("\n--- DASHBOARD PROOF ---")

roles = [
    ("SUPER_ADMIN", "GET /api/tenants/", "/api/tenants/"),
    ("SCHOOL_ADMIN", "GET /api/tenants/schools/{school_id}/metrics", f"/api/tenants/schools/{valid_school_id}/metrics"),
    ("TEACHER", "GET /api/academic/classes", "/api/academic/classes"),
    ("STUDENT", "GET /api/academic/grades/my", "/api/academic/grades/my"),
    ("PARENT", "GET /api/parents/students", "/api/parents/students")
]

for role, desc, endpoint in roles:
    app.dependency_overrides[get_current_user] = lambda r=role: get_mock_user(r, valid_school_id)
    # create new test client to ensure override is picked up
    client = TestClient(app)
    
    try:
        r = client.get(endpoint)
        count = "N/A"
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict):
                count = len(data.keys())
        else:
            print(f"Failed response: {r.text}")
                
        print(f"Role: {role}")
        print(f"  Endpoint Called: {desc}")
        print(f"  Status: {r.status_code}")
        print(f"  Records Returned / Keys: {count}")
    except Exception as e:
        print(f"Role: {role} -> ERROR: {e}")

from repositories.cloudsql_provider import CloudSQLDatabaseProvider
import asyncio
try:
    asyncio.get_running_loop().run_until_complete(CloudSQLDatabaseProvider.close_pool())
except:
    pass
