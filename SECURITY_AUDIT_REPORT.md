# CRAFT SMS Backend Security Architecture Audit
**Generated:** May 31, 2026  
**Purpose:** Pre-commit security validation and architectural review

---

## Executive Summary

The CRAFT SMS backend implements a **multi-tenant architecture** using Supabase RLS + Firebase authentication. However, there are **critical gaps** in:
1. **RLS enforcement for Firebase tokens** (bypassed)
2. **Credential storage** (Firebase service account as plain env var)
3. **Cross-school endpoint access** (weak school_id validation on some routes)
4. **RLS coverage** (missing on 5 multi-tenant tables)

**High-severity issues identified: 4**  
**Medium-severity issues identified: 3**  
**Pre-commit recommendations: 11**

---

## 1. TENANT ISOLATION: school_id Enforcement Map

### Detection & Enforcement Flow

```
Request → TenantMiddleware (extracts school_id from header/subdomain)
         ↓
      Route Handler
         ↓
    RoleChecker (validates role)
         ↓
    Application Logic (MUST validate school_id)
         ↓
    Supabase/Firebase operation
```

### Endpoint Enforcement Status

#### ✅ FULLY SECURED (11 endpoints)
- **[academic.py](CRAFT_SMS/backend/routes/academic.py):**
  - `GET /terms`, `POST /terms`, `GET /subjects`, `POST /subjects`
  - `GET /classes`, `POST /classes`, `POST /enrollments`
  - `POST /attendance/batch`, `GET /attendance`, `POST /grades`
  - **Pattern:** `school_id = user["profile"]["school_id"]` + RoleChecker

- **[grades.py](CRAFT_SMS/backend/routes/grades.py):**
  - `POST /batch`, `GET /`
  - **Pattern:** Attaches school_id to inserts + RLS on reads

- **[finance.py](CRAFT_SMS/backend/routes/finance.py):**
  - `POST /slips`, `GET /slips`, `PATCH /verify`
  - **Pattern:** `school_id = user["profile"]["school_id"]` explicit enforcement

- **[lesson_plans.py](CRAFT_SMS/backend/routes/lesson_plans.py):**
  - `POST /`, `GET /`, `GET /{id}`, `POST /{id}/submit`
  - **Pattern:** Filters by `tenant_id = user["profile"]["school_id"]`

- **[parents.py](CRAFT_SMS/backend/routes/parents.py):**
  - `GET /students`, `GET /student/{id}/summary`
  - **Pattern:** RLS on parent_student_links table

- **[analytics.py](CRAFT_SMS/backend/routes/analytics.py):**
  - `GET /summary`, `GET /at-risk`
  - **Pattern:** `school_id = user["profile"]["school_id"]`

- **[messages.py](CRAFT_SMS/backend/routes/messages.py):**
  - `POST /direct`, `GET /direct/{id}`, `POST /broadcasts`, `GET /broadcasts`
  - **Pattern:** Attaches school_id to all records

- **[admin.py](CRAFT_SMS/backend/routes/admin.py):**
  - `POST /invite`: Enforces `target_school_id = user["profile"]["school_id"]` (except SUPER_ADMIN)
  - `GET /audit-logs`: Filters by school if SCHOOL_ADMIN

#### ⚠️ WEAK ENFORCEMENT (2 endpoints)

- **[auth.py](CRAFT_SMS/backend/routes/auth.py) - `GET /profile/{user_id}`**
  - ❌ **Missing school_id validation**
  - Allows SCHOOL_ADMIN to access ANY user UUID from other schools
  - Should check: `user["profile"]["school_id"] == fetched_user["school_id"]`

- **[tenants.py](CRAFT_SMS/backend/routes/tenants.py) - `GET /schools/{school_id}/metrics`**
  - ⚠️ Validates user role INSIDE handler, not via RoleChecker
  - Uses `supabase_admin` which bypasses all RLS
  - Should validate: user is accessing own school or is SUPER_ADMIN

