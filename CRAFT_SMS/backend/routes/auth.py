from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from core.db import supabase
from core.security import get_current_user, RoleChecker

router = APIRouter()

class ProfileCreate(BaseModel):
    user_id: str
    school_id: str
    full_name: str
    role: str
    phone_number: Optional[str] = None

@router.post("/profile")
async def create_profile(profile: ProfileCreate, user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"]))):
    # SECURITY: Restrict profile creation to admins only; prevent arbitrary role assignment
    
    # SUPER_ADMIN can create profiles for any school
    # SCHOOL_ADMIN can only create profiles for their own school
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        if str(profile.school_id) != str(user["profile"]["school_id"]):
            raise HTTPException(status_code=403, detail="Cannot create profiles for other schools")
    
    # Prevent non-SUPER_ADMIN from creating SUPER_ADMIN roles
    if user["profile"]["role"] != "SUPER_ADMIN" and profile.role == "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can create SUPER_ADMIN users")
    
    data = {
        "id": profile.user_id,
        "school_id": profile.school_id,
        "full_name": profile.full_name,
        "role": profile.role,
        "phone_number": profile.phone_number
    }
    
    try:
        response = supabase.table("profiles").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    return user["profile"]

@router.get("/profile/{user_id}")
async def get_profile(user_id: str, user=Depends(get_current_user)):
    # Basic protection: users can only see their own profile or if they are admin
    if user["profile"]["id"] != user_id and user["profile"]["role"] not in ["SCHOOL_ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # SECURITY: SCHOOL_ADMIN can only access profiles from their own school
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        try:
            target_resp = supabase.table("profiles").select("school_id").eq("id", user_id).single().execute()
            if not target_resp or not target_resp.data:
                raise HTTPException(status_code=404, detail="Profile not found")
            
            target_profile = target_resp.data
            if str(target_profile.get("school_id")) != str(user["profile"]["school_id"]):
                raise HTTPException(status_code=403, detail="Cannot access profiles from other schools")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        response = supabase.table("profiles").select("*, schools(name, subdomain)").eq("id", user_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")

@router.get("/admin/stats")
async def get_admin_stats(user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"]))):
    # This is a placeholder for admin-only stats
    return {"message": "Admin stats accessible", "school_id": user["profile"]["school_id"]}
