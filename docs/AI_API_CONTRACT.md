# AI API Contract

The demo uses `AiAgentService` from `services/mock-ai`. Future real services should keep the same high-level contract:

- `understandUserInput(input: UserInput): Promise<AIUnderstandResponse>`
- `createCalmScript(action: SuggestedAction): Promise<CalmScript>`
- `createExercisePlan(action: SuggestedAction): Promise<ExercisePlan>`
- `completeAction(action: SuggestedAction): Promise<ActionCompletionResponse>`

The real implementation may add server transport, auth, RAG context, moderation, prompt versioning, and telemetry, but UI code should not depend on provider-specific payloads.

Health-related responses must include: **这只是根据记录整理，不是医学诊断。**