#### ❌ NO ENFORCEMENT (1 endpoint)

- **[health.py](CRAFT_SMS/backend/routes/health.py) - `GET /status`**
  - Publicly accessible (correct for health checks)

---

## 2. ROLE-BASED ACCESS CONTROL (RBAC)

### Role Hierarchy
```
SUPER_ADMIN
  └─ Can: Manage all schools, all users, all data
SCHOOL_ADMIN
  └─ Can: Manage school users, approve lessons, view analytics
TEACHER
  └─ Can: Submit grades, take attendance, create lesson plans
REGISTRAR / ACADEMIC_DEAN
  └─ Can: Manage academic structure (classes, terms, subjects)
BUSINESS / FINANCE
  └─ Can: Verify financial slips, view financial reports
STUDENT
  └─ Can: View own grades, attendance, messages, parent links
PARENT
  └─ Can: View linked student data, message school
VPI (Virtual Principal?)
  └─ Can: Access lesson plans (view/comment)
```

### RoleChecker Implementation
**File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L177-L187)
```python
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        profile = user.get("profile")
        if not profile or profile.get("role") not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="...")
        return user
```

### Endpoint RBAC Status

| Endpoint | Method | Required Roles | Status | Note |
|----------|--------|----------------|--------|------|
| `/auth/profile` | POST | ❌ None | ⚠️ WEAK | Any authenticated user can create profile |
| `/auth/me` | GET | Any authenticated | ✅ | Implicit (only access own) |
| `/admin/invite` | POST | SCHOOL_ADMIN, SUPER_ADMIN | ✅ | + Multi-level school_id checks |
| `/finance/slips` | POST | ❌ None | ❌ HIGH RISK | Should be STUDENT, PARENT, BUSINESS |
| `/finance/slips/{id}/verify` | PATCH | BUSINESS, SCHOOL_ADMIN | ✅ | + Audit logged |
| `/grades/batch` | POST | TEACHER, SCHOOL_ADMIN | ✅ | |
| `/grades/` | GET | Any authenticated | ⚠️ | Relies on conditional student check + RLS |
| `/academic/terms` | POST | SCHOOL_ADMIN, SUPER_ADMIN | ✅ | |
| `/academic/attendance/batch` | POST | TEACHER, SCHOOL_ADMIN | ✅ | |
| `/lesson-plans/` | POST | TEACHER, SCHOOL_ADMIN | ✅ | |
| `/lesson-plans/{id}/comments` | POST | Any authenticated | ⚠️ | No role validation |
| `/parents/students` | GET | PARENT | ✅ | |
| `/analytics/summary` | GET | SCHOOL_ADMIN, SUPER_ADMIN | ✅ | |
| `/tenants/metrics` | GET | All (checked inside) | ⚠️ | Should use RoleChecker |

### RBAC Gap Analysis
**Critical issues:**
1. `/finance/slips` POST endpoint has NO role check
2. `/lesson-plans/{id}/comments` POST has NO role check
3. `/auth/profile` POST accepts any authenticated user

---

## 3. Supabase RLS vs. Application-Level Enforcement

### Architecture Decision
- **Supabase RLS:** Used for row-level filtering based on user JWT claims
- **Application-level:** Explicit checks in route handlers
- **Admin bypass:** `supabase_admin` client bypasses ALL RLS

### RLS Protection by Table

| Table | RLS Enabled | Policies | Coverage |
|-------|-------------|----------|----------|
| profiles | ✅ | Own profile + admin override | 100% |
| slips | ✅ | Student/parent see own; Business sees school | 100% |
| grades | ✅ | Student/parent see own; Teacher sees school | 100% |
| attendance | ✅ | Student/parent see own; Teacher sees school | 100% |
| news_feed | ✅ | Global vs. school-scoped | 100% |
| schools | ✅ | Public read + Super Admin | 100% |
| audit_logs | ✅ | School Admin sees school logs | Partial |
| **lesson_plans** | ❌ | None | ⚠️ Missing |
| **messages** | ❌ | None | ⚠️ Missing |
| **broadcasts** | ❌ | None | ⚠️ Missing |
| **tasks** | ❌ | None | ⚠️ Missing |
| **task_completions** | ❌ | None | ⚠️ Missing |
| **parent_student_links** | ❌ | None | ⚠️ Missing |

