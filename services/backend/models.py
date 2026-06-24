"""
Pydantic models that mirror packages/shared-types/src/index.ts.
Keep in sync with the TypeScript contract.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


LocaleCode = Literal["zh-SG", "en-SG", "mixed"]


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


class ActionCompletionResponse(BaseModel):
    id: str
    actionId: str
    completedAt: str
    reflectionPrompt: str
    proposedRecord: RecordCard
    safetyDisclaimer: str


# Device types

class DeviceState(BaseModel):
    deviceId: str = "otter-001"
    connection: Literal["disconnected", "connecting", "connected"] = "disconnected"
    batteryLevel: int = 100
    screenState: Literal["idle", "listening", "breathing", "moving", "sleeping"] = "idle"
    lightMode: Literal["off", "soft", "breathing", "alert"] = "soft"
    volume: int = 50
    lastSeenAt: Optional[str] = None
