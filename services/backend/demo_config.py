"""
Demo configuration — read from environment or .env.
DEMO_MODE=true  → guaranteed stable; always fallback to mock on any error
AI_MODE=mock    → keyword rules only
AI_MODE=real    → try Claude API, fallback to mock on timeout/error
"""
import os

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
AI_MODE: str = os.getenv("AI_MODE", "mock")   # "mock" | "real"