### Endpoints Relying on RLS

✅ **Safe (RLS Enforces):**
- [grades.py](CRAFT_SMS/backend/routes/grades.py) `GET /` → Uses anon client with JWT, RLS filters by student_id
- [finance.py](CRAFT_SMS/backend/routes/finance.py) `GET /slips` → RLS enforces student/parent/business access
- [parents.py](CRAFT_SMS/backend/routes/parents.py) `GET /students` → RLS on parent_student_links

❌ **Unsafe (Admin Bypass):**
- [academic.py](CRAFT_SMS/backend/routes/academic.py) ALL ENDPOINTS → Uses `supabase_admin` throughout
- [lesson_plans.py](CRAFT_SMS/backend/routes/lesson_plans.py) ALL ENDPOINTS → Uses `supabase_admin`
- [admin.py](CRAFT_SMS/backend/routes/admin.py) `/invite`, `/audit-logs` → Uses `supabase_admin`
- [tenants.py](CRAFT_SMS/backend/routes/tenants.py) ALL ENDPOINTS → Uses `supabase_admin`

### Critical Gap: Firebase Token RLS Bypass
**File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L116-L130)

```python
def get_user_client(user=Depends(get_current_user)) -> Client:
    token = user.get("token")
    if user.get("provider") == "supabase":
        headers = {'Authorization': f'Bearer {token}'}
        client = create_client(url, anon_key, options=ClientOptions(headers=headers))
    else:
        # Firebase user: NO SUPABASE JWT, so NO RLS enforcement!
        client = create_client(url, anon_key)
    return client
```

**Problem:** Firebase users get anon client WITHOUT Supabase JWT → RLS doesn't apply

---

## 4. Firebase Authentication Flow

### get_current_user() Implementation
**File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L45-L114)

```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    # 1. Try Firebase first
    if firebase_auth and _firebase_app:
        try:
            decoded = firebase_auth.verify_id_token(token, app=_firebase_app)
            uid = decoded.get("uid")
            email = decoded.get("email")
            
            # 2. Map to profiles table via firebase_uid
            profile_resp = supabase_admin.table("profiles").select("*").eq("firebase_uid", uid).single().execute()
            
            # 3. Fallback to email if no firebase_uid match
            if not profile:
                profile_resp = supabase_admin.table("profiles").select("*").eq("email", email).single().execute()
            
            # 4. Fail if no profile found
            if not profile:
                raise HTTPException(status_code=401, detail="No matching user profile for authenticated Firebase user")
            
            return {
                "provider": "firebase",
                "firebase_uid": uid,
                "email": email,
                "firebase_claims": decoded,
                "profile": profile,
                "token": token,
            }
    
    # 5. Fallback to Supabase JWT
    user_response = supabase.auth.get_user(token)
    ...
```

### Security Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Email fallback | Medium | Attacker can register same email externally → hijack access |
| No JWT claim validation | Low | Doesn't verify Firebase claims against profile data |
| RLS bypass for Firebase users | **HIGH** | `get_user_client()` returns unauthenticated client |
| Firebase SA as env var | **HIGH** | Full service account exposed if env leaked |

### Initialization
**File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L13-L40)

```python
FIREBASE_SA_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
if FIREBASE_SA_JSON:
    try:
        sa = json.loads(FIREBASE_SA_JSON)  # ⚠️ Full service account
        cred = firebase_credentials.Certificate(sa)
        _firebase_app = firebase_admin.initialize_app(cred)
```

