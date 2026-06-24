"""
AI service: calls Claude API when ANTHROPIC_API_KEY is set,
otherwise falls back to deterministic mock responses.

Contract mirrors AiAgentService in services/mock-ai/src/index.ts.
"""
import os
import re
import json
import random
import string
from datetime import datetime, timezone

from models import (
    AIUnderstandResponse, CalmScript, CalmPrompt,
    ExercisePlan, ExerciseStep, ActionCompletionResponse,
    RecordCard, SuggestedAction, UserInput, DetectedState, CompletedAction
)

SAFETY_DISCLAIMER = "这只是根据记录整理，不是医学诊断。"


def _id(prefix: str) -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Mock fallback (no API key required)
# ---------------------------------------------------------------------------

def _mock_understand(inp: UserInput) -> AIUnderstandResponse:
    text = inp.text.lower()
    wants_move = bool(re.search(r"动|move|walk|stiff|僵|酸", text))
    body_signals = []
    if re.search(r"膝|knee", text):
        body_signals.append("knee discomfort")
    if re.search(r"睡|sleep|醒", text):
        body_signals.append("sleep change")
    if re.search(r"热|hot|潮热", text):
        body_signals.append("hot flash")
    if re.search(r"累|tired|fatigue", text):
        body_signals.append("tiredness")

    mood = "unclear"
    if re.search(r"烦|anxious|焦虑|irritated", text):
        mood = "anxious"
    elif re.search(r"累|tired", text):
        mood = "tired"

    if wants_move:
        action = SuggestedAction(
            id=_id("action"),
            type="move",
            title="2 分钟轻柔肩颈活动",
            reason="先用很轻的动作让身体醒一点，不追求运动量。",
            estimatedMinutes=2,
            pressureLevel="very-low",
            primaryCta="start",
            alternatives=["skip", "change", "later"],
        )
    else:
        action = SuggestedAction(
            id=_id("action"),
            type="breathe",
            title="1 分钟慢慢呼吸",
            reason="先不用分析原因，让身体和情绪都慢下来一点。",
            estimatedMinutes=1,
            pressureLevel="very-low",
            primaryCta="start",
            alternatives=["skip", "change", "later"],
        )

    return AIUnderstandResponse(
        id=_id("ai"),
        inputId=inp.id,
        detectedState=DetectedState(mood=mood, bodySignals=body_signals),
        reply="我听到了。我们先做一个很小、没有压力的动作。",
        suggestedAction=action,
        safetyDisclaimer=SAFETY_DISCLAIMER,
        createdAt=_now(),
    )


