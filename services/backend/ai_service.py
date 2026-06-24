"""
AI service: calls Claude API when ANTHROPIC_API_KEY is set,
otherwise falls back to deterministic mock responses.

DEMO_MODE=true  → always fallback to mock on any error
AI_MODE=mock    → skip Claude even if key is set
AI_MODE=real    → try Claude, fallback to mock
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
    RecordCard, SuggestedAction, UserInput, DetectedState, CompletedAction,
    SuggestedRecord
)
from skill_registry import get_skill, SKILLS
from demo_config import DEMO_MODE, AI_MODE

SAFETY_DISCLAIMER = "这只是根据记录整理，不是医学诊断。"


def _id(prefix: str) -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Keyword → skill mapping  (Demo route rules)
# ---------------------------------------------------------------------------

_KEYWORD_RULES: list[tuple[list[str], str]] = [
    # mood / emotion
    (["烦", "焦虑", "想哭", "心里堵", "irritated", "anxious", "overwhelm"], "emotion_overload"),
    (["烦躁", "anxiety", "堵"], "breathing_60s"),
    # sleep / night
    (["夜醒", "夜里醒", "半夜醒", "睡不好", "night", "insomnia"], "night_calm"),
    (["睡前", "准备睡", "放松", "bedtime"], "sleep_stretch"),
    # body temperature
    (["热醒", "潮热", "出汗", "hot flash", "flush"], "hot_flash_calm"),
    # body / movement
    (["肩颈", "脖子", "肩膀", "久坐", "neck", "shoulder", "stiff"], "neck_relax_3min"),
    (["膝盖", "腿痛", "knee", "leg pain"], "knee_friendly_move"),
    (["想运动", "动一下", "拉伸", "stretch", "exercise"], "gentle_stretch_5min"),
    # sleep-move overlap: sleep_stretch wins for bedtime context already above
]

_DEFAULT_SKILL_ID = "breathing_60s"


def _match_skill(text: str) -> str:
    lower = text.lower()
    for keywords, skill_id in _KEYWORD_RULES:
        if any(kw in lower for kw in keywords):
            return skill_id
    return _DEFAULT_SKILL_ID


def _skill_to_action(skill_id: str) -> SuggestedAction:
    skill = get_skill(skill_id)
    if not skill:
        skill = SKILLS[_DEFAULT_SKILL_ID]
    action_type = "breathe" if skill["type"] == "calm" else "move"
    duration_min = max(1, skill["duration_seconds"] // 60)
    return SuggestedAction(
        id=_id("action"),
        type=action_type,
        title=skill["title_zh"],
        reason=skill["description_zh"],
        estimatedMinutes=duration_min,
        pressureLevel="very-low",
        primaryCta="start",
        alternatives=["skip", "change", "later"],
        skillId=skill_id,
    )


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------

def _mock_understand(inp: UserInput) -> AIUnderstandResponse:
    text = inp.text

    body_signals: list[str] = []
    if re.search(r"膝|knee", text, re.I):
        body_signals.append("knee discomfort")
    if re.search(r"睡|sleep|醒", text, re.I):
        body_signals.append("sleep change")
    if re.search(r"热|hot|潮热", text, re.I):
        body_signals.append("hot flash")
    if re.search(r"累|tired|fatigue", text, re.I):
        body_signals.append("tiredness")
    if re.search(r"肩|颈|neck|shoulder", text, re.I):
        body_signals.append("neck tension")

    mood = "unclear"
    if re.search(r"烦|anxious|焦虑|irritated|堵", text, re.I):
        mood = "anxious"
    elif re.search(r"累|tired", text, re.I):
        mood = "tired"
    elif re.search(r"热|潮热|hot", text, re.I):
        mood = "unclear"

    skill_id = _match_skill(text)
    action = _skill_to_action(skill_id)

    # Warm, concise reply
    replies = {
        "emotion_overload": "听起来今天情绪很满。我们先不急着分析，可以先缓一缓。",
        "night_calm":       "夜里醒来挺难受的。我在这里陪着你，先慢慢缓一缓。",
        "hot_flash_calm":   "潮热后身体需要一点时间平静。我们先缓一缓。",
        "sleep_stretch":    "睡前放松一下身体，会更容易入睡。",
        "neck_relax_3min":  "久坐肩颈紧很常见。先做几分钟轻柔活动。",
        "knee_friendly_move": "膝盖不舒服，我们选几个坐着就能做的动作。",
        "gentle_stretch_5min": "想动一动很好！五分钟轻量拉伸，不会太累。",
        "breathing_60s":    "先不用分析原因，让身体和情绪都慢下来一点。",
    }
    reply = replies.get(skill_id, "我听到了。我们先做一个很小、没有压力的动作。")

    return AIUnderstandResponse(
        id=_id("ai"),
        inputId=inp.id,
        detectedState=DetectedState(mood=mood, bodySignals=body_signals),
        reply=reply,
        suggestedAction=action,
        safetyDisclaimer=SAFETY_DISCLAIMER,
        createdAt=_now(),
    )


def _mock_calm_script(action: SuggestedAction) -> CalmScript:
    skill_id = action.skillId or _match_skill(action.title)
    skill = get_skill(skill_id)
    if skill and skill["type"] == "calm":
        prompts = [
            CalmPrompt(
                id=s["step_id"],
                text=s["instruction_zh"],
                seconds=s["duration_seconds"],
            )
            for s in skill["steps"]
        ]
        return CalmScript(
            id=_id("calm"),
            actionId=action.id,
            title=skill["title_zh"],
            durationSeconds=skill["duration_seconds"],
            tone="quiet",
            prompts=prompts,
            safetyDisclaimer=skill["safety_note_zh"],
        )
    # Generic fallback
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
    skill_id = action.skillId or _match_skill(action.title)
    skill = get_skill(skill_id)
    if skill and skill["type"] == "move":
        steps = [
            ExerciseStep(
                id=s["step_id"],
                instruction=s["instruction_zh"],
                seconds=s["duration_seconds"],
            )
            for s in skill["steps"]
        ]
        return ExercisePlan(
            id=_id("move"),
            actionId=action.id,
            title=skill["title_zh"],
            durationSeconds=skill["duration_seconds"],
            intensity="gentle",
            avoidIf=["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
            steps=steps,
            safetyDisclaimer=skill["safety_note_zh"],
        )
    # Generic fallback
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
    skill_id = action.skillId or ""
    skill = get_skill(skill_id) if skill_id else None
    tmpl = skill["completion_record_template"] if skill else {}

    kind = tmpl.get("kind", "action")
    title = tmpl.get("title", "完成了一次缓一缓" if action.type == "breathe" else "完成了一次轻活动")
    summary = tmpl.get("summary", f"刚刚完成：{action.title}。")
    tags = tmpl.get("tags", [action.type, "low-pressure"])
    mood_tags = tmpl.get("mood_tags", [])
    body_tags = tmpl.get("body_tags", [])
    related_action = tmpl.get("related_action", action.title)

    completion_replies = {
        "breathing_60s":    "已经完成了，刚刚这一分钟做得很好。",
        "night_calm":       "陪着你缓了一会儿，现在感觉好一点了吗？",
        "hot_flash_calm":   "潮热过去了，你处理得很好。",
        "emotion_overload": "情绪缓了一缓，感谢你给自己一点空间。",
        "neck_relax_3min":  "肩颈动了动，是不是轻松一点？",
        "gentle_stretch_5min": "五分钟轻量拉伸完成了，做得很好。",
        "knee_friendly_move": "完成了，你的身体感谢你的温柔对待。",
        "sleep_stretch":    "睡前拉伸完成了，好好睡吧。",
    }
    completion_reply = completion_replies.get(skill_id, "完成了，做得很好。")

    return ActionCompletionResponse(
        id=_id("done"),
        actionId=action.id,
        completedAt=_now(),
        reflectionPrompt="要不要把这次状态简单记下来？",
        completionReply=completion_reply,
        askToRecord=True,
        recordPrompt="要不要把刚刚的状态简单记下来？",
        suggestedRecord=SuggestedRecord(
            mood_tags=mood_tags,
            body_tags=body_tags,
            related_action=related_action,
            summary=summary,
        ),
        userOptions=["save", "edit", "do_not_save"],
        proposedRecord=RecordCard(
            id=_id("record"),
            actionId=action.id,
            kind=kind,
            title=title,
            summary=summary,
            tags=tags,
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

技能库（必须从以下 skill_id 中选一个推荐）：
breathing_60s, night_calm, hot_flash_calm, emotion_overload,
neck_relax_3min, gentle_stretch_5min, knee_friendly_move, sleep_stretch
"""


