import os
import json
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.db import supabase, supabase_admin, url, anon_key
from supabase import create_client, Client, ClientOptions
from typing import List, Optional

security = HTTPBearer()

# Initialize Firebase Admin SDK if credentials are available.
_firebase_app = None
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials as firebase_credentials

    FIREBASE_SA_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if FIREBASE_SA_JSON:
        try:
            sa = json.loads(FIREBASE_SA_JSON)
            cred = firebase_credentials.Certificate(sa)
            _firebase_app = firebase_admin.initialize_app(cred)
        except Exception:
            # If parsing fails, fall back to default credentials initialization
            try:
                _firebase_app = firebase_admin.initialize_app()
            except Exception:
                _firebase_app = None
    else:
        try:
            _firebase_app = firebase_admin.initialize_app()
        except Exception:
            _firebase_app = None
except Exception:
    firebase_admin = None
    firebase_auth = None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies authentication credentials and returns the user object.

    Priority:
    1. Verify as Firebase ID token (recommended).
    2. Fallback: verify as Supabase JWT (legacy support).
    
    Maps the external identity (Firebase UID or Supabase user id) to the application's
    `profiles` record via `supabase_admin` lookup. All protected endpoints rely on the
    returned `user['profile']` to enforce role and tenant restrictions.
    """
    token = credentials.credentials

    # Try Firebase verification first
    if firebase_auth and _firebase_app:
        try:
            decoded = firebase_auth.verify_id_token(token, app=_firebase_app)
            uid = decoded.get("uid")
            email = decoded.get("email")

            if supabase_admin is None:
                raise HTTPException(status_code=503, detail="Server misconfigured: admin DB client unavailable")

            # Try to map via `firebase_uid` column first
            profile_resp = supabase_admin.table("profiles").select("*").eq("firebase_uid", uid).single().execute()
            profile = None
            if profile_resp and getattr(profile_resp, 'data', None):
                profile = profile_resp.data
            else:
                # Fallback: map by email if available
                if email:
                    profile_resp = supabase_admin.table("profiles").select("*").eq("email", email).single().execute()
                    if profile_resp and getattr(profile_resp, 'data', None):
                        profile = profile_resp.data

            if not profile:
                # No matching application profile — fail authentication to preserve RBAC
                raise HTTPException(status_code=401, detail="No matching user profile for authenticated Firebase user")

            user_data = {
                "provider": "firebase",
                "firebase_uid": uid,
                "email": email,
                "firebase_claims": decoded,
                "profile": profile,
                "token": token,
            }
            return user_data
        except Exception as e:
            # Firebase verification failed — fallthrough to Supabase check
            print(f"Firebase auth verify failed: {e}")

    # Legacy Supabase verification path
    try:
        if supabase is None:
            raise HTTPException(status_code=503, detail="Server misconfigured: Supabase client unavailable")

        user_response = supabase.auth.get_user(token)
        if not getattr(user_response, 'user', None):
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        if supabase_admin is None:
            raise HTTPException(status_code=503, detail="Server misconfigured: admin DB client unavailable")

        profile_response = supabase_admin.table("profiles").select("*").eq("id", user_response.user.id).single().execute()

        user_data = user_response.user.__dict__
        user_data["profile"] = profile_response.data
        user_data["token"] = token
        user_data["provider"] = "supabase"

        return user_data
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


def get_user_client(user=Depends(get_current_user)) -> Client:
    """
    Returns a Supabase client for this request.

    Note: When using Firebase tokens the returned client cannot be authenticated
    with the user's Supabase JWT. For now we return a client using the project's
    `anon_key` which is suitable for read operations that don't require RLS.

    During migration to Cloud SQL, application code should be adjusted to use
    server-side enforcement of tenant isolation rather than relying on Supabase RLS.
    """
    token = user.get("token")
    # Attempt to attach Authorization header only when token is a Supabase JWT
    headers = None
    try:
        # Lightweight heuristic: Supabase JWTs often contain 'role' or 'sub', but we don't parse here.
        if user.get("provider") == "supabase":
            headers = {'Authorization': f'Bearer {token}'}
    except Exception:
        headers = None

    if headers:
        client = create_client(url, anon_key, options=ClientOptions(headers=headers))
    else:
        client = create_client(url, anon_key)
    return client


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        profile = user.get("profile")
        if not profile or profile.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role {profile.get('role') if profile else None} is not authorized to access this resource",
            )
        return user
