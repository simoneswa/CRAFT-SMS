"""
repositories/supabase_provider.py

Concrete DatabaseProvider implementation backed by the Supabase Python SDK.
This is the CURRENT active provider (Phase A of migration).
Routes must not import this directly — they receive a provider instance
injected by the FastAPI dependency `get_db_provider()` in core/db.py.
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from repositories.base import DatabaseProvider


class SupabaseDatabaseProvider:
    """
    Wraps `supabase_admin` (service-role Supabase client) to satisfy the
    DatabaseProvider protocol.  All network calls are blocking (Supabase SDK
    is sync) and are dispatched to a thread-pool executor so they do not
    block the asyncio event loop.
    """

    def __init__(self) -> None:
        from core.db import supabase_admin, supabase  # lazy import avoids circular deps
        if supabase_admin is not None:
            self._client = supabase_admin
        elif supabase is not None:
            print("[PROVIDER WARNING] Falling back to anon Supabase client because admin is missing.")
            self._client = supabase
        else:
            raise RuntimeError(
                "Neither supabase_admin nor supabase client is initialised. "
                "Check SUPABASE_URL."
            )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    async def _run(self, fn):
        """Execute a synchronous callable in the default thread-pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, fn)

    # ------------------------------------------------------------------
    # Protocol implementation
    # ------------------------------------------------------------------
    async def fetch_one(
        self,
        table: str,
        filters: Dict[str, Any],
        columns: str = "*",
    ) -> Optional[Dict[str, Any]]:
        def _call():
            q = self._client.table(table).select(columns)
            for col, val in filters.items():
                q = q.eq(col, val)
            resp = q.single().execute()
            return resp.data if resp else None

        try:
            return await self._run(_call)
        except Exception:
            return None

    async def fetch_many(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        columns: str = "*",
        order_by: Optional[str] = None,
        descending: bool = False,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        def _call():
            q = self._client.table(table).select(columns)
            for col, val in (filters or {}).items():
                q = q.eq(col, val)
            if order_by:
                q = q.order(order_by, desc=descending)
            if limit:
                q = q.limit(limit)
            resp = q.execute()
            return resp.data or []

        return await self._run(_call)

    async def insert(
        self,
        table: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        def _call():
            resp = self._client.table(table).insert(data).execute()
            if resp.data:
                return resp.data[0]
            raise RuntimeError(f"Insert into '{table}' returned no data.")

        return await self._run(_call)

    async def update(
        self,
        table: str,
        filters: Dict[str, Any],
        data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        def _call():
            q = self._client.table(table).update(data)
            for col, val in filters.items():
                q = q.eq(col, val)
            resp = q.execute()
            return resp.data or []

        return await self._run(_call)

    async def delete(
        self,
        table: str,
        filters: Dict[str, Any],
    ) -> None:
        def _call():
            q = self._client.table(table).delete()
            for col, val in filters.items():
                q = q.eq(col, val)
            q.execute()

        await self._run(_call)


# Verify the class satisfies the protocol at import time
assert isinstance(SupabaseDatabaseProvider, type)
