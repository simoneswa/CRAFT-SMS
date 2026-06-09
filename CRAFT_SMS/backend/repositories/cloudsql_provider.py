"""
repositories/cloudsql_provider.py

Cloud SQL / asyncpg implementation of DatabaseProvider.
This is the TARGET provider for Phase A/B of the Supabase → Cloud SQL migration.

The provider is instantiated only when DB_PROVIDER=cloudsql is set; Supabase
remains the active default.  No routes are modified until Phase B validation
passes — this file exists in parallel, inactive, until cutover.

Connection string is pulled from Google Secret Manager via core/secrets.py:
  Secret name: CLOUD_SQL_DATABASE_URL
  Format:      postgresql://user:pass@host:5432/dbname
               (or Cloud SQL socket: postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from repositories.base import DatabaseProvider


class CloudSQLDatabaseProvider:
    """
    asyncpg-backed provider for Cloud SQL PostgreSQL.
    Pool is initialised lazily on first use and reused across requests.
    """

    _pools: dict = {}  # asyncpg.Pool per event loop

    def __init__(self) -> None:
        # DSN is resolved at first query; pool is shared across instances
        from core.secrets import get_secret
        self._dsn: str = get_secret("CLOUD_SQL_DATABASE_URL") or ""
        if not self._dsn:
            raise RuntimeError(
                "CLOUD_SQL_DATABASE_URL secret is not set. "
                "Provision it in Google Secret Manager before enabling the Cloud SQL provider."
            )

    # ------------------------------------------------------------------
    # Pool lifecycle
    # ------------------------------------------------------------------
    async def _get_pool(self):
        import asyncio
        loop = asyncio.get_running_loop()
        if loop not in CloudSQLDatabaseProvider._pools:
            import asyncpg
            CloudSQLDatabaseProvider._pools[loop] = await asyncpg.create_pool(
                dsn=self._dsn,
                min_size=2,
                max_size=10,
                command_timeout=30,
            )
        return CloudSQLDatabaseProvider._pools[loop]

    # ------------------------------------------------------------------
    # Internal SQL builder (minimal — expands as needed during Phase B)
    # ------------------------------------------------------------------
    @staticmethod
    def _where_clause(filters: Dict[str, Any]) -> tuple[str, list]:
        """Build parameterised WHERE clause from a filter dict."""
        if not filters:
            return "", []
        clauses = [f"{col} = ${i + 1}" for i, col in enumerate(filters)]
        return "WHERE " + " AND ".join(clauses), list(filters.values())

    # ------------------------------------------------------------------
    # Protocol implementation
    # ------------------------------------------------------------------
    async def fetch_one(
        self,
        table: str,
        filters: Dict[str, Any],
        columns: str = "*",
    ) -> Optional[Dict[str, Any]]:
        where, params = self._where_clause(filters)
        sql = f"SELECT {columns} FROM {table} {where} LIMIT 1"
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(sql, *params)
            return dict(row) if row else None

    async def fetch_many(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        columns: str = "*",
        order_by: Optional[str] = None,
        descending: bool = False,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        where, params = self._where_clause(filters or {})
        order = f"ORDER BY {order_by} {'DESC' if descending else 'ASC'}" if order_by else ""
        lim   = f"LIMIT {limit}" if limit else ""
        sql   = f"SELECT {columns} FROM {table} {where} {order} {lim}".strip()
        pool  = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [dict(r) for r in rows]

    async def insert(
        self,
        table: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        cols    = ", ".join(data.keys())
        placeholders = ", ".join(f"${i + 1}" for i in range(len(data)))
        sql     = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) RETURNING *"
        pool    = await self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(sql, *data.values())
            return dict(row) if row else {}

    async def update(
        self,
        table: str,
        filters: Dict[str, Any],
        data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        set_parts  = [f"{col} = ${i + 1}" for i, col in enumerate(data)]
        offset     = len(data)
        where_parts = [f"{col} = ${offset + i + 1}" for i, col in enumerate(filters)]
        sql = (
            f"UPDATE {table} SET {', '.join(set_parts)} "
            f"WHERE {' AND '.join(where_parts)} RETURNING *"
        )
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql, *data.values(), *filters.values())
            return [dict(r) for r in rows]

    async def delete(
        self,
        table: str,
        filters: Dict[str, Any],
    ) -> None:
        where, params = self._where_clause(filters)
        sql = f"DELETE FROM {table} {where}"
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute(sql, *params)

    @classmethod
    async def close_pool(cls) -> None:
        """Call on application shutdown to release connections gracefully."""
        import asyncio
        try:
            loop = asyncio.get_running_loop()
            pool = cls._pools.pop(loop, None)
            if pool:
                await pool.close()
        except RuntimeError:
            # If no running loop, close all pools we can
            for pool in list(cls._pools.values()):
                await pool.close()
            cls._pools.clear()
