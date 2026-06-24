# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│  Web App (React + TypeScript + Tailwind, apps/web)      │
│  → Calls AI/RAG API through aiService.ts                │
│  → Falls back to mock AI service (local demo mode)      │
│  → WebSocket for live DeviceState updates               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST + WebSocket
┌───────────────────────▼─────────────────────────────────┐
│  Python Backend (FastAPI, services/backend)             │
│  ├── AI: /ai/* compatibility layer + OpenAI/mock        │
│  ├── Records: SQLite (otter_records.db)                 │
│  └── Device Bridge: WebSocket server for ESP32          │
└───────────────────────┬─────────────────────────────────┘
                        │ WebSocket (Wi-Fi, same LAN)
┌───────────────────────▼─────────────────────────────────┐
│  ESP32-S3-Touch-AMOLED-1.75 (hardware/esp32-otter)      │
│  ├── 1.75" AMOLED display (368×448)                     │
│  ├── Receives DeviceCommand JSON                        │
│  └── Sends DeviceState JSON updates                     │
└─────────────────────────────────────────────────────────┘
```

## Repository Layout

```
apps/
  web/              React + TypeScript + Tailwind PWA
services/
  mock-ai/          TypeScript mock AI (local frontend dev, no backend needed)
  backend/          Python FastAPI backend (AI + records + device bridge)
packages/
  shared-types/     TypeScript type contracts (shared across app and mock-ai)
  ui/               Shared React UI components
hardware/
  esp32-otter/      Arduino firmware for ESP32-S3-Touch-AMOLED-1.75
docs/               Product, architecture, API, device, release, and roadmap docs
```

## Data Flow

1. User enters a sentence on Talk.
2. Web app calls `POST /ai/understand` through `apps/web/src/services/aiService.ts`.
3. Backend returns structured AI/RAG JSON with `reply_text`, `suggested_action`, `safety_level`, and optional `hardware_directive`.
4. Frontend maps the response into app-facing shared types and sends device state/watchface commands when needed.
5. User starts the action → app calls `/ai/generate-calm-script` or `/ai/generate-exercise-plan`.
6. As user advances steps, app calls `POST /api/device/command` with `SHOW_STEP`.
7. On completion, app calls `/ai/action-completion`.
8. User confirms → app calls `POST /api/records`.
9. Saved record appears in Timeline via `GET /api/records`.

The legacy local backend paths under `/api/ai/*` remain available for compatibility, but new frontend and Cloud/AI integration work should target `/ai/*`.

## Running Modes

### Local Frontend-Only Mode (no backend, no hardware)
```bash
npm install && npm run dev
```
Uses `services/mock-ai` (TypeScript). Records stored in `localStorage`.

### Full Stack Mode (backend + hardware)
```bash
# Terminal 1: Python backend
cd services/backend && python main.py

# Terminal 2: Web app (point to backend)
VITE_API_BASE_URL=http://localhost:8000 npm run dev

# ESP32: flash hardware/esp32-otter/esp32-otter.ino
# Set config.h: WS_HOST = your laptop LAN IP
```

## Commercial Extension Points

- AI: replace mock service with a real Agent API behind `/ai/*` while keeping the same app-facing contract.
- RAG: add retrieval and long-term memory behind `/ai/*` and `/ai/memory/*` without changing page components.
- Storage: replace `localRecordRepository` with a repository backed by a database and user account.
- Voice/TTS: add browser and native adapters behind feature-specific service boundaries.
- Hardware: replace `DeviceSimulator` with the ESP32 WebSocket adapter using `DeviceCommand`.
- Privacy: add permission records, user consent screens, data retention rules, and export/delete flows.
- Localization: move UI copy and AI prompts into locale dictionaries.

## Safety Boundary

The product supports companionship and personal recording. It must not provide diagnosis, treatment plans, drug recommendations, supplement prescriptions, real-time monitoring, or hidden family tracking.
