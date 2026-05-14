from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from core.security import get_current_user, RoleChecker, get_user_client
from supabase import Client

router = APIRouter()

class GradeEntry(BaseModel):
    student_id: str
    subject: str
    score: float
    max_score: Optional[float] = 100.0
    term: Optional[str] = "First Term"

class GradeBatch(BaseModel):
    grades: List[GradeEntry]

@router.post("/batch")
async def submit_grades_batch(request: Request, batch: GradeBatch, user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])), client: Client = Depends(get_user_client)):
    school_id = request.state.school_id or user["profile"]["school_id"]
    
    # Prepare data for bulk insert
    insert_data = []
    for entry in batch.grades:
        insert_data.append({
            "school_id": school_id,
            "student_id": entry.student_id,
            "subject": entry.subject,
            "score": entry.score,
            "max_score": entry.max_score,
            "term": entry.term,
            "graded_by": user["profile"]["id"]
        })
    
    try:
        # Client respects RLS - teacher can only insert for their school_id
        response = client.table("grades").insert(insert_data).execute()
        return {"message": f"Successfully submitted {len(response.data)} grades", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def get_grades(request: Request, subject: Optional[str] = None, term: Optional[str] = None, user=Depends(get_current_user), client: Client = Depends(get_user_client)):
    school_id = request.state.school_id or user["profile"]["school_id"]
    
    query = client.table("grades").select("*, profiles!student_id(full_name, custom_id)").eq("school_id", school_id)
    
    if user["profile"]["role"] == "STUDENT":
        query = query.eq("student_id", user["profile"]["id"])
        
    if subject:
        query = query.eq("subject", subject)
    if term:
        query = query.eq("term", term)
        
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
