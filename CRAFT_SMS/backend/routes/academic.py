"""
routes/academic.py

Academic & grading endpoints — fully migrated to DatabaseProvider.
No Supabase SDK imports.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from core.security import RoleChecker, get_current_user
from repositories import get_db_provider, DatabaseProvider
from core.audit import log_audit_event

router = APIRouter()


# Models
class TermReq(BaseModel):
    name: str
    start_date: str
    end_date: str
    is_current: bool = False
    school_id: Optional[str] = None


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
    status: str  # PRESENT, ABSENT, LATE, EXCUSED
    notes: Optional[str] = None


class AttendanceBatchReq(BaseModel):
    class_id: str
    date: str
    entries: List[AttendanceEntry]


class AssignmentReq(BaseModel):
    class_id: str
    title: str
    description: str
    deadline: str
    attachment_url: Optional[str] = None


class SubmissionReq(BaseModel):
    submission_url: Optional[str] = None
    submission_text: Optional[str] = None



# --- ACADEMIC TERMS ---
@router.get("/terms")
async def get_terms(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    return await db.fetch_many("academic_terms", {"school_id": school_id})


@router.post("/terms")
async def create_term(
    req: TermReq,
    user=Depends(RoleChecker(["SUPER_ADMIN", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = req.school_id if req.school_id and user["profile"]["role"] == "SUPER_ADMIN" else user["profile"]["school_id"]

    # If this term is set as current, unset others
    if req.is_current:
        # Fetch current terms and unset them
        current_terms = await db.fetch_many("academic_terms", {"school_id": school_id, "is_current": True})
        for term in current_terms:
            await db.update("academic_terms", {"id": term["id"]}, {"is_current": False})

    new_term = await db.insert("academic_terms", {
        **req.dict(),
        "school_id": school_id
    })
    return new_term


# --- SUBJECTS ---
@router.get("/subjects")
async def get_subjects(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    return await db.fetch_many("subjects", {"school_id": school_id})


@router.post("/subjects")
async def create_subject(
    req: SubjectReq,
    user=Depends(RoleChecker(["SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    new_sub = await db.insert("subjects", {
        **req.dict(),
        "school_id": user["profile"]["school_id"]
    })
    return new_sub


# --- CLASSES ---
@router.get("/classes")
async def get_classes(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    return await db.fetch_many("classes", {"school_id": school_id})


@router.post("/classes")
async def create_class(
    req: ClassReq,
    user=Depends(RoleChecker(["SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    new_class = await db.insert("classes", {
        **req.dict(),
        "school_id": user["profile"]["school_id"]
    })
    return new_class


# --- ENROLLMENTS ---
@router.post("/enrollments")
async def enroll_student(
    req: EnrollmentReq,
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "REGISTRAR"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    new_enr = await db.insert("enrollments", {
        **req.dict(),
        "school_id": school_id
    })
    return new_enr


@router.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: str,
    term_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    enrollments = await db.fetch_many("enrollments", {
        "class_id": class_id,
        "academic_term_id": term_id,
        "school_id": school_id
    })

    # Resolve profiles for all enrollments (no PostgREST join dependency)
    students = []
    for e in enrollments:
        student_id = e.get("student_id")
        if student_id:
            profile = await db.fetch_one("profiles", {"id": student_id})
            if profile:
                students.append(profile)
    return students


# --- CLASS SUBJECTS ---
@router.post("/class-subjects")
async def assign_subject_to_class(
    req: ClassSubjectReq,
    user=Depends(RoleChecker(["SCHOOL_ADMIN", "ACADEMIC_DEAN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    new_cs = await db.insert("class_subjects", {
        **req.dict(),
        "school_id": school_id
    })
    return new_cs


@router.get("/classes/{class_id}/subjects")
async def get_class_subjects(
    class_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    class_subs = await db.fetch_many("class_subjects", {
        "class_id": class_id,
        "school_id": school_id
    })

    # Enrich with subject names (no PostgREST join dependency)
    enriched = []
    for cs in class_subs:
        subject_id = cs.get("subject_id")
        subject = None
        if subject_id:
            subject = await db.fetch_one("subjects", {"id": subject_id})
        enriched.append({
            **cs,
            "subjects": subject
        })
    return enriched


# --- ATTENDANCE ---
@router.post("/attendance/batch")
async def record_attendance_batch(
    req: AttendanceBatchReq,
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]

    recorded_count = 0
    for entry in req.entries:
        entry_data = {
            "school_id": school_id,
            "student_id": entry.student_id,
            "date": req.date,
            "status": entry.status,
            "notes": entry.notes,
            "recorded_by": user["profile"]["id"]
        }
        # Safely upsert using find-and-update/insert sequence (database agnostic)
        existing = await db.fetch_one("attendance", {
            "school_id": school_id,
            "student_id": entry.student_id,
            "date": req.date
        })
        if existing:
            await db.update("attendance", {"id": existing["id"]}, entry_data)
        else:
            await db.insert("attendance", entry_data)
        recorded_count += 1

    # Trigger notification for Absentees
    absentees = [e.student_id for e in req.entries if e.status == "ABSENT"]
    if absentees:
        # Future: Trigger SMS/Email/In-App alerts to parents
        pass

    return {"message": f"Recorded attendance for {recorded_count} students"}


@router.get("/attendance")
async def get_attendance(
    class_id: str,
    date: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    return await db.fetch_many("attendance", {"school_id": school_id, "date": date})


# --- GRADEBOOK ENGINE ---
@router.get("/grade-categories")
async def get_grade_categories(
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    return await db.fetch_many("grade_categories", {"school_id": school_id})


@router.post("/grades")
async def post_grade(
    req: GradeReq,
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]

    # Validate term is not locked
    term = await db.fetch_one("academic_terms", {"id": req.academic_term_id})
    if not term:
        raise HTTPException(status_code=404, detail="Academic term not found.")
    if term.get("is_locked"):
        raise HTTPException(status_code=400, detail="This academic term is locked.")

    new_grade = await db.insert("grades", {
        **req.dict(),
        "school_id": school_id,
        "graded_by": user["profile"]["id"]
    })

    # Trigger Notification for Published Grades
    if req.status == "PUBLISHED":
        await db.insert("notifications", {
            "school_id": school_id,
            "user_id": req.student_id,
            "title": "New Grade Published",
            "message": "A new grade has been published for your subject.",
            "type": "ACADEMIC"
        })

    # Log Action
    log_audit_event(
        f"GRADE_ENTRY_{req.status}",
        actor_id=user["profile"]["id"],
        school_id=school_id,
        target_id=req.student_id,
        additional_metadata={"score": req.score, "subject_id": req.class_subject_id}
    )

    return new_grade


@router.get("/report-card/{student_id}")
async def get_student_report_card(
    student_id: str,
    term_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]

    # 1. Get student profile
    student = await db.fetch_one("profiles", {"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # 2. Get enrollment for this student's class in this term
    enrollment = await db.fetch_one("enrollments", {
        "student_id": student_id,
        "academic_term_id": term_id
    })
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student not enrolled in this term.")

    class_id = enrollment["class_id"]

    # 3. Get all class-subject assignments for this class
    class_subs = await db.fetch_many("class_subjects", {"class_id": class_id})
    subjects_list = []
    for cs in class_subs:
        subject_id = cs.get("subject_id")
        subject = None
        if subject_id:
            subject = await db.fetch_one("subjects", {"id": subject_id})
        subjects_list.append({
            **cs,
            "subjects": subject
        })

    # 4. Get all published grades for this student and term
    all_grades = await db.fetch_many("grades", {
        "student_id": student_id,
        "academic_term_id": term_id,
        "status": "PUBLISHED"
    })

    # Enrich grades with categories
    grades = []
    for g in all_grades:
        cat_id = g.get("category_id")
        category = None
        if cat_id:
            category = await db.fetch_one("grade_categories", {"id": cat_id})
        grades.append({
            **g,
            "grade_categories": category
        })

    # 5. Process subjects & calculate averages
    report_data = []
    overall_sum = 0
    subject_count = 0

    for cs in subjects_list:
        cs_id = cs["id"]
        subject_name = cs["subjects"]["name"] if cs.get("subjects") else "Unknown"

        # Calculate weighted average for this subject
        s_grades = [g for g in grades if g["class_subject_id"] == cs_id]
        if not s_grades:
            continue

        total_weighted = 0
        total_weight = 0
        for g in s_grades:
            if g.get("grade_categories") and g["grade_categories"].get("weight") is not None:
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
        "student": student,
        "term_id": term_id,
        "subjects": report_data,
        "overall_average": round(final_avg, 2),
        "status": "FINALIZED" if subject_count > 0 else "INCOMPLETE"
    }


@router.get("/grades/student/{student_id}")
async def get_student_grades(
    student_id: str,
    term_id: Optional[str] = None,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]

    # RLS Enforcement in Logic (Double Layer)
    if user["profile"]["role"] == "STUDENT" and user["profile"]["id"] != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    filters = {"student_id": student_id}
    if term_id:
        filters["academic_term_id"] = term_id

    grades = await db.fetch_many("grades", filters)

    # Enrich grades with subject names (no PostgREST join dependency)
    enriched = []
    for g in grades:
        cs_id = g.get("class_subject_id")
        cs = None
        subject = None
        if cs_id:
            cs = await db.fetch_one("class_subjects", {"id": cs_id})
            if cs and cs.get("subject_id"):
                subject = await db.fetch_one("subjects", {"id": cs["subject_id"]})

        enriched.append({
            **g,
            "class_subjects": {
                "subjects": {
                    "name": subject.get("name") if subject else None
                } if subject else None
            } if cs else None
        })

    return enriched


# --- ASSIGNMENTS & SUBMISSIONS ---
@router.post("/classes/{class_id}/assignments")
async def create_assignment(
    class_id: str,
    req: AssignmentReq,
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    new_assignment = await db.insert("assignments", {
        "school_id": school_id,
        "class_id": class_id,
        "teacher_id": user["profile"]["id"],
        "title": req.title,
        "description": req.description,
        "deadline": req.deadline,
        "attachment_url": req.attachment_url
    })
    
    # Notify students in the class
    students = await get_class_students(class_id, "current_term", user=user, db=db) # Mock term for notifications
    for student in students:
        await db.insert("notifications", {
            "school_id": school_id,
            "user_id": student["id"],
            "title": f"New Assignment: {req.title}",
            "message": req.description[:100],
            "type": "ACADEMIC"
        })
    
    return new_assignment


@router.get("/classes/{class_id}/assignments")
async def get_class_assignments(
    class_id: str,
    user=Depends(get_current_user),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    assignments = await db.fetch_many("assignments", {"class_id": class_id, "school_id": school_id})
    return assignments


@router.post("/assignments/{assignment_id}/submissions")
async def submit_assignment(
    assignment_id: str,
    req: SubmissionReq,
    user=Depends(RoleChecker(["STUDENT"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    student_id = user["profile"]["id"]
    
    # Check if assignment exists
    assignment = await db.fetch_one("assignments", {"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    submission_data = {
        "school_id": school_id,
        "assignment_id": assignment_id,
        "student_id": student_id,
        "submission_url": req.submission_url,
        "submission_text": req.submission_text,
        "status": "SUBMITTED"
    }
    
    existing = await db.fetch_one("assignment_submissions", {
        "assignment_id": assignment_id,
        "student_id": student_id
    })
    
    if existing:
        await db.update("assignment_submissions", {"id": existing["id"]}, submission_data)
        return {"status": "updated", "submission": existing["id"]}
    else:
        new_sub = await db.insert("assignment_submissions", submission_data)
        return {"status": "created", "submission": new_sub}


@router.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: str,
    user=Depends(RoleChecker(["TEACHER", "SCHOOL_ADMIN"])),
    db: DatabaseProvider = Depends(get_db_provider),
):
    school_id = user["profile"]["school_id"]
    submissions = await db.fetch_many("assignment_submissions", {"assignment_id": assignment_id, "school_id": school_id})
    
    # Enrich with student profiles
    enriched = []
    for sub in submissions:
        student = await db.fetch_one("profiles", {"id": sub["student_id"]})
        enriched.append({
            **sub,
            "student": student
        })
        
    return enriched

