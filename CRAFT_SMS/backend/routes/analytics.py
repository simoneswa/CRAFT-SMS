"""
routes/analytics.py

Analytics endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports. get_user_client() dependency removed.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from repositories import get_db_provider, DatabaseProvider
from core.security import RoleChecker, get_current_user

router = APIRouter()


@router.get("/summary")
async def get_institutional_kpis(
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]

    try:
        # 1. Enrollment stats
        students    = await db.fetch_many("profiles",    filters={"school_id": school_id, "role": "STUDENT"})

        # 2. Financial stats — total verified revenue
        revenue_rows = await db.fetch_many("slips",     filters={"school_id": school_id, "status": "VERIFIED"})
        total_revenue = sum(float(r.get("amount", 0)) for r in revenue_rows)

        # 3. Attendance rate — last 30 days
        last_30_days = (datetime.now() - timedelta(days=30)).date().isoformat()
        attendance   = await db.fetch_many("attendance", filters={"school_id": school_id})
        recent_att   = [a for a in attendance if (a.get("date") or "") >= last_30_days]
        att_rate     = _calculate_att_rate(recent_att)

        # 4. Academic health — average published grade
        grades   = await db.fetch_many("grades", filters={"school_id": school_id, "status": "PUBLISHED"})
        avg_grade = _calculate_avg_grade(grades)

        return {
            "kpis": {
                "total_students":      len(students),
                "institutional_revenue": total_revenue,
                "attendance_rate":     att_rate,
                "average_grade":       avg_grade,
            },
            "trends": {
                "attendance": [92, 94, 91, 95, att_rate],
                "revenue":    [12000, 15000, 18000, total_revenue],
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/at-risk")
async def get_at_risk_students(
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """Identify students with low performance or poor attendance."""
    school_id = user["profile"]["school_id"]

    try:
        students_rows = await db.fetch_many(
            "profiles", filters={"school_id": school_id, "role": "STUDENT"}
        )

        at_risk = []
        for s in students_rows:
            # Attendance
            att_rows    = await db.fetch_many("attendance", filters={"student_id": s["id"]})
            absent_count = len([a for a in att_rows if a.get("status") == "ABSENT"])
            total_days   = len(att_rows)
            att_risk     = (absent_count / total_days > 0.1) if total_days > 5 else False

            # Grades
            grade_rows = await db.fetch_many("grades", filters={"student_id": s["id"], "status": "PUBLISHED"})
            scores     = [float(g["score"]) for g in grade_rows if g.get("score") is not None]
            avg_score  = sum(scores) / len(scores) if scores else 100.0
            grade_risk = avg_score < 60.0

            if att_risk or grade_risk:
                at_risk.append({
                    "id":            s["id"],
                    "name":          s.get("full_name"),
                    "custom_id":     s.get("custom_id"),
                    "absences":      absent_count,
                    "average_grade": round(avg_score, 1),
                    "risk_level":    "CRITICAL" if (att_risk and grade_risk) else "WARNING",
                })

        return sorted(at_risk, key=lambda x: x["average_grade"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def _calculate_att_rate(data):
    if not data:
        return 100.0
    present = len([d for d in data if d.get("status") in ("PRESENT", "LATE")])
    return round((present / len(data)) * 100, 1)


def _calculate_avg_grade(data):
    if not data:
        return 0.0
    scores = [float(d["score"]) for d in data if d.get("score") is not None]
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 1)


# ---------------------------------------------------------------------------
# Phase 0 Endpoints
# ---------------------------------------------------------------------------

@router.get("/finance-summary")
async def get_finance_summary(
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN", "BUSINESS"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    Returns key financial metrics for the authenticated user's school.
    Intended for dashboard finance widgets and Phase 0 frontend migration.
    """
    school_id = user["profile"]["school_id"]

    try:
        verified_slips = await db.fetch_many("slips", filters={"school_id": school_id, "status": "VERIFIED"})
        pending_slips  = await db.fetch_many("slips", filters={"school_id": school_id, "status": "PENDING"})
        rejected_slips = await db.fetch_many("slips", filters={"school_id": school_id, "status": "REJECTED"})

        total_revenue   = sum(float(s.get("amount", 0)) for s in verified_slips)
        pending_amount  = sum(float(s.get("amount", 0)) for s in pending_slips)
        rejected_amount = sum(float(s.get("amount", 0)) for s in rejected_slips)

        # Monthly revenue (current calendar month)
        from datetime import datetime
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        monthly_revenue = sum(
            float(s.get("amount", 0)) for s in verified_slips
            if (s.get("verified_at") or "") >= start_of_month
        )

        return {
            "school_id":       school_id,
            "total_revenue":   total_revenue,
            "monthly_revenue": monthly_revenue,
            "pending_amount":  pending_amount,
            "rejected_amount": rejected_amount,
            "verified_count":  len(verified_slips),
            "pending_count":   len(pending_slips),
            "rejected_count":  len(rejected_slips),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER", "BUSINESS", "STUDENT", "PARENT"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    Returns a high-level summary for the main dashboard.
    Scoped to the authenticated user's school.
    Used by the Phase 0 frontend dashboard page to replace direct Supabase queries.
    """
    school_id = user["profile"]["school_id"]
    role      = user["profile"]["role"]

    try:
        students  = await db.fetch_many("profiles", filters={"school_id": school_id, "role": "STUDENT"})
        teachers  = await db.fetch_many("profiles", filters={"school_id": school_id, "role": "TEACHER"})

        # Financial snapshot (accessible to all roles — amounts hidden for students/parents)
        verified_slips = await db.fetch_many("slips", filters={"school_id": school_id, "status": "VERIFIED"})
        pending_slips  = await db.fetch_many("slips", filters={"school_id": school_id, "status": "PENDING"})
        total_revenue  = sum(float(s.get("amount", 0)) for s in verified_slips)

        # Attendance rate — last 30 days
        from datetime import datetime, timedelta
        last_30_days = (datetime.now() - timedelta(days=30)).date().isoformat()
        attendance   = await db.fetch_many("attendance", filters={"school_id": school_id})
        recent_att   = [a for a in attendance if (a.get("date") or "") >= last_30_days]
        att_rate     = _calculate_att_rate(recent_att)

        # Recent broadcasts
        broadcasts = await db.fetch_many(
            "broadcasts",
            filters={"school_id": school_id},
            order_by="created_at",
            descending=True,
        )
        # Limit to 5 most recent, filter by role
        recent_broadcasts = [
            b for b in broadcasts if role in (b.get("target_roles") or [])
        ][:5]

        summary: dict = {
            "school_id":          school_id,
            "total_students":     len(students),
            "total_teachers":     len(teachers),
            "attendance_rate_30d": att_rate,
            "pending_slips":      len(pending_slips),
            "recent_broadcasts":  recent_broadcasts,
        }

        # Only expose financial totals to admin / business roles
        if role in ("SCHOOL_ADMIN", "SUPER_ADMIN", "BUSINESS"):
            summary["total_revenue"] = total_revenue

        return summary
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
