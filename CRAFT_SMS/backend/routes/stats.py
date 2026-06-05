"""
routes/stats.py

Public statistics endpoint — unauthenticated, read-only.
Returns platform-level aggregates safe to expose publicly.
No Supabase SDK imports.
"""
from fastapi import APIRouter, HTTPException, Depends
from repositories import get_db_provider, DatabaseProvider

router = APIRouter()


@router.get("/public")
async def get_public_stats(
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    Public (unauthenticated) platform statistics endpoint.
    Safe for use on marketing pages, landing pages, and status dashboards.
    Only exposes non-sensitive aggregate counts.

    Returns:
        active_schools: Number of currently active tenant schools.
        total_users:    Total registered user profiles across all schools.
        platform_status: Always 'operational' unless an exception is raised.
    """
    try:
        schools = await db.fetch_many("schools", filters={"is_active": True})
        users   = await db.fetch_many("profiles")

        return {
            "active_schools":   len(schools),
            "total_users":      len(users),
            "platform_status":  "operational",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Platform statistics temporarily unavailable: {str(exc)}",
        )
