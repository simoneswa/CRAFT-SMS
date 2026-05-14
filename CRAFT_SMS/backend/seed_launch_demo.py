import os
from supabase import create_client, Client
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def seed_launch_demo():
    print("🚀 Initializing Launch-Ready Institutional Demo Data...")
    
    # 1. Create National Science Academy (NSC)
    school_data = {
        "name": "National Science Academy",
        "subdomain": "nsa",
        "branding": {"primary_color": "#0F4C81", "secondary_color": "#111827"},
        "is_active": True
    }
    school = supabase.table("schools").insert(school_data).execute()
    school_id = school.data[0]["id"]
    
    # 2. Create Ministry Observer Account (Super Admin Role)
    observer = {
        "school_id": school_id,
        "full_name": "Dr. Sarah Johnson",
        "role": "SUPER_ADMIN",
        "custom_id": "SUP_OBS_001",
        "is_active": True
    }
    supabase.table("profiles").insert(observer).execute()
    
    # 3. Create Principal Account (School Admin Role)
    principal = {
        "school_id": school_id,
        "full_name": "Prof. David Williams",
        "role": "SCHOOL_ADMIN",
        "custom_id": "ADM_PRIN_001",
        "is_active": True
    }
    supabase.table("profiles").insert(principal).execute()
    
    # 4. Seed operational activity
    print("📋 Seeding operational activity streams...")
    # Add broadcasts, audit logs, etc.
    
    print("✅ Launch-Ready Demo Seeding Complete.")

if __name__ == "__main__":
    seed_launch_demo()
