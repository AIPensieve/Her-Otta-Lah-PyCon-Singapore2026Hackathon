"""
AI service: calls OpenAI API when OPENAI_API_KEY is set,
otherwise falls back to deterministic mock responses.

DEMO_MODE=true  → always fallback to mock on any error
AI_MODE=mock    → skip OpenAI even if key is set
AI_MODE=real    → try OpenAI, fallback to mock
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

SAFETY_DISCLAIMER_ZH = "这只是根据记录整理，不是医学诊断。"
SAFETY_DISCLAIMER_EN = "This is based on your records only, not medical advice."
SAFETY_DISCLAIMER = SAFETY_DISCLAIMER_ZH


def _is_english(locale: str | None) -> bool:
    return locale in ("en", "en-SG")


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


_SKILL_EN: dict[str, dict] = {
    "breathing_60s":      {"title": "1-Min Slow Breathing",        "reason": "No need to figure it out — let's just slow down together."},
    "night_calm":         {"title": "Night Calm — 3 Min",          "reason": "I'm right here with you. Let's take it slow."},
    "hot_flash_calm":     {"title": "Hot Flash Relief",            "reason": "Let your body settle. This will pass."},
    "emotion_overload":   {"title": "60s Breathe Through It",      "reason": "You don't have to figure anything out right now. Just breathe."},
    "neck_relax_3min":    {"title": "3-Min Neck & Shoulder Relief","reason": "A few gentle movements to ease that tension."},
    "gentle_stretch_5min":{"title": "5-Min Gentle Stretch",        "reason": "Five minutes of gentle movement — no pressure at all."},
    "knee_friendly_move": {"title": "Knee-Friendly Movement",      "reason": "Seated gentle moves that work for your knees."},
    "sleep_stretch":      {"title": "Bedtime Stretch",             "reason": "Ease into rest with a few gentle stretches."},
}


def _skill_to_action(skill_id: str, locale: str | None = None) -> SuggestedAction:
    skill = get_skill(skill_id)
    if not skill:
        skill = SKILLS[_DEFAULT_SKILL_ID]
    action_type = "breathe" if skill["type"] == "calm" else "move"
    duration_min = max(1, skill["duration_seconds"] // 60)
    en = _is_english(locale)
    en_meta = _SKILL_EN.get(skill_id, {})
    return SuggestedAction(
        id=_id("action"),
        type=action_type,
        title=en_meta.get("title", skill["title_zh"]) if en else skill["title_zh"],
        reason=en_meta.get("reason", skill["description_zh"]) if en else skill["description_zh"],
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
    locale = inp.locale
    en = _is_english(locale)
    action = _skill_to_action(skill_id, locale)

    replies_zh = {
        "emotion_overload": "听起来今天情绪很满。我们先不急着分析，可以先缓一缓。",
        "night_calm":       "夜里醒来挺难受的。我在这里陪着你，先慢慢缓一缓。",
        "hot_flash_calm":   "潮热后身体需要一点时间平静。我们先缓一缓。",
        "sleep_stretch":    "睡前放松一下身体，会更容易入睡。",
        "neck_relax_3min":  "久坐肩颈紧很常见。先做几分钟轻柔活动。",
        "knee_friendly_move": "膝盖不舒服，我们选几个坐着就能做的动作。",
        "gentle_stretch_5min": "想动一动很好！五分钟轻量拉伸，不会太累。",
        "breathing_60s":    "先不用分析原因，让身体和情绪都慢下来一点。",
    }
    replies_en = {
        "emotion_overload": "I hear you. Let's not rush to analyze — just breathe together first.",
        "night_calm":       "Hard to wake up at night like that. I'm right here with you.",
        "hot_flash_calm":   "Your body needs a moment to settle after a hot flash. Let's help it along.",
        "sleep_stretch":    "A little stretch before bed makes it much easier to drift off.",
        "neck_relax_3min":  "Neck tension from sitting too long is so common. A few gentle moves will help.",
        "knee_friendly_move": "Knee discomfort — let's choose seated moves that are easy on your joints.",
        "gentle_stretch_5min": "Love that you want to move! Five minutes, no pressure at all.",
        "breathing_60s":    "I hear you. Let's just slow down together — no need to figure anything out right now.",
    }
    replies = replies_en if en else replies_zh
    fallback = "I hear you. Let's try one small, gentle thing together." if en else "我听到了。我们先做一个很小、没有压力的动作。"
    reply = replies.get(skill_id, fallback)
    disclaimer = SAFETY_DISCLAIMER_EN if en else SAFETY_DISCLAIMER_ZH

    return AIUnderstandResponse(
        id=_id("ai"),
        inputId=inp.id,
        detectedState=DetectedState(mood=mood, bodySignals=body_signals),
        reply=reply,
        suggestedAction=action,
        safetyDisclaimer=disclaimer,
        createdAt=_now(),
    )


def _mock_calm_script(action: SuggestedAction, locale: str | None = None) -> CalmScript:
    skill_id = action.skillId or _match_skill(action.title)
    en = _is_english(locale or action.locale if hasattr(action, "locale") else None)
    skill = get_skill(skill_id)
    disclaimer = SAFETY_DISCLAIMER_EN if en else SAFETY_DISCLAIMER_ZH
    if skill and skill["type"] == "calm":
        en_meta = _SKILL_EN.get(skill_id, {})
        prompts = [
            CalmPrompt(
                id=s["step_id"],
                text=s.get("instruction_en", s["instruction_zh"]) if en else s["instruction_zh"],
                seconds=s["duration_seconds"],
            )
            for s in skill["steps"]
        ]
        return CalmScript(
            id=_id("calm"),
            actionId=action.id,
            title=en_meta.get("title", skill["title_zh"]) if en else skill["title_zh"],
            durationSeconds=skill["duration_seconds"],
            tone="quiet",
            prompts=prompts,
            safetyDisclaimer=disclaimer,
        )
    # Generic fallback
    prompts_en = [
        CalmPrompt(id="p1", text="Let your shoulders drop. You don't need to answer anything right now.", seconds=15),
        CalmPrompt(id="p2", text="Breathe in slowly… like filling a little space inside.", seconds=15),
        CalmPrompt(id="p3", text="Breathe out… let go of whatever's been tightening.", seconds=15),
        CalmPrompt(id="p4", text="Good. Just like that. Give yourself a little room.", seconds=15),
    ]
    prompts_zh = [
        CalmPrompt(id="p1", text="把肩膀放松一点，先不用回答任何问题。", seconds=15),
        CalmPrompt(id="p2", text="慢慢吸气，像把空气放进身体里。", seconds=15),
        CalmPrompt(id="p3", text="慢慢呼气，把刚才的紧绷放下来。", seconds=15),
        CalmPrompt(id="p4", text="很好，就这样，给自己一点点空间。", seconds=15),
    ]
    return CalmScript(
        id=_id("calm"),
        actionId=action.id,
        title=action.title,
        durationSeconds=60,
        tone="quiet",
        prompts=prompts_en if en else prompts_zh,
        safetyDisclaimer=disclaimer,
    )


def _mock_exercise_plan(action: SuggestedAction, locale: str | None = None) -> ExercisePlan:
    skill_id = action.skillId or _match_skill(action.title)
    en = _is_english(locale or action.locale if hasattr(action, "locale") else None)
    skill = get_skill(skill_id)
    disclaimer = SAFETY_DISCLAIMER_EN if en else SAFETY_DISCLAIMER_ZH
    avoid_en = ["noticeable pain", "dizziness", "chest tightness", "if your doctor advised against exercise"]
    avoid_zh = ["明显疼痛", "头晕", "胸闷", "医生建议避免活动"]
    if skill and skill["type"] == "move":
        en_meta = _SKILL_EN.get(skill_id, {})
        steps = [
            ExerciseStep(
                id=s["step_id"],
                instruction=s.get("instruction_en", s["instruction_zh"]) if en else s["instruction_zh"],
                seconds=s["duration_seconds"],
            )
            for s in skill["steps"]
        ]
        return ExercisePlan(
            id=_id("move"),
            actionId=action.id,
            title=en_meta.get("title", skill["title_zh"]) if en else skill["title_zh"],
            durationSeconds=skill["duration_seconds"],
            intensity="gentle",
            avoidIf=avoid_en if en else avoid_zh,
            steps=steps,
            safetyDisclaimer=disclaimer,
        )
    # Generic fallback
    steps_en = [
        ExerciseStep(id="m1", instruction="Sit or stand comfortably, and slowly roll your shoulders.", seconds=30),
        ExerciseStep(id="m2", instruction="Hands resting on your thighs, slowly lift your head and look ahead.", seconds=30),
        ExerciseStep(id="m3", instruction="Let your arms hang naturally, and gently sway side to side.", seconds=30),
        ExerciseStep(id="m4", instruction="Come to a still. Notice your breath and how your body feels.", seconds=30),
    ]
    steps_zh = [
        ExerciseStep(id="m1", instruction="坐稳或站稳，慢慢转动肩膀。", seconds=30),
        ExerciseStep(id="m2", instruction="双手轻放大腿，慢慢抬头看远处。", seconds=30),
        ExerciseStep(id="m3", instruction="手臂自然下垂，左右轻轻摆动。", seconds=30),
        ExerciseStep(id="m4", instruction="停下来，感受呼吸和身体。", seconds=30),
    ]
    return ExercisePlan(
        id=_id("move"),
        actionId=action.id,
        title=action.title,
        durationSeconds=120,
        intensity="gentle",
        avoidIf=avoid_en if en else avoid_zh,
        steps=steps_en if en else steps_zh,
        safetyDisclaimer=disclaimer,
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
# OpenAI API implementation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_ZH = """\
你是 AI Otter Coach，一个陪伴 45-65 岁更年期/绝经后女性的温暖 AI 伴侣。
你的风格：温暖、平静、不评判、不施压。
你不做医学诊断、不推荐药物、不要求用户做任何事。
所有回应都必须包含声明：这只是根据记录整理，不是医学诊断。
用中文回应。回应要简短（1-3句话）、温暖。

