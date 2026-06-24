/**
 * webApiService — calls the Python FastAPI backend when VITE_API_BASE_URL is set.
 * Endpoint contract: ai_api_contract.md (2026-06-24 version from tech team)
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
import { deviceAdapter } from "./deviceAdapter";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const DEFAULT_USER_ID = "u1";

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

// ── Response mappers ────────────────────────────────────────────────────────

/** Map action_type from backend ("calm"/"move") → frontend type ("breathe"/"move") */
function mapActionType(t: string): "breathe" | "move" | "record" | "talk" {
  if (t === "calm") return "breathe";
  if (t === "move") return "move";
  return "breathe";
}

/** Maps the `round_screen_state` field from backend to our DeviceScreenState */
const SCREEN_STATE_MAP: Record<string, string> = {
  calm_guidance:    "breathing",
  movement_timer:   "exercise_countdown",
  night_companion:  "night_calm",
  hot_flash_calm:   "hot_flash_calm",
  idle:             "idle",
};

/** Map a backend `suggested_action` object → frontend SuggestedAction */
function mapSuggestedAction(raw: Record<string, unknown>): SuggestedAction {
  return {
    id:               `action_${Date.now()}`,
    type:             mapActionType(raw.action_type as string),
    title:            (raw.title as string) ?? "",
    reason:           (raw.reason as string) ?? "",
    estimatedMinutes: Math.round(((raw.duration_seconds as number) ?? 60) / 60),
    pressureLevel:    (raw.pressure_level as SuggestedAction["pressureLevel"]) ?? "low",
    primaryCta:       "start",
    alternatives:     ((raw.user_options as string[]) ?? ["skip", "change", "later"]).filter(
      (o): o is "skip" | "change" | "later" => ["skip", "change", "later"].includes(o)
    ),
    skillId:          (raw.skill_id as string) ?? undefined,
  };
}

/** Map backend understand response → AIUnderstandResponse */
function mapUnderstandResponse(raw: Record<string, unknown>): AIUnderstandResponse {
  const action = raw.suggested_action
    ? mapSuggestedAction(raw.suggested_action as Record<string, unknown>)
    : null;

  // Drive the device from hardware_directive if present
  if (raw.suggested_action) {
    const dir = (raw.suggested_action as Record<string, unknown>).hardware_directive as
      Record<string, unknown> | undefined;
    if (dir) {
      const screenState = SCREEN_STATE_MAP[dir.round_screen_state as string] ?? "idle";
      deviceAdapter.sendState({
        state: screenState as Parameters<typeof deviceAdapter.sendState>[0]["state"],
        screen_text: (dir.display_text as string) ?? "",
        duration_seconds: (dir.countdown_seconds as number) ?? 60,
        voice_text: (dir.voice_text as string) ?? undefined,
        light_mode: "soft",
        vibration: "none",
      });
    }
  }

  return {
    id:               `resp_${Date.now()}`,
    inputId:          "",
    reply:            (raw.reply_text as string) ?? "",
    suggestedAction:  action ?? {
      id: "fallback", type: "breathe", title: "缓一缓", reason: "",
      estimatedMinutes: 1, pressureLevel: "low", primaryCta: "start", alternatives: [],
    },
    safetyDisclaimer: "这只是根据记录整理，不是医学诊断。",
    createdAt:        new Date().toISOString(),
    detectedState: {
      bodySignals: [],
      riskLevel: "normal",
      language: "mixed",
    },
  };
}

/** Map backend action-completion response → ActionCompletionResponse */
function mapCompletionResponse(raw: Record<string, unknown>, action: SuggestedAction): ActionCompletionResponse {
  const now = new Date().toISOString();
  return {
    id:               `comp_${Date.now()}`,
    actionId:         action.id,
    completedAt:      now,
    reflectionPrompt: (raw.record_prompt as string) ?? "要记录这次吗？",
    safetyDisclaimer: "这只是根据记录整理，不是医学诊断。",
    completionReply:  (raw.completion_reply as string) ?? "完成了，做得很好。",
    askToRecord:      (raw.ask_to_record as boolean) ?? true,
    recordPrompt:     (raw.record_prompt as string) ?? "要记录这次吗？",
    userOptions:      (raw.user_options as string[]) ?? ["save", "do_not_save"],
    proposedRecord: {
      id:               `rec_${Date.now()}`,
      createdAt:        now,
      kind:             "action" as const,
      title:            action.title,
      summary:          (raw.completion_reply as string) ?? action.title,
      tags:             [] as string[],
      completedAction: {
        type: action.type,
        title: action.title,
        durationSeconds: action.estimatedMinutes * 60,
      },
      safetyDisclaimer: "这只是根据记录整理，不是医学诊断。",
    },
  };
}

// ── AI Service ───────────────────────────────────────────────────────────────

