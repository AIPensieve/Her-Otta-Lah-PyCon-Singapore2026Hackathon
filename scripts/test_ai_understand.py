#!/usr/bin/env python3
"""
test_ai_understand.py — Test the /ai/understand endpoint with sample inputs.

Usage:
    python3 scripts/test_ai_understand.py
    python3 scripts/test_ai_understand.py --host http://localhost:8000
    python3 scripts/test_ai_understand.py --input "肩膀有点紧，想动一下"
"""
import argparse
import json
import sys
import urllib.request
import urllib.error

DEFAULT_HOST = "http://localhost:8000"

SAMPLE_INPUTS = [
    {"text": "今天夜里三点醒了，睡不着，有点烦", "language": "zh"},
    {"text": "潮热出汗，感觉很不舒服", "language": "zh"},
    {"text": "I've been feeling anxious and can't focus", "language": "en"},
    {"text": "肩颈很紧，久坐了，想动一下", "language": "zh"},
    {"text": "膝盖有点不舒服，想找个不用站着的运动", "language": "zh"},
    {"text": "情绪有点低落，不知道为什么", "language": "zh"},
    {"text": "想睡个好觉", "language": "zh"},
    {"text": "Feeling hot and uncomfortable, need to calm down", "language": "en"},
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


def test_one(host: str, text: str, language: str = "zh") -> None:
    url = f"{host}/ai/understand"
    body = {"text": text, "language": language, "user_id": "demo_user"}
    print(f"\n{'─'*60}")
    print(f"INPUT:  {text!r}")
    try:
        result = post(url, body)
        print(f"INTENT: {result.get('intent', '?')}")
        print(f"REPLY:  {result.get('reply_text', result.get('display_text', '?'))}")
        action = result.get("suggested_action") or result.get("action_recommendation") or {}
        if action:
            print(f"ACTION: {action.get('skill_id','?')} — {action.get('title','?')}")
        safety = result.get("safety", {})
        print(f"SAFETY: {safety.get('level', 'normal')}")
    except urllib.error.URLError as e:
        print(f"ERROR:  {e} — is the backend running at {host}?", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--input", default=None)
    args = parser.parse_args()

    print(f"Testing /ai/understand at {args.host}")

    if args.input:
        test_one(args.host, args.input)
    else:
        for sample in SAMPLE_INPUTS:
            test_one(args.host, sample["text"], sample["language"])

    print(f"\n{'─'*60}")
    print("Done.")


if __name__ == "__main__":
    main()
