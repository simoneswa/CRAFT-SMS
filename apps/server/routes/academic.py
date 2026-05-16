from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from core.db import supabase_admin
from core.security import RoleChecker, get_current_user

router = APIRouter()

# Models
class TermReq(BaseModel):
    name: str
    start_date: str
    end_date: str
    is_current: bool = False

class SubjectReq(BaseModel):
    name: str
    code: Optional[str] = None
    department: Optional[str] = None

class ClassReq(BaseModel):
    name: str
    grade_level: Optional[str] = None
    room_number: Optional[str] = None

class GradeReq(BaseModel):
    student_id: str
    class_subject_id: str
    category_id: str
    academic_term_id: str
    score: float
    status: str = "DRAFT"

class EnrollmentReq(BaseModel):
    student_id: str
    class_id: str
    academic_term_id: str

class ClassSubjectReq(BaseModel):
    class_id: str
    subject_id: str
    teacher_id: Optional[str] = None

class AttendanceEntry(BaseModel):
    student_id: str
    status: str # PRESENT, ABSENT, LATE, EXCUSED
    notes: Optional[str] = None

class AttendanceBatchReq(BaseModel):
    class_id: str
    date: str
    entries: List[AttendanceEntry]

# --- ACADEMIC TERMS ---
@router.get("/terms")
async def get_terms(user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("academic_terms").select("*").eq("school_id", school_id).execute()
    return resp.data

@router.post("/terms")
async def create_term(req: TermReq, user=Depends(RoleChecker(["SCHOOL_ADMIN"]))):
    school_id = user["profile"]["school_id"]
    
    # If this term is set as current, unset others
    if req.is_current:
        supabase_admin.table("academic_terms").update({"is_current": False}).eq("school_id", school_id).execute()
        
    resp = supabase_admin.table("academic_terms").insert({
        **req.dict(),
        "school_id": school_id
    }).execute()
    return resp.data[0]

# --- SUBJECTS ---
@router.get("/subjects")
async def get_subjects(user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("subjects").select("*").eq("school_id", school_id).execute()
    return resp.data

@router.post("/subjects")
async def create_subject(req: SubjectReq, user=Depends(RoleChecker(["SCHOOL_ADMIN"]))):
    resp = supabase_admin.table("subjects").insert({
        **req.dict(),
        "school_id": user["profile"]["school_id"]
    }).execute()
    return resp.data[0]

# --- CLASSES ---
@router.get("/classes")
async def get_classes(user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("classes").select("*").eq("school_id", school_id).execute()
    return resp.data

@router.post("/classes")
async def create_class(req: ClassReq, user=Depends(RoleChecker(["SCHOOL_ADMIN"]))):
    resp = supabase_admin.table("classes").insert({
        **req.dict(),
        "school_id": user["profile"]["school_id"]
    }).execute()
    return resp.data[0]

# --- ENROLLMENTS ---
@router.post("/enrollments")
async def enroll_student(req: EnrollmentReq, user=Depends(RoleChecker(["SCHOOL_ADMIN", "REGISTRAR"]))):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("enrollments").insert({
        **req.dict(),
        "school_id": school_id
    }).execute()
    return resp.data[0]

@router.get("/classes/{class_id}/students")
async def get_class_students(class_id: str, term_id: str, user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("enrollments").select("profiles!student_id(*)").eq("class_id", class_id).eq("academic_term_id", term_id).eq("school_id", school_id).execute()
    return [e["profiles"] for e in resp.data]

# --- CLASS SUBJECTS ---
@router.post("/class-subjects")
async def assign_subject_to_class(req: ClassSubjectReq, user=Depends(RoleChecker(["SCHOOL_ADMIN", "ACADEMIC_DEAN"]))):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("class_subjects").insert({
        **req.dict(),
        "school_id": school_id
    }).execute()
    return resp.data[0]

@router.get("/classes/{class_id}/subjects")
async def get_class_subjects(class_id: str, user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("class_subjects").select("*, subjects(*)").eq("class_id", class_id).eq("school_id", school_id).execute()
    return resp.data

# --- ATTENDANCE ---
@router.post("/attendance/batch")
async def record_attendance_batch(req: AttendanceBatchReq, user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"]))):
    school_id = user["profile"]["school_id"]
    
    insert_data = []
    for entry in req.entries:
        insert_data.append({
            "school_id": school_id,
            "student_id": entry.student_id,
            "date": req.date,
            "status": entry.status,
            "notes": entry.notes,
            "recorded_by": user["profile"]["id"]
        })
        
    resp = supabase_admin.table("attendance").upsert(insert_data, on_conflict="school_id,student_id,date").execute()
    
    # Trigger notification for Absentees
    absentees = [e.student_id for e in req.entries if e.status == "ABSENT"]
    if absentees:
        # Future: Trigger SMS/Email/In-App alerts to parents
        pass
        
    return {"message": f"Recorded attendance for {len(resp.data)} students"}

@router.get("/attendance")
async def get_attendance(class_id: str, date: str, user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("attendance").select("*").eq("school_id", school_id).eq("date", date).execute()
    return resp.data

# --- GRADEBOOK ENGINE ---
@router.get("/grade-categories")
async def get_grade_categories(user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    resp = supabase_admin.table("grade_categories").select("*").eq("school_id", school_id).execute()
    return resp.data

@router.post("/grades")
async def post_grade(req: GradeReq, user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"]))):
    school_id = user["profile"]["school_id"]
    
    # Validate term is not locked
    term = supabase_admin.table("academic_terms").select("is_locked").eq("id", req.academic_term_id).single().execute()
    if term.data.get("is_locked"):
        raise HTTPException(status_code=400, detail="This academic term is locked.")
        
    resp = supabase_admin.table("grades").insert({
        **req.dict(),
        "school_id": school_id,
        "graded_by": user["profile"]["id"]
    }).execute()
    
    # Trigger Notification for Published Grades
    if req.status == "PUBLISHED":
        supabase_admin.table("notifications").insert({
            "school_id": school_id,
            "user_id": req.student_id,
            "title": "New Grade Published",
            "message": "A new grade has been published for your subject.",
            "type": "ACADEMIC"
        }).execute()
        
    # Log Action
    supabase_admin.table("audit_logs").insert({
        "school_id": school_id,
        "actor_id": user["profile"]["id"],
        "action": f"GRADE_ENTRY_{req.status}",
        "target_id": req.student_id,
        "metadata": {"score": req.score, "subject_id": req.class_subject_id}
    }).execute()
    
    return resp.data[0]

@router.get("/report-card/{student_id}")
async def get_student_report_card(student_id: str, term_id: str, user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    
    # 1. Get student profile
    student = supabase_admin.table("profiles").select("*").eq("id", student_id).single().execute()
    
    # 2. Get all class-subject assignments for this student's class in this term
    enrollment = supabase_admin.table("enrollments").select("class_id").eq("student_id", student_id).eq("academic_term_id", term_id).single().execute()
    if not enrollment.data:
        raise HTTPException(status_code=404, detail="Student not enrolled in this term.")
        
    class_id = enrollment.data["class_id"]
    subjects_resp = supabase_admin.table("class_subjects").select("*, subjects(*)").eq("class_id", class_id).execute()
    
    # 3. Get all published grades for this student and term
    grades_resp = supabase_admin.table("grades").select("*, grade_categories(*)").eq("student_id", student_id).eq("academic_term_id", term_id).eq("status", "PUBLISHED").execute()
    grades = grades_resp.data
    
    # 4. Process subjects
    report_data = []
    overall_sum = 0
    subject_count = 0
    
    for cs in subjects_resp.data:
        cs_id = cs["id"]
        subject_name = cs["subjects"]["name"]
        
        # Calculate weighted average for this subject
        s_grades = [g for g in grades if g["class_subject_id"] == cs_id]
        if not s_grades:
            continue
            
        total_weighted = 0
        total_weight = 0
        for g in s_grades:
            weight = g["grade_categories"]["weight"]
            total_weighted += (float(g["score"]) / 100) * float(weight)
            total_weight += float(weight)
            
        if total_weight > 0:
            avg = (total_weighted / total_weight) * 100
            report_data.append({
                "subject": subject_name,
                "score": round(avg, 2),
                "grades": s_grades
            })
            overall_sum += avg
            subject_count += 1
            
    final_avg = (overall_sum / subject_count) if subject_count > 0 else 0
    
    return {
        "student": student.data,
        "term_id": term_id,
        "subjects": report_data,
        "overall_average": round(final_avg, 2),
        "status": "FINALIZED" if subject_count > 0 else "INCOMPLETE"
    }

@router.get("/grades/student/{student_id}")
async def get_student_grades(student_id: str, term_id: Optional[str] = None, user=Depends(get_current_user)):
    school_id = user["profile"]["school_id"]
    
    # RLS Enforcement in Logic (Double Layer)
    if user["profile"]["role"] == "STUDENT" and user["profile"]["id"] != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
        
    query = supabase_admin.table("grades").select("*, class_subjects(subjects(name))").eq("student_id", student_id)
    if term_id:
        query = query.eq("academic_term_id", term_id)
        
    resp = query.execute()
    return resp.data
