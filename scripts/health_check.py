#!/usr/bin/env python3
"""
health_check.py — Verify all backend endpoints are alive.

Checks:
  - /health
  - /api/demo/status
  - /api/skills
  - /api/device/state
  - /ai/understand (quick smoke test)

Usage:
    python3 scripts/health_check.py
    python3 scripts/health_check.py --host http://localhost:8000
"""
import argparse
import json
import sys
import urllib.request
import urllib.error
from typing import Any

DEFAULT_HOST = "http://localhost:8000"
OK   = "✓"
FAIL = "✗"


def get(url: str, timeout: int = 5) -> tuple[int, Any]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except urllib.error.URLError as e:
        return 0, {"error": str(e)}


def post(url: str, body: dict, timeout: int = 8) -> tuple[int, Any]:
    try:
        data = json.dumps(body).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except urllib.error.URLError as e:
        return 0, {"error": str(e)}


def check(label: str, ok: bool, detail: str = "") -> bool:
    icon = OK if ok else FAIL
    line = f"  {icon} {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    return ok


def run(host: str) -> int:
    print(f"\nAI Otter Coach — Health Check")
    print(f"Backend: {host}")
    print("─" * 50)

    failures = 0

    # /health
    status, data = get(f"{host}/health")
    ok = status == 200 and data.get("status") == "ok"
    ai_mode = data.get("ai_mode", "?")
    device = "connected" if data.get("device_connected") else "disconnected"
    if not check(f"GET /health", ok, f"ai={ai_mode} device={device}"):
        failures += 1

    # /api/demo/status
    status, data = get(f"{host}/api/demo/status")
    ok = status == 200
    skills = data.get("skill_count", "?")
    if not check(f"GET /api/demo/status", ok, f"skills={skills}"):
        failures += 1

    # /api/skills
    status, data = get(f"{host}/api/skills")
    ok = status == 200 and isinstance(data, list) and len(data) > 0
    if not check(f"GET /api/skills", ok, f"{len(data) if isinstance(data, list) else 0} skills"):
        failures += 1

    # /api/device/state
    status, data = get(f"{host}/api/device/state")
    ok = status == 200 and "connection" in data
    conn = data.get("connection", "?")
    if not check(f"GET /api/device/state", ok, f"connection={conn}"):
        failures += 1

    # /ai/understand (smoke test)
    status, data = post(
        f"{host}/ai/understand",
        {"text": "今天夜里醒了，有点累", "language": "zh", "user_id": "health_check"},
    )
    ok = status == 200 and "intent" in data
    intent = data.get("intent", "?") if ok else data.get("error", "?")
    if not check(f"POST /ai/understand", ok, f"intent={intent}"):
        failures += 1

    # /api/records
    status, data = get(f"{host}/api/records")
    ok = status == 200 and isinstance(data, list)
    count = len(data) if isinstance(data, list) else "?"
    if not check(f"GET /api/records", ok, f"{count} records"):
        failures += 1

    print("─" * 50)
    if failures == 0:
        print(f"  {OK} All checks passed\n")
    else:
        print(f"  {FAIL} {failures} check(s) failed\n")

    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=DEFAULT_HOST)
    args = parser.parse_args()
    failures = run(args.host)
    sys.exit(0 if failures == 0 else 1)


if __name__ == "__main__":
    main()
