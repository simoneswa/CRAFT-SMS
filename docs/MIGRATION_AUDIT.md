 # CRAFT SMS — Firebase / GCP Migration Audit

 This document audits current Supabase dependencies and outlines a safe migration roadmap to Google Cloud (Cloud Run + Cloud SQL) and Firebase (Auth, Storage, Messaging, Analytics).

 ## Dependency Audit

 - Authentication: Supabase Auth used throughout frontend (`supabase.auth.*`) and backend (`core.security` verifies Supabase JWTs).
 - Database access: Supabase PostgREST client and Python `supabase` client used in backend `core.db`, routes use `supabase`/`supabase_admin` for reads and admin writes.
 - Storage: Supabase Storage used for school logos, payment slips, and other media (`supabase.storage.*` calls in frontend and backend health checks).
 - Realtime: Supabase realtime channels used in notifications and live UI components (`supabase` client subscriptions in frontend `NotificationBell`, `messages`).
 - SDK integrations: Frontend depends on `@supabase/supabase-js`. Frontend also includes Firebase SDK (analytics) config file.
 - Environment variables: `.env`, `.env.local`, `.env.example` contain Supabase and DB connection strings, JWT secret, and multiple NEXT_PUBLIC_* keys. These will need migrating to Secret Manager / GitHub secrets / Firebase project config.

 ## Migration Roadmap (Non-destructive)

 1. Infrastructure scaffold
    - Provision GCP project and enable APIs: Cloud Run, Cloud Build, Cloud SQL, Secret Manager, Firebase APIs.
    - Create Firebase project if not identical and configure hosting + storage + auth.
 2. Build CI/CD for Cloud Run + Firebase Hosting (non-destructive deploy to staging).
 3. Schema parity: Export Supabase Postgres schema and apply to Cloud SQL in staging (read-only verification first).
 4. Storage migration: Copy buckets objects from Supabase storage to Firebase Storage (preserve names and metadata), do not remove original.
 5. Authentication mapping: Evaluate mapping Supabase users → Firebase Authentication; implement custom token flow or staged dual-auth period (frontend reads from Supabase, backend validates Firebase tokens after migration window).
 6. App code changes: Make backend accept Firebase ID tokens and continue to honor role/tenant claims (custom claims mapping required). Replace Supabase client usage incrementally.
 7. Cutover: Redirect frontend to new endpoints and swap storage sources; keep Supabase read-only for rollback window.
 8. Deprecate Supabase once validated and data sync confirmed.

 ## Risk Assessment

 - Risk: Loss of tenant isolation during migration.
   - Mitigation: Stage-by-stage migration; keep RLS and tenant filters intact; validate per-tenant in staging.
 - Risk: Auth mismatch between Supabase and Firebase identities.
   - Mitigation: Implement account linking and custom claims; support dual-auth tokens during migration.
 - Risk: Data loss during DB migration.
   - Mitigation: Use logical replication or dump/restore into Cloud SQL and verify checksums; keep Supabase snapshot and PITR until rollback window closes.
 - Risk: Realtime features break (Supabase real-time vs FCM / Firestore listeners).
   - Mitigation: Replace realtime channels progressively with FCM for push and WebSockets/Cloud Run for server-sent events as needed.

 ## Rollback Plan

 1. Keep Supabase production project live and writable until final verification.
 2. DNS of frontend remains same; host new frontend under staging domain first.
 3. If Cloud SQL or Cloud Run proves unstable, revert frontend API base URL to Supabase-backed endpoints and re-enable Supabase storage and auth.
 4. Maintain backups and export snapshots before any writable cutover.

 ## Estimated Development Effort (High-level)

 - Infrastructure & CI/CD scaffolding: 2–4 days
 - Schema migration + verification: 3–5 days
 - Storage migration tooling and validation: 2–3 days
 - Auth migration + linking (complex): 5–10 days
 - Backend code changes (replace supabase client): 5–8 days
 - Frontend changes (storage + auth client): 4–7 days
 - Testing, QA, remediation: 3–6 days

 Total: 24–43 engineering days (1–2 engineers) depending on parallel work and complexity of user-account linking.

 ---

 For next steps, see `docs/DATABASE_EVALUATION.md` and `docs/GCP-Migration-Plan.md` (short checklist included earlier).