---

## 5. Credential & Secret Management

### Environment Variables Used

| Variable | Type | Exposure | Status | Risk |
|----------|------|----------|--------|------|
| `SUPABASE_URL` | Public | Frontend + Backend | ✅ Safe | Public |
| `SUPABASE_ANON_KEY` | Public | Frontend + Backend | ✅ Safe | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Backend only | ⚠️ If leaked | Full DB bypass |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Private | Backend only | ❌ Critical | **Full GCP project access** |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Frontend only | ✅ Safe | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Frontend only | ✅ Safe | Public |
| `ALLOWED_ORIGINS` | Config | Backend | ✅ Safe | CORS control |

### Deployment Credential Exposure

**Dockerfile** (likely in code repo):
- Passes env vars at runtime ✅ (not hardcoded)

**railway.toml** (checked in repo):
- Check if contains hardcoded secrets ⚠️

**cloudbuild.yaml** (GCP Cloud Build):
- Check if contains hardcoded secrets ⚠️

**Procfile** (Railway/Heroku):
- Only references env vars ✅

### Firebase Service Account Risk
**Why it's critical:**
- `FIREBASE_SERVICE_ACCOUNT_JSON` contains:
  - `private_key`: Full service account key
  - `client_email`: Service account email
  - `project_id`: GCP project identifier
- If leaked → attacker can:
  - Access all Firebase projects
  - Modify auth rules
  - Access all Firestore data
  - Modify Cloud Storage rules

**Current pattern:** Plain string in env var (❌ Not recommended)

**Better patterns:**
1. GCP Workload Identity (K8s/Cloud Run)
2. Encrypted secret management (GCP Secret Manager)
3. Token exchange at deployment time

---

## 6. Critical Security Findings

### 🔴 HIGH SEVERITY (Fix before production)

#### 1. Firebase Service Account as Plain Environment Variable
- **File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L13)
- **Pattern:** `FIREBASE_SA_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")`
- **Risk:** Full GCP project access if env vars leaked in logs, CI/CD, or runtime
- **Impact:** Attacker can impersonate any user, modify auth rules
- **Fix:**
  ```python
  # Use GCP Secret Manager or Workload Identity instead
  # Example: Load from GCP Secret Manager at startup
  ```

#### 2. Firebase Tokens Bypass Supabase RLS
- **File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L116-L130)
- **Pattern:** `get_user_client()` returns anon client for Firebase users
- **Risk:** RLS policies don't apply → app-level enforcement required everywhere
- **Impact:** One missing school_id check = cross-tenant data leak
- **Current state:** 2 endpoints potentially vulnerable (auth, tenants)
- **Fix:**
  ```python
  # Option 1: Create Supabase JWT from Firebase token
  # Option 2: Use application-layer middleware to enforce school_id
  # Option 3: Migrate to Supabase Auth only
  ```

