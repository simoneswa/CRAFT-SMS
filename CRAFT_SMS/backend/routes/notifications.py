from fastapi import APIRouter, Depends, HTTPException
from core.db import supabase_admin
from core.security import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def _is_supabase_missing_or_forbidden_error(exc: Exception) -> bool:
    """
    Supabase REST can respond with 404 when the table doesn't exist in the
    deployed instance, and 401/403 when RLS/permissions block access.
    We treat these as non-fatal for the dashboard reads: return an empty list.
    Writes must fail loudly.
    """
    msg = str(exc).lower()
    return (
        "404" in msg
        or "not found" in msg
        or "does not exist" in msg
        or "permission denied" in msg
        or "403" in msg
        or "401" in msg
        or "forbidden" in msg
        or "not configured" in msg
        or "client not configured" in msg
    )


@router.get("/")
async def get_notifications(user=Depends(get_current_user)):
    # Read operations may degrade gracefully if the admin client or table is missing
    if supabase_admin is None:
        logger.warning("Supabase admin client is not configured; returning empty notifications list.")
        return []

    try:
        resp = (
            supabase_admin.table("notifications")
            .select("*")
            .eq("user_id", user["profile"]["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data
    except Exception as exc:
        # For reads, non-fatal fallback to empty list for missing table/permissions
        if _is_supabase_missing_or_forbidden_error(exc):
            logger.warning("Notifications read failed (treating as empty): %s", exc)
            return []
        logger.exception("Unexpected error fetching notifications")
        raise


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, user=Depends(get_current_user)):
    from datetime import datetime

    # Writes must fail loudly if admin client is missing
    if supabase_admin is None:
        logger.error("Attempt to mark notification as read but supabase_admin is not configured.")
        raise HTTPException(status_code=503, detail="Notifications service unavailable")

    try:
        supabase_admin.table("notifications").update(
            {"read_at": datetime.now().isoformat()}
        ).eq("id", notification_id).eq("user_id", user["profile"]["id"]).execute()
    except Exception as exc:
        msg = str(exc).lower()
        # Permission/auth errors should surface clearly
        if "403" in msg or "permission denied" in msg or "forbidden" in msg:
            logger.error("Permission denied updating notification: %s", exc)
            raise HTTPException(status_code=403, detail="Permission denied")
        if "401" in msg:
            logger.error("Unauthorized when updating notification: %s", exc)
            raise HTTPException(status_code=401, detail="Unauthorized")
        if _is_supabase_missing_or_forbidden_error(exc):
            logger.error("Notifications update failed due to missing table or config: %s", exc)
            raise HTTPException(status_code=503, detail="Notifications service unavailable")
        logger.exception("Unexpected error marking notification as read")
        raise

    return {"status": "success"}


@router.post("/read-all")
async def mark_all_as_read(user=Depends(get_current_user)):
    from datetime import datetime

    if supabase_admin is None:
        logger.error("Attempt to mark all notifications as read but supabase_admin is not configured.")
        raise HTTPException(status_code=503, detail="Notifications service unavailable")

    try:
        supabase_admin.table("notifications").update(
            {"read_at": datetime.now().isoformat()}
        ).eq("user_id", user["profile"]["id"]).is_("read_at", "null").execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "403" in msg or "permission denied" in msg or "forbidden" in msg:
            logger.error("Permission denied updating notifications: %s", exc)
            raise HTTPException(status_code=403, detail="Permission denied")
        if "401" in msg:
            logger.error("Unauthorized when updating notifications: %s", exc)
            raise HTTPException(status_code=401, detail="Unauthorized")
        if _is_supabase_missing_or_forbidden_error(exc):
            logger.error("Notifications bulk update failed due to missing table or config: %s", exc)
            raise HTTPException(status_code=503, detail="Notifications service unavailable")
        logger.exception("Unexpected error marking all notifications as read")
        raise

    return {"status": "success"}
