"""
Record Card Generator — produces a RecordCardDraft from user context.

Called after the user completes an action or wants to save a check-in.
Extracts body_tags, mood_tags, and generates a human-readable summary.

All summaries include the safety disclaimer.
No interpretation beyond what the user explicitly stated.
"""
from __future__ import annotations
import os
import re
from datetime import datetime, timezone
from .schemas import ClassifiedIntent, RecommendedAction, RecordCardDraft

DISCLAIMER = "这只是根据记录整理，不是医学诊断。"

# Body signal → display tag
_BODY_TAG_MAP: dict[str, str] = {
    "knee_discomfort": "膝盖不适",
    "neck_tension":    "肩颈紧",
    "hot_flash":       "潮热",
    "sleep_change":    "睡眠变化",
    "tiredness":       "疲惫",
    "head_discomfort": "头部不适",
    "palpitation":     "心悸",
    "digestive":       "消化不适",
}

# Mood signal → display tag
_MOOD_TAG_MAP: dict[str, str] = {
    "anxious":        "焦虑",
    "irritated":      "烦躁",
    "sad":            "难过",
    "tired":          "没精神",
    "sleep_related":  "睡眠困扰",
    "positive":       "心情好转",
}


def _body_tags(signals: list[str]) -> list[str]:
    return [_BODY_TAG_MAP[s] for s in signals if s in _BODY_TAG_MAP]


def _mood_tags(signals: list[str]) -> list[str]:
    return [_MOOD_TAG_MAP[s] for s in signals if s in _MOOD_TAG_MAP]


def _kind(body_tags: list[str], mood_tags: list[str], action: RecommendedAction | None) -> str:
    has_body = bool(body_tags)
    has_mood = bool(mood_tags)
    has_action = action is not None
    if has_body and has_mood:
        return "mixed"
    if has_body:
        return "body"
    if has_mood:
        return "mood"
    if has_action:
        return "action"
    return "mixed"


def _summary(
    intent: ClassifiedIntent,
    action: RecommendedAction | None,
    body_tags: list[str],
    mood_tags: list[str],
) -> str:
    parts: list[str] = []
    if body_tags:
        parts.append(f"身体：{', '.join(body_tags)}")
    if mood_tags:
        parts.append(f"心情：{', '.join(mood_tags)}")
    if action:
        parts.append(f"完成了：{action.title_zh}")
    if not parts:
        parts.append("记录了一次状态")
    return "。".join(parts) + "。"


def _title(body_tags: list[str], mood_tags: list[str], action: RecommendedAction | None) -> str:
    if action:
        return f"完成了 {action.title_zh}"
    if body_tags:
        return f"身体记录：{body_tags[0]}"
    if mood_tags:
        return f"心情记录：{mood_tags[0]}"
    return "状态记录"


def generate(
    intent: ClassifiedIntent,
    action: RecommendedAction | None = None,
) -> RecordCardDraft:
    """Generate a RecordCardDraft from classified intent and optional action."""
    body_tags = _body_tags(intent.body_signals)
    mood_tags = _mood_tags(intent.mood_signals)

    return RecordCardDraft(
        kind=_kind(body_tags, mood_tags, action),
        title=_title(body_tags, mood_tags, action),
        summary=_summary(intent, action, body_tags, mood_tags),
        body_tags=body_tags,
        mood_tags=mood_tags,
        action_tag=action.title_zh if action else None,
        safety_disclaimer=DISCLAIMER,
    )


def generate_with_claude(
    intent: ClassifiedIntent,
    action: RecommendedAction | None,
    client,
) -> RecordCardDraft:
    """Claude-enhanced record card. Falls back to generate() on error."""
    import json
    try:
        body = ", ".join(intent.body_signals) or "无"
        mood = ", ".join(intent.mood_signals) or "无"
        act = action.title_zh if action else "无"
        prompt = f"""用户原文："{intent.raw_text}"
身体信号：{body}
情绪信号：{mood}
完成行动：{act}

请生成简短的身心记录，JSON格式：
{{
  "title": "记录标题（10字内）",
  "summary": "1-2句话的温暖记录摘要（中文）",
  "body_tags": ["身体标签列表"],
  "mood_tags": ["心情标签列表"]
}}
只返回JSON。"""
        resp = client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(resp.content[0].text)
        body_tags_raw = data.get("body_tags", [])
        mood_tags_raw = data.get("mood_tags", [])
        return RecordCardDraft(
            kind=_kind(body_tags_raw, mood_tags_raw, action),
            title=data.get("title", _title([], [], action)),
            summary=data.get("summary", ""),
            body_tags=body_tags_raw,
            mood_tags=mood_tags_raw,
            action_tag=action.title_zh if action else None,
            safety_disclaimer=DISCLAIMER,
        )
    except Exception:
        return generate(intent, action)
