"""
core/audit.py — Centralised, non-blocking audit logging.

All constants are strings so they can be persisted directly to the audit_logs
table without a mapping step.  The write uses supabase_admin (service-role key)
to bypass RLS, ensuring no security event is silently dropped due to policy.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request

# ---------------------------------------------------------------------------
# Action constants
# ---------------------------------------------------------------------------
ACTION_LOGIN_SUCCESS       = "LOGIN_SUCCESS"
ACTION_LOGIN_FAILED        = "LOGIN_FAILED"
ACTION_ROLE_CHANGE         = "ROLE_CHANGE"
ACTION_PROFILE_CREATED     = "PROFILE_CREATED"
ACTION_PAYMENT_SUBMITTED   = "PAYMENT_SUBMITTED"
ACTION_LESSON_PLAN_APPROVED = "LESSON_PLAN_APPROVED"
ACTION_TENANT_ACCESS_DENIED = "TENANT_ACCESS_DENIED"
ACTION_PASSWORD_RESET      = "PASSWORD_RESET"

# Storage constants
ACTION_FILE_UPLOAD         = "FILE_UPLOAD"
ACTION_FILE_DOWNLOAD       = "FILE_DOWNLOAD"
ACTION_FILE_DELETE         = "FILE_DELETE"
ACTION_FILE_ACCESS_DENIED  = "FILE_ACCESS_DENIED"


# ---------------------------------------------------------------------------
# Internal write — never raises, always logs to stderr on failure
# ---------------------------------------------------------------------------
async def _async_write(
    action: str,
    actor_id: Optional[str],
    school_id: Optional[str],
    target_id: Optional[str],
    metadata: dict
) -> None:
    """Asynchronous write to audit_logs via AuditRepository."""
    try:
        # Import lazily to avoid circular imports
        from repositories import get_db_provider
        from repositories.audit import AuditRepository
        
        provider = get_db_provider()
        repo = AuditRepository(provider)
        await repo.create_log(
            action=action,
            actor_id=actor_id,
            school_id=school_id,
            target_id=target_id,
            metadata=metadata
        )
    except Exception as exc:  # pragma: no cover
        print(f"[AUDIT ERROR] Failed to write event '{action}': {exc}")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def log_audit_event(
    action: str,
    request: Optional[Request] = None,
    *,
    actor_id: Optional[str] = None,
    school_id: Optional[str] = None,
    target_id: Optional[str] = None,
    additional_metadata: Optional[dict] = None,
) -> None:
    """
    Persist an audit event.  The write is dispatched as a fire-and-forget
    background task when called from an async context so it never adds
    latency to the originating request.

    Args:
        action:              One of the ACTION_* constants above.
        request:             FastAPI Request object (optional); used to extract
                             IP address and URL path.
        actor_id:            UUID of the user who performed the action.
        school_id:           UUID of the school / tenant context.
        target_id:           UUID of the affected resource.
        additional_metadata: Arbitrary key/value pairs merged into metadata.
    """
    ip_address = "unknown"
    endpoint   = "unknown"
    if request is not None:
        ip_address = request.client.host if request.client else "unknown"
        endpoint   = str(request.url.path)

    metadata: dict = {"ip_address": ip_address, "endpoint": endpoint}
    if additional_metadata:
        metadata.update(additional_metadata)

    data = {
        "action":     action,
        "actor_id":   actor_id,
        "school_id":  school_id,
        "target_id":  target_id,
        "metadata":   metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Fire-and-forget: if there is a running event loop (inside an async
    # request handler) schedule the write as a background task.  Otherwise
    # write synchronously (e.g. during testing or startup hooks).
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_async_write(action, actor_id, school_id, target_id, metadata))
    except RuntimeError:
        asyncio.run(_async_write(action, actor_id, school_id, target_id, metadata))