技能库（必须从以下 skill_id 中选一个推荐）：
breathing_60s, night_calm, hot_flash_calm, emotion_overload,
neck_relax_3min, gentle_stretch_5min, knee_friendly_move, sleep_stretch
"""

SYSTEM_PROMPT_EN = """\
You are AI Otter Coach, a warm AI companion for women aged 45-65 going through menopause or post-menopause.
Your tone: warm, calm, non-judgmental, never pressuring.
You do not make medical diagnoses, recommend drugs, or demand anything of the user.
All responses must include this disclaimer: This is based on your records only, not medical advice.
Respond in English. Keep responses short (1-3 sentences), warm, and grounded.

Skill library (must recommend exactly one skill_id from this list):
breathing_60s, night_calm, hot_flash_calm, emotion_overload,
neck_relax_3min, gentle_stretch_5min, knee_friendly_move, sleep_stretch
"""

SYSTEM_PROMPT = SYSTEM_PROMPT_ZH


def _openai_understand(inp: UserInput, client) -> AIUnderstandResponse:
    en = _is_english(inp.locale)
    system = SYSTEM_PROMPT_EN if en else SYSTEM_PROMPT_ZH
    lang_instruction = "Reply in English." if en else "用中文回应。"
    prompt = f"""User said: "{inp.text}"

