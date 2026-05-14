from fastapi import APIRouter, HTTPException, Depends
from core.db import supabase_admin
from core.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_notifications(user=Depends(get_current_user)):
    resp = supabase_admin.table("notifications").select("*").eq("user_id", user["profile"]["id"]).order("created_at", desc=True).execute()
    return resp.data

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, user=Depends(get_current_user)):
    from datetime import datetime
    resp = supabase_admin.table("notifications").update({"read_at": datetime.now().isoformat()}).eq("id", notification_id).eq("user_id", user["profile"]["id"]).execute()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(user=Depends(get_current_user)):
    from datetime import datetime
    supabase_admin.table("notifications").update({"read_at": datetime.now().isoformat()}).eq("user_id", user["profile"]["id"]).is_("read_at", "null").execute()
    return {"status": "success"}
