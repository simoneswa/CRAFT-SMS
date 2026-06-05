import asyncio
import json
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from fastapi import Depends

from core import security
from core.security import RoleChecker, get_current_user
import repositories
from main import app


class MockDatabaseProvider:
    def __init__(self, profile=None):
        self._profile = profile
        self.inserts = []
        self.updates = []

    async def fetch_one(self, table, filters, columns="*"):
        if table == "profiles":
            if self._profile:
                # Mock get_profile_by_firebase_uid or get_profile_by_email match
                if "firebase_uid" in filters and filters["firebase_uid"] == self._profile.get("firebase_uid"):
                    return self._profile
                if "email" in filters and filters["email"] == self._profile.get("email"):
                    return self._profile
        return None

    async def fetch_many(self, table, filters=None, columns="*", order_by=None, descending=False, limit=None):
        return []

    async def insert(self, table, data):
        self.inserts.append((table, data))
        return data

    async def update(self, table, filters, data):
        self.updates.append((table, filters, data))
        return [data]

    async def delete(self, table, filters):
        pass


@pytest.mark.asyncio
async def test_firebase_token_maps_to_profile(monkeypatch):
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            if token == "firebase-valid":
                return {"uid": "firebase-uid-123", "email": "teacher@example.com"}
            raise Exception("invalid")

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())

    profile = {
        "id": "user-1",
        "role": "TEACHER",
        "school_id": "school-1",
        "email": "teacher@example.com",
        "firebase_uid": "firebase-uid-123",
    }
    mock_db = MockDatabaseProvider(profile=profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    # Register temporary protected endpoint if not already registered
    @app.get("/test-protected")
    async def protected(user=Depends(RoleChecker(["TEACHER"]))):
        return {
            "ok": True,
            "role": user["profile"]["role"],
            "school_id": user["profile"]["school_id"],
        }

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

    profile = {
        "id": "user-2",
        "role": "TEACHER",
        "school_id": "school-2",
        "email": "teacher2@example.com",
    }
    mock_db = MockDatabaseProvider(profile=profile)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    @app.get("/test-protected-email")
    async def protected_email(user=Depends(RoleChecker(["TEACHER"]))):
        return {"ok": True, "role": user["profile"]["role"]}

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(
                "/test-protected-email",
                headers={"Authorization": "Bearer firebase-valid-email"},
            )
            assert resp.status_code == 200
            assert resp.json()["role"] == "TEACHER"


@pytest.mark.asyncio
async def test_missing_token(monkeypatch):
    # Ensure missing token returns 401
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected")
            assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_invalid_token(monkeypatch):
    class FakeFirebaseAuth:
        def verify_id_token(self, token, app=None):
            raise Exception("invalid")

    monkeypatch.setattr(security, "firebase_auth", FakeFirebaseAuth())
    mock_db = MockDatabaseProvider(profile=None)
    monkeypatch.setattr(repositories, "get_db_provider", lambda: mock_db)

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/test-protected", headers={"Authorization": "Bearer totally-invalid"})
            assert resp.status_code == 401
