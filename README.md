# 🦦 AI Otter Coach

> *A warm AI companion for women navigating menopause — combining a mobile app, a Python AI backend, and a physical desktop companion device.*

---

## Project Background

Menopause affects every woman, yet most digital health tools are built for generic wellness rather than the specific, daily lived experience of perimenopause and post-menopause (ages 45–65). Symptoms — hot flashes, night waking, anxiety, joint discomfort, mood shifts — arrive unexpectedly and are often dismissed.

AI Otter Coach is a low-pressure AI companion that listens, suggests tiny achievable actions, generates personal record cards, and syncs with a physical "otter" device on the user's desk — turning abstract health tracking into something warm and present.

---

## Target Users

Women aged **45–65**, perimenopause through post-menopause, in Singapore and the Chinese diaspora. App supports Chinese (Simplified), English, and natural code-switching between the two.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Talk** | Voice/text input → AI understands mood & body signals → suggests a small action |
| **Breathe** | Guided breathing and calm scripts, synced to the hardware device |
| **Move** | Gentle exercise plans (chair-friendly, low-impact, always stoppable) |
| **Timeline** | Personal record cards showing patterns over time |
| **Me** | Profile and weekly summary (non-diagnostic) |
| **Hardware sync** | Physical otter device shows real-time state (breathing, listening, idle…) |

---

## AI / RAG Architecture

```
User text (zh / en / mixed)
        │
        ▼
┌─────────────────────────────────────────────┐
│  Safety Guard  (emergency / elevated / ok)  │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  Intent Classifier  (mood_record /          │
│  action_request / night_wake / check_in)    │
└─────────────────────────────────────────────┘
        │
        ├──── RAG Retrieval ─────────────────┐
        │     (menopause knowledge snippets) │
        │     → context hint                 │
        ◄────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  Action Recommender  (→ skill_id)           │
│  Skill Registry  (8 fixed demo skills)      │
└─────────────────────────────────────────────┘
        │
        ├── Exercise Plan Generator
        ├── Calm Script Generator
        └── Record Card Generator
```

**AI modes** (set via `AI_MODE` env var):
- `mock` — deterministic rule-based responses (no API key needed, great for demo)
- `real` — Claude API (`claude-sonnet-4-6`), with mock fallback on any error

**RAG** — local keyword retrieval over curated sample documents in `services/backend/app/rag/sample_docs/`. Production would use a vector database backed by reviewed medical content.

---

## Hardware

**Device**: Waveshare ESP32-S3-Touch-AMOLED-1.75
- Round AMOLED display (466×466 px)
- WiFi → WebSocket to Python backend
- 9 display states: `idle`, `listening`, `thinking`, `breathing`, `exercise_countdown`, `next_move`, `night_calm`, `location_confirm`, `location_sent`

**Firmware options**:
- `hardware/esp32-micropython/` — MicroPython (serial-only, display pending driver)
- `hardware/esp32-otter/pio/` — Arduino + LovyanGFX (AMOLED display support)

---

## Demo Flow

```
1. Start backend:  cd services/backend && uvicorn main:app --reload
2. Start frontend: cd apps/web && npm run dev
3. Open http://localhost:5173
4. Tap "Talk" → type or speak (e.g. "今天夜里醒了，有点烦")
5. AI replies → suggests a calm/move action
6. Start the action → see hardware device sync in real time
7. Complete → save record card → view in Timeline
```

---

## Running Locally

### Backend (Python 3.11+)

```bash
cd services/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env   # fill in values
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Node 20+)

```bash
cd apps/web
npm install
npm run dev
```

### Scripts

```bash
# Health check
python3 scripts/health_check.py

# Smoke-test AI endpoint
python3 scripts/test_ai_understand.py

# Seed demo timeline records
python3 scripts/seed_demo_records.py

# Test hardware WebSocket commands
python3 scripts/test_device_ws.py --loop
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MODE` | `mock` | `mock` or `real` |
| `ANTHROPIC_API_KEY` | — | Required for `AI_MODE=real` |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model ID |
| `DEMO_MODE` | `true` | Guarantees mock fallback on error |
| `ELEVENLABS_API_KEY` | — | Optional TTS |
| `PORT` | `8000` | Backend port |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

See `.env.example` for the full list.

---

## Safety & Ethics

- **No medical diagnosis** — all responses include: *这只是根据记录整理，不是医学诊断。*
- **No drug recommendations** — the safety guard blocks or flags any medication-related input
- **Emergency redirect** — if emergency keywords detected, user is immediately redirected to seek human help
- **No real user data committed** — all credentials and personal data are gitignored
- **Local-first records** — stored in a local SQLite database, not sent to external services
- **Stoppable at any time** — every exercise/calm action is explicitly designed to be skippable

See [`docs/ethics-and-safety.md`](docs/ethics-and-safety.md) for full details.

---

## Project Structure

```
.
├── apps/web/                   # React + TypeScript PWA (frontend)
│   └── src/
│       ├── pages/              # TalkPage, BreathePage, MovePage, TimelinePage, MePage
│       ├── components/         # OtterIllustration, RecordCardUI, DeviceHardwareUI…
│       └── services/           # aiService.ts, webApiService.ts
│
├── services/backend/           # FastAPI Python backend
│   ├── main.py                 # All API routes
│   ├── ai_service.py           # Claude API + mock fallback
│   ├── skill_registry.py       # 8 fixed demo skills
│   ├── models.py               # Pydantic models
│   ├── device_bridge.py        # WebSocket bridge (ESP32 ↔ frontend)
│   └── app/
│       ├── ai/                 # Modular AI pipeline
│       │   ├── schemas.py
│       │   ├── intent_classifier.py
│       │   ├── action_recommender.py
│       │   ├── record_card_generator.py
│       │   ├── exercise_plan_generator.py
│       │   ├── calm_script_generator.py
│       │   └── safety_guard.py
│       └── rag/                # RAG demo pipeline
│           ├── rag_pipeline.py
│           ├── retrieval.py
│           └── sample_docs/    # Illustrative knowledge snippets
│
├── hardware/
│   ├── esp32-micropython/      # MicroPython firmware
│   └── esp32-otter/pio/        # Arduino firmware (LovyanGFX display)
│
├── scripts/                    # Dev / demo scripts
│   ├── health_check.py
│   ├── test_ai_understand.py
│   ├── test_device_ws.py
│   └── seed_demo_records.py
│
├── packages/shared-types/      # Shared TypeScript types
└── docs/                       # Architecture, protocol, ethics docs
```

---

## Current Limitations

- Display driver for the round AMOLED (CO5300/RM67162 QSPI) is still in development for both MicroPython and Arduino pathways
- RAG uses simple keyword retrieval; production needs a proper vector store
- No user authentication (demo uses a single `demo_user` ID)
- Voice input uses browser Web Speech API (Chrome/Safari only)
- TTS via ElevenLabs is optional and requires an API key

---

## Future Plans

- [ ] Full AMOLED display support (Arduino firmware with LovyanGFX)
- [ ] Vector-based RAG with reviewed menopause knowledge base
- [ ] Multi-user support with proper auth
- [ ] Wearable data integration (heart rate, sleep quality via BLE)
- [ ] Mandarin + Singlish code-switching improvements
- [ ] Practitioner companion dashboard

---

*这只是根据记录整理，不是医学诊断。 / This is based on your records only, not medical advice.*
