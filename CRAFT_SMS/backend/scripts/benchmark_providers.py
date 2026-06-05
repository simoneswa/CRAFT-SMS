import asyncio
import time
import os
from statistics import mean, quantiles

from repositories.supabase_provider import SupabaseDatabaseProvider
from repositories.cloudsql_provider import CloudSQLDatabaseProvider
from core.db import supabase_admin

async def run_benchmark(provider, name, iterations=50):
    latencies = []
    
    # Warmup
    try:
        await provider.fetch_many("schools", limit=1)
    except Exception as e:
        print(f"Warmup failed for {name}: {e}")
        return
        
    for _ in range(iterations):
        start = time.perf_counter()
        await provider.fetch_many("schools", limit=10)
        end = time.perf_counter()
        latencies.append((end - start) * 1000) # ms
        
    avg = mean(latencies)
    p95 = quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
    print(f"{name:15} | Avg: {avg:6.2f} ms | P95: {p95:6.2f} ms | Errors: 0")

async def main():
    print("Running Provider Benchmarks (50 iterations each)...\n")
    
    # Supabase Provider
    supa = SupabaseDatabaseProvider()
    await run_benchmark(supa, "Supabase SDK")
    
    # Cloud SQL Provider (asyncpg)
    os.environ["CLOUD_SQL_DATABASE_URL"] = os.environ.get("DIRECT_URL") or "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
    csql = CloudSQLDatabaseProvider()
    
    # Initialize pool
    pool = await csql._get_pool()
    print(f"Cloud SQL Pool: min={pool.get_min_size()}, max={pool.get_max_size()}")
    await run_benchmark(csql, "Cloud SQL/PG")
    
    await CloudSQLDatabaseProvider.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
