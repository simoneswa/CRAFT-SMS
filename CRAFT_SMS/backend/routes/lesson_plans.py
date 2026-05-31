from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.security import RoleChecker, get_current_user
from core.db import supabase_admin
from datetime import datetime

router = APIRouter()


class LessonPlanCreate(BaseModel):
    tenant_id: str
    teacher_id: str
    subject_id: Optional[str]
    class_id: Optional[str]
    academic_year: Optional[str]
    term: Optional[str]
    week_number: Optional[int]
    topic: Optional[str]
    sub_topic: Optional[str]
    objectives: Optional[str]
    activities: Optional[str]
    assessment: Optional[str]
    resources: Optional[dict]


class CommentCreate(BaseModel):
    comment: str
    decision: Optional[str] = None


@router.post("/", tags=["LessonPlans"])
async def create_lesson_plan(lp: LessonPlanCreate, user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"]))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Database admin client not configured")

    # SECURITY: Enforce tenant_id validation - prevent cross-school lesson plan creation
    user_school_id = user["profile"]["school_id"]
    if user["profile"]["role"] != "SUPER_ADMIN" and str(lp.tenant_id) != str(user_school_id):
        raise HTTPException(status_code=403, detail="Cannot create lesson plans for other schools")

    data = lp.dict()
    data.update({"status": "draft", "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat()})
    resp = supabase_admin.table("lesson_plans").insert(data).execute()
    if resp.error:
        raise HTTPException(status_code=500, detail=str(resp.error))
    return resp.data


@router.get("/", tags=["LessonPlans"])
async def list_lesson_plans(status: Optional[str] = None, user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"]))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Database admin client not configured")

    query = supabase_admin.table("lesson_plans")
    if status:
        query = query.eq("status", status)

    if user["profile"]["role"] != "SUPER_ADMIN":
        tenant_id = user["profile"]["school_id"]
        query = query.eq("tenant_id", tenant_id)

    resp = query.select("*").order("created_at", desc=True).execute()
    if resp.error:
        raise HTTPException(status_code=500, detail=str(resp.error))
    return resp.data


@router.get("/{plan_id}", tags=["LessonPlans"])
async def get_lesson_plan(plan_id: str, user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN", "VPI"]))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Database admin client not configured")

    resp = supabase_admin.table("lesson_plans").select("*").eq("id", plan_id).single().execute()
    if resp.error or not resp.data:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # SECURITY: Enforce tenant isolation - prevent cross-school lesson plan access
    lesson_plan = resp.data
    user_school_id = user["profile"]["school_id"]
    
    # SUPER_ADMIN can see all; others only their own school
    if user["profile"]["role"] != "SUPER_ADMIN":
        if str(lesson_plan.get("tenant_id")) != str(user_school_id):
            raise HTTPException(status_code=403, detail="Access denied: lesson plan belongs to another school")
    
    return lesson_plan


@router.post("/{plan_id}/submit", tags=["LessonPlans"])
async def submit_lesson_plan(plan_id: str, user=Depends(RoleChecker(["TEACHER"]))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Database admin client not configured")

    # SECURITY: Verify tenant isolation before updating
    get_resp = supabase_admin.table("lesson_plans").select("tenant_id").eq("id", plan_id).single().execute()
    if get_resp.error or not get_resp.data:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    if str(get_resp.data.get("tenant_id")) != str(user["profile"]["school_id"]):
        raise HTTPException(status_code=403, detail="Access denied: cannot submit lesson plan from another school")

    resp = supabase_admin.table("lesson_plans").update({"status": "submitted", "submitted_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat()}).eq("id", plan_id).execute()
    if resp.error:
        raise HTTPException(status_code=500, detail=str(resp.error))
    return {"ok": True}


@router.post("/{plan_id}/comments", tags=["LessonPlans"])
async def comment_on_plan(plan_id: str, payload: CommentCreate, user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN", "VPI"]))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Database admin client not configured")

    # SECURITY: Verify tenant isolation and access before allowing comment
    get_resp = supabase_admin.table("lesson_plans").select("tenant_id").eq("id", plan_id).single().execute()
    if get_resp.error or not get_resp.data:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    lesson_plan = get_resp.data
    user_school_id = user["profile"]["school_id"]
    
    # Verify commenter belongs to same school as lesson plan
    if user["profile"]["role"] != "SUPER_ADMIN":
        if str(lesson_plan.get("tenant_id")) != str(user_school_id):
            raise HTTPException(status_code=403, detail="Access denied: cannot comment on lesson plans from another school")

    comment_data = {
        "lesson_plan_id": plan_id,
        "commenter_id": user["profile"]["id"],
        "commenter_role": user["profile"]["role"],
        "comment": payload.comment,
        "decision": payload.decision,
        "created_at": datetime.utcnow().isoformat(),
    }
    resp = supabase_admin.table("lesson_plan_comments").insert(comment_data).execute()
    if resp.error:
        raise HTTPException(status_code=500, detail=str(resp.error))

    if payload.decision in ("approve", "reject", "revision"):
        status_map = {"approve": "approved", "reject": "rejected", "revision": "revision_requested"}
        update_resp = supabase_admin.table("lesson_plans").update({"status": status_map[payload.decision], "updated_at": datetime.utcnow().isoformat(), "approved_at": datetime.utcnow().isoformat() if payload.decision == "approve" else None}).eq("id", plan_id).execute()
        if update_resp.error:
            raise HTTPException(status_code=500, detail=str(update_resp.error))

    return resp.data
