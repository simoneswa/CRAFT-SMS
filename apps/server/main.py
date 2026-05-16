import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.middleware import TenantMiddleware
from core.security_hardening import RateLimitMiddleware

load_dotenv()

app = FastAPI(title="CRAFT SMS API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security & Rate Limiting
app.add_middleware(RateLimitMiddleware, limit=60, window=60) # 60 reqs/min for critical paths

# Multi-Tenant Middleware
app.add_middleware(TenantMiddleware)

@app.get("/")
async def root():
    return {"message": "Welcome to CRAFT SMS API - Unified Educational Platform"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Include routes
from routes import auth, finance, tenants, admin, academic, notifications, parents, messages, analytics, reports, health, events

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(tenants.router, prefix="/api/tenants", tags=["Tenants"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(academic.router, prefix="/api/academic", tags=["Academic"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(parents.router, prefix="/api/parents", tags=["Parents"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
