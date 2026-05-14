from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from core.security import RoleChecker, get_current_user, get_user_client
from supabase import Client
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
async def get_institutional_kpis(user=Depends(RoleChecker(["SCHOOL_ADMIN", "SUPER_ADMIN"])), client: Client = Depends(get_user_client)):
    school_id = user["profile"]["school_id"]
    
    try:
        # 1. Enrollment Stats
        students = client.table("profiles").select("id", count="exact").eq("school_id", school_id).eq("role", "STUDENT").execute()
        
        # 2. Financial Stats (Total verified revenue)
        revenue = client.table("slips").select("amount").eq("school_id", school_id).eq("status", "VERIFIED").execute()
        total_revenue = sum([float(r["amount"]) for r in revenue.data])
        
        # 3. Attendance Rate (Last 30 days)
        last_30_days = (datetime.now() - timedelta(days=30)).date().isoformat()
        attendance = client.table("attendance").select("status").eq("school_id", school_id).gte("date", last_30_days).execute()
        
        att_rate = calculate_att_rate(attendance.data)
        
        # 4. Academic Health (Average GPA)
        grades = client.table("grades").select("score").eq("school_id", school_id).eq("status", "PUBLISHED").execute()
        avg_grade = calculate_avg_grade(grades.data)

        return {
            "kpis": {
                "total_students": students.count,
                "institutional_revenue": total_revenue,
                "attendance_rate": att_rate,
                "average_grade": avg_grade
            },
            "trends": {
                "attendance": [92, 94, 91, 95, att_rate], # Mock trend for now
                "revenue": [12000, 15000, 18000, total_revenue]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/at-risk")
async def get_at_risk_students(user=Depends(RoleChecker(["SCHOOL_ADMIN", "TEACHER"])), client: Client = Depends(get_user_client)):
    """
    Identify students with low performance or poor attendance.
    """
    school_id = user["profile"]["school_id"]
    
    try:
        # 1. Fetch students
        students_resp = client.table("profiles").select("id, full_name, custom_id").eq("school_id", school_id).eq("role", "STUDENT").execute()
        students = students_resp.data
        
        at_risk = []
        for s in students:
            # Check Attendance (e.g., > 10% absences)
            att_resp = client.table("attendance").select("status").eq("student_id", s["id"]).execute()
            absent_count = len([a for a in att_resp.data if a["status"] == "ABSENT"])
            total_days = len(att_resp.data)
            
            att_risk = (absent_count / total_days > 0.1) if total_days > 5 else False
            
            # Check Grades (e.g., Average < 60%)
            grade_resp = client.table("grades").select("score").eq("student_id", s["id"]).eq("status", "PUBLISHED").execute()
            scores = [float(g["score"]) for g in grade_resp.data if g["score"] is not None]
            avg_score = sum(scores) / len(scores) if scores else 100.0
            
            grade_risk = avg_score < 60.0
            
            if att_risk or grade_risk:
                at_risk.append({
                    "id": s["id"],
                    "name": s["full_name"],
                    "custom_id": s["custom_id"],
                    "absences": absent_count,
                    "average_grade": round(avg_score, 1),
                    "risk_level": "CRITICAL" if (att_risk and grade_risk) else "WARNING"
                })
                
        return sorted(at_risk, key=lambda x: x["average_grade"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def calculate_att_rate(data):
    if not data: return 100.0
    present = len([d for d in data if d["status"] in ["PRESENT", "LATE"]])
    return round((present / len(data)) * 100, 1)

def calculate_avg_grade(data):
    if not data: return 0.0
    scores = [float(d["score"]) for d in data if d["score"] is not None]
    if not scores: return 0.0
    return round(sum(scores) / len(scores), 1)
