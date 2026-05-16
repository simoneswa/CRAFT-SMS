import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit # Requests per window
        self.window = window # Window in seconds
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Only rate limit critical paths
        critical_paths = ["/api/auth/login", "/api/finance/slips/verify", "/api/auth/otp"]
        
        if any(request.url.path.startswith(p) for p in critical_paths):
            client_ip = request.client.host
            now = time.time()
            
            # Clean old requests
            self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window]
            
            if len(self.requests[client_ip]) >= self.limit:
                raise HTTPException(status_code=429, detail="Too many requests. Operational lock engaged.")
                
            self.requests[client_ip].append(now)
            
        response = await call_next(request)
        return response
