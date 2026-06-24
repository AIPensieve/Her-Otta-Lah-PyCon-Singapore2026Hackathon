"""
Action Recommender — maps classified intent + signals to a skill.

Loads skills from skill_registry (single source of truth).
Priority order:
  1. Night wake signals → night_calm
  2. Hot flash → hot_flash_calm
  3. Neck/shoulder → neck_relax_3min
  4. Knee → knee_friendly_move
  5. Sleep stretch → sleep_stretch
  6. Emotional overwhelm → emotion_overload
  7. Explicit move request → gentle_stretch_5min
  8. Default → breathing_60s

Optionally enriched by RAG context (passed in from rag_pipeline).
"""
from __future__ import annotations
import sys
import os

# Allow running from project root or this directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from .schemas import ClassifiedIntent, IntentType, RecommendedAction, ActionCategory

# Import skill registry (flat file alongside main.py)
try:
    from skill_registry import get_skill, SKILLS  # type: ignore
except ImportError:
    SKILLS: dict = {}
    def get_skill(skill_id: str) -> dict | None:  # type: ignore
        return None


# ---------------------------------------------------------------------------
# Signal → skill mapping (ordered by priority)
# ---------------------------------------------------------------------------

_SIGNAL_RULES: list[tuple[list[str], str]] = [
    (["sleep_change", "night_wake"],        "night_calm"),
    (["hot_flash"],                         "hot_flash_calm"),
    (["neck_tension"],                      "neck_relax_3min"),
    (["knee_discomfort"],                   "knee_friendly_move"),
    (["anxious", "irritated", "sad"],       "emotion_overload"),
    (["tiredness"],                         "breathing_60s"),
]

_INTENT_RULES: dict[str, str] = {
    IntentType.night_wake:     "night_calm",
    IntentType.action_request: "gentle_stretch_5min",
    IntentType.check_in:       "breathing_60s",
    IntentType.mood_record:    "breathing_60s",
}

_DEFAULT_SKILL = "breathing_60s"


def _pick_skill(intent: ClassifiedIntent) -> str:
    all_signals = intent.body_signals + intent.mood_signals

    # Intent-level override first
    if intent.intent == IntentType.night_wake:
        return "night_calm"

    # Signal-based matching
    for signal_list, skill_id in _SIGNAL_RULES:
        if any(sig in all_signals for sig in signal_list):
            return skill_id

    # Intent fallback
    return _INTENT_RULES.get(intent.intent, _DEFAULT_SKILL)


def recommend(intent: ClassifiedIntent, rag_hint: str | None = None) -> RecommendedAction | None:
    """
    Returns a RecommendedAction, or None if intent is emergency.

    rag_hint: optional extra context string from RAG retrieval,
              used to refine the reason text.
    """
    if intent.intent == IntentType.emergency:
        return None

    skill_id = _pick_skill(intent)

    # Prefer rag_hint skill override if it matches a known skill
    if rag_hint and rag_hint in SKILLS:
        skill_id = rag_hint

    skill = get_skill(skill_id) or {}
    category = ActionCategory.calm if skill.get("type") == "calm" else ActionCategory.move

    reason_zh = skill.get("description_zh", "先做一个低压力的小行动。")
    if rag_hint and rag_hint not in SKILLS:
        # rag_hint is extra context text, not a skill_id
        reason_zh = f"{reason_zh} ({rag_hint[:60]})"

    return RecommendedAction(
        skill_id=skill_id,
        action_category=category,
        title_zh=skill.get("title_zh", "缓一缓"),
        title_en=skill.get("title_en", "Take a break"),
        reason_zh=reason_zh,
        duration_seconds=skill.get("duration_seconds", 60),
        pressure_level="very_low",
        alternatives=["skip", "change", "later"],
    )
