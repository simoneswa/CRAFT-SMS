"""
repositories/__init__.py

Exposes the active DatabaseProvider instance via a FastAPI dependency.

The active provider is selected by the DB_PROVIDER environment variable:
  supabase  (default) — SupabaseDatabaseProvider
  cloudsql            — CloudSQLDatabaseProvider  (Phase A / B / C)

Routes MUST depend on `get_db_provider()` and MUST NOT import Supabase or
asyncpg clients directly.

Example usage in a route:
    from repositories import get_db_provider, DatabaseProvider
    from fastapi import Depends

    @router.get("/profiles/{user_id}")
    async def get_profile(user_id: str, db: DatabaseProvider = Depends(get_db_provider)):
        return await db.fetch_one("profiles", {"id": user_id})
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Union

from repositories.base import DatabaseProvider
from repositories.supabase_provider import SupabaseDatabaseProvider
from repositories.cloudsql_provider import CloudSQLDatabaseProvider


@lru_cache(maxsize=1)
def _build_provider() -> Union[SupabaseDatabaseProvider, CloudSQLDatabaseProvider]:
    """
    Build the provider singleton.  Cached so the same object is reused
    across all requests; providers are safe to share (they hold no
    per-request state).
    """
    provider_name = os.environ.get("DB_PROVIDER", "supabase").lower()
    if provider_name == "cloudsql":
        print("[DB] Using Cloud SQL PostgreSQL provider (Phase A/B migration)")
        return CloudSQLDatabaseProvider()
    print("[DB] Using Supabase provider (current default)")
    return SupabaseDatabaseProvider()


def get_db_provider() -> DatabaseProvider:
    """FastAPI dependency — inject into route handlers."""
    return _build_provider()


__all__ = ["get_db_provider", "DatabaseProvider"]
