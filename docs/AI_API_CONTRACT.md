# AI API Contract

## Implementations

Two interchangeable implementations of the same contract:

| Implementation | Location | When Used |
|----------------|----------|-----------|
| TypeScript mock | `services/mock-ai` | Local frontend-only dev, no backend |
| Python + Claude | `services/backend/ai_service.py` | Full stack with backend |

## Contract (TypeScript)

```typescript
interface AiAgentService {
  understandUserInput(input: UserInput): Promise<AIUnderstandResponse>
  createCalmScript(action: SuggestedAction): Promise<CalmScript>
  createExercisePlan(action: SuggestedAction): Promise<ExercisePlan>
  completeAction(action: SuggestedAction): Promise<ActionCompletionResponse>
}
```

## REST API (Python Backend)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/understand` | `UserInput` | `AIUnderstandResponse` |
| POST | `/api/ai/calm-script` | `SuggestedAction` | `CalmScript` |
| POST | `/api/ai/exercise-plan` | `SuggestedAction` | `ExercisePlan` |
| POST | `/api/ai/complete-action` | `SuggestedAction` | `ActionCompletionResponse` |

## Claude Model

Default: `claude-sonnet-4-6` (set `CLAUDE_MODEL` env var to override).

The backend falls back to deterministic mock responses if `ANTHROPIC_API_KEY` is not set.

## Safety Rules

All health-related responses must include:

> **这只是根据记录整理，不是医学诊断。**

The AI must never:
- Suggest a specific diagnosis
- Recommend medication or supplements
- Claim to replace professional medical care

## Future Extensions

- RAG context can be injected before `understandUserInput` without changing the contract.
- Auth headers and user context can be added at the transport layer.
- Prompt versioning and moderation can wrap the Claude call without changing response shapes.
