"""
Pydantic models that mirror packages/shared-types/src/index.ts.
Keep in sync with the TypeScript contract.
"""
from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel


LocaleCode = Literal["zh-SG", "en-SG", "mixed"]

DeviceScreenState = Literal[
    "idle", "listening", "thinking", "breathing", "moving", "sleeping",
    "night_calm", "hot_flash_calm", "exercise_countdown", "next_move",
    "reminder", "location_confirm", "location_sent", "low_battery"
]


class UserInput(BaseModel):
    id: str
    userId: Optional[str] = None
    text: str
    inputMode: Literal["typed", "voice-simulated", "voice"]
    locale: LocaleCode
    createdAt: str


class SuggestedAction(BaseModel):
    id: str
    type: Literal["breathe", "move", "record", "talk"]
    title: str
    reason: str
    estimatedMinutes: int
    pressureLevel: Literal["very-low", "low", "medium"]
    primaryCta: Literal["start"] = "start"
    alternatives: list[Literal["skip", "change", "later"]]
    skillId: Optional[str] = None          # links to skill_registry key


class DetectedState(BaseModel):
    mood: Optional[Literal["tired", "anxious", "sad", "irritated", "calm", "unclear"]] = None
    bodySignals: list[str] = []
    riskLevel: Literal["normal", "needs-human-help"] = "normal"
    language: LocaleCode = "mixed"


class AIUnderstandResponse(BaseModel):
    id: str
    inputId: str
    detectedState: DetectedState
    reply: str
    suggestedAction: SuggestedAction
    safetyDisclaimer: str
    createdAt: str


class ExerciseStep(BaseModel):
    id: str
    instruction: str
    seconds: int


class ExercisePlan(BaseModel):
    id: str
    actionId: str
    title: str
    durationSeconds: int
    intensity: Literal["gentle", "easy"]
    avoidIf: list[str]
    steps: list[ExerciseStep]
    safetyDisclaimer: str


class CalmPrompt(BaseModel):
    id: str
    text: str
    seconds: int


class CalmScript(BaseModel):
    id: str
    actionId: str
    title: str
    durationSeconds: int
    tone: Literal["warm", "quiet", "sleepy"]
    prompts: list[CalmPrompt]
    safetyDisclaimer: str


class CompletedAction(BaseModel):
    type: Literal["breathe", "move", "record", "talk"]
    title: str
    durationSeconds: int


class RecordCard(BaseModel):
    id: str
    userId: Optional[str] = None
    sourceInputId: Optional[str] = None
    actionId: Optional[str] = None
    kind: Literal["body", "mood", "action", "mixed"]
    title: str
    summary: str
    tags: list[str]
    completedAction: Optional[CompletedAction] = None
    createdAt: str
    safetyDisclaimer: str


class SuggestedRecord(BaseModel):
    type: str = "mood_body_record"
    mood_tags: list[str] = []
    body_tags: list[str] = []
    related_action: str = ""
    summary: str = ""


class ActionCompletionResponse(BaseModel):
    id: str
    actionId: str
    completedAt: str
    reflectionPrompt: str
    proposedRecord: RecordCard
    safetyDisclaimer: str
    # Extended fields for Demo Mode
    completionReply: Optional[str] = None
    askToRecord: bool = True
    recordPrompt: str = "要不要把今天的状态简单记下来？"
    suggestedRecord: Optional[SuggestedRecord] = None
    userOptions: list[str] = ["save", "edit", "do_not_save"]


# Device types

class DeviceState(BaseModel):
    deviceId: str = "otter-001"
    connection: Literal["disconnected", "connecting", "connected"] = "disconnected"
    batteryLevel: int = 100
    screenState: DeviceScreenState = "idle"
    lightMode: Literal["off", "soft", "breathing", "alert", "night", "pulse"] = "soft"
    volume: int = 50
    lastSeenAt: Optional[str] = None


class DeviceStateCommand(BaseModel):
    """Unified device state command sent to ESP32 / frontend simulator."""
    type: Literal["DEVICE_STATE"] = "DEVICE_STATE"
    state: DeviceScreenState
    screen_text: str = ""
    duration_seconds: int = 0
    voice_text: Optional[str] = None
    light_mode: str = "soft"
    vibration: Literal["none", "short", "long", "double"] = "none"
