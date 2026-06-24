"""
Pydantic schemas for the modular AI pipeline.

These types are used by intent_classifier, action_recommender,
record_card_generator, exercise_plan_generator, calm_script_generator,
and safety_guard. They intentionally mirror the top-level models.py
so either layer can be used independently.
"""
from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class IntentType(str, Enum):
    mood_record      = "mood_record"       # user sharing how they feel
    action_request   = "action_request"    # user wants to do something
    check_in         = "check_in"          # quick status update
    night_wake       = "night_wake"        # woke up at night
    emergency        = "emergency"         # needs human help


class SafetyLevel(str, Enum):
    normal    = "normal"
    elevated  = "elevated"     # mentions medication, medical term → add disclaimer
    emergency = "emergency"    # self-harm, acute chest pain → redirect to humans


class ActionCategory(str, Enum):
    calm  = "calm"    # breathing, meditation, night companion
    move  = "move"    # gentle exercise, stretching
    none  = "none"    # record-only, no action needed


class Locale(str, Enum):
    zh      = "zh"
    en      = "en"
    mixed   = "mixed"


# ---------------------------------------------------------------------------
# Input / detection
# ---------------------------------------------------------------------------

class ClassifiedIntent(BaseModel):
    intent: IntentType
    locale: Locale
    body_signals: list[str] = Field(default_factory=list)
    mood_signals: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)
    raw_text: str


class SafetyCheckResult(BaseModel):
    level: SafetyLevel
    allowed: bool
    flagged_terms: list[str] = Field(default_factory=list)
    disclaimer: str = "这只是根据记录整理，不是医学诊断。"
    redirect_message: Optional[str] = None


# ---------------------------------------------------------------------------
# Action recommendation
# ---------------------------------------------------------------------------

class RecommendedAction(BaseModel):
    skill_id: str
    action_category: ActionCategory
    title_zh: str
    title_en: str
    reason_zh: str
    duration_seconds: int
    pressure_level: str = "very_low"
    alternatives: list[str] = Field(default_factory=lambda: ["skip", "change", "later"])


# ---------------------------------------------------------------------------
# Record card
# ---------------------------------------------------------------------------

class RecordCardDraft(BaseModel):
    kind: str = "mixed"                  # body | mood | action | mixed
    title: str
    summary: str
    body_tags: list[str] = Field(default_factory=list)
    mood_tags: list[str] = Field(default_factory=list)
    action_tag: Optional[str] = None
    safety_disclaimer: str = "这只是根据记录整理，不是医学诊断。"


# ---------------------------------------------------------------------------
# Exercise plan
# ---------------------------------------------------------------------------

class ExerciseStepSchema(BaseModel):
    step_id: str
    instruction_zh: str
    instruction_en: str
    duration_seconds: int
    screen_state: str = "exercise_countdown"


class ExercisePlanSchema(BaseModel):
    skill_id: str
    title_zh: str
    title_en: str
    total_duration_seconds: int
    intensity: str = "gentle"
    avoid_if: list[str] = Field(default_factory=lambda: [
        "明显疼痛", "头晕", "胸闷", "医生建议避免活动",
        "obvious pain", "dizziness", "chest tightness",
    ])
    steps: list[ExerciseStepSchema]
    safety_note_zh: str = "这只是根据记录整理，不是医学诊断。"
    safety_note_en: str = "This is based on your records only, not medical advice."


# ---------------------------------------------------------------------------
# Calm script
# ---------------------------------------------------------------------------

class CalmPromptSchema(BaseModel):
    step_id: str
    instruction_zh: str
    instruction_en: str
    duration_seconds: int
    screen_state: str = "breathing"


class CalmScriptSchema(BaseModel):
    skill_id: str
    title_zh: str
    title_en: str
    total_duration_seconds: int
    tone: str = "quiet"         # quiet | warm | sleepy
    prompts: list[CalmPromptSchema]
    safety_note_zh: str = "这只是根据记录整理，不是医学诊断。"
    safety_note_en: str = "This is based on your records only, not medical advice."


# ---------------------------------------------------------------------------
# Pipeline response (full understand → recommend → safety)
# ---------------------------------------------------------------------------

class PipelineResponse(BaseModel):
    intent: ClassifiedIntent
    safety: SafetyCheckResult
    action: Optional[RecommendedAction] = None
    reply_zh: str
    reply_en: str
    rag_context_used: bool = False
