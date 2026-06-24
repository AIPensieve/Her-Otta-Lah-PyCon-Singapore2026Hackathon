# AI Otter Coach

Public Web/PWA hackathon demo for an AI health companion for women aged 45-65 experiencing menopause or post-menopause changes.

This project is not a medical diagnosis tool. It helps users talk, slow down, move gently, and record body and mood changes. All health-related summaries must keep this disclaimer: **这只是根据记录整理，不是医学诊断。**

---

## System Architecture

```
Web App (React PWA)
  ↕ REST + WebSocket
Python Backend (FastAPI)
  ├── Claude API (AI)
  ├── SQLite (records)
  └── WebSocket bridge
        ↕ Wi-Fi WebSocket
ESP32-S3-Touch-AMOLED-1.75
  └── AMOLED display + DeviceCommands
```

---

## Running Modes

### Mode 1 – Frontend Only (no backend, no hardware)

Quickest way to demo the UI. Uses TypeScript mock AI and localStorage.

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

---

### Mode 2 – Full Stack (backend + hardware)

#### Step 1: Start the Python backend

```bash
cd services/backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Optional: add ANTHROPIC_API_KEY to .env for real AI responses

python main.py
# Backend runs at http://0.0.0.0:8000
# API docs: http://localhost:8000/docs
```

#### Step 2: Start the web app (pointed at backend)

```bash
# In project root
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

#### Step 3: Flash the ESP32

See `hardware/README.md` for library setup and flashing instructions.

1. Copy `hardware/esp32-otter/config.h.example` → `config.h`
2. Set your WiFi credentials and the backend's LAN IP
3. Open `esp32-otter.ino` in Arduino IDE and click Upload

---

## Build And Deploy (Web App)

```bash
npm run build
# Output: apps/web/dist
```

Deployment config is included for:
- Vercel: `vercel.json`
- Netlify: `netlify.toml`

---

## Demo Flow

1. The user starts on **Talk** and enters one sentence, simulating voice input.
2. The AI understands the user's state and recommends one low-pressure action: **Breathe** or **Move**.
3. The ESP32 device displays "我在听" and then the action steps.
4. The user can **Start**, **Skip**, **Change**, or choose **Later**.
5. If the user starts, the app opens the matching execution flow.
6. After completion, the AI asks whether to save a record.
7. Saved records appear in **Timeline**.

---

## Repository Layout

```
apps/web/          React + TypeScript + Tailwind PWA
services/
  mock-ai/         TypeScript mock AI (frontend-only mode)
  backend/         Python FastAPI backend
    main.py        FastAPI app + all routes
    ai_service.py  Claude API + mock fallback
    device_bridge.py  WebSocket bridge for ESP32
    record_store.py   SQLite record persistence
    models.py      Pydantic models (mirror of shared-types)
packages/
  shared-types/    Shared TypeScript contracts
  ui/              Shared React components
hardware/
  esp32-otter/     Arduino firmware for Waveshare ESP32-S3-Touch-AMOLED-1.75
docs/              Architecture, API contract, device protocol, roadmap
```

---

## Current Scope

- React + TypeScript + Tailwind CSS Web/PWA.
- Mobile-first UI.
- Python FastAPI backend with Claude API integration.
- SQLite record storage.
- Mock AI fallback (no API key required).
- ESP32-S3-Touch-AMOLED-1.75 Arduino firmware.
- WebSocket device bridge.
- Local storage persistence for frontend-only mode.
- PWA manifest, install icons, and screenshot previews.

---

## Future Replacement Points

- Replace mock AI with real Claude API (already integrated in backend).
- Add RAG retrieval before `understandUserInput`.
- Replace SQLite with authenticated database and user accounts.
- Replace device simulator with the ESP32 WebSocket adapter.
- Add real voice input and TTS behind browser capability adapters.
- Add privacy and permission controls before GPS sharing or caregiver features.

---

## Important Safety Boundary

The product must not provide medical diagnosis, medication recommendations, supplement prescriptions, real-time monitoring, or covert family tracking.
