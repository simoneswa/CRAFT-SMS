"""
routes/tenants.py

Tenant management endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports.
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from repositories import get_db_provider, DatabaseProvider
from core.security import RoleChecker, get_current_user
from core.audit import log_audit_event
from services.tenant_bootstrap import bootstrap_new_tenant

router = APIRouter()


class SchoolCreate(BaseModel):
    name: str
    subdomain: str
    branding: dict = None


@router.get("/")
async def list_tenants(
    db: DatabaseProvider = Depends(get_db_provider),
):
    return await db.fetch_many("schools", filters={"is_active": True})


@router.post("/schools")
async def create_school(
    req: SchoolCreate,
    background_tasks: BackgroundTasks,
    user=Depends(RoleChecker(["SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    try:
        data = {
            "name": req.name,
            "subdomain": req.subdomain.lower(),
            "branding": req.branding,
            "is_active": True,
        }
        new_school = await db.insert("schools", data)
        new_school_id = new_school.get("id")

        # Audit log via the centralised non-blocking logger
        log_audit_event(
            "SCHOOL_CREATED",
            actor_id=user["profile"]["id"],
            school_id=new_school_id,
            target_id=new_school_id,
            additional_metadata={"name": req.name, "subdomain": req.subdomain},
        )

        # Provision default academic structure in the background
        background_tasks.add_task(bootstrap_new_tenant, school_id=new_school_id, db=db)

        return new_school
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/metrics")
async def get_global_metrics(
    user=Depends(RoleChecker(["SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    try:
        schools = await db.fetch_many("schools")
        users   = await db.fetch_many("profiles")
        slips   = await db.fetch_many("slips", filters={"status": "VERIFIED"})

        revenue = sum(float(s.get("amount", 0)) for s in slips)

        return {
            "total_tenants": len(schools),
            "total_users":   len(users),
            "platform_revenue": revenue,
            "system_health": "99.9%",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/schools/{school_id}/metrics")
async def get_school_metrics(
    school_id: str,
    user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "BUSINESS", "STUDENT"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    # Tenant isolation: non-super-admins can only view their own school
    if user["profile"]["role"] != "SUPER_ADMIN" and str(user["profile"]["school_id"]) != school_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this school's metrics")

    try:
        from datetime import datetime
        students = await db.fetch_many("profiles",    filters={"school_id": school_id, "role": "STUDENT"})
        teachers = await db.fetch_many("profiles",    filters={"school_id": school_id, "role": "TEACHER"})
        pending  = await db.fetch_many("slips",       filters={"school_id": school_id, "status": "PENDING"})

        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        all_verified   = await db.fetch_many("slips", filters={"school_id": school_id, "status": "VERIFIED"})
        monthly_revenue = sum(
            float(s.get("amount", 0)) for s in all_verified
            if (s.get("verified_at") or "") >= start_of_month
        )

        return {
            "total_students":  len(students),
            "pending_slips":   len(pending),
            "monthly_revenue": monthly_revenue,
            "total_teachers":  len(teachers),
            "academic_avg":    88,  # Placeholder until grades logic is finalised
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ---------------------------------------------------------------------------
# Phase 0 Endpoints
# ---------------------------------------------------------------------------

@router.get("/by-subdomain")
async def get_tenant_by_subdomain(
    subdomain: str,
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    Public (unauthenticated) endpoint that resolves a school by subdomain.
    Replaces the direct supabase.from('schools') call in the frontend TenantProvider.

    Returns:
        200: School object if subdomain matches an active tenant.
        404: School not found.
        403: School found but inactive.
    """
    if not subdomain or not subdomain.strip():
        raise HTTPException(status_code=400, detail="subdomain query parameter is required")

    try:
        school = await db.fetch_one("schools", {"subdomain": subdomain.strip().lower()})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")

    if not school:
        raise HTTPException(status_code=404, detail=f"No school found for subdomain '{subdomain}'")

    if not school.get("is_active", False):
        raise HTTPException(status_code=403, detail=f"School '{subdomain}' exists but is inactive")

    return school


class TenantRequest(BaseModel):
    name: str
    subdomain: str
    contact_email: str
    contact_name: str
    notes: Optional[str] = ""


@router.post("/request")
async def request_tenant(
    req: TenantRequest,
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    Public (unauthenticated) endpoint that allows an organization to request
    a new tenant account. Stores the request as an audit event for SUPER_ADMIN review.

    Returns:
        200: Confirmation that the request was received.
        409: Subdomain already registered.
    """
    # Check if subdomain is already taken
    try:
        existing = await db.fetch_one("schools", {"subdomain": req.subdomain.strip().lower()})
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Subdomain '{req.subdomain}' is already registered",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")

    # Log the request as an audit event for SUPER_ADMIN review
    log_audit_event(
        "TENANT_REQUESTED",
        additional_metadata={
            "requested_name": req.name,
            "requested_subdomain": req.subdomain.strip().lower(),
            "contact_email": req.contact_email,
            "contact_name": req.contact_name,
            "notes": req.notes,
        },
    )

    return {
        "message": "Tenant request received. A platform administrator will review and contact you.",
        "subdomain": req.subdomain.strip().lower(),
    }


class TenantStatusUpdate(BaseModel):
    is_active: bool


@router.patch("/{school_id}/status")
async def update_tenant_status(
    school_id: str,
    body: TenantStatusUpdate,
    user=Depends(RoleChecker(["SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    """
    SUPER_ADMIN only. Activate or deactivate a tenant school.

    Returns:
        200: Updated school object.
        404: School not found.
    """
    try:
        school = await db.fetch_one("schools", {"id": school_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")

    if not school:
        raise HTTPException(status_code=404, detail=f"School '{school_id}' not found")

    try:
        updated = await db.update(
            "schools",
            filters={"id": school_id},
            data={"is_active": body.is_active},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(exc)}")

    action = "TENANT_ACTIVATED" if body.is_active else "TENANT_DEACTIVATED"
    log_audit_event(
        action,
        actor_id=user["profile"]["id"],
        school_id=school_id,
        target_id=school_id,
        additional_metadata={"is_active": body.is_active},
    )

    return updated
