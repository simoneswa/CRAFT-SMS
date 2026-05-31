import asyncio
import json
from types import SimpleNamespace
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from fastapi import Depends

from core import security
from core.security import RoleChecker

# Import the app
from main import app


class MockTable:
    def __init__(self, data=None):
        self._data = data
    def select(self, *args, **kwargs):
        return self
    def eq(self, *args, **kwargs):
        return self
    def single(self):
        return self
    def execute(self):
        return SimpleNamespace(data=self._data, error=None)


class MockSupabaseAdmin:
    def __init__(self, profile=None):
        self._profile = profile
    def table(self, name):
        return MockTable(data=self._profile)


class MockSupabase:
    def __init__(self, user_id=None):
        self._user_id = user_id
    class Auth:
        def __init__(self, parent):
            self.parent = parent
        def get_user(self, token):
            if token == "supabase-valid-token":
                return SimpleNamespace(user=SimpleNamespace(id=self.parent._user_id))
            raise Exception("invalid supabase token")
    @property
    def auth(self):
        return MockSupabase.Auth(self)


@pytest.mark.asyncio
async def test_firebase_token_maps_to_profile(monkeypatch):
    # Mock firebase_auth.verify_id_token
    async def fake_verify(token, app=None):
        return {"uid": "firebase-uid-123", "email": "teacher@example.com"}

    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            if token == "firebase-valid":
                return {"uid": "firebase-uid-123", "email": "teacher@example.com"}
            raise Exception("invalid")

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())
    # Provide a supabase_admin that returns a profile matching the firebase uid
    profile = {"id": "user-1", "role": "TEACHER", "school_id": "school-1", "email": "teacher@example.com", "firebase_uid": "firebase-uid-123"}
    monkeypatch.setattr(security, "supabase_admin", MockSupabaseAdmin(profile=profile))

    # Register a temporary protected endpoint
    @app.get("/test-protected")
    async def protected(user=Depends(RoleChecker(["TEACHER"]))):
        return {"ok": True, "role": user["profile"]["role"], "school_id": user["profile"]["school_id"]}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected", headers={"Authorization": "Bearer firebase-valid"})
            assert resp.status_code == 200
            body = resp.json()
            assert body["ok"] is True
            assert body["role"] == "TEACHER"
            assert body["school_id"] == "school-1"


@pytest.mark.asyncio
async def test_firebase_token_fallback_to_email(monkeypatch):
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            if token == "firebase-valid-email":
                return {"uid": "some-uid", "email": "teacher2@example.com"}
            raise Exception("invalid")

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())
    # Simulate no firebase_uid match, but email match
    profile = {"id": "user-2", "role": "TEACHER", "school_id": "school-2", "email": "teacher2@example.com"}
    monkeypatch.setattr(security, "supabase_admin", MockSupabaseAdmin(profile=profile))

    @app.get("/test-protected-email")
    async def protected_email(user=Depends(RoleChecker(["TEACHER"]))):
        return {"ok": True, "role": user["profile"]["role"]}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected-email", headers={"Authorization": "Bearer firebase-valid-email"})
            assert resp.status_code == 200
            assert resp.json()["role"] == "TEACHER"


@pytest.mark.asyncio
async def test_supabase_fallback(monkeypatch):
    # Simulate firebase not configured/verify fails
    monkeypatch.setattr(security, "firebase_auth", None)
    # Simulate supabase auth returns user
    mock_supabase = MockSupabase(user_id="user-3")
    monkeypatch.setattr(security, "supabase", mock_supabase)
    profile = {"id": "user-3", "role": "SCHOOL_ADMIN", "school_id": "school-3", "email": "admin@example.com"}
    monkeypatch.setattr(security, "supabase_admin", MockSupabaseAdmin(profile=profile))

    @app.get("/test-supabase")
    async def protected_sb(user=Depends(RoleChecker(["SCHOOL_ADMIN"]))):
        return {"ok": True, "role": user["profile"]["role"]}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-supabase", headers={"Authorization": "Bearer supabase-valid-token"})
            assert resp.status_code == 200
            assert resp.json()["role"] == "SCHOOL_ADMIN"


@pytest.mark.asyncio
async def test_missing_token(monkeypatch):
    # Ensure missing token returns 403 or 401
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected")
            assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_invalid_token(monkeypatch):
    # Set firebase to raise
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            raise Exception("invalid")
    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())
    # And supabase fallback fails
    class BrokenSupabase:
        class Auth:
            def get_user(self, token):
                raise Exception("invalid")
        @property
        def auth(self):
            return BrokenSupabase.Auth()
    monkeypatch.setattr(security, "supabase", BrokenSupabase())

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected", headers={"Authorization": "Bearer totally-invalid"})
            assert resp.status_code == 401
