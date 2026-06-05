"""
core/security.py

Provider-agnostic authentication and authorization layer.

Authentication path (get_current_user):
  1. Verify Firebase ID token via firebase-admin SDK.
  2. Map Firebase UID → profile via ProfileRepository (DatabaseProvider).
  3. Return enriched user dict for downstream RBAC and tenant checks.

NO direct Supabase SDK imports in the authentication critical path.
The only remaining Supabase reference is get_user_client(), which is
a DEPRECATED shim kept for backward compatibility with legacy routes
that have not yet been migrated to get_db_provider(). It will be
removed when those routes are fully migrated.
"""
from __future__ import annotations

import json
import os
from typing import List, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.audit import (
    ACTION_LOGIN_FAILED,
    ACTION_LOGIN_SUCCESS,
    log_audit_event,
)
from core.secrets import get_secret

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialisation — attempted once at import time.
# Falls back gracefully if credentials are unavailable (dev/test environments).
# ---------------------------------------------------------------------------
_firebase_app = None
firebase_auth = None  # module-level reference for monkeypatching in tests

try:
    import firebase_admin
    from firebase_admin import auth as _firebase_auth_module
    from firebase_admin import credentials as firebase_credentials

    FIREBASE_SA_JSON = get_secret("FIREBASE_SERVICE_ACCOUNT_JSON")
    if FIREBASE_SA_JSON:
        try:
            sa = json.loads(FIREBASE_SA_JSON)
            cred = firebase_credentials.Certificate(sa)
            _firebase_app = firebase_admin.initialize_app(cred)
        except Exception:
            try:
                _firebase_app = firebase_admin.initialize_app()
            except Exception:
                _firebase_app = None
    else:
        try:
            _firebase_app = firebase_admin.initialize_app()
        except Exception:
            _firebase_app = None

    firebase_auth = _firebase_auth_module

except Exception:
    firebase_admin = None  # type: ignore[assignment]
    firebase_auth = None


# ---------------------------------------------------------------------------
# Primary authentication dependency — fully provider-agnostic
# ---------------------------------------------------------------------------
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify the bearer token and return the enriched user dict.

    Flow:
      1. Verify as Firebase ID token (firebase-admin SDK).
      2. Look up application profile via ProfileRepository (DatabaseProvider).
         → No direct Supabase SDK calls in this path.
      3. Raise 401 if token is invalid or no profile is found.

    The returned dict shape:
      {
        "provider":        "firebase",
        "firebase_uid":    str,
        "email":           str | None,
        "firebase_claims": dict,
        "profile":         dict,   # row from profiles table
        "token":           str,
      }
    """
    from repositories import get_db_provider
    from repositories.profiles import ProfileRepository

    token = credentials.credentials

    if firebase_auth and _firebase_app:
        try:
            decoded = firebase_auth.verify_id_token(token, app=_firebase_app)
            uid: str = decoded.get("uid", "")
            email: Optional[str] = decoded.get("email")

            db = get_db_provider()
            repo = ProfileRepository(db)

            # Primary lookup — by Firebase UID (indexed column)
            profile = await repo.get_profile_by_firebase_uid(uid)

            # Fallback — by email (for pre-existing accounts without firebase_uid)
            if profile is None and email:
                profile = await repo.get_profile_by_email(email)

            if not profile:
                log_audit_event(
                    ACTION_LOGIN_FAILED,
                    actor_id=uid,
                    additional_metadata={
                        "reason": "No matching profile for Firebase UID",
                        "provider": "firebase",
                    },
                )
                raise HTTPException(
                    status_code=401,
                    detail="No matching user profile for authenticated Firebase user",
                )

            log_audit_event(
                ACTION_LOGIN_SUCCESS,
                actor_id=profile.get("id"),
                school_id=profile.get("school_id"),
                additional_metadata={"provider": "firebase", "email": email},
            )
            return {
                "provider": "firebase",
                "firebase_uid": uid,
                "email": email,
                "firebase_claims": decoded,
                "profile": profile,
                "token": token,
            }

        except HTTPException:
            raise
        except Exception as exc:
            # Token verification failed — fall through to 401
            print(f"[AUTH] Firebase token verification failed: {exc}")

    # No valid provider succeeded
    log_audit_event(
        ACTION_LOGIN_FAILED,
        additional_metadata={
            "reason": "Token verification failed — no valid auth provider",
        },
    )
    raise HTTPException(status_code=401, detail="Invalid authentication credentials")


# ---------------------------------------------------------------------------
# Role-Based Access Control
# ---------------------------------------------------------------------------
class RoleChecker:
    """FastAPI dependency — enforces allowed roles at endpoint level."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        profile = user.get("profile")
        if not profile or profile.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Role {profile.get('role') if profile else None} "
                    "is not authorized to access this resource"
                ),
            )
        return user


# ---------------------------------------------------------------------------
# DEPRECATED: get_user_client
# ---------------------------------------------------------------------------
def get_user_client(user=Depends(get_current_user)):
    """
    DEPRECATED — returns a Supabase SDK client.

    This shim is kept only for backward compatibility with legacy routes that
    have not yet been migrated to get_db_provider().  It will be removed once
    all routes in routes/analytics.py, routes/messages.py, routes/grades.py,
    routes/parents.py, routes/reports.py, and routes/health.py are migrated.

    DO NOT use this in new routes.  Use:
        from repositories import get_db_provider, DatabaseProvider
        db: DatabaseProvider = Depends(get_db_provider)
    """
    try:
        from core.db import supabase_admin, supabase, url, anon_key
        from supabase import create_client, ClientOptions

        token = user.get("token", "")
        if user.get("provider") == "supabase" and token:
            from supabase import ClientOptions
            client = create_client(url, anon_key, options=ClientOptions(
                headers={"Authorization": f"Bearer {token}"}
            ))
        else:
            # Firebase-authenticated requests: use the admin client
            # (RLS is enforced at the application layer, not via JWT)
            client = supabase_admin or create_client(url, anon_key)
        return client
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Legacy Supabase client unavailable: {exc}. "
                   "This route requires migration to get_db_provider().",
        )
