from fastapi import APIRouter, Depends
from core.db import supabase_admin
from core.security import get_current_user

router = APIRouter()


def _is_supabase_missing_or_forbidden_error(exc: Exception) -> bool:
    """
    Supabase REST can respond with 404 when the table doesn't exist in the
    deployed instance, and 401/403 when RLS/permissions block access.
    We treat these as non-fatal for the dashboard: return an empty list.
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
    )


@router.get("/")
async def get_notifications(user=Depends(get_current_user)):
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
        # Hotfix: never let notifications break the dashboard.
        if _is_supabase_missing_or_forbidden_error(exc):
            return []
        raise


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, user=Depends(get_current_user)):
    from datetime import datetime

    try:
        supabase_admin.table("notifications").update(
            {"read_at": datetime.now().isoformat()}
        ).eq("id", notification_id).eq("user_id", user["profile"]["id"]).execute()
    except Exception as exc:
        # Hotfix: non-fatal if notifications table is missing/restricted.
        if _is_supabase_missing_or_forbidden_error(exc):
            return {"status": "success"}
        raise

    return {"status": "success"}


@router.post("/read-all")
async def mark_all_as_read(user=Depends(get_current_user)):
    from datetime import datetime

    try:
        supabase_admin.table("notifications").update(
            {"read_at": datetime.now().isoformat()}
        ).eq("user_id", user["profile"]["id"]).is_("read_at", "null").execute()
    except Exception as exc:
        # Hotfix: non-fatal if notifications table is missing/restricted.
        if _is_supabase_missing_or_forbidden_error(exc):
            return {"status": "success"}
        raise

    return {"status": "success"}
