from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from core.security import get_current_user, RoleChecker
from core.audit import log_audit_event, ACTION_PAYMENT_SUBMITTED
from repositories import get_db_provider, DatabaseProvider
from repositories.finance import FinanceRepository


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
async def submit_slip(
    request: Request, 
    slip: SlipCreate, 
    user=Depends(RoleChecker(["STUDENT", "TEACHER", "BUSINESS", "SCHOOL_ADMIN"])), 
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = FinanceRepository(db)

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
        created_slip = await repo.create_slip(data)
        if created_slip:
            log_audit_event(
                ACTION_PAYMENT_SUBMITTED, request, actor_id=user["profile"]["id"],
                school_id=school_id, target_id=created_slip.get("id"),
                additional_metadata={"amount": slip.amount, "slip_number": slip.slip_number}
            )
        return [created_slip] if created_slip else []

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/slips/{slip_id}/verify")
async def verify_slip(
    slip_id: str, 
    verification: SlipVerify, 
    user=Depends(RoleChecker(["BUSINESS", "SCHOOL_ADMIN"])), 
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = FinanceRepository(db)

    if verification.status not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    data = {
        "status": verification.status,
        "verified_by": user["profile"]["id"],
        "verified_at": datetime.now().isoformat(),
        "notes": verification.notes
    }
    
    try:
        updated_slips = await repo.update_slip(slip_id, data)
        
        # Log this action to the audit logs
        log_audit_event(
            f"SLIP_{verification.status}", request=None, actor_id=user["profile"]["id"],
            school_id=user["profile"]["school_id"], target_id=slip_id,
            additional_metadata={"notes": verification.notes}
        )
        # Trigger Notification for Student
        if updated_slips:
            slip_data = updated_slips[0]
            await db.insert("notifications", {
                "school_id": user["profile"]["school_id"],
                "user_id": slip_data["student_id"],
                "title": f"Payment {verification.status}",
                "message": f"Your payment slip #{slip_data['slip_number']} for ${slip_data['amount']} has been {verification.status.lower()}.",
                "type": "FINANCE"
            })
        
        return updated_slips
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/slips")
async def get_my_slips(
    request: Request, 
    status: Optional[str] = None, 
    user=Depends(get_current_user), 
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = FinanceRepository(db)

    school_id = request.state.school_id or user["profile"]["school_id"]
    
    student_id = None
    # If not staff, only see own slips (Though RLS also enforces this!)
    if user["profile"]["role"] not in ["BUSINESS", "SCHOOL_ADMIN", "TEACHER"]:
        student_id = user["profile"]["id"]
        
    try:
        slips = await repo.list_slips(school_id=school_id, student_id=student_id, status=status)
        return slips
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
