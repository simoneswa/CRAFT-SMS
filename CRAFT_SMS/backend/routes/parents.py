"""
routes/parents.py

Parent portal endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports. get_user_client() dependency removed.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from repositories import get_db_provider, DatabaseProvider
from core.security import get_current_user, RoleChecker

router = APIRouter()


@router.get("/students")
async def get_linked_students(
    user=Depends(RoleChecker(["PARENT"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Return all students linked to this parent profile."""
    try:
        links = await db.fetch_many(
            "parent_student_links",
            filters={"parent_id": user["profile"]["id"]},
        )
        # Enrich with student profile data (separate lookup — no PostgREST join)
        enriched = []
        for link in links:
            student = await db.fetch_one("profiles", {"id": link["student_id"]})
            enriched.append({
                "student_id":   link["student_id"],
                "relationship": link.get("relationship"),
                "profile":      student,
            })
        return enriched
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/student/{student_id}/summary")
async def get_student_summary(
    student_id: str,
    user=Depends(RoleChecker(["PARENT"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Return a high-level performance summary for a linked student."""
    try:
        # Verify the parent–student link exists (double-check even without RLS)
        link = await db.fetch_one(
            "parent_student_links",
            {"parent_id": user["profile"]["id"], "student_id": student_id},
        )
        if not link:
            raise HTTPException(status_code=403, detail="Not linked to this student")

        attendance = await db.fetch_many("attendance", filters={"student_id": student_id})
        grades     = await db.fetch_many("grades",     filters={"student_id": student_id, "status": "PUBLISHED"})
        finance    = await db.fetch_many("slips",      filters={"student_id": student_id})

        return {
            "attendance_rate":  _calculate_rate(attendance),
            "average_grade":    _calculate_avg(grades),
            "pending_payments": len([s for s in finance if s.get("status") == "PENDING"]),
            "total_paid":       sum(float(s.get("amount", 0)) for s in finance if s.get("status") == "VERIFIED"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def _calculate_rate(data):
    if not data:
        return 100.0
    present = len([d for d in data if d.get("status") in ("PRESENT", "LATE")])
    return round((present / len(data)) * 100, 1)


def _calculate_avg(data):
    if not data:
        return 0.0
    scores = [float(d["score"]) for d in data if d.get("score") is not None]
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 1)
