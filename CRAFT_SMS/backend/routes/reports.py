from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from core.security import RoleChecker, get_current_user, get_user_client
from supabase import Client
from datetime import datetime

router = APIRouter()

@router.get("/finance/summary")
async def get_financial_report(term_id: str, user=Depends(RoleChecker(["SCHOOL_ADMIN", "BUSINESS"])), client: Client = Depends(get_user_client)):
    """
    Generate a term-wise financial summary for the institution.
    """
    school_id = user["profile"]["school_id"]
    
    try:
        # Fetch all verified slips for this term
        # Note: We might need a junction between slips and terms if not already linked
        # For now, we assume we filter by date range of the term
        term = client.table("academic_terms").select("*").eq("id", term_id).single().execute()
        if not term.data:
            raise HTTPException(status_code=404, detail="Term not found")

        slips = client.table("slips") \
            .select("amount, status, created_at, profiles!student_id(full_name, custom_id)") \
            .eq("school_id", school_id) \
            .gte("created_at", term.data["start_date"]) \
            .lte("created_at", term.data["end_date"]) \
            .execute()
        
        verified = [s for s in slips.data if s["status"] == "VERIFIED"]
        pending = [s for s in slips.data if s["status"] == "PENDING"]
        
        return {
            "term_name": term.data["name"],
            "summary": {
                "total_collected": sum([float(s["amount"]) for s in verified]),
                "total_pending": sum([float(s["amount"]) for s in pending]),
                "collection_count": len(verified),
                "pending_count": len(pending)
            },
            "records": slips.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/attendance/heatmap")
async def get_attendance_heatmap(user=Depends(RoleChecker(["SCHOOL_ADMIN"])), client: Client = Depends(get_user_client)):
    """
    Generate an institutional attendance heatmap (Attendance per day).
    """
    school_id = user["profile"]["school_id"]
    try:
        # Fetch last 90 days of attendance counts
        response = client.rpc("get_attendance_stats", {"p_school_id": school_id}).execute()
        return response.data
    except Exception as e:
        # Fallback if RPC doesn't exist
        return {"message": "Heatmap generation requires SQL RPC helper", "school_id": school_id}
