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
