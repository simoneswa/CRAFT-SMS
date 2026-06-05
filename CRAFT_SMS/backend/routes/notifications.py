"""
routes/notifications.py

Notifications endpoint — fully migrated to DatabaseProvider.
No Supabase SDK imports.
"""
from fastapi import APIRouter, Depends, HTTPException
from repositories import get_db_provider, DatabaseProvider
from core.security import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def get_notifications(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Return all notifications for the authenticated user, newest first."""
    try:
        return await db.fetch_many(
            "notifications",
            filters={"user_id": user["profile"]["id"]},
            order_by="created_at",
            descending=True,
        )
    except Exception as exc:
        msg = str(exc).lower()
        # Table may not exist on every environment — degrade gracefully for reads
        if any(k in msg for k in ("not found", "does not exist", "404", "403", "permission denied")):
            logger.warning("Notifications read failed (returning empty list): %s", exc)
            return []
        logger.exception("Unexpected error fetching notifications")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Mark a single notification as read (must belong to the authenticated user)."""
    from datetime import datetime, timezone

    try:
        await db.update(
            "notifications",
            filters={"id": notification_id, "user_id": user["profile"]["id"]},
            data={"read_at": datetime.now(timezone.utc).isoformat()},
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "403" in msg or "permission denied" in msg or "forbidden" in msg:
            raise HTTPException(status_code=403, detail="Permission denied")
        if "401" in msg:
            raise HTTPException(status_code=401, detail="Unauthorized")
        logger.exception("Error marking notification %s as read", notification_id)
        raise HTTPException(status_code=503, detail="Notifications service unavailable")

    return {"status": "success"}


@router.post("/read-all")
async def mark_all_as_read(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Mark every unread notification for the authenticated user as read."""
    from datetime import datetime, timezone

    try:
        # Fetch unread notifications first, then bulk-update each one.
        # The base DatabaseProvider protocol does not expose a filtered bulk-update
        # with IS NULL; we retrieve IDs and update individually.
        unread = await db.fetch_many(
            "notifications",
            filters={"user_id": user["profile"]["id"]},
        )
        now_str = datetime.now(timezone.utc).isoformat()
        for notif in unread:
            if notif.get("read_at") is None:
                await db.update(
                    "notifications",
                    filters={"id": notif["id"]},
                    data={"read_at": now_str},
                )
    except Exception as exc:
        msg = str(exc).lower()
        if "403" in msg or "permission denied" in msg or "forbidden" in msg:
            raise HTTPException(status_code=403, detail="Permission denied")
        if "401" in msg:
            raise HTTPException(status_code=401, detail="Unauthorized")
        logger.exception("Error marking all notifications as read")
        raise HTTPException(status_code=503, detail="Notifications service unavailable")

    return {"status": "success"}
