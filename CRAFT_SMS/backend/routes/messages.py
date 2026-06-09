"""
routes/messages.py

Messaging endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports. get_user_client() dependency removed.

Note: PostgREST join syntax (profiles!sender_id(full_name, avatar_url)) is not
supported by the asyncpg provider. Joined profile data is fetched via a
separate lookup when needed, or omitted and resolved client-side.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from repositories import get_db_provider, DatabaseProvider
from core.security import get_current_user, RoleChecker

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


@router.get("/contacts")
async def get_contacts(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    my_id = user["profile"]["id"]
    
    profiles = await db.fetch_many("profiles", filters={"school_id": school_id})
    return [p for p in profiles if p["id"] != my_id]


@router.post("/direct")
async def send_direct_message(
    msg: MessageCreate,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    data = {
        "school_id":      user["profile"]["school_id"],
        "sender_id":      user["profile"]["id"],
        "receiver_id":    msg.receiver_id,
        "content":        msg.content,
        "attachment_url": msg.attachment_url,
    }
    try:
        result = await db.insert("messages", data)
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/direct/{contact_id}")
async def get_chat_history(
    contact_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Return messages between authenticated user and contact_id.

    The asyncpg provider does not support PostgREST OR-filter syntax.
    We fetch both directions and merge in Python.
    """
    try:
        my_id = user["profile"]["id"]
        sent     = await db.fetch_many("messages", filters={"sender_id": my_id,    "receiver_id": contact_id})
        received = await db.fetch_many("messages", filters={"sender_id": contact_id, "receiver_id": my_id})
        all_msgs = sorted(sent + received, key=lambda m: m.get("created_at", ""))
        return all_msgs
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/broadcasts")
async def create_broadcast(
    bc: BroadcastCreate,
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    data = {
        "school_id":    user["profile"]["school_id"],
        "author_id":    user["profile"]["id"],
        "title":        bc.title,
        "content":      bc.content,
        "target_roles": bc.target_roles,
        "is_emergency": bc.is_emergency,
    }
    try:
        result = await db.insert("broadcasts", data)
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/broadcasts")
async def get_my_broadcasts(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Return broadcasts for this school that target the user's role."""
    try:
        school_id = user["profile"]["school_id"]
        role      = user["profile"]["role"]
        all_broadcasts = await db.fetch_many(
            "broadcasts",
            filters={"school_id": school_id},
            order_by="created_at",
            descending=True,
        )
        # Filter by target_roles in Python (asyncpg provider has no array-contains filter)
        return [b for b in all_broadcasts if role in (b.get("target_roles") or [])]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