Respond in JSON. Choose exactly one skill_id from the skill library:
{{
  "mood": "tired|anxious|sad|irritated|calm|unclear",
  "bodySignals": ["list of detected body signals in {'English' if en else 'Chinese'}"],
  "reply": "Your warm response (1-2 sentences, {lang_instruction})",
  "skill_id": "one of breathing_60s|night_calm|hot_flash_calm|emotion_overload|neck_relax_3min|gentle_stretch_5min|knee_friendly_move|sleep_stretch",
  "actionReason": "Why you recommend this (1 sentence, {lang_instruction})"
}}

Return JSON only, no other text."""

    message = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        max_tokens=500,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
    )
    data = json.loads(message.choices[0].message.content)

    skill_id = data.get("skill_id", _match_skill(inp.text))
    if skill_id not in SKILLS:
        skill_id = _match_skill(inp.text)

    action = _skill_to_action(skill_id, inp.locale)
    if data.get("actionReason"):
        action.reason = data["actionReason"]

    disclaimer = SAFETY_DISCLAIMER_EN if en else SAFETY_DISCLAIMER_ZH
    return AIUnderstandResponse(
        id=_id("ai"),
        inputId=inp.id,
        detectedState=DetectedState(
            mood=data.get("mood", "unclear"),
            bodySignals=data.get("bodySignals", []),
        ),
        reply=data.get("reply", "I hear you." if en else "我听到了。"),
        suggestedAction=action,
        safetyDisclaimer=disclaimer,
        createdAt=_now(),
    )


def _openai_calm_script(action: SuggestedAction, client, locale: str | None = None) -> CalmScript:
    # If we have a skill_id, use registry directly — no AI needed
    if action.skillId and get_skill(action.skillId):
        return _mock_calm_script(action, locale)
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
    message = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        max_tokens=400,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
    )
    data = json.loads(message.choices[0].message.content)
    return CalmScript(
        id=_id("calm"),
        actionId=action.id,
        title=data.get("title", action.title),
        durationSeconds=60,
        tone="quiet",
        prompts=[CalmPrompt(**p) for p in data.get("prompts", [])],
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )


def _openai_exercise_plan(action: SuggestedAction, client, locale: str | None = None) -> ExercisePlan:
    # If we have a skill_id, use registry directly — no AI needed
    if action.skillId and get_skill(action.skillId):
        return _mock_exercise_plan(action, locale)
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
    message = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        max_tokens=400,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
    )
    data = json.loads(message.choices[0].message.content)
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
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self._client = None

        use_real = (AI_MODE == "real") and bool(api_key)
        if use_real:
            try:
                import openai
                self._client = openai.OpenAI(api_key=api_key)
                print(f"[AI] OpenAI API enabled (model: {os.getenv('OPENAI_MODEL', 'gpt-4o')})")
            except ImportError:
                print("[AI] openai package not installed – using mock AI")
        else:
            mode_reason = "AI_MODE=mock" if AI_MODE == "mock" else "no OPENAI_API_KEY"
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
        return self._safe_call(_openai_understand, _mock_understand, inp, self._client) \
            if self._client else _mock_understand(inp)

    def create_calm_script(self, action: SuggestedAction) -> CalmScript:
        return self._safe_call(_openai_calm_script, _mock_calm_script, action, self._client) \
            if self._client else _mock_calm_script(action)

    def create_exercise_plan(self, action: SuggestedAction) -> ExercisePlan:
        return self._safe_call(_openai_exercise_plan, _mock_exercise_plan, action, self._client) \
            if self._client else _mock_exercise_plan(action)

    def complete_action(self, action: SuggestedAction) -> ActionCompletionResponse:
        return _mock_complete(action)
