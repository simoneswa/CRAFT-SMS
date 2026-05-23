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

if __name__ == "__main__":
    # Force Railway's PORT environment variable or default to 8080
    port = int(os.environ.get("PORT", 8080))
    print(f"--- STARTING UVICORN ON 0.0.0.0:{port} ---")
    uvicorn.run(app, host="0.0.0.0", port=port)
