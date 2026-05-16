from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from core.security import get_current_user, RoleChecker, get_user_client
from supabase import Client

router = APIRouter()

@router.get("/students")
async def get_linked_students(user=Depends(RoleChecker(["PARENT"])), client: Client = Depends(get_user_client)):
    """
    Fetch all students linked to this parent profile.
    """
    try:
        # parent_student_links table tracks the relationships
        response = client.table("parent_student_links") \
            .select("student_id, relationship, profiles!student_id(id, full_name, custom_id, avatar_url)") \
            .eq("parent_id", user["profile"]["id"]) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/student/{student_id}/summary")
async def get_student_summary(student_id: str, user=Depends(RoleChecker(["PARENT"])), client: Client = Depends(get_user_client)):
    """
    Get a high-level summary of a student's performance for the parent.
    Data is already filtered by RLS via the linked relationship.
    """
    try:
        # Verify link exists (Double check even with RLS)
        link = client.table("parent_student_links") \
            .select("id") \
            .eq("parent_id", user["profile"]["id"]) \
            .eq("student_id", student_id) \
            .single() \
            .execute()
        
        if not link.data:
            raise HTTPException(status_code=403, detail="Not linked to this student")

        # Aggregate data
        attendance = client.table("attendance").select("status").eq("student_id", student_id).execute()
        grades = client.table("grades").select("score").eq("student_id", student_id).eq("status", "PUBLISHED").execute()
        finance = client.table("slips").select("amount, status").eq("student_id", student_id).execute()

        return {
            "attendance_rate": calculate_rate(attendance.data),
            "average_grade": calculate_avg(grades.data),
            "pending_payments": len([s for s in finance.data if s["status"] == "PENDING"]),
            "total_paid": sum([s["amount"] for s in finance.data if s["status"] == "VERIFIED"])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def calculate_rate(data):
    if not data: return 100.0
    present = len([d for d in data if d["status"] in ["PRESENT", "LATE"]])
    return round((present / len(data)) * 100, 1)

def calculate_avg(data):
    if not data: return 0.0
    scores = [float(d["score"]) for d in data if d["score"] is not None]
    if not scores: return 0.0
    return round(sum(scores) / len(scores), 1)
