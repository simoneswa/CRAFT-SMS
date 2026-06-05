"""
repositories/base.py

Defines the DatabaseProvider protocol that all backend data access MUST use.
Routes MUST NOT import supabase or asyncpg clients directly — they must
depend on a repository class that implements this protocol.

Provider implementations:
  - SupabaseDatabaseProvider  (current — Supabase SDK)
  - CloudSQLDatabaseProvider  (target — asyncpg / Cloud SQL)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


@runtime_checkable
class DatabaseProvider(Protocol):
    """
    Minimal async-compatible interface that every data-store provider must
    satisfy.  Method signatures mirror the most common Supabase SDK patterns
    so migration is additive, not a full rewrite.
    """

    async def fetch_one(
        self,
        table: str,
        filters: Dict[str, Any],
        columns: str = "*",
    ) -> Optional[Dict[str, Any]]:
        """Return a single row or None."""
        ...

    async def fetch_many(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        columns: str = "*",
        order_by: Optional[str] = None,
        descending: bool = False,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Return a list of rows (empty list when nothing matches)."""
        ...

    async def insert(
        self,
        table: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Insert a row and return the created record."""
        ...

    async def update(
        self,
        table: str,
        filters: Dict[str, Any],
        data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Update rows matching *filters* and return the updated records."""
        ...

    async def delete(
        self,
        table: str,
        filters: Dict[str, Any],
    ) -> None:
        """Delete rows matching *filters*."""
        ...
