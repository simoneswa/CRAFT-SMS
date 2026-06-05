"""
routes/reports.py

Reporting and analytics endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports. get_user_client() dependency removed.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from core.security import RoleChecker, get_current_user
from repositories import get_db_provider, DatabaseProvider
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/finance/summary")
async def get_financial_report(
    term_id: str,
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "BUSINESS"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Generate a term-wise financial summary for the institution.

    Pulls all slips within the academic term date range and enriches with student profiles.
    """
    school_id = user["profile"]["school_id"]

    try:
        # Fetch the academic term
        term = await db.fetch_one("academic_terms", {"id": term_id})
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")

        # Fetch all slips for the school
        slips_rows = await db.fetch_many("slips", {"school_id": school_id})

        # Filter by term date range in Python (agnostic & robust)
        start_date = term.get("start_date") or ""
        end_date   = term.get("end_date") or ""

        term_slips = []
        for s in slips_rows:
            created_at = s.get("created_at") or ""
            # Handle ISO timestamp comparison
            if start_date <= created_at <= end_date:
                term_slips.append(s)

        # Enrich slips with student profiles
        enriched = []
        for s in term_slips:
            student_id = s.get("student_id")
            student = None
            if student_id:
                student = await db.fetch_one("profiles", {"id": student_id})

            # Format response matching legacy schema format that frontend expects
            enriched.append({
                "amount":     s.get("amount"),
                "status":     s.get("status"),
                "created_at": s.get("created_at"),
                "profiles": {
                    "full_name": student.get("full_name") if student else None,
                    "custom_id": student.get("custom_id") if student else None,
                } if student else None,
            })

        verified = [s for s in enriched if s["status"] == "VERIFIED"]
        pending  = [s for s in enriched if s["status"] == "PENDING"]

        return {
            "term_name": term.get("name"),
            "summary": {
                "total_collected": sum(float(s["amount"] or 0) for s in verified),
                "total_pending":   sum(float(s["amount"] or 0) for s in pending),
                "collection_count": len(verified),
                "pending_count":    len(pending),
            },
            "records": enriched,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/attendance/heatmap")
async def get_attendance_heatmap(
    user=Depends(RoleChecker(["SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Generate daily attendance counts for the last 90 days.

    Computed entirely in Python to be provider-agnostic, eliminating the need
    for a database RPC function helper.
    """
    school_id = user["profile"]["school_id"]
    try:
        limit_date = (datetime.now() - timedelta(days=90)).date().isoformat()
        attendance = await db.fetch_many("attendance", {"school_id": school_id})

        # Filter and aggregate daily stats in Python
        counts = {}
        for a in attendance:
            d = a.get("date")
            if d and d >= limit_date:
                counts.setdefault(d, {"present": 0, "total": 0})
                counts[d]["total"] += 1
                if a.get("status") in ("PRESENT", "LATE"):
                    counts[d]["present"] += 1

        result = []
        for d, stat in counts.items():
            present = stat["present"]
            total   = stat["total"]
            result.append({
                "date":          d,
                "present_count": present,
                "total_count":   total,
                "attendance_rate": round((present / total) * 100, 1) if total > 0 else 0,
            })

        return sorted(result, key=lambda x: x["date"])
    except Exception as exc:
        return {"message": f"Heatmap generation error: {exc}", "school_id": school_id}
