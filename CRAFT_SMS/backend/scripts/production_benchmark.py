"""
scripts/production_benchmark.py

Post-Cutover Production Benchmark Collector
============================================
Collects real production metrics from:
  Cloud Run → Cloud SQL

Hits the actual production /api/health/detailed endpoint N times,
records round-trip latency, then writes a structured report.

Also runs asyncpg direct queries against Cloud SQL to separate
  - Application-level latency (Cloud Run → load balancer → app → DB → app)
  - Raw DB query latency (asyncpg direct)

Usage:
    python scripts/production_benchmark.py \
        --url https://<cloud-run-url> \
        --iterations 200

Output: monitoring/production_benchmark.json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, median

MONITOR_DIR = Path(__file__).parent.parent / "monitoring"

DIRECT_URL = os.environ.get(
    "CLOUD_SQL_DATABASE_URL",
    "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
)


def pct(data: list[float], p: float) -> float:
    if not data:
        return 0.0
    s = sorted(data)
    idx = max(0, int(len(s) * p / 100) - 1)
    return round(s[idx], 2)


async def benchmark_http(base_url: str, iterations: int) -> dict:
    """Hit the production health endpoint and measure end-to-end latency."""
    import aiohttp
    latencies: list[float] = []
    errors = 0

    print(f"\n  Benchmarking {base_url}/api/health/detailed ({iterations} requests)...")
    async with aiohttp.ClientSession() as session:
        # Warmup
        for _ in range(3):
            try:
                async with session.get(f"{base_url}/api/health/detailed",
                                       timeout=aiohttp.ClientTimeout(total=15)) as r:
                    await r.json()
            except Exception:
                pass

        for i in range(iterations):
            start = time.perf_counter()
            try:
                async with session.get(f"{base_url}/api/health/detailed",
                                       timeout=aiohttp.ClientTimeout(total=15)) as r:
                    data = await r.json()
                    if r.status == 200:
                        latencies.append((time.perf_counter() - start) * 1000)
                    else:
                        errors += 1
                        latencies.append((time.perf_counter() - start) * 1000)
            except Exception:
                errors += 1
                latencies.append((time.perf_counter() - start) * 1000)

            if (i + 1) % 25 == 0:
                print(f"    {i+1}/{iterations} complete...")

    return {
        "type":    "cloud_run_end_to_end",
        "target":  f"{base_url}/api/health/detailed",
        "iterations": iterations,
        "avg_ms":  round(mean(latencies), 2) if latencies else 0,
        "median_ms": round(median(latencies), 2) if latencies else 0,
        "p95_ms":  pct(latencies, 95),
        "p99_ms":  pct(latencies, 99),
        "min_ms":  round(min(latencies), 2) if latencies else 0,
        "max_ms":  round(max(latencies), 2) if latencies else 0,
        "errors":  errors,
        "error_rate_pct": round(errors / iterations * 100, 2),
    }


async def benchmark_db(dsn: str, iterations: int) -> dict:
    """Direct asyncpg query benchmark — isolates DB latency from HTTP overhead."""
    import asyncpg
    print(f"\n  Benchmarking Cloud SQL direct (asyncpg) ({iterations} queries)...")

    workloads = {
        "schools_list":       "SELECT * FROM schools LIMIT 10",
        "lesson_plans_count": "SELECT COUNT(*) FROM lesson_plans",
        "audit_logs_recent":  "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50",
    }

    pool = await asyncpg.create_pool(dsn=dsn, min_size=2, max_size=10, command_timeout=30)
    results = {}

    for name, sql in workloads.items():
        latencies: list[float] = []
        errors = 0

        # Warmup
        for _ in range(3):
            try:
                async with pool.acquire() as c:
                    await c.fetch(sql)
            except Exception:
                pass

        for _ in range(iterations):
            start = time.perf_counter()
            try:
                async with pool.acquire() as c:
                    await c.fetch(sql)
                latencies.append((time.perf_counter() - start) * 1000)
            except Exception:
                errors += 1
                latencies.append((time.perf_counter() - start) * 1000)

        results[name] = {
            "avg_ms":    round(mean(latencies), 2),
            "p95_ms":    pct(latencies, 95),
            "p99_ms":    pct(latencies, 99),
            "min_ms":    round(min(latencies), 2),
            "max_ms":    round(max(latencies), 2),
            "errors":    errors,
            "error_rate_pct": round(errors / iterations * 100, 2),
        }
        print(f"    {name:<30} avg={results[name]['avg_ms']:>7.2f}ms  "
              f"p95={results[name]['p95_ms']:>7.2f}ms  err={errors}")

    pool_snap = {
        "size":   pool.get_size(),
        "idle":   pool.get_idle_size(),
        "active": pool.get_size() - pool.get_idle_size(),
    }
    await pool.close()

    return {
        "type":       "cloudsql_direct_asyncpg",
        "target":     dsn.split("@")[-1],
        "iterations": iterations,
        "workloads":  results,
        "pool":       pool_snap,
    }


async def main(base_url: str, iterations: int, dsn: str) -> None:
    MONITOR_DIR.mkdir(exist_ok=True)

    print(f"\n{'='*65}")
    print(f"  CRAFT SMS — Production Benchmark Collector")
    print(f"  Timestamp  : {datetime.now(timezone.utc).isoformat()}")
    print(f"  Cloud Run  : {base_url}")
    print(f"  Iterations : {iterations}")
    print(f"{'='*65}")

    report: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cloud_run_url": base_url,
    }

    # HTTP end-to-end benchmark
    http_results = await benchmark_http(base_url, iterations)
    report["cloud_run_benchmark"] = http_results

    # Direct DB benchmark
    db_results = await benchmark_db(dsn, iterations)
    report["cloudsql_benchmark"] = db_results

    # Summary table
    print(f"\n{'='*65}")
    print(f"  PRODUCTION BENCHMARK SUMMARY")
    print(f"  {'Metric':<35} {'Cloud Run E2E':>14}  {'DB Direct':>10}")
    print(f"  {'-'*60}")
    print(f"  {'Average latency':<35} {http_results['avg_ms']:>12.2f}ms  (varies per workload)")
    print(f"  {'P95 latency':<35} {http_results['p95_ms']:>12.2f}ms")
    print(f"  {'P99 latency':<35} {http_results['p99_ms']:>12.2f}ms")
    print(f"  {'Error rate':<35} {http_results['error_rate_pct']:>11.2f}%")
    print(f"{'='*65}")

    out = MONITOR_DIR / "production_benchmark.json"
    with out.open("w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n  Report written → {out.resolve()}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url",        default="http://localhost:8000", help="Cloud Run URL")
    parser.add_argument("--iterations", default=200, type=int,           help="Requests per workload")
    parser.add_argument("--dsn",        default=DIRECT_URL,              help="PostgreSQL DSN")
    args = parser.parse_args()
    asyncio.run(main(args.url, args.iterations, args.dsn))
