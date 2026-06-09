import asyncio
from fastapi.testclient import TestClient
from main import app
from core.security import get_current_user

def mock_admin():
    return {"profile": {"id": "test_admin", "role": "SUPER_ADMIN", "school_id": "12345678-1234-5678-1234-567812345678"}}

app.dependency_overrides[get_current_user] = mock_admin
client = TestClient(app)

print("--- API PROOF ---")

r1 = client.get("/api/health/status")
print(f"GET /api/health/status -> Status: {r1.status_code}, Response: {r1.json()}")

try:
    r2 = client.get("/api/admin/stats")
    print(f"GET /api/auth/admin/stats -> Status: {r2.status_code}, Response: {str(r2.json())[:100]}")
except Exception as e:
    print(f"GET /api/auth/admin/stats -> ERROR: {e}")

r3 = client.get("/api/academic/terms")
print(f"GET /api/academic/terms -> Status: {r3.status_code}, Response: {str(r3.json())[:100]}")

r4 = client.get("/api/academic/classes")
print(f"GET /api/academic/classes -> Status: {r4.status_code}, Response: {str(r4.json())[:100]}")

try:
    r5 = client.get("/api/messages/contacts")
    print(f"GET /api/messages/contacts -> Status: {r5.status_code}, Response: {str(r5.json())[:100]}")
except Exception as e:
    print(f"GET /api/messages/contacts -> ERROR: {e}")

r6 = client.get("/api/tenants/schools")
print(f"GET /api/tenants/schools -> Status: {r6.status_code}, Response: {str(r6.json())[:100]}")

