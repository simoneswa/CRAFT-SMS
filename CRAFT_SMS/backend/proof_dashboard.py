import asyncio
from fastapi.testclient import TestClient
from main import app
from core.security import get_current_user

print("--- DASHBOARD PROOF ---")

roles = [
    ("SUPER_ADMIN", "GET /api/tenants/", "/api/tenants/"),
    ("SCHOOL_ADMIN", "GET /api/tenants/schools/{school_id}/metrics", "/api/tenants/schools/12345678-1234-5678-1234-567812345678/metrics"),
    ("TEACHER", "GET /api/academic/classes", "/api/academic/classes"),
    ("STUDENT", "GET /api/academic/grades/my", "/api/academic/grades/my"),
    ("PARENT", "GET /api/parents/students", "/api/parents/students")
]

for role, desc, endpoint in roles:
    def get_mock_user(r=role):
        return {"profile": {"id": f"test_{r.lower()}", "role": r, "school_id": "12345678-1234-5678-1234-567812345678"}}
        
    app.dependency_overrides[get_current_user] = get_mock_user
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
                
        print(f"Role: {role}")
        print(f"  Endpoint Called: {desc}")
        print(f"  Status: {r.status_code}")
        print(f"  Records Returned / Keys: {count}")
    except Exception as e:
        print(f"Role: {role} -> ERROR: {e}")

