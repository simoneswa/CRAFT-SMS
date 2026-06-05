from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from repositories import get_db_provider

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Paths that don't need tenant context
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # 1. Check Header first (Manual override/API usage)
        school_id = request.headers.get("X-School-ID")
        
        # 2. Check Subdomain if header is missing
        if not school_id:
            host = request.headers.get("host", "")
            # e.g., schoola.localhost:3000 -> schoola
            parts = host.split(".")
            # Filter out common local/prod root domains
            if len(parts) >= 2:
                subdomain = parts[0]
                if subdomain not in ["www", "api", "localhost", "craft-sms"]:
                    try:
                        db = get_db_provider()
                        res = await db.fetch_one("schools", {"subdomain": subdomain, "is_active": True})
                        if res:
                            school_id = res.get("id")
                    except Exception as e:
                        print(f"Subdomain resolution error: {e}")
        
        # Attach to request state
        request.state.school_id = school_id
        
        # For authenticated routes, we will later verify if user belongs to this school
        
        response = await call_next(request)
        return response
