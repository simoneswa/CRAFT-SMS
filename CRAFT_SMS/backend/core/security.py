import os
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.db import supabase, supabase_admin, url, anon_key
from supabase import create_client, Client, ClientOptions
from typing import List, Optional

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the Supabase JWT and returns the user object.
    """
    token = credentials.credentials
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Get profile data (role, school_id) using admin client to bypass RLS for auth lookup
        profile_response = supabase_admin.table("profiles").select("*").eq("id", user_response.user.id).single().execute()
        
        user_data = user_response.user.__dict__
        user_data["profile"] = profile_response.data
        user_data["token"] = token # Store token for client creation
        
        return user_data
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def get_user_client(user=Depends(get_current_user)) -> Client:
    """
    Returns a per-request Supabase client authenticated with the user's JWT.
    This ensures all database operations respect RLS policies.
    """
    token = user.get("token")
    client = create_client(url, anon_key, options=ClientOptions(headers={'Authorization': f'Bearer {token}'}))
    return client

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        if not user.get("profile") or user["profile"].get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Role {user.get('profile', {}).get('role')} is not authorized to access this resource"
            )
        return user
