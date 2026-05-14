# CRAFT SMS - Infrastructure Readiness Report
**Operational Dependency Mapping & Deployment Sequence**

This report defines the technical coordination required between Vercel, Railway, and Supabase for a successful public launch.

## 1. Deployment Sequence (The "Go-Live" Path)
To prevent runtime configuration failures, the following sequence must be observed:

1. **Phase A: Database Foundation (Supabase)**
   - Apply production schema migrations.
   - Verify RLS policies and trigger activation.
   - Configure Storage Buckets for public domain access.
   
2. **Phase B: Backend Logic (Railway)**
   - Link GitHub Repo and set production env vars.
   - Verify connection to the Supabase Production project.
   - Validate health endpoint connectivity.

3. **Phase C: Routing & Frontend (Vercel)**
   - Link GitHub Repo and configure wildcard domain support.
   - Input production `API_URL` (pointing to the Railway instance).
   - Verify middleware tenant resolution against the root domain.

## 2. Service Dependency Map
| Service | Dependency | Requirement |
|:--- |:--- |:--- |
| **Vercel Frontend** | Railway API | Must have `NEXT_PUBLIC_API_URL` set to the live production endpoint. |
| **Vercel Middleware** | Root Domain | Must know the `NEXT_PUBLIC_ROOT_DOMAIN` to extract subdomains. |
| **Railway Backend** | Supabase Auth | Must have `SUPABASE_SERVICE_ROLE_KEY` for administrative overrides. |
| **Railway Backend** | Supabase DB | Must have `DATABASE_URL` (Direct PG Connection) for high-performance writes. |

## 3. Storage & Realtime Coordination
- **CORS Policies**: Supabase Storage must be configured to allow `https://*.craftsms.com`.
- **Realtime Channels**: The client-side Supabase client must use the production `anon_key` and project URL to maintain channel persistence on subdomains.

## 4. Operational Guardrails
- **Health Probes**: Railway will monitor the `/api/health` endpoint; if latency exceeds 5s, automated service restart is triggered.
- **Circuit Breaking**: The frontend will gracefully degrade to 'Offline Mode' if the API is unreachable, utilizing the local Sync Engine.

## 5. Certification Status
- [x] Schema parity verified.
- [x] Dependency order formalized.
- [x] Service mapping validated.
