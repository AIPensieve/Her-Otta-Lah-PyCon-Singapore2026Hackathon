# Decisions

## 2026-06-24: Record Repository Boundary

The demo stores records in browser `localStorage`, but page components should not depend on storage details directly.

Decision:

- Keep `RecordCard` in `packages/shared-types`.
- Introduce a `RecordRepository` interface in `apps/web/src/store/localRecords.ts`.
- Export `recordRepository` for app code and keep `localRecordRepository` as the current demo implementation.
- Use async repository methods so a future database-backed implementation can replace local storage without changing page flows.

Reason:

This keeps the Hackathon demo simple while preserving a clean replacement point for authenticated database storage and long-term commercial records.

## 2026-06-24: Runtime Otter Assets Must Not Reuse Full Design Boards

The app previously rendered otter visuals by slicing a full reference-board image in the runtime UI.

Decision:

- Keep full design boards only as reference material.
- Extract standalone runtime-safe otter state assets for `default`, `listening`, `thinking`, and `breathing`.
- Use a shared `OtterIllustration` component instead of page-level background-position slicing.

Reason:

This preserves visual fidelity while avoiding accidental screenshot-as-UI behavior, and it gives later UI work a clean replacement point for transparent PNGs or production illustrations.

## 2026-06-24: `/ai/*` Is The Primary AI/RAG Contract

The app originally used local backend routes under `/api/ai/*`, while the newer AI/RAG technical contract uses `/ai/*`.

Decision:

- Treat `/ai/*` as the primary contract for frontend, Cloud AI, RAG, and future backend integration.
- Keep legacy `/api/ai/*` routes in the local Python backend for compatibility.
- Keep page components behind `apps/web/src/services/aiService.ts` so UI code does not depend on transport details.
- Normalize newer skill IDs through Skill Registry aliases instead of renaming the canonical demo skills.

Reason:

This lets the Hackathon demo run locally today while giving the AI/RAG team a stable contract for backend, memory, and hardware directive integration.

## 2026-06-24: Game Flows Are First-Class Skill IDs

The AI/RAG team confirmed `heel_drop_game_60s` and `neck_relax_game_60s` should be treated as formal game flow IDs, not aliases.

Decision:

- Add both IDs to frontend and backend Skill Registry as first-class skills.
- Allow these IDs in `game_id`, `hardware_directive.skill_id`, and `hardware_directive.open_fixed_flow`.
- Keep `hardware_directive.open_fixed_flow` as a string flow key, while `round_screen_state` remains the hardware round-screen state key.

Reason:

This lets the app and ESP32 handle game flows the same way they handle fixed calm/move skills, without special-case alias behavior.

## 2026-06-24: Game Flow Contract Includes Sensor And Scoring Metadata

The AI/backend team confirmed game flows need more than `game_id`, `skill_id`, and `hardware_directive.open_fixed_flow`.

Decision:

- Include `motion_detection`, `scoring`, `completion`, and `sensor_events` in game skill responses.
- Include `hardware_directive.watchface` for app/watchface routing.
- Use `hardware_directive.round_screen_state = "playful_timer"` for hardware game screens.
- Treat ESP32 events such as `motion_detected` and `safety_stop` as hardware event reports, not AI decisions.

Reason:

The ESP32-S3-Touch-AMOLED-1.75 has a screen, buttons/touch, and IMU signals available for simple game feedback, but it should not run AI or heavyweight game logic.
