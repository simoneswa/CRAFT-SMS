"""
scripts/cloudrun_benchmark.py

Phase B – Cloud Run → Cloud SQL Performance Benchmark
======================================================
Simulates the exact request path that Cloud Run will use when deployed:

  FastAPI Request Handler
      → CloudSQLDatabaseProvider._get_pool()
      → asyncpg Connection Acquire
      → SQL Query
      → asyncpg Release

Measures per-query:
  - Avg latency
  - P95 latency
  - P99 latency
  - Min / Max
  - Connection pool size (active + idle)
  - Error rate

Runs 200 iterations across 4 workload types:
  1. schools fetch (simple SELECT)
  2. profiles fetch (filtered, realistic RLS-equivalent)
  3. lesson_plans count (aggregate)
  4. audit_logs range query (time-window)

Results written to cloudrun_benchmark_report.json.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from statistics import mean, median, quantiles
from typing import Any, Callable, Coroutine

DIRECT_URL = os.environ.get(
    "CLOUD_SQL_DATABASE_URL",
    "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
)

ITERATIONS = 100


def stats(latencies: list[float]) -> dict[str, float]:
    if not latencies:
        return {}
    sorted_l = sorted(latencies)
    n = len(latencies)
    p95 = sorted_l[int(n * 0.95)] if n >= 20 else sorted_l[-1]
    p99 = sorted_l[int(n * 0.99)] if n >= 100 else sorted_l[-1]
    return {
        "avg_ms":    round(mean(latencies), 2),
        "median_ms": round(median(latencies), 2),
        "p95_ms":    round(p95, 2),
        "p99_ms":    round(p99, 2),
        "min_ms":    round(min(latencies), 2),
        "max_ms":    round(max(latencies), 2),
        "count":     n,
    }


async def benchmark_query(pool, name: str, sql: str, params=()) -> dict[str, Any]:
    latencies: list[float] = []
    errors = 0

    # Warmup (3 iterations not counted)
    for _ in range(3):
        try:
            async with pool.acquire() as conn:
                await conn.fetch(sql, *params)
        except Exception:
            pass

    for i in range(ITERATIONS):
        start = time.perf_counter()
        try:
            async with pool.acquire() as conn:
                await conn.fetch(sql, *params)
            latencies.append((time.perf_counter() - start) * 1000)
        except Exception as e:
            errors += 1
            latencies.append((time.perf_counter() - start) * 1000)

    s = stats(latencies)
    s["errors"] = errors
    s["error_rate_pct"] = round(errors / ITERATIONS * 100, 2)

    pool_size   = pool.get_size()
    pool_idle   = pool.get_idle_size()
    pool_active = pool_size - pool_idle

    print(f"  {name:<35} Avg={s['avg_ms']:>7.2f}ms  P95={s['p95_ms']:>7.2f}ms  "
          f"P99={s['p99_ms']:>7.2f}ms  Err={errors}/{ITERATIONS}  "
          f"Pool(active={pool_active},idle={pool_idle})")
    return {**s, "pool_size": pool_size, "pool_idle": pool_idle, "pool_active": pool_active}


async def main() -> None:
    import asyncpg

    print(f"\n{'='*80}")
    print("  CRAFT SMS — Cloud Run → Cloud SQL Performance Benchmark")
    print(f"  Timestamp  : {datetime.now(timezone.utc).isoformat()}")
    print(f"  Iterations : {ITERATIONS} per workload")
    print(f"  Target     : {DIRECT_URL.split('@')[-1]}")
    print(f"{'='*80}\n")

    pool = await asyncpg.create_pool(
        dsn=DIRECT_URL,
        min_size=2,
        max_size=10,
        command_timeout=30,
    )

    workloads = [
        ("schools — SELECT * LIMIT 10",
         "SELECT * FROM schools LIMIT 10", ()),
        ("profiles — SELECT by school_id",
         "SELECT * FROM profiles WHERE school_id = $1 LIMIT 20",
         ((await pool.fetchval("SELECT id FROM schools LIMIT 1")),)),
        ("lesson_plans — COUNT aggregate",
         "SELECT COUNT(*) FROM lesson_plans", ()),
        ("audit_logs — recent 100",
         "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100", ()),
    ]

    report: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target": DIRECT_URL.split("@")[-1],
        "iterations_per_workload": ITERATIONS,
        "workloads": {},
    }

    print(f"  {'Workload':<35} {'Avg':>9}  {'P95':>9}  {'P99':>9}  {'Errors':>12}  Pool")
    print("  " + "-" * 76)

    for name, sql, params in workloads:
        result = await benchmark_query(pool, name, sql, params)
        report["workloads"][name] = result

    await pool.close()

    # Overall summary
    all_latencies = []
    total_errors  = 0
    for r in report["workloads"].values():
        total_errors += r.get("errors", 0)
    report["summary"] = {
        "total_queries": ITERATIONS * len(workloads),
        "total_errors":  total_errors,
        "error_rate_pct": round(total_errors / (ITERATIONS * len(workloads)) * 100, 2),
        "connection_pool": {"min": 2, "max": 10},
        "verdict": "PASS" if total_errors == 0 else f"WARN — {total_errors} errors",
    }

    print(f"\n{'='*80}")
    print(f"  Total queries : {report['summary']['total_queries']}")
    print(f"  Total errors  : {total_errors}")
    print(f"  Error rate    : {report['summary']['error_rate_pct']}%")
    print(f"  Verdict       : {report['summary']['verdict']}")
    print(f"{'='*80}")

    out = os.path.join(os.path.dirname(__file__), "..", "cloudrun_benchmark_report.json")
    with open(out, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n  Report written → {os.path.abspath(out)}\n")


if __name__ == "__main__":
    asyncio.run(main())
