"""
repositories/audit.py

Repository for writing audit logs via the configured DatabaseProvider.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from repositories.base import DatabaseProvider


class AuditRepository:
    def __init__(self, provider: DatabaseProvider):
        self.provider = provider

    async def create_log(
        self,
        action: str,
        actor_id: Optional[str] = None,
        school_id: Optional[str] = None,
        target_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Insert a single audit log entry."""
        data = {
            "action": action,
            "actor_id": actor_id,
            "school_id": school_id,
            "target_id": target_id,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        # In current design, _write is synchronous, but the Protocol expects async
        # SupabaseProvider will run this in a threadpool so it doesn't block.
        await self.provider.insert("audit_logs", data)

