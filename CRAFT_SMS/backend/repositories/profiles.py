"""
repositories/profiles.py

Repository for managing user profiles via the configured DatabaseProvider.

All database access goes through DatabaseProvider — no Supabase SDK imports here.
"""
from typing import Optional, Dict, Any
from repositories.base import DatabaseProvider


class ProfileRepository:
    def __init__(self, provider: DatabaseProvider):
        self.provider = provider

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------
    async def create_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user profile."""
        return await self.provider.insert("profiles", data)

    # ------------------------------------------------------------------
    # Read — by primary key
    # ------------------------------------------------------------------
    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a user profile by internal UUID."""
        return await self.provider.fetch_one("profiles", {"id": user_id})

    async def get_profile_with_school(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a user profile along with its school info.

        The Supabase provider supports the PostgREST join syntax
        '*, schools(name, subdomain)' in the columns field.
        The asyncpg provider ignores the join and returns the flat profile only
        (school lookup must be performed separately if needed).
        """
        return await self.provider.fetch_one(
            "profiles", {"id": user_id}, columns="*, schools(name, subdomain)"
        )

    # ------------------------------------------------------------------
    # Read — by Firebase identity (used by core/security.py auth path)
    # ------------------------------------------------------------------
    async def get_profile_by_firebase_uid(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Primary lookup: map Firebase UID → application profile.

        This is the first lookup attempted by get_current_user().
        Requires a `firebase_uid` column on the profiles table with a UNIQUE index.
        """
        return await self.provider.fetch_one("profiles", {"firebase_uid": firebase_uid})

    async def get_profile_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fallback lookup: map email → profile.

        Used when firebase_uid has not yet been written to the profile
        (e.g. accounts created before firebase_uid indexing was introduced).
        """
        return await self.provider.fetch_one("profiles", {"email": email})
