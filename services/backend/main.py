"""
AI Otter Coach – Python Backend
================================
Run:  uvicorn main:app --reload --host 0.0.0.0 --port 8000

Endpoints
---------
POST  /api/ai/understand          UserInput → AIUnderstandResponse
POST  /api/ai/calm-script         SuggestedAction → CalmScript
POST  /api/ai/exercise-plan       SuggestedAction → ExercisePlan
POST  /api/ai/complete-action     SuggestedAction → ActionCompletionResponse

GET   /api/records                → RecordCard[]
POST  /api/records                RecordCard → RecordCard
DELETE /api/records/{id}          → {ok: bool}

GET   /api/device/state           → DeviceState
POST  /api/device/command         DeviceCommand dict → {sent: bool}

WS    /ws/device                  ESP32 connects here
WS    /ws/frontend                Frontend connects for live device state
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    UserInput, SuggestedAction, RecordCard, DeviceState
)
from ai_service import AiService
from record_store import RecordStore
from device_bridge import device_bridge
from skill_registry import all_skills, get_skill, normalize_skill_id
from demo_config import DEMO_MODE, AI_MODE


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Server] AI Otter Coach backend starting…")
    print(f"[Server] AI mode: {'Claude API' if ai.using_real_ai else 'Mock'}")
    yield
    print("[Server] Shutting down")


app = FastAPI(title="AI Otter Coach Backend", version="0.1.0", lifespan=lifespan)

cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai = AiService()
records = RecordStore(db_path=os.getenv("DB_PATH", "./otter_records.db"))

SAFETY_DISCLAIMER = "这只是根据记录整理，不是医学诊断。"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _model_dump(model):
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def _locale_from_api(language: str | None) -> str:
    if language == "zh":
        return "zh-SG"
    if language == "en":
        return "en-SG"
    return "mixed"


def _api_language_from_locale(locale: str | None) -> str:
    if locale == "zh-SG":
        return "zh"
    if locale == "en-SG":
        return "en"
    return "zh_en_mixed"


def _frontend_action_type(action_type: str | None) -> str:
    return "move" if action_type == "move" else "breathe"


def _api_action_type(action_type: str | None) -> str:
    if action_type == "move":
        return "move"
    if action_type in ("record", "talk", "none"):
        return "none"
    return "calm"


def _screen_state_for_skill(skill_id: str | None, action_type: str) -> str:
    if skill_id in ("heel_drop_game_60s", "neck_relax_game_60s"):
        return "playful_timer"
    skill = get_skill(skill_id or "")
    if skill:
        first_step = (skill.get("steps") or [{}])[0]
        screen_state = first_step.get("screen_state")
        if screen_state == "night_calm":
            return "night_companion"
        if screen_state == "exercise_countdown":
            return "movement_timer"
        if screen_state == "hot_flash_calm":
            return "hot_flash_calm"
    return "movement_timer" if action_type == "move" else "calm_guidance"


def _game_flow_contract(skill_id: str | None) -> dict:
    if skill_id == "heel_drop_game_60s":
        return {
            "game_id": "heel_drop_game_60s",
            "movement": "supported_heel_drops",
            "motion_detection": {
                "primary_motion": "supported_heel_drop",
                "fallback_input": "space_key",
                "sensor_signal": "imu_vertical_pulse",
                "minimum_reps": 4,
                "max_reps_target": 12,
                "safety_stop_signals": [
                    "dizziness",
                    "chest_tightness",
                    "sharp_pain",
                    "loss_of_balance",
                ],
            },
            "scoring": {
                "score_unit": "gentle_rep",
                "points_per_motion": 1,
                "target_score": 12,
                "minimum_success_score": 4,
                "pressure_level": "low",
            },
            "completion": {
                "duration_seconds": 60,
                "success_condition": "time_elapsed_or_user_stops_comfortably",
                "record_action_on_finish": True,
                "completion_states": ["completed", "skipped", "changed", "later", "safety_stopped"],
            },
            "sensor_events": {
                "expected_from_hardware": ["game_started", "motion_detected", "game_completed", "safety_stop"],
                "optional_signals": ["imu_vertical_pulse", "button_press", "heart_rate_high", "user_stop"],
                "app_to_hardware": ["start_countdown", "show_score", "play_voice", "soft_vibration"],
            },
        }
    if skill_id == "neck_relax_game_60s":
        return {
            "game_id": "neck_relax_game_60s",
            "movement": "gentle_neck_relax",
            "motion_detection": {
                "primary_motion": "small_neck_shoulder_motion",
                "fallback_input": "button_press",
                "sensor_signal": "imu_tilt_or_button_press",
                "minimum_reps": 3,
                "max_reps_target": 8,
                "safety_stop_signals": [
                    "dizziness",
                    "chest_tightness",
                    "sharp_pain",
                    "loss_of_balance",
                ],
            },
            "scoring": {
                "score_unit": "gentle_motion",
                "points_per_motion": 1,
                "target_score": 8,
                "minimum_success_score": 3,
                "pressure_level": "low",
            },
            "completion": {
                "duration_seconds": 60,
                "success_condition": "time_elapsed_or_user_stops_comfortably",
                "record_action_on_finish": True,
                "completion_states": ["completed", "skipped", "changed", "later", "safety_stopped"],
            },
            "sensor_events": {
                "expected_from_hardware": ["game_started", "motion_detected", "game_completed", "safety_stop"],
                "optional_signals": ["imu_tilt", "button_press", "heart_rate_high", "user_stop"],
                "app_to_hardware": ["start_countdown", "show_score", "play_voice", "soft_vibration"],
            },
        }
    return {}


def _suggested_action_to_api(action: SuggestedAction) -> dict:
    duration_seconds = max(60, action.estimatedMinutes * 60)
    action_type = _api_action_type(action.type)
    skill_id = normalize_skill_id(action.skillId) or action.skillId
    game_contract = _game_flow_contract(skill_id)
    suggested_action = {
        "action_type": action_type,
        "skill_id": skill_id,
        "title": action.title,
        "reason": action.reason,
        "duration_seconds": duration_seconds,
        "pressure_level": "low" if action.pressureLevel == "very-low" else action.pressureLevel,
        "user_options": ["start", *action.alternatives],
        "hardware_directive": {
            "skill_id": skill_id,
            "open_fixed_flow": skill_id,
            "round_screen_state": _screen_state_for_skill(skill_id, action_type),
            "watchface": skill_id,
            "display_text": action.title,
            "voice_text": action.reason,
            "countdown_seconds": duration_seconds,
            "effects": {
                "light": "playful_soft" if game_contract else "soft",
                "breathing_light": action_type == "calm",
                "vibration": "score_soft" if game_contract else "none",
            },
        },
    }
    return {**suggested_action, **game_contract}


def _understand_to_api(resp, user_text: str, locale: str | None = None) -> dict:
    data = _model_dump(resp)
    detected = data.get("detectedState", {})
    action = resp.suggestedAction
    body_state = detected.get("bodySignals", [])
    mood = detected.get("mood")
    return {
        "intent": "exercise_request" if action.type == "move" else "mood_body_record",
        "language": _api_language_from_locale(locale or detected.get("language")),
        "raw_language": locale or detected.get("language", "mixed"),
        "user_text": user_text,
        "reply_text": data.get("reply", ""),
        "pet_voice_text": data.get("reply", ""),
        "record_suggestion": True,
        "suggested_action": _suggested_action_to_api(action),
        "safety_level": "normal",
        "body_state": body_state,
        "mood_state": [mood] if mood else [],
        "wants_record": True,
        "suitable_for_action": True,
        "safety": {"level": "normal", "disclaimer": SAFETY_DISCLAIMER},
        "next_step": "recommend_action",
        "action_recommendation": _suggested_action_to_api(action),
        "display_text": data.get("reply", ""),
    }


def _input_from_new_contract(body: dict) -> UserInput:
    text = str(body.get("text") or body.get("user_text") or "")
    return UserInput(
        id=str(body.get("input_id") or f"input_{uuid4().hex[:8]}"),
        userId=str(body.get("user_id") or "u1"),
        text=text,
        inputMode="voice-simulated",
        locale=_locale_from_api(body.get("language")),
        createdAt=_now(),
    )


def _action_from_new_contract(body: dict) -> SuggestedAction:
    skill_id = normalize_skill_id(body.get("skill_id")) or body.get("skill_id")
    skill = get_skill(skill_id or "")
    action_type = body.get("action_type") or (skill.get("type") if skill else "calm")
    duration_seconds = int(body.get("duration_seconds") or (skill or {}).get("duration_seconds") or 60)
    title = body.get("title") or (skill or {}).get("title_zh") or ("轻柔活动" if action_type == "move" else "缓一缓")
    reason = body.get("reason") or (skill or {}).get("description_zh") or "先做一个低压力的小行动。"
    return SuggestedAction(
        id=str(body.get("action_id") or f"action_{uuid4().hex[:8]}"),
        type=_frontend_action_type(action_type),
        title=title,
        reason=reason,
        estimatedMinutes=max(1, round(duration_seconds / 60)),
        pressureLevel="low",
        primaryCta="start",
        alternatives=["skip", "change", "later"],
        skillId=skill_id,
    )


def _completion_to_api(resp) -> dict:
    data = _model_dump(resp)
    suggested = data.get("suggestedRecord") or {}
    return {
        "completion_reply": data.get("completionReply") or "完成了，做得很好。",
        "ask_to_record": data.get("askToRecord", True),
        "record_prompt": data.get("recordPrompt") or data.get("reflectionPrompt") or "要不要把今天的状态简单记下来？",
        "suggested_record": {
            "type": suggested.get("type", "mood_body_record"),
            "mood_tags": suggested.get("mood_tags", []),
            "body_tags": suggested.get("body_tags", []),
            "related_action": suggested.get("related_action", ""),
            "summary": suggested.get("summary", ""),
        },
        "user_options": data.get("userOptions", ["save", "edit", "do_not_save"]),
    }


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

@app.post("/api/ai/understand")
def understand(inp: UserInput):
    return ai.understand_user_input(inp)


@app.post("/api/ai/calm-script")
def calm_script(action: SuggestedAction):
    return ai.create_calm_script(action)


@app.post("/api/ai/exercise-plan")
def exercise_plan(action: SuggestedAction):
    return ai.create_exercise_plan(action)


@app.post("/api/ai/complete-action")
def complete_action(action: SuggestedAction):
    return ai.complete_action(action)


@app.post("/ai/understand")
def ai_understand(body: dict):
    inp = _input_from_new_contract(body)
    return _understand_to_api(ai.understand_user_input(inp), inp.text, inp.locale)


@app.post("/ai/recommend-action")
def ai_recommend_action(body: dict):
    inp = _input_from_new_contract(body)
    resp = ai.understand_user_input(inp)
    return {
        "suggested_action": _suggested_action_to_api(resp.suggestedAction),
        "safety_level": "normal",
    }


@app.post("/ai/generate-record-card")
def ai_generate_record_card(body: dict):
    completion = ai.complete_action(_action_from_new_contract(body))
    data = _completion_to_api(completion)
    return {
        "record_suggestion": True,
        "suggested_record": data["suggested_record"],
        "safety_note": SAFETY_DISCLAIMER,
    }


@app.post("/ai/generate-calm-script")
def ai_generate_calm_script(body: dict):
    return ai.create_calm_script(_action_from_new_contract(body))


@app.post("/ai/generate-exercise-plan")
def ai_generate_exercise_plan(body: dict):
    return ai.create_exercise_plan(_action_from_new_contract(body))


@app.post("/ai/action-completion")
def ai_action_completion(body: dict):
    return _completion_to_api(ai.complete_action(_action_from_new_contract(body)))


@app.post("/ai/safety-check")
def ai_safety_check(body: dict):
    text = str(body.get("text") or body.get("user_text") or "").lower()
    emergency_terms = ["自杀", "suicide", "胸痛", "chest pain", "昏倒", "faint"]
    high_terms = ["药", "medicine", "supplement", "补剂", "诊断", "diagnose"]
    if any(term in text for term in emergency_terms):
        level = "emergency"
    elif any(term in text for term in high_terms):
        level = "high"
    else:
        level = "normal"
    return {
        "safety_level": level,
        "allowed": level == "normal",
        "reply_text": SAFETY_DISCLAIMER,
    }


@app.post("/ai/generate-weekly-summary")
def ai_generate_weekly_summary(body: dict):
    limit = int(body.get("limit", 20))
    recent_records = records.list()[:limit] if hasattr(records, "list") else []
    record_titles = [_model_dump(record).get("title", "记录") for record in recent_records[:5]]
    return {
        "summary_type": "weekly",
        "disclaimer": "以下是根据记录做的整理，不是医学诊断。",
        "body_summary": "本周可以继续留意睡眠、潮热、疲惫和身体紧绷等变化。",
        "mood_summary": "情绪记录用于帮助你看见自己的状态变化，不代表医学判断。",
        "exercise_summary": "轻活动完成情况已整理，建议继续保持低压力、可停止的节奏。",
        "small_action_summary": "本周完成的小行动会作为陪伴记录保留。",
        "wearable_summary": "当前 demo 只整理已授权的可穿戴摘要，不接入真实设备数据。",
        "patterns_to_watch": record_titles or ["睡眠、潮热、情绪和轻活动完成情况。"],
        "doctor_questions": [],
    }


@app.post("/ai/memory/record")
def ai_memory_record(body: dict):
    now = _now()
    body_sensations = body.get("body_sensations") or []
    mood_sensations = body.get("mood_sensations") or []
    tags = [*body_sensations, *mood_sensations]
    record = RecordCard(
        id=str(body.get("record_id") or f"record_{uuid4().hex[:8]}"),
        userId=str(body.get("user_id") or "u1"),
        sourceInputId=body.get("input_id"),
        actionId=body.get("action_id"),
        kind="mixed",
        title=str(body.get("title") or "身体和心情记录"),
        summary=str(body.get("summary") or body.get("original_text") or "保存了一条身体和心情记录。"),
        tags=tags,
        createdAt=str(body.get("time") or now),
        safetyDisclaimer=SAFETY_DISCLAIMER,
    )
    saved = records.create(record)
    saved_data = _model_dump(saved)
    return {
        "saved": True,
        "record": {
            "user_id": saved_data.get("userId"),
            "date": str(saved_data.get("createdAt", ""))[:10],
            "time": saved_data.get("createdAt"),
            "body_tags": body_sensations,
            "mood_tags": mood_sensations,
            "sleep_quality": body.get("sleep_quality"),
            "hot_flash": "hot_flash" in body_sensations or "潮热" in body_sensations,
            "knee_pain": "knee_pain" in body_sensations or "膝盖" in body_sensations,
            "action_id": body.get("action_id"),
            "free_text": body.get("original_text") or saved_data.get("summary"),
        },
    }


@app.post("/ai/memory/wearable-daily")
def ai_memory_wearable_daily(body: dict):
    return {
        "saved": True,
        "wearable_daily": body,
    }


@app.post("/ai/memory/action")
def ai_memory_action(body: dict):
    action = {
        **body,
        "skill_id": normalize_skill_id(body.get("skill_id")) or body.get("skill_id"),
    }
    return {
        "status": "success",
        "saved": True,
        "message": "Action status logged to local-first memory.",
        "action": action,
    }


@app.post("/ai/memory/timeline")
def ai_memory_timeline(body: dict):
    limit = int(body.get("limit", 30))
    timeline = [_model_dump(record) for record in records.list()[:limit]]
    tag_counts: dict[str, int] = {}
    for record in timeline:
        for tag in record.get("tags", []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    return {
        "user_id": body.get("user_id", "u1"),
        "timeline": timeline,
        "tag_counts": tag_counts,
    }


# ---------------------------------------------------------------------------
# Record endpoints
# ---------------------------------------------------------------------------

@app.get("/api/records")
def list_records():
    return records.list()


@app.post("/api/records")
def create_record(record: RecordCard):
    return records.create(record)


@app.delete("/api/records/{record_id}")
def delete_record(record_id: str):
    ok = records.delete(record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Device endpoints
# ---------------------------------------------------------------------------

@app.get("/api/device/state")
def get_device_state():
    return device_bridge.state


@app.post("/api/device/command")
async def send_device_command(command: dict):
    sent = await device_bridge.send_command(command)
    return {"sent": sent}


# ---------------------------------------------------------------------------
# WebSocket endpoints
# ---------------------------------------------------------------------------

@app.websocket("/ws/device")
async def ws_device(ws: WebSocket):
    """ESP32 connects here. Receives DeviceCommand JSON, sends DeviceState JSON."""
    await device_bridge.device_connect(ws)


@app.websocket("/ws/frontend")
async def ws_frontend(ws: WebSocket):
    """Frontend connects here for live DeviceState push."""
    await device_bridge.frontend_connect(ws)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/skills")
def list_skills():
    """Return all 8 fixed skills from the registry."""
    return all_skills()


@app.get("/api/skills/{skill_id}")
def get_skill_by_id(skill_id: str):
    skill = get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_id}' not found")
    return skill


@app.get("/api/demo/status")
def demo_status():
    """Demo mode configuration – useful for frontend to adapt UI."""
    return {
        "demo_mode": DEMO_MODE,
        "ai_mode": AI_MODE,
        "ai_using_real": ai.using_real_ai,
        "device_connected": device_bridge.state.connection == "connected",
        "skill_count": len(all_skills()),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "demo_mode": DEMO_MODE,
        "ai_mode": "claude" if ai.using_real_ai else "mock",
        "device_connected": device_bridge.state.connection == "connected",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
