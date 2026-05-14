from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.db import supabase_admin
from core.security import RoleChecker, get_current_user

router = APIRouter()

class SchoolCreate(BaseModel):
    name: str
    subdomain: str

@router.post("/schools")
async def create_school(req: SchoolCreate, user=Depends(RoleChecker(["SUPER_ADMIN"]))):
    try:
        data = {
            "name": req.name,
            "subdomain": req.subdomain.lower(),
            "is_active": True
        }
        response = supabase_admin.table("schools").insert(data).execute()
        new_school_id = response.data[0]["id"]
        
        # Log action
        supabase_admin.table("audit_logs").insert({
            "school_id": new_school_id,
            "actor_id": user["profile"]["id"],
            "action": "SCHOOL_CREATED",
            "target_id": new_school_id,
            "metadata": {"name": req.name, "subdomain": req.subdomain}
        }).execute()
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/metrics")
async def get_global_metrics(user=Depends(RoleChecker(["SUPER_ADMIN"]))):
    try:
        # Fetch high-level metrics via admin bypass
        schools_count = supabase_admin.table("schools").select("id", count="exact").execute()
        users_count = supabase_admin.table("profiles").select("id", count="exact").execute()
        
        # Aggregate revenue
        slips_resp = supabase_admin.table("slips").select("amount").eq("status", "VERIFIED").execute()
        revenue = sum(slip["amount"] for slip in slips_resp.data) if slips_resp.data else 0

        return {
            "total_tenants": schools_count.count,
            "total_users": users_count.count,
            "platform_revenue": revenue,
            "system_health": "99.9%"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/schools/{school_id}/metrics")
async def get_school_metrics(school_id: str, user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "BUSINESS", "STUDENT"]))):
    # Enforce isolation: non-super-admins can only see their own school
    if user["profile"]["role"] != "SUPER_ADMIN" and str(user["profile"]["school_id"]) != school_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this school's metrics")

    try:
        # 1. Total Students
        students_count = supabase_admin.table("profiles").select("id", count="exact").eq("school_id", school_id).eq("role", "STUDENT").execute()
        
        # 2. Pending Slips
        pending_slips = supabase_admin.table("slips").select("id", count="exact").eq("school_id", school_id).eq("status", "PENDING").execute()
        
        # 3. Monthly Revenue (Current Month)
        from datetime import datetime
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        revenue_resp = supabase_admin.table("slips").select("amount").eq("school_id", school_id).eq("status", "VERIFIED").gte("verified_at", start_of_month).execute()
        monthly_revenue = sum(slip["amount"] for slip in revenue_resp.data) if revenue_resp.data else 0

        # 4. Teacher count
        teachers_count = supabase_admin.table("profiles").select("id", count="exact").eq("school_id", school_id).eq("role", "TEACHER").execute()

        return {
            "total_students": students_count.count,
            "pending_slips": pending_slips.count,
            "monthly_revenue": monthly_revenue,
            "total_teachers": teachers_count.count,
            "academic_avg": 88 # Placeholder until grades logic is finalized
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
