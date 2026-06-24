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
from skill_registry import all_skills, get_skill
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
        "skill_count": 8,
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
