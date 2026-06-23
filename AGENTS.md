# AGENTS.md

## Project Mode

This project is both:

1. A Hackathon MVP that must be demoable and publicly deployable.
2. A long-term commercializable product prototype that should remain maintainable and extensible.

Do not write disposable demo code unless explicitly requested.

## Product Context

This is an AI Otter Coach product for 45-65-year-old menopausal / postmenopausal women.

The product includes:

- Mobile Web/PWA App
- AI Otter companion
- Device simulator for the desktop pet hardware
- Mock AI for Hackathon demo
- Future real AI/RAG service
- Future real hardware integration

Core pages:

1. Talk / 说说
2. Breathe / 缓一缓
3. Move / 动一动
4. Timeline / 记录
5. Me / 我的

Core experience:

User says something on Talk page
-> AI understands body/mood state
-> AI recommends a low-pressure small action
-> user can start / skip / change / later
-> action runs in Breathe or Move
-> action completion asks whether to save a record
-> saved record appears in Timeline.

## Product Principles

Always follow these principles:

1. Voice-first
2. Bilingual-friendly: Chinese, English, and mixed Chinese-English
3. Age-friendly UI: large text, large buttons, clear hierarchy
4. Companion, not monitoring
5. Record, not diagnose
6. Low pressure, no forced check-in
7. Calm, warm, clear, and non-medical visual tone
8. App shows details; otter device handles short guidance, countdown, light/vibration, simple confirmation
9. All health-related summaries must include: "This is based on your records and is not a medical diagnosis."

## Commercialization Principles

Even if building a Hackathon demo:

- Mock AI must be replaceable by real AI service.
- Mock records must be replaceable by a real database.
- Device simulator must be replaceable by real hardware protocol.
- UI components must be reusable.
- Types should live in shared-types where possible.
- Avoid hard-coded business logic inside page components.
- Avoid hard-coded copy that should later become i18n.
- Avoid one-off CSS when a shared component or token can be used.

## Repository Rules

Before starting any task, read:

- `docs/PRODUCT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/TASKS.md`
- `docs/AI_API_CONTRACT.md`
- `docs/DEVICE_PROTOCOL.md`
- `docs/COMMERCIAL_ROADMAP.md`

If the task is UI-related, also read:

- `docs/UI_REFERENCE.md`
- `assets/reference/`

## Development Rules

1. Work on one task at a time.
2. Do not modify unrelated files.
3. Do not introduce complex dependencies unless necessary.
4. Do not connect real AI, real GPS, real user data, or real hardware unless explicitly asked.
5. Do not commit API keys, tokens, `.env` files, real contacts, real locations, private RAG content, or private prompts.
6. Keep `npm run build` passing.
7. After finishing a task, update `docs/TASKS.md`.
8. If making an architecture decision, update `docs/DECISIONS.md`.
9. If adding or changing an AI response shape, update `docs/AI_API_CONTRACT.md`.
10. If adding or changing device states/commands, update `docs/DEVICE_PROTOCOL.md`.
11. If adding user-visible text, consider future i18n.
12. If adding UI, use shared components and design tokens where possible.

## Task Selection Rule

When asked to continue development:

1. Inspect the current repo.
2. Read `docs/TASKS.md`.
3. Identify the highest-impact next task.
4. Propose a short plan before editing.
5. Keep the task small enough to complete safely.
6. Implement.
7. Run build or explain why build cannot be run.
8. Update task status.

## What Not To Do

Do not:

- Rebuild the whole app from scratch
- Change the product structure without approval
- Remove the Talk -> Action -> Completion -> Timeline flow
- Add medical diagnosis wording
- Add drug or supplement recommendations
- Add child-monitoring or real-time location monitoring
- Make the UI look like a hospital, fitness weight-loss app, or children's toy
- Hide major changes inside unrelated files

## Output Format After Each Task

After each task, report:

1. What changed
2. Files changed
3. How to test
4. Whether build passes
5. What should be done next
6. Any risks or TODOs
