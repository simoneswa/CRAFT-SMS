from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from core.db import supabase_admin
from core.security import RoleChecker, get_current_user

router = APIRouter()

class InviteUserReq(BaseModel):
    email: str
    full_name: str
    role: str
    school_id: Optional[str] = None # Optional for Super Admins

@router.post("/invite")
async def invite_user(req: InviteUserReq, user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN"]))):
    # Enforce isolation
    target_school_id = req.school_id
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        if req.role in ["SUPER_ADMIN"]:
            raise HTTPException(status_code=403, detail="Cannot invite Super Admins")
        target_school_id = user["profile"]["school_id"]
    
    if not target_school_id:
        raise HTTPException(status_code=400, detail="school_id is required")

    try:
        # Invite user via Supabase Auth Admin API
        response = supabase_admin.auth.admin.invite_user_by_email(req.email)
        new_user_id = response.user.id
        
        # Create profile
        profile_data = {
            "id": new_user_id,
            "school_id": target_school_id,
            "full_name": req.full_name,
            "role": req.role
        }
        supabase_admin.table("profiles").insert(profile_data).execute()
        
        # Log action
        supabase_admin.table("audit_logs").insert({
            "school_id": target_school_id,
            "actor_id": user["profile"]["id"],
            "action": f"USER_INVITED_{req.role}",
            "target_id": new_user_id,
            "metadata": {"email": req.email}
        }).execute()
        
        return {"message": "User invited successfully", "user_id": new_user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/audit-logs")
async def get_audit_logs(user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN"]))):
    try:
        query = supabase_admin.table("audit_logs").select("*, actor:profiles!actor_id(full_name, role)").order("created_at", desc=True)
        
        if user["profile"]["role"] == "SCHOOL_ADMIN":
            query = query.eq("school_id", user["profile"]["school_id"])
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
