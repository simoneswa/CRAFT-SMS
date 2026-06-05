import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import firebase_admin
from firebase_admin import storage as firebase_storage

from core.security import get_current_user, _firebase_app
from core.audit import (
    log_audit_event, 
    ACTION_FILE_DOWNLOAD, 
    ACTION_FILE_ACCESS_DENIED,
    ACTION_FILE_UPLOAD
)

# You should configure this via env vars in a real deployment
# Example: "craft-sms-460912.appspot.com"
FIREBASE_STORAGE_BUCKET = "craft-sms-460912.appspot.com"

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])

class SignedUrlRequest(BaseModel):
    path: str

@router.get("/signed-url")
async def get_signed_url(
    path: str = Query(..., description="The full path of the file in Firebase Storage"),
    user: dict = Depends(get_current_user)
):
    """
    Generate a short-lived Signed URL for secure download access.
    Enforces RBAC before generating the URL.
    """
    profile = user.get("profile")
    if not profile:
        raise HTTPException(status_code=401, detail="User profile not found")

    user_id = profile.get("id")
    school_id = profile.get("school_id")
    role = profile.get("role")

    # Path format should be: schools/{schoolId}/{category}/{userId}/{filename}
    parts = path.strip("/").split("/")
    
    # Validation against malformed paths
    if len(parts) < 5 or parts[0] != "schools":
        log_audit_event(
            ACTION_FILE_ACCESS_DENIED,
            actor_id=user_id,
            school_id=school_id,
            additional_metadata={"path": path, "reason": "Malformed path"}
        )
        raise HTTPException(status_code=400, detail="Invalid storage path format")

    req_school_id = parts[1]
    category = parts[2]
    req_user_id = parts[3]

    # Role-Based Access Control
    authorized = False
    
    if role == "SUPER_ADMIN":
        authorized = True
    elif role == "SCHOOL_ADMIN" and school_id == req_school_id:
        authorized = True
    elif role == "TEACHER" and school_id == req_school_id:
        authorized = True
    elif role == "STUDENT":
        # Students should NOT be downloading files via this endpoint 
        # (they only upload payment slips according to the rules)
        authorized = False
    
    if not authorized:
        log_audit_event(
            ACTION_FILE_ACCESS_DENIED,
            actor_id=user_id,
            school_id=school_id,
            additional_metadata={"path": path, "reason": "RBAC Denied"}
        )
        raise HTTPException(status_code=403, detail="Not authorized to access this file")

    if not _firebase_app:
        raise HTTPException(status_code=503, detail="Firebase Admin not initialized")

    try:
        bucket = firebase_storage.bucket(FIREBASE_STORAGE_BUCKET, app=_firebase_app)
        blob = bucket.blob(path)
        
        # Check if file exists and is not quarantined
        if not blob.exists():
            raise HTTPException(status_code=404, detail="File not found")
            
        # Optional: Check malware scan metadata
        blob.reload()
        status = blob.metadata.get("status") if blob.metadata else None
        if status == "QUARANTINED":
            raise HTTPException(status_code=403, detail="File is quarantined and cannot be downloaded")

        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET",
        )

        log_audit_event(
            ACTION_FILE_DOWNLOAD,
            actor_id=user_id,
            school_id=school_id,
            additional_metadata={"path": path}
        )

        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        log_audit_event(
            ACTION_FILE_ACCESS_DENIED,
            actor_id=user_id,
            school_id=school_id,
            additional_metadata={"path": path, "reason": str(e)}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit-upload")
async def audit_upload(
    payload: SignedUrlRequest,
    user: dict = Depends(get_current_user)
):
    """
    Called by the frontend after a successful direct upload to Firebase Storage 
    so we can persist the FILE_UPLOAD event.
    """
    profile = user.get("profile")
    if not profile:
        raise HTTPException(status_code=401, detail="User profile not found")

    log_audit_event(
        ACTION_FILE_UPLOAD,
        actor_id=profile.get("id"),
        school_id=profile.get("school_id"),
        additional_metadata={"path": payload.path}
    )
    return {"status": "ok"}
