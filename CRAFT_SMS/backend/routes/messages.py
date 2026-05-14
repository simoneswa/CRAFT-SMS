from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from core.security import get_current_user, RoleChecker, get_user_client
from supabase import Client
from datetime import datetime

router = APIRouter()

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    attachment_url: Optional[str] = None

class BroadcastCreate(BaseModel):
    title: str
    content: str
    target_roles: List[str] = ["STUDENT", "TEACHER", "PARENT"]
    is_emergency: bool = False

@router.post("/direct")
async def send_direct_message(msg: MessageCreate, user=Depends(get_current_user), client: Client = Depends(get_user_client)):
    data = {
        "school_id": user["profile"]["school_id"],
        "sender_id": user["profile"]["id"],
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "attachment_url": msg.attachment_url
    }
    try:
        response = client.table("messages").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/direct/{contact_id}")
async def get_chat_history(contact_id: str, user=Depends(get_current_user), client: Client = Depends(get_user_client)):
    try:
        response = client.table("messages") \
            .select("*, profiles!sender_id(full_name, avatar_url)") \
            .or_(f"and(sender_id.eq.{user['profile']['id']},receiver_id.eq.{contact_id}),and(sender_id.eq.{contact_id},receiver_id.eq.{user['profile']['id']})") \
            .order("created_at", { "ascending": True }) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/broadcasts")
async def create_broadcast(bc: BroadcastCreate, user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER"])), client: Client = Depends(get_user_client)):
    data = {
        "school_id": user["profile"]["school_id"],
        "author_id": user["profile"]["id"],
        "title": bc.title,
        "content": bc.content,
        "target_roles": bc.target_roles,
        "is_emergency": bc.is_emergency
    }
    try:
        response = client.table("broadcasts").insert(data).execute()
        
        # Trigger system notifications for all targets (Simplified for now)
        # In a real system, this would be a background job
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/broadcasts")
async def get_my_broadcasts(user=Depends(get_current_user), client: Client = Depends(get_user_client)):
    try:
        role = user["profile"]["role"]
        response = client.table("broadcasts") \
            .select("*, profiles!author_id(full_name)") \
            .eq("school_id", user["profile"]["school_id"]) \
            .contains("target_roles", [role]) \
            .order("created_at", { "ascending": False }) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
