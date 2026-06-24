/**
 * webApiService — calls the Python FastAPI backend when VITE_API_BASE_URL is set.
 *
 * If VITE_API_BASE_URL is not set, this module is not used;
 * the app falls through to the mock-ai service instead.
 *
 * Contract: same method signatures as AiAgentService in services/mock-ai.
 */
import type {
  AIUnderstandResponse,
  ActionCompletionResponse,
  CalmScript,
  DeviceCommand,
  ExercisePlan,
  RecordCard,
  SuggestedAction,
  UserInput,
} from "@ai-otter/shared-types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const webAiService = {
  understandUserInput: (input: UserInput) =>
    post<AIUnderstandResponse>("/api/ai/understand", input),

  createCalmScript: (action: SuggestedAction) =>
    post<CalmScript>("/api/ai/calm-script", action),

  createExercisePlan: (action: SuggestedAction) =>
    post<ExercisePlan>("/api/ai/exercise-plan", action),

  completeAction: (action: SuggestedAction) =>
    post<ActionCompletionResponse>("/api/ai/complete-action", action),
};

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export const webRecordService = {
  list: () => get<RecordCard[]>("/api/records"),

  create: (record: RecordCard) => post<RecordCard>("/api/records", record),
};

// ---------------------------------------------------------------------------
// Device commands
// ---------------------------------------------------------------------------

export async function sendDeviceCommand(command: DeviceCommand): Promise<boolean> {
  try {
    const res = await post<{ sent: boolean }>("/api/device/command", command);
    return res.sent;
  } catch {
    return false;
  }
}
