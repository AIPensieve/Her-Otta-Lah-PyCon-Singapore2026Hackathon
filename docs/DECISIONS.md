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
