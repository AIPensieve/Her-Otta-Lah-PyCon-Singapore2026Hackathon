# Demo Script — AI Otter Coach

A guided walkthrough for hackathon judges or live presentations (~5 minutes).

## Setup Checklist

```bash
# Terminal 1: Backend
cd services/backend && uvicorn main:app --reload

# Terminal 2: Frontend
cd apps/web && npm run dev

# Terminal 3: Seed demo data (optional but recommended)
python3 scripts/seed_demo_records.py

# (Optional) Hardware device connected via USB, MicroPython firmware loaded
```

Open: http://localhost:5173

---

## Scene 1 — Night Wake (夜醒)
*"It's 3am. She woke up again."*

1. Tap **Talk** tab
2. Enter: `夜里三点又醒了，睡不着，有点烦`
3. **Show**: AI reply appears — warm, not clinical
4. **Show**: Suggested action = "夜里陪伴" (Night Calm, 3 min)
5. Tap **开始** (Start)
6. **Show**: Breathing animation + step-by-step guide
7. *If hardware connected*: device screen switches to `night_calm` state

---

## Scene 2 — Hot Flash (潮热)
*"Midday, a wave of heat."*

1. Tap **Talk** tab
2. Enter: `潮热出汗，很不舒服`
3. **Show**: AI detects hot_flash signal → suggests Hot Flash Calm
4. Tap **开始**
5. **Show**: Cool-down breathing prompts
6. Complete → **Show**: Record card generation prompt

---

## Scene 3 — Gentle Exercise (轻活动)
*"She's been sitting too long."*

1. Tap **Move** tab  
   *Or from Talk: enter* `肩颈很紧，久坐了`
2. **Show**: Neck relax skill appears
3. Tap **开始**
4. **Show**: Exercise steps with countdown
5. *Hardware*: device switches to `exercise_countdown`

---

## Scene 4 — Timeline
*"Her own story, week by week."*

1. Tap **Timeline** tab
2. **Show**: Record cards (seeded by seed_demo_records.py)
3. **Show**: Tags — 潮热, 夜醒, 肩颈, breathing — building a picture
4. *Point out*: "Not clinical — just her own patterns"

---

## Scene 5 — Hardware Sync (live if device connected)

```bash
# From Terminal 3, cycle through all states:
python3 scripts/test_device_ws.py --loop
```

1. **Show**: Device screen cycling through states
2. **Show**: Backend terminal — WebSocket messages
3. **Point out**: App and device stay in sync via `/ws/frontend`

---

## Key Points for Judges

- **No medical diagnosis** — disclaimer appears on every response
- **Bilingual** — try English: "I woke up at 3am and can't sleep"
- **Always stoppable** — every action has skip/change/later
- **AI modes** — swap `AI_MODE=real` + `ANTHROPIC_API_KEY` for live Claude responses
- **RAG ready** — `services/backend/app/rag/` shows the architecture

---

## Fallback if Backend is Down

The frontend has a local mock mode. Set in `apps/web/.env.local`:
```
VITE_API_BASE_URL=mock
```
All AI responses come from the TypeScript mock in `apps/web/src/services/aiService.ts`.