export const webAiService = {
  understandUserInput: (input: UserInput): Promise<AIUnderstandResponse> =>
    post<Record<string, unknown>>("/ai/understand", {
      user_id: DEFAULT_USER_ID,
      text:    input.text,
      remember: true,
    }).then(mapUnderstandResponse),

  createCalmScript: (action: SuggestedAction): Promise<CalmScript> =>
    post<Record<string, unknown>>("/ai/generate-calm-script", {
      user_id:  DEFAULT_USER_ID,
      skill_id: action.skillId,
      action_type: "calm",
    }).then((raw) => ({
      id:              `script_${Date.now()}`,
      actionId:        action.id,
      title:           (raw.title as string) ?? action.title,
      durationSeconds: action.estimatedMinutes * 60,
      tone:            "quiet",
      prompts:         ((raw.steps ?? raw.prompts ?? []) as Record<string, unknown>[]).map(
        (s, i) => ({
          id:      (s.step_id as string) ?? `step_${i}`,
          text:    (s.instruction_zh ?? s.instruction ?? s.text) as string,
          seconds: (s.duration_seconds ?? s.seconds ?? 15) as number,
        })
      ),
      safetyDisclaimer: (raw.safety_note ?? "这只是根据记录整理，不是医学诊断。") as string,
    })),

  createExercisePlan: (action: SuggestedAction): Promise<ExercisePlan> =>
    post<Record<string, unknown>>("/ai/generate-exercise-plan", {
      user_id:  DEFAULT_USER_ID,
      skill_id: action.skillId,
      action_type: "move",
    }).then((raw) => ({
      id:              `plan_${Date.now()}`,
      actionId:        action.id,
      title:           (raw.title as string) ?? action.title,
      durationSeconds: action.estimatedMinutes * 60,
      intensity:       "gentle",
      avoidIf:         (raw.avoid ?? []) as string[],
      steps:           ((raw.moves ?? raw.steps ?? []) as Record<string, unknown>[]).map(
        (s, i) => ({
          id:          (s.step_id as string) ?? `step_${i}`,
          instruction: (s.instruction_zh ?? s.name_zh ?? s.instruction) as string,
          seconds:     (s.duration_seconds ?? s.seconds ?? 30) as number,
        })
      ),
      safetyDisclaimer: (raw.safety_note ?? "这只是根据记录整理，不是医学诊断。") as string,
    })),

  completeAction: (action: SuggestedAction): Promise<ActionCompletionResponse> =>
    post<Record<string, unknown>>("/ai/action-completion", {
      user_id:     DEFAULT_USER_ID,
      skill_id:    action.skillId,
      action_type: action.type === "breathe" ? "calm" : "move",
    }).then((raw) => mapCompletionResponse(raw, action)),
};

// ── Memory API ───────────────────────────────────────────────────────────────

export const webMemoryService = {
  /** Save a user-approved body/mood record */
  saveRecord: (params: {
    time: string;
    bodySensations: string[];
    moodSensations: string[];
    sleepQuality?: string;
    actionId?: string;
    originalText?: string;
  }) =>
    post<{ saved: boolean }>("/ai/memory/record", {
      user_id:          DEFAULT_USER_ID,
      time:             params.time,
      body_sensations:  params.bodySensations,
      mood_sensations:  params.moodSensations,
      sleep_quality:    params.sleepQuality,
      action_id:        params.actionId,
      original_text:    params.originalText,
    }),

  /** Save daily wearable summary */
  saveWearable: (params: {
    date: string;
    restingHr?: number;
    hrv?: number;
    sleepMinutes?: number;
    wakeCount?: number;
    skinTempDelta?: number;
    steps?: number;
  }) =>
    post<{ saved: boolean }>("/ai/memory/wearable-daily", {
      user_id:          DEFAULT_USER_ID,
      date:             params.date,
      resting_hr:       params.restingHr,
      hrv:              params.hrv,
      sleep_minutes:    params.sleepMinutes,
      wake_count:       params.wakeCount,
      skin_temp_delta:  params.skinTempDelta,
      steps:            params.steps,
    }),

  /** Get personal timeline */
  getTimeline: (limit = 30) =>
    post<{ events: unknown[] }>("/ai/memory/timeline", {
      user_id: DEFAULT_USER_ID,
      limit,
    }),
};

// ── Records ──────────────────────────────────────────────────────────────────

export const webRecordService = {
  list: () => get<RecordCard[]>("/api/records"),
  create: (record: RecordCard) => post<RecordCard>("/api/records", record),
};

// ── Device commands ───────────────────────────────────────────────────────────

export async function sendDeviceCommand(command: DeviceCommand): Promise<boolean> {
  try {
    const res = await post<{ sent: boolean }>("/api/device/command", command);
    return res.sent;
  } catch {
    return false;
  }
}