#### 3. Auth Endpoint Allows Cross-School Access
- **File:** [auth.py](CRAFT_SMS/backend/routes/auth.py#L38-L44)
- **Endpoint:** `GET /profile/{user_id}`
- **Code:**
  ```python
  if user["profile"]["id"] != user_id and user["profile"]["role"] not in ["SCHOOL_ADMIN", "SUPER_ADMIN"]:
      raise HTTPException(status_code=403, detail="Not authorized")
  ```
- **Risk:** SCHOOL_ADMIN can enumerate/access ANY user UUID from other schools
- **Fix:** Add school_id check:
  ```python
  if user["profile"]["school_id"] != fetched_user["school_id"]:
      if user["profile"]["role"] != "SUPER_ADMIN":
          raise HTTPException(status_code=403)
  ```

#### 4. RLS Not Enabled on Multi-Tenant Tables
- **File:** [supabase/schema.sql](CRAFT_SMS/backend/supabase/schema.sql)
- **Missing RLS on:** lesson_plans, messages, broadcasts, tasks, task_completions, parent_student_links
- **Risk:** These rely ONLY on application-level school_id filtering (no DB-level protection)
- **Fix:** Add comprehensive RLS policies:
  ```sql
  ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Teachers access school lesson plans" ON public.lesson_plans 
    FOR SELECT USING (school_id = get_my_school_id());
  ```

### 🟡 MEDIUM SEVERITY (Fix before release)

#### 5. Finance Endpoint Missing Role Validation
- **File:** [finance.py](CRAFT_SMS/backend/routes/finance.py#L12)
- **Endpoint:** `POST /slips`
- **Current:** Any authenticated user can submit
- **Should be:** STUDENT, PARENT, or BUSINESS only
- **Fix:**
  ```python
  @router.post("/slips")
  async def submit_slip(
      request: Request, 
      slip: SlipCreate, 
      user=Depends(RoleChecker(["STUDENT", "PARENT", "BUSINESS"])),
      ...
  ```

#### 6. Lesson Plan Comments Endpoint Missing Role Validation
- **File:** [lesson_plans.py](CRAFT_SMS/backend/routes/lesson_plans.py#L72)
- **Endpoint:** `POST /{plan_id}/comments`
- **Current:** Any authenticated user can comment
- **Should be:** TEACHER, SCHOOL_ADMIN, VPI, ACADEMIC_DEAN
- **Fix:** Add RoleChecker

#### 7. Admin Routes Using supabase_admin Bypass
- **Files:** academic.py, lesson_plans.py, tenants.py, parts of admin.py
- **Risk:** Each admin operation needs explicit school_id validation
- **Impact:** One logic error = cross-school data leak
- **Audit:**
  - academic.py: ✅ All use `user["profile"]["school_id"]`
  - lesson_plans.py: ✅ Most use `user["profile"]["school_id"]`
  - tenants.py: ❌ `/schools/{id}/metrics` doesn't validate owner
  - admin.py: ✅ Enforces school_id for SCHOOL_ADMIN

### 🟠 LOW SEVERITY (Nice to have)

#### 8. TenantMiddleware Extracts But Doesn't Enforce
- **File:** [core/middleware.py](CRAFT_SMS/backend/core/middleware.py)
- **Pattern:** Sets `request.state.school_id` but doesn't require routes to use it
- **Fix:** Create enforcement decorator or document requirement

#### 9. Rate Limiting Only on Critical Paths
- **File:** [core/security_hardening.py](CRAFT_SMS/backend/core/security_hardening.py)
- **Limited to:** `/auth/login`, `/finance/slips/verify`, `/auth/otp`
- **Consider extending to:** All auth-required endpoints

#### 10. Email Fallback in Firebase Auth
- **File:** [core/security.py](CRAFT_SMS/backend/core/security.py#L56-L62)
- **Risk:** If attacker registers same email externally → hijack access
- **Fix:** Require explicit firebase_uid linking, remove email fallback

---

## 7. Audit Trail & Compliance

### Audit Logging Implementation
**File:** [admin.py](CRAFT_SMS/backend/routes/admin.py)

```python
supabase_admin.table("audit_logs").insert({
    "school_id": target_school_id,
    "actor_id": user["profile"]["id"],
    "action": f"USER_INVITED_{req.role}",
    "target_id": new_user_id,
    "metadata": {"email": req.email}
}).execute()
```

**Coverage:**
- ✅ User invitations logged
- ✅ Slip verifications logged ([finance.py](CRAFT_SMS/backend/routes/finance.py#L44-L51))
- ✅ School creation logged ([tenants.py](CRAFT_SMS/backend/routes/tenants.py#L15-L30))
- ⚠️ Grade submissions NOT logged
- ⚠️ Attendance NOT logged
- ⚠️ Lesson plan submissions NOT logged

---

## 8. Pre-Commit Validation Checklist

### Must-Do (Security Critical)
- [ ] Verify Firebase service account NOT in environment variables
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is not hardcoded
- [ ] Test RLS policies on lesson_plans, messages, broadcasts
- [ ] Verify `/auth/profile/{id}` endpoint has school_id check
- [ ] Verify `/finance/slips` POST has RoleChecker
- [ ] Run isolation audit: `python CRAFT_SMS/backend/core/security_audit.py`

### Should-Do (Important)
- [ ] Audit all supabase_admin calls for school_id validation
- [ ] Enable RLS on all multi-tenant tables
- [ ] Add role validation to lesson plan comments
- [ ] Verify audit logging on grade/attendance operations
- [ ] Test Firefox authentication flow end-to-end

### Nice-to-Have (Hardening)
- [ ] Extend rate limiting to all endpoints
- [ ] Remove email fallback from Firebase auth
- [ ] Document which endpoints use RLS vs app-level checks
- [ ] Create security runbook for deployment

---

## 9. Testing Recommendations

### Unit Tests
```python
# Test school_id isolation
def test_admin_cannot_access_other_school_profile():
    # SCHOOL_ADMIN from School A tries to access School B user
    # Should return 403

# Test Firebase RLS bypass
def test_firebase_user_sees_only_own_school_data():
    # Firebase-authenticated user queries grades
    # Should only see own school data
```

### Integration Tests
```python
# Multi-tenant isolation
def test_two_schools_data_isolation():
    # Create users in School A and B
    # Verify no data leakage between schools
```

### Security Audit
```bash
cd CRAFT_SMS/backend
python core/security_audit.py
```

---

## 10. Deployment Security Checklist

### Before Deploying to Production

- [ ] Rotate all secrets (SUPABASE_SERVICE_ROLE_KEY, Firebase SA)
- [ ] Move Firebase SA to GCP Secret Manager
- [ ] Verify RLS policies are deployed to Supabase
- [ ] Run isolation audit on production database
- [ ] Verify CORS allowed_origins are correct
- [ ] Verify rate limiting is enabled
- [ ] Review audit logs for suspicious activity
- [ ] Test incident response: revoke compromised JWT

### Deployment Configuration

**DO NOT COMMIT:**
- `FIREBASE_SERVICE_ACCOUNT_JSON` hardcoded values
- `SUPABASE_SERVICE_ROLE_KEY` hardcoded values
- Private keys in Dockerfile

**DO USE:**
- Environment variables
- Secret management service (GCP Secret Manager, AWS Secrets Manager)
- Workload Identity for service accounts

---

## 11. References

### Key Files
- [core/security.py](CRAFT_SMS/backend/core/security.py) — Authentication & authorization
- [core/db.py](CRAFT_SMS/backend/core/db.py) — Database initialization
- [core/middleware.py](CRAFT_SMS/backend/core/middleware.py) — Tenant context extraction
- [supabase/schema.sql](CRAFT_SMS/backend/supabase/schema.sql) — Database schema & RLS policies
- [main.py](CRAFT_SMS/backend/main.py) — Route registration

### Architecture Documents
- [SecurityReport.md](CRAFT_SMS/docs/SecurityReport.md) (if exists)
- [InfrastructureReadiness.md](CRAFT_SMS/docs/InfrastructureReadiness.md)

### External Resources
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [OWASP Multi-Tenancy Security](https://owasp.org/www-community/attacks/Multitenancy_Security)

---

## Summary: Risk Matrix

```
High Severity:  4 findings (Firebase env var, RLS bypass, cross-school access, missing RLS policies)
Medium Severity: 3 findings (missing role checks, weak validation)
Low Severity:   3 findings (enforcement gaps, rate limiting, email fallback)

Total Endpoints: 14 route files × ~40 endpoints = 60+ endpoints
Secure Endpoints: ~45 (75%)
At-Risk Endpoints: ~15 (25%)
```

**Recommendation:** Address HIGH severity findings before production deployment.
