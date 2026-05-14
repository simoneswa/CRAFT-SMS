import asyncio
import aiohttp
import time
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")
JWT_TOKEN = os.getenv("TEST_JWT_TOKEN")

async def simulate_attendance(session, i):
    payload = {
        "student_id": "STU-DEMO-123",
        "date": "2026-05-14",
        "status": "PRESENT"
    }
    headers = {"Authorization": f"Bearer {JWT_TOKEN}"}
    
    start = time.time()
    try:
        async with session.post(f"{API_URL}/api/academic/attendance", json=payload, headers=headers) as resp:
            latency = (time.time() - start) * 1000
            status = resp.status
            return latency, status
    except Exception:
        return 0, 500

async def run_load_test(concurrent_requests=50):
    print(f"🔥 Starting Institutional Load Test: {concurrent_requests} concurrent requests...")
    
    async with aiohttp.ClientSession() as session:
        tasks = [simulate_attendance(session, i) for i in range(concurrent_requests)]
        results = await asyncio.gather(*tasks)
        
    latencies = [r[0] for r in results if r[1] == 200]
    errors = [r for r in results if r[1] != 200]
    
    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        print(f"✅ Average Latency: {round(avg_latency, 2)}ms")
        print(f"📊 Success Rate: {len(latencies)}/{concurrent_requests}")
    else:
        print("❌ All requests failed. Verify API_URL and JWT_TOKEN.")

if __name__ == "__main__":
    if not JWT_TOKEN:
        print("⚠️ TEST_JWT_TOKEN not found in .env. Skipping load test.")
    else:
        asyncio.run(run_load_test())
