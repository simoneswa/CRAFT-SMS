from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from core.security import get_current_user, RoleChecker, get_user_client
from supabase import Client

router = APIRouter()

class SlipCreate(BaseModel):
    student_id: str
    slip_number: str
    amount: float
    notes: Optional[str] = None
    image_url: Optional[str] = None

class SlipVerify(BaseModel):
    status: str # VERIFIED or REJECTED
    notes: Optional[str] = None

@router.post("/slips")
async def submit_slip(request: Request, slip: SlipCreate, user=Depends(RoleChecker(["STUDENT", "TEACHER", "BUSINESS", "SCHOOL_ADMIN"])), client: Client = Depends(get_user_client)):
    school_id = request.state.school_id or user["profile"]["school_id"]
    
    # Use a placeholder if no image is uploaded yet, per user instructions
    final_image_url = slip.image_url if slip.image_url else f"https://placehold.co/600x800/2dd4bf/ffffff?text=Slip+{slip.slip_number}"

    data = {
        "school_id": school_id,
        "student_id": slip.student_id,
        "slip_number": slip.slip_number,
        "amount": slip.amount,
        "notes": slip.notes,
        "image_url": final_image_url,
        "status": "PENDING"
    }
    
    try:
        response = client.table("slips").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/slips/{slip_id}/verify")
async def verify_slip(slip_id: str, verification: SlipVerify, user=Depends(RoleChecker(["BUSINESS", "SCHOOL_ADMIN"])), client: Client = Depends(get_user_client)):
    if verification.status not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    data = {
        "status": verification.status,
        "verified_by": user["profile"]["id"],
        "verified_at": datetime.now().isoformat(),
        "notes": verification.notes
    }
    
    try:
        response = client.table("slips").update(data).eq("id", slip_id).execute()
        
        # Log this action to the audit logs
        from core.db import supabase_admin
        supabase_admin.table("audit_logs").insert({
            "school_id": user["profile"]["school_id"],
            "actor_id": user["profile"]["id"],
            "action": f"SLIP_{verification.status}",
            "target_id": slip_id,
            "metadata": {"notes": verification.notes}
        }).execute()

        # Trigger Notification for Student
        slip_data = response.data[0]
        supabase_admin.table("notifications").insert({
            "school_id": user["profile"]["school_id"],
            "user_id": slip_data["student_id"],
            "title": f"Payment {verification.status}",
            "message": f"Your payment slip #{slip_data['slip_number']} for ${slip_data['amount']} has been {verification.status.lower()}.",
            "type": "FINANCE"
        }).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/slips")
async def get_my_slips(request: Request, status: Optional[str] = None, user=Depends(get_current_user), client: Client = Depends(get_user_client)):
    school_id = request.state.school_id or user["profile"]["school_id"]
    
    query = client.table("slips").select("*, profiles!student_id(full_name, custom_id)").eq("school_id", school_id)
    
    # If not staff, only see own slips (Though RLS also enforces this!)
    if user["profile"]["role"] not in ["BUSINESS", "SCHOOL_ADMIN", "TEACHER"]:
        query = query.eq("student_id", user["profile"]["id"])
        
    if status:
        query = query.eq("status", status)
    
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
