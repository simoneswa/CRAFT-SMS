import asyncio
from fastapi.testclient import TestClient
from main import app
from core.security import get_current_user
import uuid

client = TestClient(app)

# Helper to mock dependencies
def override_get_current_user(role, school_id):
    def _override():
        return {
            "uid": "mock-firebase-uid",
            "email": "test@example.com",
            "profile": {
                "id": str(uuid.uuid4()),
                "role": role,
                "school_id": school_id,
                "firebase_uid": "mock-firebase-uid"
            }
        }
    return _override

def run_tests():
    print("Starting Phase 0.5 Validation...")
    
    with TestClient(app) as client:
        # 1. GET /api/tenants/by-subdomain
        print("\n1. Testing GET /api/tenants/by-subdomain")
        resp = client.get("/api/tenants/by-subdomain?subdomain=craft-demo")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "id" in data
        assert data["subdomain"] == "craft-demo"
        print("   [PASS] Resolves active tenant correctly.")
        
        # 2. GET /api/stats/public
        print("\n2. Testing GET /api/stats/public")
        resp = client.get("/api/stats/public")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "active_schools" in data
        assert "total_users" in data
        print("   [PASS] Public stats returned safely.")
    
        # 3. GET /api/analytics/finance-summary
        print("\n3. Testing GET /api/analytics/finance-summary (Role/Tenant Isolation)")
        # Should fail if unauthenticated
        app.dependency_overrides = {}
        resp = client.get("/api/analytics/finance-summary")
        assert resp.status_code == 401 or resp.status_code == 403, "Should reject unauth"
        
        # Should succeed as SCHOOL_ADMIN
        school_id = "aaaaaaaa-0000-0000-0000-000000000001" # use demo school
        app.dependency_overrides[get_current_user] = override_get_current_user("SCHOOL_ADMIN", school_id)
        resp = client.get("/api/analytics/finance-summary")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        assert "total_revenue" in resp.json()
        
        # Should fail as STUDENT
        app.dependency_overrides[get_current_user] = override_get_current_user("STUDENT", school_id)
        resp = client.get("/api/analytics/finance-summary")
        assert resp.status_code == 403, "Student should not access finance-summary"
        print("   [PASS] Role permissions enforced. SCHOOL_ADMIN succeeds, STUDENT fails.")
    
        # 4. GET /api/analytics/dashboard-summary
        print("\n4. Testing GET /api/analytics/dashboard-summary (Data masking)")
        # As STUDENT (revenue hidden)
        resp = client.get("/api/analytics/dashboard-summary")
        assert resp.status_code == 200
        assert "total_revenue" not in resp.json(), "Student should not see revenue"
        
        # As SCHOOL_ADMIN (revenue visible)
        app.dependency_overrides[get_current_user] = override_get_current_user("SCHOOL_ADMIN", school_id)
        resp = client.get("/api/analytics/dashboard-summary")
        assert resp.status_code == 200
        assert "total_revenue" in resp.json(), "Admin should see revenue"
        print("   [PASS] Dashboard data correctly masked by role.")
        
        # 5. POST /api/admin/invite
        print("\n5. Testing POST /api/admin/invite (Profile Creation & Firebase Mock)")
        
        # Patch firebase_auth to None to force the mock fallback
        import core.security
        core.security.firebase_auth = None
        
        invite_payload = {
            "email": f"test_invite_{uuid.uuid4().hex[:8]}@example.com",
            "full_name": "Test Invite User",
            "role": "TEACHER",
            "school_id": school_id
        }
        resp = client.post("/api/admin/invite", json=invite_payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} - {resp.text}"
        data = resp.json()
        assert "user_id" in data
        print(f"   [PASS] User created with ID: {data['user_id']}")
    
        # Verify the profile was actually stored correctly in Neon with email and firebase_uid
        from repositories.cloudsql_provider import CloudSQLDatabaseProvider
        provider = CloudSQLDatabaseProvider()
        async def check_db():
            await asyncio.sleep(1)
            profile = await provider.fetch_one("profiles", {"id": data['user_id']})
            assert profile is not None
            assert profile["email"] == invite_payload["email"]
            assert profile["firebase_uid"] is not None
            assert profile["role"] == "TEACHER"
            print("   [PASS] Profile record validated in Neon (email and firebase_uid persisted).")
        
        asyncio.run(check_db())

    print("\n[ALL CHECKS PASSED] Phase 0.5 Validation Complete.")

if __name__ == "__main__":
    run_tests()
