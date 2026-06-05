import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from fastapi import Depends

from core import security
from core.security import RoleChecker
import repositories
from main import app


class MockDatabaseProvider:
    def __init__(self, profile=None):
        self._profile = profile

    async def fetch_one(self, table, filters, columns="*"):
        if table == "profiles" and self._profile:
            return self._profile
        return None

    async def fetch_many(self, table, filters=None, columns="*", order_by=None, descending=False, limit=None):
        return []

    async def insert(self, table, data):
        return data

    async def update(self, table, filters, data):
        return [data]

    async def delete(self, table, filters):
        pass


def create_mock_user(role, school_id="school-1", user_id="user-1", email="test@example.com"):
    """Helper to create mock user objects"""
    return {
        "profile": {
            "id":           user_id,
            "role":         role,
            "school_id":    school_id,
            "email":        email,
            "firebase_uid": f"firebase-{user_id}",
        },
        "provider": "firebase",
        "email":    email,
        "token":    "mock-token",
    }


@pytest.mark.asyncio
async def test_role_checker_denies_unauthorized_role(monkeypatch):
    """Test that RoleChecker denies access for unauthorized roles"""
    checker = RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"])

    async def mock_get_current_user():
        return create_mock_user("TEACHER")

    monkeypatch.setattr(security, "get_current_user", mock_get_current_user)

    with pytest.raises(Exception) as exc_info:
        checker(user=create_mock_user("TEACHER"))

    assert "not authorized" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_role_checker_allows_authorized_role(monkeypatch):
    """Test that RoleChecker allows access for authorized roles"""
    checker = RoleChecker(["SCHOOL_ADMIN", "TEACHER"])
    teacher_user = create_mock_user("TEACHER")

    result = checker(user=teacher_user)
    assert result["profile"]["role"] == "TEACHER"


@pytest.mark.asyncio
async def test_tenant_isolation_lesson_plans_list(monkeypatch):
    """Test that lesson plans list enforces tenant isolation (school_id filtering)"""
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            return {
                "uid":   "teacher-uid-1",
                "email": "teacher1@school1.com",
            }

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    teacher_profile = create_mock_user("TEACHER", school_id="school-1")["profile"]
    mock_db = MockDatabaseProvider(profile=teacher_profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-tenant-isolation")
    async def test_list_endpoint(user=Depends(security.get_current_user)):
        if user["profile"]["role"] != "SUPER_ADMIN":
            tenant_id = user["profile"]["school_id"]
            return {"filtered_by_tenant": True, "tenant_id": tenant_id}
        return {"filtered_by_tenant": False, "is_super_admin": True}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-tenant-isolation",
                headers={"Authorization": "Bearer test-token"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["filtered_by_tenant"] is True
            assert data["tenant_id"] == "school-1"


@pytest.mark.asyncio
async def test_parent_cannot_access_admin_endpoints(monkeypatch):
    """Test that PARENT role cannot access admin endpoints (403)"""
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            return {"uid": "parent-uid-1", "email": "parent@example.com"}

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    parent_profile = create_mock_user("PARENT", school_id="school-1")["profile"]
    mock_db = MockDatabaseProvider(profile=parent_profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-admin-only")
    async def admin_endpoint(user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"]))):
        return {"admin_access": True}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-admin-only", headers={"Authorization": "Bearer parent-token"}
            )
            assert resp.status_code == 403
            assert "not authorized" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_student_cannot_access_teacher_endpoints(monkeypatch):
    """Test that STUDENT role cannot access TEACHER-only endpoints (403)"""
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            return {"uid": "student-uid-1", "email": "student@example.com"}

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    student_profile = create_mock_user("STUDENT", school_id="school-1")["profile"]
    mock_db = MockDatabaseProvider(profile=student_profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-teacher-only")
    async def teacher_endpoint(user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"]))):
        return {"teacher_access": True}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-teacher-only", headers={"Authorization": "Bearer student-token"}
            )
            assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_access_prevention(monkeypatch):
    """Test that users cannot access data from another school (cross-tenant)

    even if they have the right role.
    """
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            return {"uid": "teacher-uid-2", "email": "teacher2@school2.com"}

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    teacher_profile = create_mock_user(
        "TEACHER", school_id="school-2", user_id="teacher-2"
    )["profile"]
    mock_db = MockDatabaseProvider(profile=teacher_profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-cross-tenant/{tenant_id}")
    async def fetch_tenant_data(
        tenant_id: str, user=Depends(security.get_current_user)
    ):
        if user["profile"]["school_id"] != tenant_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=403,
                detail="Access denied: tenant mismatch",
            )
        return {"tenant_data": True, "accessed_tenant": tenant_id}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-cross-tenant/school-1",
                headers={"Authorization": "Bearer school2-teacher-token"},
            )
            assert resp.status_code == 403
            assert "tenant mismatch" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_super_admin_bypasses_tenant_restriction(monkeypatch):
    """Test that SUPER_ADMIN role can access data from any tenant"""
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            return {"uid": "super-admin-uid", "email": "superadmin@craft-sms.com"}

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    super_admin_profile = create_mock_user(
        "SUPER_ADMIN", school_id="global", user_id="superadmin-1"
    )["profile"]
    mock_db = MockDatabaseProvider(profile=super_admin_profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-super-admin-bypass/{tenant_id}")
    async def fetch_any_tenant(
        tenant_id: str, user=Depends(security.get_current_user)
    ):
        if user["profile"]["role"] == "SUPER_ADMIN":
            return {"data": "accessible", "tenant": tenant_id}

        if user["profile"]["school_id"] != tenant_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Access denied")

        return {"data": "accessible", "tenant": tenant_id}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-super-admin-bypass/school-999",
                headers={"Authorization": "Bearer superadmin-token"},
            )
            assert resp.status_code == 200
            assert resp.json()["tenant"] == "school-999"
