"""
Calm Script Generator — returns CalmScriptSchema for a breathing / calm skill.

Pulls prompts from skill_registry for registered skills.
Claude enhancement for custom calm sessions not in the registry.
"""
from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from .schemas import CalmScriptSchema, CalmPromptSchema

try:
    from skill_registry import get_skill  # type: ignore
except ImportError:
    def get_skill(skill_id: str) -> dict | None:  # type: ignore
        return None

DISCLAIMER_ZH = "这只是根据记录整理，不是医学诊断。"
DISCLAIMER_EN = "This is based on your records only, not medical advice."

_GENERIC_PROMPTS = [
    CalmPromptSchema(step_id="p1", instruction_zh="把肩膀放松一点，先不用回答任何问题。", instruction_en="Relax your shoulders. No need to answer anything right now.", duration_seconds=15),
    CalmPromptSchema(step_id="p2", instruction_zh="慢慢吸气，像把空气放进身体里。", instruction_en="Slowly breathe in, as if filling your body with air.", duration_seconds=15),
    CalmPromptSchema(step_id="p3", instruction_zh="慢慢呼气，把刚才的紧绷放下来。", instruction_en="Slowly breathe out, releasing any tension.", duration_seconds=15),
    CalmPromptSchema(step_id="p4", instruction_zh="很好，就这样，给自己一点点空间。", instruction_en="Well done. Give yourself a little space.", duration_seconds=15),
]


def generate(skill_id: str) -> CalmScriptSchema | None:
    """
    Returns CalmScriptSchema for a calm/breathing skill.
    Returns None if skill not found or not a 'calm' type.
    """
    skill = get_skill(skill_id)
    if not skill or skill.get("type") != "calm":
        return None

    prompts = [
        CalmPromptSchema(
            step_id=s["step_id"],
            instruction_zh=s["instruction_zh"],
            instruction_en=s.get("instruction_en", s["instruction_zh"]),
            duration_seconds=s["duration_seconds"],
            screen_state=s.get("screen_state", "breathing"),
        )
        for s in skill.get("steps", [])
    ]

    tone_map = {
        "night_calm": "sleepy",
        "hot_flash_calm": "quiet",
        "sleep_stretch": "sleepy",
        "emotion_overload": "warm",
    }

    return CalmScriptSchema(
        skill_id=skill_id,
        title_zh=skill["title_zh"],
        title_en=skill.get("title_en", skill["title_zh"]),
        total_duration_seconds=skill["duration_seconds"],
        tone=tone_map.get(skill_id, "quiet"),
        prompts=prompts,
        safety_note_zh=skill.get("safety_note_zh", DISCLAIMER_ZH),
        safety_note_en=skill.get("safety_note_en", DISCLAIMER_EN),
    )


def generate_with_claude(skill_id: str, title: str, tone: str, client) -> CalmScriptSchema:
    """
    Claude-generated calm script for custom sessions.
    Falls back to a generic 4-prompt breathing script on error.
    """
    import json
    try:
        prompt = f"""为以下更年期友好放松练习生成4个引导词，JSON格式：
练习名称：{title}
语调：{tone}（quiet=安静/sleepy=助眠/warm=温暖）

每个引导词要简短（1-2句中文），语气温暖不评判，每步15秒。

返回JSON：
{{
  "prompts": [
    {{"step_id": "p1", "instruction_zh": "中文引导词", "instruction_en": "English guide", "duration_seconds": 15}},
    {{"step_id": "p2", ...}},
    {{"step_id": "p3", ...}},
    {{"step_id": "p4", ...}}
  ]
}}
只返回JSON。"""
        resp = client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(resp.content[0].text)
        prompts = [
            CalmPromptSchema(
                step_id=p["step_id"],
                instruction_zh=p["instruction_zh"],
                instruction_en=p.get("instruction_en", p["instruction_zh"]),
                duration_seconds=int(p.get("duration_seconds", 15)),
            )
            for p in data.get("prompts", [])
        ]
    except Exception:
        prompts = _GENERIC_PROMPTS

    return CalmScriptSchema(
        skill_id=skill_id,
        title_zh=title,
        title_en=title,
        total_duration_seconds=sum(p.duration_seconds for p in prompts),
        tone=tone,
        prompts=prompts,
        safety_note_zh=DISCLAIMER_ZH,
        safety_note_en=DISCLAIMER_EN,
    )
