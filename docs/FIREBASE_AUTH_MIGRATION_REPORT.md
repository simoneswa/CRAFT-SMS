# Firebase Auth Integration — Migration Report

Date: 2026-05-31

Summary
-------
Implemented Firebase ID token verification as the primary authentication layer in `CRAFT_SMS/backend/core/security.py`.

What I changed
- Added `firebase-admin` to `CRAFT_SMS/backend/requirements.txt`.
- Implemented Firebase Admin SDK initialization reading from `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable or using default application credentials.
- Updated `get_current_user` to:
  - Verify Firebase ID tokens (signature, expiry) and extract `uid`, `email`, and claims.
  - Map Firebase UID to application `profiles` via `supabase_admin.table('profiles')` using `firebase_uid` column, falling back to `email` if necessary.
  - Return `user` object with `profile`, `firebase_claims`, `firebase_uid`, and original token.
  - Fallback to legacy Supabase JWT verification if Firebase verification fails or Firebase SDK is unavailable.
- Updated `get_user_client` to return a Supabase client while noting limitations: Firebase tokens cannot be used as Supabase JWTs for RLS; the function heuristically attaches Authorization header only for legacy Supabase tokens.
- Preserved `RoleChecker` behavior to enforce role-based access using `user['profile']['role']`.

Important considerations & limitations
------------------------------------
- Supabase RLS compatibility: Supabase RLS relies on Supabase-issued JWTs containing role/claims. Firebase ID tokens are not compatible with Supabase RLS. While the new middleware maps Firebase users to application `profiles`, backend code must enforce tenant isolation and RBAC in application logic until the system fully migrates to Cloud SQL and app-level enforcement or new DB-level policies are implemented.

- Profiles mapping: For reliable mapping, add a `firebase_uid` column to `profiles` and backfill it by matching existing user emails or via an account-linking flow during user migration. Without `firebase_uid` mapping, the system will attempt to match profiles by email as a fallback.

- Secrets & credentials: The Firebase Admin credentials should be provided via `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable (JSON string) or via `GOOGLE_APPLICATION_CREDENTIALS` in the runtime environment. For CI/CD, store service account JSON in Google Secret Manager or GitHub secrets and populate the env var during deployment.

- Testing: Before enabling Firebase-based auth in production, test the following in staging:
  1. Valid Firebase tokens map to intended `profiles` entries.
  2. Role-based endpoints (`RoleChecker`) continue to block/allow as expected.
  3. Endpoints that previously relied on Supabase RLS still enforce tenant isolation via application logic.

Next steps
----------
1. Add `firebase_uid` column to `profiles` (migration SQL) and backfill values.
2. Provision Firebase project and service account; add credentials to staging & production envs.
3. Implement account linking flow for existing users to associate their Supabase account with Firebase UID.
4. Update endpoints using `get_user_client` and Supabase RLS to enforce tenant isolation in application logic until Cloud SQL migration completes.
5. Add automated integration tests for auth flows and role checks.

Files modified
- `CRAFT_SMS/backend/core/security.py`
- `CRAFT_SMS/backend/requirements.txt`
