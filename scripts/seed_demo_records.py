#!/usr/bin/env python3
"""
seed_demo_records.py — Seed the backend with realistic demo RecordCards.

Creates a 7-day history of sample records to populate the Timeline page.
Safe to run multiple times (records accumulate).

Usage:
    python3 scripts/seed_demo_records.py
    python3 scripts/seed_demo_records.py --host http://localhost:8000 --days 7
"""
import argparse
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
import random
import uuid

DEFAULT_HOST = "http://localhost:8000"

DISCLAIMER = "这只是根据记录整理，不是医学诊断。"

SAMPLE_RECORDS = [
    {
        "kind": "action",
        "title": "完成了 60 秒呼吸",
        "summary": "完成了 60 秒的慢慢呼吸练习。做完感觉肩膀轻了一点。",
        "tags": ["breathing", "calm", "60s"],
    },
    {
        "kind": "body",
        "title": "身体记录：肩颈紧",
        "summary": "久坐后肩颈有些紧绷，做了几分钟轻柔活动。",
        "tags": ["neck_tension", "sitting_long"],
    },
    {
        "kind": "mood",
        "title": "心情记录：有点烦躁",
        "summary": "下午情绪有点烦躁，做了呼吸练习，稍微好了一些。",
        "tags": ["anxious", "afternoon"],
    },
    {
        "kind": "action",
        "title": "完成了夜里陪伴",
        "summary": "夜里三点醒了，用 AI 陪伴缓了一缓，然后慢慢又睡着了。",
        "tags": ["night_calm", "sleep", "night_wake"],
    },
    {
        "kind": "body",
        "title": "身体记录：潮热",
        "summary": "下午两点左右有一阵潮热，出了些汗，做了冷却呼吸。",
        "tags": ["hot_flash", "afternoon"],
    },
    {
        "kind": "action",
        "title": "完成了颈肩轻柔活动",
        "summary": "工作间隙做了三分钟肩颈活动，感觉轻松了不少。",
        "tags": ["neck_relax", "move", "work_break"],
    },
    {
        "kind": "mixed",
        "title": "身心记录：疲惫 + 轻活动",
        "summary": "今天比较累，做了五分钟轻量拉伸，情绪好了一点。",
        "tags": ["tiredness", "gentle_stretch", "mood_improved"],
    },
]


def post(url: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def seed(host: str, days: int) -> None:
    url = f"{host}/api/records"
    now = datetime.now(timezone.utc)
    created = 0

    for day_offset in range(days, 0, -1):
        day = now - timedelta(days=day_offset)
        templates = random.sample(SAMPLE_RECORDS, k=min(2, len(SAMPLE_RECORDS)))
        for tmpl in templates:
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            created_at = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
            record = {
                "id": str(uuid.uuid4()),
                "userId": "demo_user",
                "kind": tmpl["kind"],
                "title": tmpl["title"],
                "summary": tmpl["summary"],
                "tags": tmpl["tags"],
                "createdAt": created_at.isoformat(),
                "safetyDisclaimer": DISCLAIMER,
            }
            try:
                post(url, record)
                print(f"  ✓ {created_at.strftime('%Y-%m-%d %H:%M')} — {tmpl['title']}")
                created += 1
            except urllib.error.URLError as e:
                print(f"  ✗ ERROR: {e}", file=sys.stderr)

    print(f"\nSeeded {created} demo records over {days} days.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()

    print(f"Seeding demo records at {args.host} ({args.days} days)…")
    try:
        seed(args.host, args.days)
    except Exception as e:
        print(f"Failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
