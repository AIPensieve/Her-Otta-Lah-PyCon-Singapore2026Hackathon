"""
Intent Classifier — first step in the AI pipeline.

Classifies user free-text (Chinese / English / mixed) into:
  - intent type (mood_record, action_request, check_in, night_wake, emergency)
  - detected body signals
  - detected mood signals
  - language / locale

Uses rule-based classification by default. When OPENAI_API_KEY is set
and AI_MODE=real, delegates to OpenAI for edge cases.
"""
from __future__ import annotations
import os
import re
from .schemas import ClassifiedIntent, IntentType, Locale

# ---------------------------------------------------------------------------
# Keyword signal tables
# ---------------------------------------------------------------------------

_BODY_SIGNALS: list[tuple[list[str], str]] = [
    (["膝盖", "knee", "腿痛", "leg pain"],                 "knee_discomfort"),
    (["肩颈", "脖子", "neck", "shoulder", "肩膀"],          "neck_tension"),
    (["睡不好", "夜醒", "失眠", "insomnia", "night wake"],  "sleep_change"),
    (["潮热", "热醒", "出汗", "hot flash", "flush"],        "hot_flash"),
    (["累", "疲惫", "tired", "fatigue", "exhausted"],       "tiredness"),
    (["头痛", "头晕", "headache", "dizzy"],                 "head_discomfort"),
    (["心跳", "心悸", "palpitation", "heart racing"],       "palpitation"),
    (["腹胀", "胃", "bloat", "stomach"],                    "digestive"),
]

_MOOD_SIGNALS: list[tuple[list[str], str]] = [
    (["焦虑", "担心", "worried", "anxious", "anxiety"],     "anxious"),
    (["烦", "烦躁", "irritated", "frustrated"],             "irritated"),
    (["想哭", "难过", "sad", "upset", "低落"],              "sad"),
    (["累", "没精神", "tired", "low energy"],               "tired"),
    (["睡不好", "睡眠", "sleep"],                           "sleep_related"),
    (["开心", "好多了", "happy", "better", "relieved"],     "positive"),
]

_NIGHT_WAKE: list[str] = [
    "夜醒", "夜里醒", "半夜醒", "夜里", "凌晨", "睡不着",
    "night wake", "woke up", "midnight", "can't sleep",
]

_ACTION_REQUEST: list[str] = [
    "想做", "想动", "想运动", "帮我", "带我", "怎么做", "推荐",
    "exercise", "move", "stretch", "relax", "breathe",
    "want to", "help me", "guide me",
]


def _detect_locale(text: str) -> Locale:
    has_cjk = bool(re.search(r'[一-鿿]', text))
    has_latin = bool(re.search(r'[a-zA-Z]{3,}', text))
    if has_cjk and has_latin:
        return Locale.mixed
    if has_cjk:
        return Locale.zh
    return Locale.en


def _detect_body_signals(text: str) -> list[str]:
    lower = text.lower()
    return [
        signal
        for keywords, signal in _BODY_SIGNALS
        if any(kw in lower for kw in keywords)
    ]


def _detect_mood_signals(text: str) -> list[str]:
    lower = text.lower()
    return [
        signal
        for keywords, signal in _MOOD_SIGNALS
        if any(kw in lower for kw in keywords)
    ]


def _classify_intent(text: str) -> tuple[IntentType, float]:
    lower = text.lower()

    # Emergency signals override everything
    emergency_terms = ["自杀", "想死", "胸痛", "心脏", "昏倒", "suicide", "chest pain"]
    if any(t in lower for t in emergency_terms):
        return IntentType.emergency, 0.95

    # Night wake context
    if any(t in lower for t in _NIGHT_WAKE):
        return IntentType.night_wake, 0.85

    # Explicit action request
    if any(t in lower for t in _ACTION_REQUEST):
        return IntentType.action_request, 0.80

    # Short check-in (< 10 words, mostly mood/body tags)
    word_count = len(text.split())
    if word_count <= 6:
        return IntentType.check_in, 0.70

    # Default: user is sharing mood/body — record it
    return IntentType.mood_record, 0.65


def classify(text: str) -> ClassifiedIntent:
    """
    Classify user input. Returns ClassifiedIntent.
    Pure Python, no external dependencies.
    """
    intent, confidence = _classify_intent(text)
    return ClassifiedIntent(
        intent=intent,
        locale=_detect_locale(text),
        body_signals=_detect_body_signals(text),
        mood_signals=_detect_mood_signals(text),
        confidence=confidence,
        raw_text=text,
    )


def classify_with_openai(text: str, client) -> ClassifiedIntent:
    """
    OpenAI-powered fallback for ambiguous cases.
    Falls back to rule-based classify() on any error.
    """
    import json
    try:
        prompt = f"""Classify this user message from a menopause wellness app:
"{text}"

Return JSON only:
{{
  "intent": "mood_record|action_request|check_in|night_wake|emergency",
  "body_signals": ["list of physical symptoms detected"],
  "mood_signals": ["list of emotional signals detected"],
  "locale": "zh|en|mixed",
  "confidence": 0.0-1.0
}}"""
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            max_tokens=300,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
        )
        data = json.loads(resp.content[0].text)
        return ClassifiedIntent(
            intent=IntentType(data.get("intent", "mood_record")),
            locale=Locale(data.get("locale", "mixed")),
            body_signals=data.get("body_signals", []),
            mood_signals=data.get("mood_signals", []),
            confidence=float(data.get("confidence", 0.75)),
            raw_text=text,
        )
    except Exception:
        return classify(text)
