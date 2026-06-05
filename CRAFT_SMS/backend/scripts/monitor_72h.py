"""
scripts/monitor_72h.py

72-Hour Post-Cutover Monitoring Script
=======================================
Polls /api/health/detailed on a configurable interval and tracks:

  - Error rate
  - Authentication failures (via audit_logs table)
  - Tenant isolation violations (TENANT_ACCESS_DENIED events)
  - Query latency (health probe round-trip)
  - Connection pool utilization

Writes a rolling JSON log to: monitoring/72h_log.jsonl
Writes a summary report to:   monitoring/72h_summary.json

Usage:
    python scripts/monitor_72h.py --url https://<cloud-run-url> --interval 60

Defaults:
    --interval  60 seconds
    --duration  72 hours (259200 seconds)
    --url       http://localhost:8000
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BASE_URL = os.environ.get("CLOUD_RUN_URL", "http://localhost:8000")
MONITOR_DIR = Path(__file__).parent.parent / "monitoring"
LOG_FILE    = MONITOR_DIR / "72h_log.jsonl"
SUMMARY_FILE = MONITOR_DIR / "72h_summary.json"

# Thresholds that trigger a WARNING in the log
THRESHOLDS = {
    "latency_warn_ms":   2000,   # warn if health probe > 2s
    "latency_crit_ms":   5000,   # critical if > 5s
    "pool_util_warn_pct": 80,    # warn if pool active > 80%
    "error_streak":      3,      # consecutive failures before ALERT
}


async def poll_health(session, base_url: str) -> dict:
    """Hit /api/health/detailed and return a structured reading."""
    import aiohttp
    start = time.perf_counter()
    try:
        async with session.get(f"{base_url}/api/health/detailed", timeout=aiohttp.ClientTimeout(total=10)) as resp:
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            if resp.status == 200:
                data = await resp.json()
                pool = data.get("pool", {})
                pool_size   = pool.get("size", 0) or 0
                pool_active = pool.get("active", 0) or 0
                pool_util   = round(pool_active / max(pool_size, 1) * 100, 1) if pool_size else 0

                return {
                    "ts":           datetime.now(timezone.utc).isoformat(),
                    "status":       data.get("status", "unknown"),
                    "db_provider":  data.get("db_provider", "unknown"),
                    "db_reachable": data.get("db_reachable", False),
                    "latency_ms":   latency_ms,
                    "pool":         pool,
                    "pool_util_pct": pool_util,
                    "http_status":  resp.status,
                    "error":        None,
                }
            else:
                body = await resp.text()
                return {
                    "ts":          datetime.now(timezone.utc).isoformat(),
                    "status":      "degraded",
                    "latency_ms":  latency_ms,
                    "http_status": resp.status,
                    "error":       f"HTTP {resp.status}: {body[:200]}",
                }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "ts":          datetime.now(timezone.utc).isoformat(),
            "status":      "unreachable",
            "latency_ms":  latency_ms,
            "http_status": None,
            "error":       str(e),
        }


async def poll_audit_events(dsn: str) -> dict:
    """Count recent security events in audit_logs (last poll window)."""
    try:
        import asyncpg
        conn = await asyncpg.connect(dsn=dsn)
        counts = await conn.fetchrow(
            """
            SELECT
                COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED'
                                   AND created_at > NOW() - INTERVAL '5 minutes') AS auth_failures,
                COUNT(*) FILTER (WHERE action = 'TENANT_ACCESS_DENIED'
                                   AND created_at > NOW() - INTERVAL '5 minutes') AS isolation_violations
            FROM audit_logs
            """
        )
        await conn.close()
        return {
            "auth_failures_5m":      int(counts["auth_failures"]),
            "isolation_violations_5m": int(counts["isolation_violations"]),
        }
    except Exception as e:
        return {"audit_error": str(e)}


def classify(reading: dict) -> str:
    """Return severity level for a health reading."""
    if reading.get("error") or reading.get("status") in ("unreachable", "degraded"):
        return "ERROR"
    if reading.get("latency_ms", 0) >= THRESHOLDS["latency_crit_ms"]:
        return "CRITICAL"
    if reading.get("latency_ms", 0) >= THRESHOLDS["latency_warn_ms"]:
        return "WARN"
    if reading.get("pool_util_pct", 0) >= THRESHOLDS["pool_util_warn_pct"]:
        return "WARN"
    return "OK"


async def run(base_url: str, interval: int, duration: int, dsn: str) -> None:
    import aiohttp

    MONITOR_DIR.mkdir(exist_ok=True)
    print(f"\n{'='*65}")
    print(f"  CRAFT SMS — 72-Hour Post-Cutover Monitor")
    print(f"  Target    : {base_url}")
    print(f"  Interval  : {interval}s")
    print(f"  Duration  : {duration // 3600}h")
    print(f"  Log       : {LOG_FILE}")
    print(f"{'='*65}\n")

    totals   = {"ok": 0, "warn": 0, "error": 0, "critical": 0}
    latencies = []
    error_streak = 0
    start_wall   = time.monotonic()

    async with aiohttp.ClientSession() as session:
        while (time.monotonic() - start_wall) < duration:
            reading = await poll_health(session, base_url)

            # Optionally enrich with audit counts
            if dsn:
                audit = await poll_audit_events(dsn)
                reading.update(audit)

            level = classify(reading)
            reading["level"] = level
            totals[level.lower()] = totals.get(level.lower(), 0) + 1

            if reading.get("latency_ms") is not None:
                latencies.append(reading["latency_ms"])

            # Streak detection
            if level in ("ERROR", "CRITICAL"):
                error_streak += 1
            else:
                error_streak = 0

            # Log entry
            with LOG_FILE.open("a") as f:
                f.write(json.dumps(reading, default=str) + "\n")

            # Console output
            pool_str = ""
            if "pool" in reading and isinstance(reading["pool"], dict):
                p = reading["pool"]
                pool_str = f"  pool={p.get('active',0)}/{p.get('size',0)}"

            tag = f"[{level}]" if level != "OK" else "[OK] "
            print(f"  {tag}  {reading['ts'][:19]}  "
                  f"latency={reading.get('latency_ms','?'):>7.1f}ms"
                  f"{pool_str}"
                  f"  db={reading.get('db_reachable', '?')}"
                  f"  status={reading.get('status','?')}")

            if error_streak >= THRESHOLDS["error_streak"]:
                print(f"\n  !!! ALERT: {error_streak} consecutive errors — consider rollback !!!\n")

            await asyncio.sleep(interval)

    # Final summary
    sorted_lat = sorted(latencies) if latencies else [0]
    n = len(sorted_lat)
    p95 = sorted_lat[int(n * 0.95)] if n >= 20 else sorted_lat[-1]
    p99 = sorted_lat[int(n * 0.99)] if n >= 100 else sorted_lat[-1]
    avg = sum(sorted_lat) / n

    summary = {
        "generated_at":    datetime.now(timezone.utc).isoformat(),
        "base_url":        base_url,
        "duration_hours":  duration // 3600,
        "total_polls":     sum(totals.values()),
        "results":         totals,
        "latency": {
            "avg_ms":  round(avg, 2),
            "p95_ms":  round(p95, 2),
            "p99_ms":  round(p99, 2),
            "min_ms":  round(min(sorted_lat), 2),
            "max_ms":  round(max(sorted_lat), 2),
        },
        "verdict": "STABLE" if totals.get("error", 0) == 0 and totals.get("critical", 0) == 0 else "UNSTABLE",
    }

    with SUMMARY_FILE.open("w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n{'='*65}")
    print(f"  Monitoring complete. Verdict: {summary['verdict']}")
    print(f"  OK={totals['ok']}  WARN={totals['warn']}  "
          f"ERROR={totals.get('error',0)}  CRITICAL={totals.get('critical',0)}")
    print(f"  Avg={avg:.1f}ms  P95={p95:.1f}ms  P99={p99:.1f}ms")
    print(f"  Summary → {SUMMARY_FILE}")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="72-hour post-cutover monitor")
    parser.add_argument("--url",      default=BASE_URL,  help="Cloud Run base URL")
    parser.add_argument("--interval", default=60,  type=int, help="Poll interval (seconds)")
    parser.add_argument("--duration", default=259200, type=int, help="Total duration (seconds, default=72h)")
    parser.add_argument("--dsn",      default="", help="PostgreSQL DSN for audit log queries (optional)")
    args = parser.parse_args()

    asyncio.run(run(args.url, args.interval, args.duration, args.dsn))
