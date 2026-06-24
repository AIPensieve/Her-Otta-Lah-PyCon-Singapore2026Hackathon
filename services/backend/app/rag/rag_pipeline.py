"""
RAG Pipeline — orchestrates retrieval-augmented generation.

Flow:
  1. Retrieve relevant document chunks (retrieval.py)
  2. Compose a context-aware prompt
  3. Call OpenAI API (if available) or return rule-based fallback

Used by the intent understanding step when the user's query touches topics
in the knowledge base (menopause symptoms, exercise safety, calm techniques).

DEMO NOTE: sample_docs/ contains illustrative snippets only.
Production requires properly licensed medical content.
"""
from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from .retrieval import retrieve_text

DISCLAIMER = "这只是根据记录整理，不是医学诊断。"


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

_SYSTEM = """\
你是 AI Otter Coach，陪伴 45–65 岁更年期/绝经后女性的温暖 AI 伴侣。
风格：温暖、平静、不评判。
规则：不做医学诊断，不推荐药物，不施压。
所有回应末尾必须加：这只是根据记录整理，不是医学诊断。"""

_RAG_TEMPLATE = """\
以下是从知识库检索到的相关内容（仅供参考，不作为医学建议）：
---
{context}
---

用户说："{user_text}"

请用温暖、简短的中文（1–3句）回应用户，并推荐一个合适的小行动。
回应末尾附上：这只是根据记录整理，不是医学诊断。"""


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def run(user_text: str, client=None) -> dict:
    """
    Run RAG pipeline for a user query.

    Returns:
        {
          "reply": str,               # AI or rule-based response
          "context_used": bool,       # whether RAG context was found
          "context_snippets": [str],  # retrieved chunks
          "rag_hint": str | None,     # skill_id hint from context
        }
    """
    context = retrieve_text(user_text, top_k=3)
    context_used = bool(context)

    # Try OpenAI if available
    if client and context_used:
        try:
            reply = _call_openai(user_text, context, client)
            return {
                "reply": reply,
                "context_used": True,
                "context_snippets": [context],
                "rag_hint": _extract_skill_hint(context),
            }
        except Exception as e:
            print(f"[RAG] OpenAI error: {e} – falling back to rule-based")

    # Rule-based fallback
    reply = _rule_based_reply(user_text, context)
    return {
        "reply": reply,
        "context_used": context_used,
        "context_snippets": [context] if context else [],
        "rag_hint": _extract_skill_hint(context) if context else None,
    }


def _call_openai(user_text: str, context: str, client) -> str:
    prompt = _RAG_TEMPLATE.format(context=context, user_text=user_text)
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        max_tokens=300,
        
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
    )
    return resp.content[0].text


def _rule_based_reply(user_text: str, context: str) -> str:
    lower = user_text.lower()
    if any(t in lower for t in ["潮热", "热醒", "hot flash"]):
        reply = "潮热后身体需要一点时间平静下来，我们先缓一缓。"
    elif any(t in lower for t in ["夜醒", "睡不好", "insomnia"]):
        reply = "夜里醒来挺难受的。我在这里陪着你，先慢慢缓一缓。"
    elif any(t in lower for t in ["焦虑", "烦", "anxious"]):
        reply = "听起来今天情绪很满。先不急着分析，可以先做一分钟呼吸。"
    elif any(t in lower for t in ["运动", "拉伸", "exercise"]):
        reply = "我们来做几分钟轻柔活动，随时可以停下来。"
    else:
        reply = "我听到了。先做一个很小、没有压力的动作。"
    return f"{reply}\n\n*{DISCLAIMER}*"


def _extract_skill_hint(context: str) -> str | None:
    """
    Naive skill hint extraction from context text.
    Returns a skill_id string if a known skill keyword appears.
    """
    skill_keywords = {
        "night_calm":       ["夜醒", "night", "睡眠"],
        "hot_flash_calm":   ["潮热", "hot flash", "体温"],
        "breathing_60s":    ["呼吸", "breathing", "breath"],
        "gentle_stretch_5min": ["拉伸", "stretch", "运动"],
    }
    lower = context.lower()
    for skill_id, keywords in skill_keywords.items():
        if any(kw in lower for kw in keywords):
            return skill_id
    return None
