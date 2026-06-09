"""
routes/admin.py

Admin management endpoints — fully migrated to DatabaseProvider
and Firebase Admin SDK. No Supabase SDK imports.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
from repositories import get_db_provider, DatabaseProvider
from core.security import RoleChecker, get_current_user
from core.audit import log_audit_event

router = APIRouter()


class InviteUserReq(BaseModel):
    email: str
    full_name: str
    role: str
    school_id: Optional[str] = None  # Optional for Super Admins


@router.get("/users")
async def get_users(
    role: Optional[str] = None,
    user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "BUSINESS", "REGISTRAR"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    filters = {}
    if user["profile"]["role"] != "SUPER_ADMIN":
        filters["school_id"] = user["profile"]["school_id"]
    if role:
        filters["role"] = role
    return await db.fetch_many("profiles", filters=filters)


@router.post("/invite")
async def invite_user(
    req: InviteUserReq,
    user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    # Enforce isolation
    target_school_id = req.school_id
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        if req.role in ["SUPER_ADMIN"]:
            raise HTTPException(status_code=403, detail="Cannot invite Super Admins")
        target_school_id = user["profile"]["school_id"]

    if not target_school_id:
        raise HTTPException(status_code=400, detail="school_id is required")

    try:
        # Invite / create user via Firebase Admin SDK
        from core.security import firebase_auth, _firebase_app
        fb_uid = None

        if firebase_auth and _firebase_app:
            try:
                # If user already exists in Firebase, reuse their UID
                fb_user = firebase_auth.get_user_by_email(req.email, app=_firebase_app)
                fb_uid = fb_user.uid
            except Exception:
                # Otherwise, create the user in Firebase Auth
                fb_user = firebase_auth.create_user(
                    email=req.email,
                    display_name=req.full_name,
                    app=_firebase_app
                )
                fb_uid = fb_user.uid
        else:
            # Fallback for local mock/test environments
            fb_uid = f"mock-fb-{uuid.uuid4().hex[:12]}"

        new_profile_id = str(uuid.uuid4())

        # Create the profile record in the application database
        profile_data = {
            "id":           new_profile_id,
            "firebase_uid": fb_uid,
            "email":        req.email,
            "school_id":    target_school_id,
            "full_name":    req.full_name,
            "role":         req.role,
        }
        await db.insert("profiles", profile_data)

        # Log the action via our centralized logger
        log_audit_event(
            f"USER_INVITED_{req.role}",
            actor_id=user["profile"]["id"],
            school_id=target_school_id,
            target_id=new_profile_id,
            additional_metadata={"email": req.email},
        )

        return {"message": "User invited successfully", "user_id": new_profile_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/audit-logs")
async def get_audit_logs(
    user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    try:
        filters = {}
        if user["profile"]["role"] == "SCHOOL_ADMIN":
            filters["school_id"] = user["profile"]["school_id"]

        logs = await db.fetch_many(
            "audit_logs",
            filters=filters,
            order_by="created_at",
            descending=True,
        )

        # Enrich audit logs with actor profile details (no PostgREST join dependency)
        enriched = []
        for log in logs:
            actor = None
            actor_id = log.get("actor_id")
            if actor_id:
                actor = await db.fetch_one("profiles", {"id": actor_id})

            enriched.append({
                **log,
                "actor": {
                    "full_name": actor.get("full_name") if actor else None,
                    "role":      actor.get("role") if actor else None,
                } if actor else None,
            })

        return enriched
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
