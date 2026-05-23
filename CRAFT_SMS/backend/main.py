from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CRAFT SMS API Minimal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Railway Minimal Root OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/health/status")
async def api_health_status():
    return {"status": "healthy"}

