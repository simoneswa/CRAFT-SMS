from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from core.security import RoleChecker, get_current_user
from repositories import get_db_provider, DatabaseProvider
from repositories.lesson_plans import LessonPlanRepository
from core.audit import log_audit_event, ACTION_TENANT_ACCESS_DENIED, ACTION_LESSON_PLAN_APPROVED
from datetime import datetime, timezone


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
async def create_lesson_plan(
    request: Request, 
    lp: LessonPlanCreate, 
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = LessonPlanRepository(db)


    # SECURITY: Enforce tenant_id validation - prevent cross-school lesson plan creation
    user_school_id = user["profile"]["school_id"]
    if user["profile"]["role"] != "SUPER_ADMIN" and str(lp.tenant_id) != str(user_school_id):
        log_audit_event(
            ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
            school_id=user_school_id, target_id=lp.tenant_id,
            additional_metadata={"reason": "Cannot create lesson plans for other schools"}
        )
        raise HTTPException(status_code=403, detail="Cannot create lesson plans for other schools")

    data = lp.dict()
    data.update({
        "status": "draft", 
        "created_at": datetime.now(timezone.utc).isoformat(), 
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    try:
        created_plan = await repo.create_lesson_plan(data)
        return created_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/", tags=["LessonPlans"])
async def list_lesson_plans(
    status: Optional[str] = None, 
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = LessonPlanRepository(db)
    
    tenant_id = None
    if user["profile"]["role"] != "SUPER_ADMIN":
        tenant_id = user["profile"]["school_id"]

    try:
        plans = await repo.list_lesson_plans(status=status, tenant_id=tenant_id)
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/{plan_id}", tags=["LessonPlans"])
async def get_lesson_plan(
    request: Request, 
    plan_id: str, 
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN", "VPI"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = LessonPlanRepository(db)
    
    try:
        lesson_plan = await repo.get_lesson_plan(plan_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # SECURITY: Enforce tenant isolation - prevent cross-school lesson plan access
    user_school_id = user["profile"]["school_id"]
    
    # SUPER_ADMIN can see all; others only their own school
    if user["profile"]["role"] != "SUPER_ADMIN":
        if str(lesson_plan.get("tenant_id")) != str(user_school_id):
            log_audit_event(
                ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
                school_id=user_school_id, target_id=plan_id,
                additional_metadata={"reason": "Access denied: lesson plan belongs to another school"}
            )
            raise HTTPException(status_code=403, detail="Access denied: lesson plan belongs to another school")
    
    return lesson_plan


@router.post("/{plan_id}/submit", tags=["LessonPlans"])
async def submit_lesson_plan(
    request: Request, 
    plan_id: str, 
    user=Depends(RoleChecker(["TEACHER"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = LessonPlanRepository(db)

    # SECURITY: Verify tenant isolation before updating
    try:
        lesson_plan = await repo.get_lesson_plan(plan_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    if str(lesson_plan.get("tenant_id")) != str(user["profile"]["school_id"]):
        log_audit_event(
            ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
            school_id=user["profile"]["school_id"], target_id=plan_id,
            additional_metadata={"reason": "Access denied: cannot submit lesson plan from another school"}
        )
        raise HTTPException(status_code=403, detail="Access denied: cannot submit lesson plan from another school")

    try:
        await repo.update_lesson_plan(plan_id, {
            "status": "submitted", 
            "submitted_at": datetime.now(timezone.utc).isoformat(), 
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{plan_id}/comments", tags=["LessonPlans"])
async def comment_on_plan(
    request: Request, 
    plan_id: str, 
    payload: CommentCreate, 
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN", "VPI"])),
    db: DatabaseProvider = Depends(get_db_provider)
):
    repo = LessonPlanRepository(db)

    # SECURITY: Verify tenant isolation and access before allowing comment
    try:
        lesson_plan = await repo.get_lesson_plan(plan_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    

    user_school_id = user["profile"]["school_id"]
    
    # Verify commenter belongs to same school as lesson plan
    if user["profile"]["role"] != "SUPER_ADMIN":
        if str(lesson_plan.get("tenant_id")) != str(user_school_id):
            log_audit_event(
                ACTION_TENANT_ACCESS_DENIED, request, actor_id=user["profile"]["id"],
                school_id=user_school_id, target_id=plan_id,
                additional_metadata={"reason": "Access denied: cannot comment on lesson plans from another school"}
            )
            raise HTTPException(status_code=403, detail="Access denied: cannot comment on lesson plans from another school")

    comment_data = {
        "lesson_plan_id": plan_id,
        "commenter_id": user["profile"]["id"],
        "commenter_role": user["profile"]["role"],
        "comment": payload.comment,
        "decision": payload.decision,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        created_comment = await repo.create_comment(comment_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if payload.decision in ("approve", "reject", "revision"):
        status_map = {"approve": "approved", "reject": "rejected", "revision": "revision_requested"}
        now = datetime.now(timezone.utc).isoformat()
        try:
            await repo.update_lesson_plan(plan_id, {
                "status": status_map[payload.decision], 
                "updated_at": now, 
                "approved_at": now if payload.decision == "approve" else None
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        
        if payload.decision == "approve":
            log_audit_event(
                ACTION_LESSON_PLAN_APPROVED, request, actor_id=user["profile"]["id"],
                school_id=user_school_id, target_id=plan_id
            )

    return created_comment
