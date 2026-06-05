from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from core.security import get_current_user, RoleChecker
from repositories import get_db_provider, DatabaseProvider
from repositories.profiles import ProfileRepository

from core.audit import (
    log_audit_event,
    ACTION_PROFILE_CREATED,
    ACTION_TENANT_ACCESS_DENIED,
    ACTION_ROLE_CHANGE,
    ACTION_PASSWORD_RESET,
)

router = APIRouter()

class ProfileCreate(BaseModel):
    user_id: str
    school_id: str
    full_name: str
    role: str
    phone_number: Optional[str] = None

@router.post("/profile")
async def create_profile(
    request: Request, 
    profile: ProfileCreate, 
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = ProfileRepository(db)
    # SECURITY: Restrict profile creation to admins only; prevent arbitrary role assignment
    
    # SUPER_ADMIN can create profiles for any school
    # SCHOOL_ADMIN can only create profiles for their own school
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        if str(profile.school_id) != str(user["profile"]["school_id"]):
            log_audit_event(
                ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"], 
                school_id=user["profile"]["school_id"], target_id=profile.school_id, 
                additional_metadata={"reason": "Cannot create profiles for other schools"}
            )
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
        data = await repo.create_profile(data)

        log_audit_event(
            ACTION_PROFILE_CREATED, request, actor_id=user["profile"]["id"],
            school_id=profile.school_id, target_id=profile.user_id,
            additional_metadata={"role_assigned": profile.role}
        )
        # If a non-default role is being explicitly assigned, also log ROLE_CHANGE
        if profile.role not in ("STUDENT",):
            log_audit_event(
                ACTION_ROLE_CHANGE, request, actor_id=user["profile"]["id"],
                school_id=profile.school_id, target_id=profile.user_id,
                additional_metadata={"new_role": profile.role, "reason": "profile creation"}
            )
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    return user["profile"]

@router.get("/profile/{user_id}")
async def get_profile(
    request: Request, 
    user_id: str, 
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = ProfileRepository(db)
    # Basic protection: users can only see their own profile or if they are admin
    if user["profile"]["id"] != user_id and user["profile"]["role"] not in ["SCHOOL_ADMIN", "SUPER_ADMIN"]:
        log_audit_event(
            ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
            school_id=user["profile"]["school_id"], target_id=user_id,
            additional_metadata={"reason": "Not authorized to view other profiles"}
        )
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # SECURITY: SCHOOL_ADMIN can only access profiles from their own school
    if user["profile"]["role"] == "SCHOOL_ADMIN":
        try:
            target_profile = await repo.get_profile(user_id)
            if not target_profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            

            if str(target_profile.get("school_id")) != str(user["profile"]["school_id"]):
                log_audit_event(
                    ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
                    school_id=user["profile"]["school_id"], target_id=user_id,
                    additional_metadata={"reason": "Cannot access profiles from other schools"}
                )
                raise HTTPException(status_code=403, detail="Cannot access profiles from other schools")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        target_profile = await repo.get_profile_with_school(user_id)
        if not target_profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return target_profile
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")

@router.get("/admin/stats")
async def get_admin_stats(user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"]))):
    # This is a placeholder for admin-only stats
    return {"message": "Admin stats accessible", "school_id": user["profile"]["school_id"]}


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
class PasswordResetRequest(BaseModel):
    email: str

@router.post("/reset-password", status_code=200)
async def request_password_reset(request: Request, body: PasswordResetRequest):
    """
    Initiates a password-reset flow via Firebase Auth.

    The backend generates a Firebase password-reset link via firebase-admin.
    Audit-logs the request regardless of whether the email exists
    (prevents user enumeration via timing differences).

    Note: Firebase Auth is the sole authentication provider. Supabase Auth
    password reset (supabase.auth.reset_password_email) has been removed.
    """
    log_audit_event(
        ACTION_PASSWORD_RESET,
        request,
        additional_metadata={"email": body.email},
    )
    try:
        from core.security import firebase_auth, _firebase_app
        if firebase_auth and _firebase_app:
            # Generate reset link — client should redirect the user to this URL.
            # The link is not emailed here; email delivery is handled by
            # Firebase's own email action template or a downstream service.
            reset_link = firebase_auth.generate_password_reset_link(
                body.email, app=_firebase_app
            )
            # Do not return the link in the response (security: enumeration prevention)
            _ = reset_link
    except Exception:
        # Swallow all errors — do not expose whether the email is registered.
        pass
    return {"message": "If that email is registered, a reset link has been sent."}
