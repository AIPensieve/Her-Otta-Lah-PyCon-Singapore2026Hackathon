"""
Exercise Plan Generator — returns a structured ExercisePlanSchema for a given skill.

Pulls steps directly from the skill_registry so the plan is always
consistent with what the backend serves via /api/skills/{skill_id}.
Claude enhancement available for skills not in the registry.
"""
from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from .schemas import ExercisePlanSchema, ExerciseStepSchema

try:
    from skill_registry import get_skill  # type: ignore
except ImportError:
    def get_skill(skill_id: str) -> dict | None:  # type: ignore
        return None

DISCLAIMER_ZH = "这只是根据记录整理，不是医学诊断。"
DISCLAIMER_EN = "This is based on your records only, not medical advice."

AVOID_IF_DEFAULT = [
    "明显疼痛", "头晕", "胸闷", "医生建议避免活动",
    "obvious pain", "dizziness", "chest tightness",
]


def generate(skill_id: str) -> ExercisePlanSchema | None:
    """
    Returns ExercisePlanSchema for a movement skill.
    Returns None if skill not found or not a 'move' type.
    """
    skill = get_skill(skill_id)
    if not skill or skill.get("type") != "move":
        return None

    steps = [
        ExerciseStepSchema(
            step_id=s["step_id"],
            instruction_zh=s["instruction_zh"],
            instruction_en=s.get("instruction_en", s["instruction_zh"]),
            duration_seconds=s["duration_seconds"],
            screen_state=s.get("screen_state", "exercise_countdown"),
        )
        for s in skill.get("steps", [])
    ]

    return ExercisePlanSchema(
        skill_id=skill_id,
        title_zh=skill["title_zh"],
        title_en=skill.get("title_en", skill["title_zh"]),
        total_duration_seconds=skill["duration_seconds"],
        intensity=skill.get("intensity", "gentle"),
        avoid_if=AVOID_IF_DEFAULT,
        steps=steps,
        safety_note_zh=skill.get("safety_note_zh", DISCLAIMER_ZH),
        safety_note_en=skill.get("safety_note_en", DISCLAIMER_EN),
    )


def generate_with_claude(skill_id: str, title: str, client) -> ExercisePlanSchema:
    """
    Claude-generated plan for skills not in the registry.
    Falls back to a generic 4-step plan on error.
    """
    import json
    try:
        prompt = f"""为以下更年期友好轻运动生成4个步骤，JSON格式：
运动名称：{title}

要求：
- 每步30秒
- 坐着或站着均可完成
- 非常低强度，随时可停止

返回JSON：
{{
  "steps": [
    {{"step_id": "m1", "instruction_zh": "中文说明", "instruction_en": "English instruction", "duration_seconds": 30}},
    {{"step_id": "m2", ...}},
    {{"step_id": "m3", ...}},
    {{"step_id": "m4", ...}}
  ]
}}
只返回JSON。"""
        resp = client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(resp.content[0].text)
        steps = [
            ExerciseStepSchema(
                step_id=s["step_id"],
                instruction_zh=s["instruction_zh"],
                instruction_en=s.get("instruction_en", s["instruction_zh"]),
                duration_seconds=int(s.get("duration_seconds", 30)),
            )
            for s in data.get("steps", [])
        ]
    except Exception:
        steps = [
            ExerciseStepSchema(step_id="m1", instruction_zh="坐稳，慢慢转动肩膀。", instruction_en="Sit comfortably and slowly roll your shoulders.", duration_seconds=30),
            ExerciseStepSchema(step_id="m2", instruction_zh="双手轻放膝盖，慢慢抬头看远处。", instruction_en="Hands on knees, gently lift your head and look ahead.", duration_seconds=30),
            ExerciseStepSchema(step_id="m3", instruction_zh="手臂自然下垂，左右轻轻摆动。", instruction_en="Arms relaxed, gently swing side to side.", duration_seconds=30),
            ExerciseStepSchema(step_id="m4", instruction_zh="停下来，感受呼吸和身体。", instruction_en="Pause and notice your breath and body.", duration_seconds=30),
        ]

    return ExercisePlanSchema(
        skill_id=skill_id,
        title_zh=title,
        title_en=title,
        total_duration_seconds=sum(s.duration_seconds for s in steps),
        intensity="gentle",
        avoid_if=AVOID_IF_DEFAULT,
        steps=steps,
        safety_note_zh=DISCLAIMER_ZH,
        safety_note_en=DISCLAIMER_EN,
    )
