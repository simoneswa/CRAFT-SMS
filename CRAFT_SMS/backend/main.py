import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CRAFT SMS API", version="1.0.0")

# CORS — must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://craft-sms.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        # Allow all vercel preview deployments
        "https://craft-sms-git-main-simoneswas-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CRAFT SMS API", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/health/status")
async def api_health_status():
    return {"status": "healthy"}

# Include all API routers
from routes import auth, finance, tenants, admin, academic, notifications, parents, messages, analytics, reports, health

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
