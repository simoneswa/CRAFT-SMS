# Google Cloud Migration Plan for CRAFT SMS

## 1. Current architecture audit

### Frontend
- Application: `CRAFT_SMS/frontend`
- Framework: Next.js 15
- Current hosting config: `firebase.json` with Firebase Hosting targeting `CRAFT_SMS/frontend`
- Current client dependencies: direct Supabase SDK usage for auth, realtime, storage, and database reads/writes
- Firebase config already present in `CRAFT_SMS/frontend/src/firebase-config.js`

### Backend
- Application: `CRAFT_SMS/backend`
- Framework: FastAPI
- Containerization: `CRAFT_SMS/backend/Dockerfile`
- Database access: Supabase Python client (`supabase` / `supabase_admin`) rather than direct Postgres driver
- Auth validation: Supabase JWT verification in `CRAFT_SMS/backend/core/security.py`

### Database
- Current production PostgreSQL is Supabase-backed
- `.env` references a Supabase PostgreSQL connection pooler
- Target: Cloud SQL PostgreSQL

### Storage
- Frontend uses Supabase storage in finance upload flows and direct storage calls
- Backend health checks also validate Supabase storage
- Target: Firebase Storage buckets

### Authentication
- Current auth flow is Supabase Auth via frontend and backend
- Target: Firebase Authentication with preserved role-based access control and tenant isolation

### Deployment
- Existing Firebase hosting rewrite currently points at `/api/v1/**`
- FastAPI backend exposes `/api/**`
- Firebase Hosting rewrite must be adjusted to match backend paths

## 2. Immediate audit findings

- `firebase.json` rewrite path was `"/api/v1/**"` but FastAPI exposes `/api/**`
- `CRAFT_SMS/backend/main.py` CORS allowed origins are hardcoded for Vercel and localhost only
- Backend is not yet wired for Cloud SQL or Firebase Auth validation
- Frontend still depends on Supabase SDK for core application flows

## 3. Migration phases

### Phase 1: Host and route services on Google
1. Deploy Next.js frontend to Firebase Hosting
2. Deploy FastAPI backend to Cloud Run as `craft-sms-backend`
3. Use Firebase Hosting rewrite for `/api/**` to Cloud Run
4. Use custom domain via Firebase Hosting and enable SSL

### Phase 2: Configure GCP infrastructure
1. Create Cloud SQL PostgreSQL instance
2. Set up backups and automated maintenance
3. Configure Cloud SQL connection pooling / proxy for Cloud Run
4. Set up Firebase Storage bucket(s)
5. Set up Firebase Authentication and custom claims for roles
6. Configure Firebase Cloud Messaging for push notifications

### Phase 3: Migrate backend from Supabase to Cloud SQL + Firebase Auth
1. Create Postgres schema in Cloud SQL matching Supabase schema
2. Preserve row-level security by mapping tenant isolation into backend authorization and Postgres row filters
3. Replace Supabase Python client with a direct Postgres client or ORM layer
4. Implement Firebase ID token verification in backend security middleware
5. Keep role-based access control logic intact in backend route guards

### Phase 4: Migrate storage and notifications
1. Move uploaded media and payment slips from Supabase storage to Firebase Storage
2. Update upload/download flows to use Firebase Storage buckets
3. Integrate Firebase Cloud Messaging for parent, teacher, and student notifications

### Phase 5: CI/CD and production readiness
1. Add GitHub Actions workflow for Cloud Run + Firebase Hosting deployments
2. Use Google service account secrets and Firebase token management
3. Validate production secrets via Secret Manager or GitHub secrets
4. Test all APIs, auth flows, storage uploads, and tenant isolation
5. Enable Firebase Analytics and performance monitoring

## 4. Action items implemented in this repo

- Updated `firebase.json` to rewrite `/api/**` to the Cloud Run backend
- Added environment-driven CORS support in `CRAFT_SMS/backend/main.py`
- Added Cloud Run Docker ignore file for faster image builds
- Added Cloud Build config for backend container build
- Added GitHub Actions deployment workflow at `.github/workflows/deploy-gcp.yml`
- Extended `CRAFT_SMS/.env.example` with Google Cloud / Firebase migration placeholders

## 5. Recommended next steps

1. Register `craft-sms-backend` service in Cloud Run and verify `us-central1`
2. Provision Cloud SQL PostgreSQL and set `CLOUD_SQL_CONNECTION_NAME`
3. Provision Firebase Storage bucket and Firebase Auth for the target Firebase project
4. Add production values to Google Secret Manager and GitHub secrets
5. Perform a controlled test deploy of the frontend and backend
6. Validate API endpoints, auth, storage, and school isolation in staging

## 6. Notes for implementation

- Preserve FastAPI and PostgreSQL architecture. Do not rebuild on a different server platform.
- Keep tenant isolation and role access checks; migrate data source behind the current application boundaries.
- Use Firebase Hosting for frontend + custom domain; use Cloud Run for backend service hosting.
- Do not remove FastAPI or PostgreSQL from the stack during this migration.
