# Tasks

## Must Finish Today

- [x] Initialize React + TypeScript + Tailwind Web/PWA project.
- [x] Create Talk, Breathe, Move, Timeline, and Me routes.
- [x] Add bottom navigation.
- [x] Add shared product, AI, record, and device types.
- [x] Add mock AI service with replaceable service contract.
- [x] Add device protocol and simulator.
- [x] Add README.
- [x] Add architecture documentation.
- [x] Add commercial roadmap.
- [x] Add AGENTS.md project collaboration rules.
- [x] Run build and fix remaining issues.
- [x] Push repository to GitHub.
- [x] Polish mobile visual design.
- [x] Add PWA icons and screenshots.
- [x] Add richer Talk to action recommendation states.
- [x] Add action completion confirmation before saving.
- [x] Correct Talk-page asset usage and align app shell width to mobile PWA reference.
- [x] Restore Bottom Navigation and Breathe page toward mobile reference visuals.
- [x] Restore Move in-progress page toward mobile reference visuals.
- [x] Add standalone watchface UI page from generated reference states.
- [x] Add SET_WATCHFACE command contract and simulator integration.
- [x] Wire Talk and Move flow events to SET_WATCHFACE commands.
- [x] Align frontend AI adapter and local backend with new `/ai/*` contract.
- [x] Add Skill Registry aliases for newer AI/RAG skill IDs.
- [x] Update AI API contract docs for Cloud/AI handoff.
- [x] Apply AI/RAG team confirmations for weekly summary, memory endpoints, hardware directive, and game flows.
- [x] Add game flow contract fields for motion detection, scoring, completion, and sensor events.

## Nice To Have

- [x] Add i18n dictionary structure.
- [x] Add simple privacy/permission screen.
- [x] Add smoke tests.
- [x] Add deploy notes for Vercel or Netlify.
- [x] Add record repository abstraction.
- [x] Complete public release checklist verification.

## Backend

- [x] Python FastAPI backend (services/backend/).
- [x] Claude API integration with mock fallback.
- [x] SQLite record store.
- [x] Device bridge (WebSocket server for ESP32).
- [x] REST endpoints matching AI contract.
- [x] Wire frontend to call Python backend (VITE_API_BASE_URL).
- [x] Add /ws/frontend integration in web app DeviceSimulator.
- [x] Send SHOW_STEP / SHOW_COMPLETE to device on Breathe/Move step changes.

## Hardware

- [x] ESP32-S3-Touch-AMOLED-1.75 firmware (Arduino).
- [x] WiFi + WebSocket client to Python backend.
- [x] AMOLED display: idle / listening / breathing / moving / complete screens.
- [x] DeviceCommand JSON handler.
- [x] DeviceState JSON sender.
- [ ] Test on real hardware – verify AMOLED library include path.
- [ ] Verify Chinese font rendering on device.
- [ ] Touch input to confirm/skip on device (future).

## AI / RAG Follow-Up

- [x] Confirm `/ai/generate-weekly-summary` response shape with AI/RAG team.
- [x] Confirm `/ai/memory/*` request/response shapes with AI/RAG team.
- [x] Confirm final `hardware_directive.round_screen_state` values for real device firmware.
- [x] Decide whether game-like skill IDs remain aliases or become first-class skills.
- [x] Confirm whether future game flows need extra fields beyond `game_id`, `skill_id`, and `hardware_directive.open_fixed_flow`.

## Future / Post-Demo

- [ ] Wire i18n dictionary into page components (currently pages use hardcoded strings).
- [ ] Add locale switcher to Me page.
- [ ] Improve Timeline with date grouping.
- [ ] Add otter device simulator visual feedback on Talk submit.
- [ ] Integrate real AI service behind AiAgentService contract.
- [ ] Replace localRecordRepository with authenticated database backend.
- [ ] Add user accounts and multi-device sync.
- [ ] Add voice input and TTS.
