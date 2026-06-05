"""
routes/grades.py

Grades endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports. get_user_client() dependency removed.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from repositories import get_db_provider, DatabaseProvider
from core.security import get_current_user, RoleChecker

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
async def submit_grades_batch(
    request: Request,
    batch: GradeBatch,
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = getattr(request.state, "school_id", None) or user["profile"]["school_id"]

    results = []
    for entry in batch.grades:
        try:
            row = await db.insert("grades", {
                "school_id":  school_id,
                "student_id": entry.student_id,
                "subject":    entry.subject,
                "score":      entry.score,
                "max_score":  entry.max_score,
                "term":       entry.term,
                "graded_by":  user["profile"]["id"],
            })
            results.append(row)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    return {
        "message": f"Successfully submitted {len(results)} grades",
        "data":    results,
    }


@router.get("/")
async def get_grades(
    request: Request,
    subject: Optional[str] = None,
    term:    Optional[str] = None,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = getattr(request.state, "school_id", None) or user["profile"]["school_id"]

    filters: dict = {"school_id": school_id}
    if user["profile"]["role"] == "STUDENT":
        filters["student_id"] = user["profile"]["id"]
    if subject:
        filters["subject"] = subject
    if term:
        filters["term"] = term

    try:
        return await db.fetch_many("grades", filters=filters)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
