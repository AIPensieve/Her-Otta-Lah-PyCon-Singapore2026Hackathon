"""
Safety Guard — screens user text before AI processing.

Three levels:
  normal    → proceed normally, append standard disclaimer
  elevated  → add stronger disclaimer, avoid medical framing
  emergency → do not process further, return human-help redirect

Rules are deliberately conservative: when in doubt, escalate.
No medical diagnosis, no drug recommendations.
"""
from __future__ import annotations
import re
from .schemas import SafetyLevel, SafetyCheckResult

DISCLAIMER = "这只是根据记录整理，不是医学诊断。"

# Terms that signal acute emergency — redirect to humans immediately
_EMERGENCY_ZH = [
    "自杀", "想死", "不想活", "结束生命",
    "胸痛", "心脏", "心肌梗", "脑卒中", "中风",
    "昏倒", "失去意识", "摔倒", "骨折",
]
_EMERGENCY_EN = [
    "suicide", "kill myself", "end my life", "don't want to live",
    "chest pain", "heart attack", "stroke", "collapsed", "unconscious",
    "broken bone", "fracture",
]

# Terms that need stronger disclaimer but allow continuation
_ELEVATED_ZH = [
    "药", "吃药", "停药", "剂量", "处方",
    "激素", "雌激素", "孕激素", "补充剂",
    "诊断", "检查结果", "化验", "血压", "血糖",
    "医生说", "医院", "症状",
]
_ELEVATED_EN = [
    "medication", "medicine", "dosage", "prescription", "supplement",
    "hormone", "estrogen", "progesterone",
    "diagnose", "diagnosis", "lab result", "blood pressure", "blood sugar",
    "doctor said", "hospital", "symptom",
]

_REDIRECT_MESSAGE = (
    "我听到了，这听起来很重要。请马上联系你信任的家人、朋友或医疗专业人员。"
    " / I hear you. Please reach out to someone you trust or a healthcare professional right away."
)


def check(text: str) -> SafetyCheckResult:
    lower = text.lower()
    flagged: list[str] = []

    # Emergency check (highest priority)
    for term in _EMERGENCY_ZH + _EMERGENCY_EN:
        if term in lower:
            flagged.append(term)

    if flagged:
        return SafetyCheckResult(
            level=SafetyLevel.emergency,
            allowed=False,
            flagged_terms=flagged,
            disclaimer=DISCLAIMER,
            redirect_message=_REDIRECT_MESSAGE,
        )

    # Elevated check
    elevated_flagged: list[str] = []
    for term in _ELEVATED_ZH + _ELEVATED_EN:
        if term in lower:
            elevated_flagged.append(term)

    if elevated_flagged:
        return SafetyCheckResult(
            level=SafetyLevel.elevated,
            allowed=True,
            flagged_terms=elevated_flagged,
            disclaimer=DISCLAIMER + " 如有医疗相关问题，请咨询医生。",
        )

    return SafetyCheckResult(
        level=SafetyLevel.normal,
        allowed=True,
        disclaimer=DISCLAIMER,
    )


def apply_disclaimer(text: str, level: SafetyLevel) -> str:
    """Append appropriate disclaimer to any AI-generated output."""
    if level == SafetyLevel.normal:
        return f"{text}\n\n*{DISCLAIMER}*"
    if level == SafetyLevel.elevated:
        return f"{text}\n\n*{DISCLAIMER} 如有医疗相关问题，请咨询医生。*"
    return _REDIRECT_MESSAGE
