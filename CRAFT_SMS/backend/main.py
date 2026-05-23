from fastapi import FastAPI

app = FastAPI(title="CRAFT SMS API Minimal", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Minimal Root OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "mode": "minimal"}
