import uuid
import random
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use service role for seeding
supabase: Client = create_client(url, key)

SCHOOLS = [
    {"name": "National Science Academy", "subdomain": "nsa", "primary": "#0F4C81"},
    {"name": "Monrovia International School", "subdomain": "monrovia", "primary": "#0D9488"},
    {"name": "Central Business District School", "subdomain": "cbds", "primary": "#0F172A"},
    {"name": "St. Peter’s Lutheran High", "subdomain": "stpeters", "primary": "#4338CA"},
    {"name": "Future Leaders Academy", "subdomain": "fla", "primary": "#0D9488"}
]

def seed():
    print("🚀 Starting Institutional Launch Simulation Seed...")
    
    for s_data in SCHOOLS:
        print(f"🏫 Seeding {s_data['name']}...")
        
        # 1. Create School
        school = supabase.table("schools").insert({
            "name": s_data["name"],
            "subdomain": s_data["subdomain"],
            "branding": {"primary_color": s_data["primary"], "secondary_color": "#111827"},
            "is_active": True
        }).execute()
        
        school_id = school.data[0]["id"]
        
        # 2. Create Current Term
        term = supabase.table("academic_terms").insert({
            "school_id": school_id,
            "name": "First Semester 2026/2027",
            "start_date": "2026-09-01",
            "end_date": "2027-01-15",
            "is_current": True
        }).execute()
        
        # 3. Create Profiles (Admin, Teachers, Students)
        # (Simplified loop for demo readiness)
        roles = ["TEACHER"] * 3 + ["STUDENT"] * 20
        for i, role in enumerate(roles):
            prefix = "TEA" if role == "TEACHER" else "STU"
            full_name = f"{role.capitalize()} {i+1}"
            custom_id = f"{prefix}-{random.randint(1000, 9999)}"
            
            p = supabase.table("profiles").insert({
                "school_id": school_id,
                "full_name": full_name,
                "role": role,
                "custom_id": custom_id,
                "is_active": True
            }).execute()
            
            profile_id = p.data[0]["id"]
            
            if role == "STUDENT":
                # Seed Attendance for last 30 days
                for d in range(30):
                    date = (datetime.now() - timedelta(days=d)).date().isoformat()
                    status = random.choices(["PRESENT", "LATE", "ABSENT"], weights=[85, 10, 5])[0]
                    supabase.table("attendance").insert({
                        "school_id": school_id,
                        "student_id": profile_id,
                        "date": date,
                        "status": status
                    }).execute()
                
                # Seed verified financial slip
                supabase.table("slips").insert({
                    "school_id": school_id,
                    "student_id": profile_id,
                    "amount": random.choice([500, 750, 1200]),
                    "status": "VERIFIED",
                    "slip_number": f"SLP-{random.randint(10000, 99999)}"
                }).execute()

    print("✅ Institutional Seeding Complete. System is now operationally alive.")

if __name__ == "__main__":
    seed()