def _mock_calm_script(action: SuggestedAction) -> CalmScript:
    return CalmScript(
        id=_id("calm"),
        actionId=action.id,
        title=action.title,
        durationSeconds=60,
        tone="quiet",
        prompts=[
            CalmPrompt(id="p1", text="把肩膀放松一点，先不用回答任何问题。", seconds=15),
            CalmPrompt(id="p2", text="慢慢吸气，像把空气放进身体里。", seconds=15),
            CalmPrompt(id="p3", text="慢慢呼气，把刚才的紧绷放下来。", seconds=15),
            CalmPrompt(id="p4", text="很好，就这样，给自己一点点空间。", seconds=15),
        ],
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


def _mock_exercise_plan(action: SuggestedAction) -> ExercisePlan:
    return ExercisePlan(
        id=_id("move"),
        actionId=action.id,
        title=action.title,
        durationSeconds=120,
        intensity="gentle",
        avoidIf=["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
        steps=[
            ExerciseStep(id="m1", instruction="坐稳或站稳，慢慢转动肩膀。", seconds=30),
            ExerciseStep(id="m2", instruction="双手轻放大腿，慢慢抬头看远处。", seconds=30),
            ExerciseStep(id="m3", instruction="手臂自然下垂，左右轻轻摆动。", seconds=30),
            ExerciseStep(id="m4", instruction="停下来，感受呼吸和身体。", seconds=30),
        ],
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


def _mock_complete(action: SuggestedAction) -> ActionCompletionResponse:
    return ActionCompletionResponse(
        id=_id("done"),
        actionId=action.id,
        completedAt=_now(),
        reflectionPrompt="要不要把这次状态简单记下来？",
        proposedRecord=RecordCard(
            id=_id("record"),
            actionId=action.id,
            kind="action",
            title="完成了一次缓一缓" if action.type == "breathe" else "完成了一次轻活动",
            summary=f"刚刚完成：{action.title}。",
            tags=[action.type, "low-pressure"],
            completedAction=CompletedAction(
                type=action.type,
                title=action.title,
                durationSeconds=action.estimatedMinutes * 60,
            ),
            createdAt=_now(),
            safetyDisclaimer=SAFETY_DISCLAIMER,
        ),
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


# ---------------------------------------------------------------------------
# Claude API implementation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
你是 AI Otter Coach，一个陪伴 45-65 岁更年期/绝经后女性的温暖 AI 伴侣。
你的风格：温暖、平静、不评判、不施压。
你不做医学诊断、不推荐药物、不要求用户做任何事。
所有回应都必须包含声明：这只是根据记录整理，不是医学诊断。
用中英文混合（中文为主）回应。回应要简短（1-3句话）、温暖。
"""


def _claude_understand(inp: UserInput, client) -> AIUnderstandResponse:
    """Call Claude to understand user input and suggest an action."""
    prompt = f"""用户说："{inp.text}"

请以JSON格式回应，包含以下字段：
{{
  "mood": "tired|anxious|sad|irritated|calm|unclear",
  "bodySignals": ["list of detected body signals in English"],
  "reply": "你对用户的温暖回应（1-2句，中文）",
  "actionType": "breathe|move",
  "actionTitle": "行动标题（简短，中文）",
  "actionReason": "为什么推荐这个行动（1句，中文）",
  "estimatedMinutes": 1
}}

只返回JSON，不要其他文字。"""

    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(message.content[0].text)

    action_type = data.get("actionType", "breathe")
    action = SuggestedAction(
        id=_id("action"),
        type=action_type,
        title=data.get("actionTitle", "1 分钟慢慢呼吸"),
        reason=data.get("actionReason", "先让身体慢下来。"),
        estimatedMinutes=int(data.get("estimatedMinutes", 1)),
        pressureLevel="very-low",
        primaryCta="start",
        alternatives=["skip", "change", "later"],
    )

    return AIUnderstandResponse(
        id=_id("ai"),
        inputId=inp.id,
        detectedState=DetectedState(
            mood=data.get("mood", "unclear"),
            bodySignals=data.get("bodySignals", []),
        ),
        reply=data.get("reply", "我听到了。"),
        suggestedAction=action,
        safetyDisclaimer=SAFETY_DISCLAIMER,
        createdAt=_now(),
    )


def _claude_calm_script(action: SuggestedAction, client) -> CalmScript:
    prompt = f"""为以下放松行动生成引导词，JSON格式：
行动：{action.title}

返回JSON：
{{
  "title": "行动标题",
  "prompts": [
    {{"id": "p1", "text": "引导词（1句，中文）", "seconds": 15}},
    {{"id": "p2", "text": "...", "seconds": 15}},
    {{"id": "p3", "text": "...", "seconds": 15}},
    {{"id": "p4", "text": "...", "seconds": 15}}
  ]
}}

只返回JSON。"""
    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(message.content[0].text)
    return CalmScript(
        id=_id("calm"),
        actionId=action.id,
        title=data.get("title", action.title),
        durationSeconds=60,
        tone="quiet",
        prompts=[CalmPrompt(**p) for p in data.get("prompts", [])],
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


def _claude_exercise_plan(action: SuggestedAction, client) -> ExercisePlan:
    prompt = f"""为以下轻运动行动生成步骤，JSON格式：
行动：{action.title}

返回JSON：
{{
  "title": "行动标题",
  "steps": [
    {{"id": "m1", "instruction": "步骤说明（1句，中文）", "seconds": 30}},
    {{"id": "m2", "instruction": "...", "seconds": 30}},
    {{"id": "m3", "instruction": "...", "seconds": 30}},
    {{"id": "m4", "instruction": "...", "seconds": 30}}
  ]
}}

只返回JSON。"""
    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(message.content[0].text)
    return ExercisePlan(
        id=_id("move"),
        actionId=action.id,
        title=data.get("title", action.title),
        durationSeconds=120,
        intensity="gentle",
        avoidIf=["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
        steps=[ExerciseStep(**s) for s in data.get("steps", [])],
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


# ---------------------------------------------------------------------------
# Public service class
# ---------------------------------------------------------------------------

class AiService:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self._client = None
        if api_key:
            try:
                import anthropic
                self._client = anthropic.Anthropic(api_key=api_key)
                print(f"[AI] Claude API enabled (model: {os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-6')})")
            except ImportError:
                print("[AI] anthropic package not installed – using mock AI")
        else:
            print("[AI] No ANTHROPIC_API_KEY – using mock AI")

    @property
    def using_real_ai(self) -> bool:
        return self._client is not None

    def understand_user_input(self, inp: UserInput) -> AIUnderstandResponse:
        if self._client:
            try:
                return _claude_understand(inp, self._client)
            except Exception as e:
                print(f"[AI] Claude error: {e} – falling back to mock")
        return _mock_understand(inp)

    def create_calm_script(self, action: SuggestedAction) -> CalmScript:
        if self._client:
            try:
                return _claude_calm_script(action, self._client)
            except Exception as e:
                print(f"[AI] Claude error: {e} – falling back to mock")
        return _mock_calm_script(action)

    def create_exercise_plan(self, action: SuggestedAction) -> ExercisePlan:
        if self._client:
            try:
                return _claude_exercise_plan(action, self._client)
            except Exception as e:
                print(f"[AI] Claude error: {e} – falling back to mock")
        return _mock_exercise_plan(action)

    def complete_action(self, action: SuggestedAction) -> ActionCompletionResponse:
        return _mock_complete(action)
