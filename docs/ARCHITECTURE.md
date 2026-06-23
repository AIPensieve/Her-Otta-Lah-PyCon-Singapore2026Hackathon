# Architecture

## Current Demo

This repository is a small npm workspace:

- `apps/web`: React + TypeScript + Tailwind Web/PWA demo.
- `services/mock-ai`: mock AI Agent service with future-compatible method names.
- `packages/shared-types`: shared contracts for app, AI, records, and device protocol.
- `packages/ui`: reusable React UI primitives.
- `docs`: product, architecture, API, device, release, and roadmap notes.

The Web app keeps page components thin. AI decisions live behind `AiAgentService`, device behavior lives behind `DeviceSimulator`, and records are stored through a local repository wrapper.

## Data Flow

1. User enters a sentence on Talk.
2. Talk creates `UserInput`.
3. `AiAgentService.understandUserInput` returns `AIUnderstandResponse`.
4. User starts the suggested action.
5. Breathe or Move requests a `CalmScript` or `ExercisePlan`.
6. Completion creates an `ActionCompletionResponse`.
7. The proposed `RecordCard` is saved locally and shown in Timeline.

## Commercial Extension Points

- AI: replace mock service with a real Agent API while keeping the same app-facing contract.
- RAG: add retrieval before response generation without changing page components.
- Storage: replace local storage with a repository backed by a database and user account.
- Voice/TTS: add browser and native adapters behind feature-specific service boundaries.
- Hardware: replace `DeviceSimulator` with Bluetooth/Wi-Fi adapters using `DeviceCommand`.
- Privacy: add permission records, user consent screens, data retention rules, and export/delete flows.
- Localization: move UI copy and AI prompts into locale dictionaries.

## Safety Boundary

The product supports companionship and personal recording. It must not provide diagnosis, treatment plans, drug recommendations, supplement prescriptions, real-time monitoring, or hidden family tracking.