def _claude_understand(inp: UserInput, client) -> AIUnderstandResponse:
    prompt = f"""用户说："{inp.text}"

请以JSON格式回应，必须从 skill_registry 中选一个 skill_id：
{{
  "mood": "tired|anxious|sad|irritated|calm|unclear",
  "bodySignals": ["list of detected body signals"],
  "reply": "你对用户的温暖回应（1-2句，中文）",
  "skill_id": "从 breathing_60s|night_calm|hot_flash_calm|emotion_overload|neck_relax_3min|gentle_stretch_5min|knee_friendly_move|sleep_stretch 中选一个",
  "actionReason": "为什么推荐这个（1句，中文）"
}}

只返回JSON，不要其他文字。"""

    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(message.content[0].text)

    skill_id = data.get("skill_id", _match_skill(inp.text))
    if skill_id not in SKILLS:
        skill_id = _match_skill(inp.text)

    action = _skill_to_action(skill_id)
    if data.get("actionReason"):
        action.reason = data["actionReason"]

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
    # If we have a skill_id, use registry directly — no AI needed
    if action.skillId and get_skill(action.skillId):
        return _mock_calm_script(action)
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
    # If we have a skill_id, use registry directly — no AI needed
    if action.skillId and get_skill(action.skillId):
        return _mock_exercise_plan(action)
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

        use_real = (AI_MODE == "real") and bool(api_key)
        if use_real:
            try:
                import anthropic
                self._client = anthropic.Anthropic(api_key=api_key)
                print(f"[AI] Claude API enabled (model: {os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-6')})")
            except ImportError:
                print("[AI] anthropic package not installed – using mock AI")
        else:
            mode_reason = "AI_MODE=mock" if AI_MODE == "mock" else "no ANTHROPIC_API_KEY"
            print(f"[AI] Using mock AI ({mode_reason})")

        if DEMO_MODE:
            print("[Demo] DEMO_MODE=true – fallback guaranteed on any error")

    @property
    def using_real_ai(self) -> bool:
        return self._client is not None

    def _safe_call(self, fn, fallback_fn, *args):
        """Call fn; on any exception or DEMO_MODE=true-error, call fallback_fn."""
        if self._client:
            try:
                return fn(*args)
            except Exception as e:
                print(f"[AI] Error: {e} – falling back to mock")
        return fallback_fn(*args)

    def understand_user_input(self, inp: UserInput) -> AIUnderstandResponse:
        return self._safe_call(_claude_understand, _mock_understand, inp, self._client) \
            if self._client else _mock_understand(inp)

    def create_calm_script(self, action: SuggestedAction) -> CalmScript:
        return self._safe_call(_claude_calm_script, _mock_calm_script, action, self._client) \
            if self._client else _mock_calm_script(action)

    def create_exercise_plan(self, action: SuggestedAction) -> ExercisePlan:
        return self._safe_call(_claude_exercise_plan, _mock_exercise_plan, action, self._client) \
            if self._client else _mock_exercise_plan(action)

    def complete_action(self, action: SuggestedAction) -> ActionCompletionResponse:
        return _mock_complete(action)
