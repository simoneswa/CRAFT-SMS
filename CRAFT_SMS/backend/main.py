import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Startup timestamp — used by /health/detailed uptime calculation
_START_TIME: float = time.monotonic()
_START_TS: str = datetime.now(timezone.utc).isoformat()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup probe: logs secret resolution mode and active DB provider.
    Cloud Run deployment logs will clearly show which provider is active."""
    db_provider = os.environ.get("DB_PROVIDER", "supabase")
    print(f"[STARTUP] DB_PROVIDER={db_provider}")

    gcp_project = os.environ.get("GCP_PROJECT")
    if gcp_project:
        try:
            from core.secrets import get_secret
            secret_to_probe = "CLOUD_SQL_DATABASE_URL" if db_provider == "cloudsql" else "SUPABASE_URL"
            probe = get_secret(secret_to_probe)
            if probe:
                print(f"[STARTUP] [OK] Google Secret Manager active (project={gcp_project}, probed={secret_to_probe}).")
            else:
                print(f"[STARTUP] [WARN] GSM reachable but {secret_to_probe} not found (project={gcp_project}).")
        except Exception as e:
            print(f"[STARTUP] [FAIL] GSM probe FAILED: {e}. Using environment variables.")
    else:
        print("[STARTUP] GCP_PROJECT not set -- dev mode (local .env).")

    # Pre-warm Cloud SQL pool so first request has no cold-start penalty
    if db_provider == "cloudsql":
        try:
            from repositories.cloudsql_provider import CloudSQLDatabaseProvider
            provider = CloudSQLDatabaseProvider()
            pool = await provider._get_pool()
            print(f"[STARTUP] [OK] Cloud SQL pool initialised (size={pool.get_size()}).")
        except Exception as e:
            print(f"[STARTUP] [FAIL] Cloud SQL pool pre-warm FAILED: {e}")

    yield  # application runs here

    # Graceful shutdown — drain Cloud SQL connections
    if db_provider == "cloudsql":
        try:
            from repositories.cloudsql_provider import CloudSQLDatabaseProvider
            await CloudSQLDatabaseProvider.close_pool()
            print("[SHUTDOWN] Cloud SQL connection pool closed gracefully.")
        except Exception:
            pass


app = FastAPI(title="CRAFT SMS API", version="1.0.0", lifespan=lifespan)

# CORS — must be added before routes
allowed_origins = os.environ.get("ALLOWED_ORIGINS")
if allowed_origins:
    allow_origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
else:
    allow_origins = [
        "https://craft-sms.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        # Allow all Vercel preview deployments
        "https://craft-sms-git-main-simoneswas-projects.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CRAFT SMS API", "status": "operational"}

@app.get("/health")
async def health():
    """Basic liveness probe for Cloud Run."""
    return {"status": "healthy", "provider": os.environ.get("DB_PROVIDER", "supabase")}


@app.get("/api/health/status")
async def api_health_status():
    return {"status": "healthy"}


@app.get("/api/health/detailed")
async def health_detailed():
    """
    Deep health check used by the 72-hour post-cutover monitoring script.
    Returns DB provider, pool metrics, and uptime.
    Safe to call unauthenticated — returns no sensitive data.
    """
    import time
    db_provider = os.environ.get("DB_PROVIDER", "supabase")
    uptime_s    = round(time.monotonic() - _START_TIME, 1)

    pool_info: dict = {"status": "N/A"}
    db_reachable: bool = False

    if db_provider == "cloudsql":
        try:
            from repositories.cloudsql_provider import CloudSQLDatabaseProvider
            provider = CloudSQLDatabaseProvider()
            pool = await provider._get_pool()
            pool_info = {
                "min": pool.get_min_size(),
                "max": pool.get_max_size(),
                "size": pool.get_size(),
                "idle": pool.get_idle_size(),
                "active": pool.get_size() - pool.get_idle_size(),
            }
            # Lightweight connectivity probe
            await provider.fetch_many("schools", limit=1)
            db_reachable = True
        except Exception as e:
            pool_info = {"error": str(e)}
    else:
        try:
            from core.db import supabase
            if supabase:
                supabase.table("schools").select("id").limit(1).execute()
                db_reachable = True
        except Exception as e:
            pool_info = {"error": str(e)}

    return {
        "status":      "healthy" if db_reachable else "degraded",
        "db_provider": db_provider,
        "db_reachable": db_reachable,
        "pool":        pool_info,
        "uptime_seconds": uptime_s,
        "started_at":  _START_TS,
        "checked_at":  datetime.now(timezone.utc).isoformat(),
    }

# Include all API routers
from routes import auth, finance, tenants, admin, academic, notifications, parents, messages, analytics, reports, health, lesson_plans, storage, stats

app.include_router(auth.router,           prefix="/api/auth",          tags=["Authentication"])
app.include_router(finance.router,        prefix="/api/finance",       tags=["Finance"])
app.include_router(tenants.router,        prefix="/api/tenants",       tags=["Tenants"])
app.include_router(admin.router,          prefix="/api/admin",         tags=["Admin"])
app.include_router(academic.router,       prefix="/api/academic",      tags=["Academic"])
app.include_router(notifications.router,  prefix="/api/notifications", tags=["Notifications"])
app.include_router(parents.router,        prefix="/api/parents",       tags=["Parents"])
app.include_router(messages.router,       prefix="/api/messages",      tags=["Messages"])
app.include_router(analytics.router,      prefix="/api/analytics",     tags=["Analytics"])
app.include_router(reports.router,        prefix="/api/reports",       tags=["Reports"])
app.include_router(health.router,         prefix="/api/health",        tags=["Health"])
app.include_router(lesson_plans.router,   prefix="/api/lesson-plans",  tags=["LessonPlans"])
app.include_router(storage.router,        prefix="/api/storage",       tags=["Storage"])
app.include_router(stats.router,          prefix="/api/stats",         tags=["Stats"])
