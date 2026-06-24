# AI Otter Coach – Python Backend

FastAPI server that bridges the web app, OpenAI AI, SQLite records, and the ESP32 device.

## Quick Start

```bash
cd services/backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env – add OPENAI_API_KEY if you want real AI responses

python main.py
# or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server starts at `http://0.0.0.0:8000`.

## AI Mode

| Condition | Behavior |
|-----------|----------|
| `OPENAI_API_KEY` set | Calls OpenAI API (`gpt-4o`) |
| No API key | Falls back to deterministic mock responses |

The fallback mock uses the same response shapes, so the frontend always works.

## Endpoints

### AI
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/understand` | `UserInput` | `AIUnderstandResponse` |
| POST | `/api/ai/calm-script` | `SuggestedAction` | `CalmScript` |
| POST | `/api/ai/exercise-plan` | `SuggestedAction` | `ExercisePlan` |
| POST | `/api/ai/complete-action` | `SuggestedAction` | `ActionCompletionResponse` |

### Records
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/records` | – | `RecordCard[]` |
| POST | `/api/records` | `RecordCard` | `RecordCard` |
| DELETE | `/api/records/{id}` | – | `{ok: true}` |

### Device
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/device/state` | – | `DeviceState` |
| POST | `/api/device/command` | `DeviceCommand` | `{sent: bool}` |

### WebSocket
| Path | Who connects | Direction |
|------|-------------|-----------|
| `/ws/device` | ESP32 | Receives `DeviceCommand` JSON, sends `DeviceState` JSON |
| `/ws/frontend` | Web app | Receives live `DeviceState` push |

### Health
```
GET /health
→ {"status":"ok","ai_mode":"mock","device_connected":false}
```

Interactive API docs: `http://localhost:8000/docs`

## Data Models

All models in `models.py` mirror `packages/shared-types/src/index.ts`. Keep them in sync.

## Architecture

```
Web App (React)
  → POST /api/ai/*          AI calls
  → GET/POST /api/records   Record storage
  → POST /api/device/command  Forward to ESP32
  → WS /ws/frontend         Live device state

Python Backend (FastAPI)
  → OpenAI OpenAI API    (or mock fallback)
  → SQLite otter_records.db
  → WS /ws/device           ESP32 connection

ESP32-S3-Touch-AMOLED-1.75
  → WS to Python backend
  → AMOLED display rendering
```
