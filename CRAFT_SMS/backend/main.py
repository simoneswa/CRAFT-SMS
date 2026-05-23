import os
import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Railway Minimal Debug", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Railway Programmatic Start OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "mode": "minimal"}

@app.get("/api/health/status")
async def api_health_status():
    return {"status": "healthy", "mode": "minimal_override"}

if __name__ == "__main__":
    port = 8080
    print(f"--- STARTING UVICORN ON 0.0.0.0:{port} ---")
    uvicorn.run(app, host="0.0.0.0", port=port)
