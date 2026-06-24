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
const SAFETY_DISCLAIMER = "这只是根据记录整理，不是医学诊断。";

type ApiLanguage = "zh" | "en" | "zh_en_mixed" | string;

type RawHardwareDirective = {
  skill_id?: string;
  open_fixed_flow?: string;
  round_screen_state?: string;
  watchface?: string;
  display_text?: string;
  voice_text?: string;
  countdown_seconds?: number;
  effects?: {
    light?: string;
    breathing_light?: boolean;
    vibration?: string;
  };
};

type RawSuggestedAction = {
  game_id?: string;
  action_type?: "calm" | "move" | "none" | string;
  skill_id?: string;
  movement?: string;
  title?: string;
  reason?: string;
  duration_seconds?: number;
  pressure_level?: string;
  user_options?: string[];
  motion_detection?: {
    primary_motion?: string;
    fallback_input?: string;
    sensor_signal?: string;
    minimum_reps?: number;
    max_reps_target?: number;
    safety_stop_signals?: string[];
  };
  scoring?: {
    score_unit?: string;
    points_per_motion?: number;
    target_score?: number;
    minimum_success_score?: number;
    pressure_level?: string;
  };
  completion?: {
    duration_seconds?: number;
    success_condition?: string;
    record_action_on_finish?: boolean;
    completion_states?: string[];
  };
  sensor_events?: {
    expected_from_hardware?: string[];
    optional_signals?: string[];
    app_to_hardware?: string[];
  };
  hardware_directive?: RawHardwareDirective;
};

type RawUnderstandResponse = {
  intent?: string;
  language?: ApiLanguage;
  raw_language?: string;
  user_text?: string;
  reply_text?: string;
  pet_voice_text?: string;
  record_suggestion?: boolean;
  suggested_action?: RawSuggestedAction | null;
  safety_level?: "normal" | "high" | "emergency" | string;
  body_state?: string[];
  mood_state?: string[];
  wants_record?: boolean;
  safety?: unknown;
  next_step?: string;
  action_recommendation?: RawSuggestedAction;
  display_text?: string;
};

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
  if (t === "none") return "talk";
  return "breathe";
}

function mapLanguage(language: ApiLanguage | undefined): "zh-SG" | "en-SG" | "mixed" {
  if (language === "zh") return "zh-SG";
  if (language === "en") return "en-SG";
  return "mixed";
}

function mapRiskLevel(level: string | undefined): "normal" | "needs-human-help" {
  return level === "high" || level === "emergency" ? "needs-human-help" : "normal";
}

function mapPressureLevel(level: string | undefined): SuggestedAction["pressureLevel"] {
  if (level === "very-low" || level === "very_low") return "very-low";
  if (level === "medium") return "medium";
  return "low";
}

/** Maps the `round_screen_state` field from backend to our DeviceScreenState */
const SCREEN_STATE_MAP: Record<string, string> = {
  calm_guidance:    "breathing",
  movement_timer:   "exercise_countdown",
  night_companion:  "night_calm",
  hot_flash_calm:   "hot_flash_calm",
  playful_timer:    "exercise_countdown",
  idle:             "idle",
};

/** Map a backend `suggested_action` object → frontend SuggestedAction */
function mapSuggestedAction(raw: RawSuggestedAction): SuggestedAction {
  const actionType = raw.action_type ?? "calm";
  const durationSeconds = raw.duration_seconds ?? 60;
  const userOptions = (raw.user_options ?? ["start", "skip", "change", "later"]).filter(
    (o): o is "start" | "skip" | "change" | "later" =>
      ["start", "skip", "change", "later"].includes(o)
  );

  return {
    id:               `action_${Date.now()}`,
    type:             mapActionType(actionType),
    apiActionType:    actionType === "move" || actionType === "none" ? actionType : "calm",
    title:            raw.title ?? "",
    reason:           raw.reason ?? "",
    estimatedMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    durationSeconds,
    pressureLevel:    mapPressureLevel(raw.pressure_level),
    primaryCta:       "start",
    alternatives:     userOptions.filter(
      (o): o is "skip" | "change" | "later" => ["skip", "change", "later"].includes(o)
    ),
    userOptions,
    skillId:          raw.skill_id,
    gameId:           raw.game_id,
    movement:         raw.movement,
    motionDetection: raw.motion_detection
      ? {
          primaryMotion: raw.motion_detection.primary_motion ?? "",
          fallbackInput: raw.motion_detection.fallback_input ?? "button_press",
          sensorSignal: raw.motion_detection.sensor_signal ?? "",
          minimumReps: raw.motion_detection.minimum_reps ?? 0,
          maxRepsTarget: raw.motion_detection.max_reps_target ?? 0,
          safetyStopSignals: raw.motion_detection.safety_stop_signals ?? [],
        }
      : undefined,
    scoring: raw.scoring
      ? {
          scoreUnit: raw.scoring.score_unit ?? "gentle_rep",
          pointsPerMotion: raw.scoring.points_per_motion ?? 1,
          targetScore: raw.scoring.target_score ?? 0,
          minimumSuccessScore: raw.scoring.minimum_success_score ?? 0,
          pressureLevel: mapPressureLevel(raw.scoring.pressure_level),
        }
      : undefined,
    completion: raw.completion
      ? {
          durationSeconds: raw.completion.duration_seconds ?? durationSeconds,
          successCondition: raw.completion.success_condition ?? "time_elapsed_or_user_stops_comfortably",
          recordActionOnFinish: raw.completion.record_action_on_finish ?? true,
          completionStates: (raw.completion.completion_states ?? []).filter(
            (s): s is "completed" | "skipped" | "changed" | "later" | "safety_stopped" =>
              ["completed", "skipped", "changed", "later", "safety_stopped"].includes(s)
          ),
        }
      : undefined,
    sensorEvents: raw.sensor_events
      ? {
          expectedFromHardware: raw.sensor_events.expected_from_hardware ?? [],
          optionalSignals: raw.sensor_events.optional_signals ?? [],
          appToHardware: raw.sensor_events.app_to_hardware ?? [],
        }
      : undefined,
  };
}

/** Map backend understand response → AIUnderstandResponse */
function mapUnderstandResponse(raw: RawUnderstandResponse): AIUnderstandResponse {
  const action = raw.suggested_action
    ? mapSuggestedAction(raw.suggested_action)
    : null;

  // Drive the device from hardware_directive if present
  if (raw.suggested_action) {
    const dir = raw.suggested_action.hardware_directive;
    if (dir) {
      const screenState = SCREEN_STATE_MAP[dir.round_screen_state ?? ""] ?? "idle";
      deviceAdapter.sendState({
        state: screenState as Parameters<typeof deviceAdapter.sendState>[0]["state"],
        screen_text: dir.display_text ?? "",
        duration_seconds: dir.countdown_seconds ?? raw.suggested_action.duration_seconds ?? 60,
        voice_text: dir.voice_text,
        light_mode: "soft",
        vibration: ["short", "long", "double"].includes(dir.effects?.vibration ?? "")
          ? (dir.effects?.vibration as "short" | "long" | "double")
          : "none",
      });
    }
  }

  return {
    id:               `resp_${Date.now()}`,
    inputId:          "",
    userText:         raw.user_text,
    apiLanguage:      raw.language,
    reply:            raw.reply_text ?? raw.display_text ?? "",
    petVoiceText:     raw.pet_voice_text,
    intent:           raw.intent,
    suggestedAction:  action ?? {
      id: "fallback", type: "breathe", title: "缓一缓", reason: "",
      estimatedMinutes: 1, pressureLevel: "low", primaryCta: "start", alternatives: [],
    },
    safetyDisclaimer: SAFETY_DISCLAIMER,
    safetyLevel:      raw.safety_level,
    wantsRecord:      raw.wants_record ?? raw.record_suggestion,
    recordSuggestion: raw.record_suggestion,
    createdAt:        new Date().toISOString(),
    bodyState:        raw.body_state ?? [],
    moodState:        raw.mood_state ?? [],
    detectedState: {
      bodySignals: raw.body_state ?? [],
      riskLevel: mapRiskLevel(raw.safety_level),
      language: mapLanguage(raw.language),
    },
  };
}

/** Map backend action-completion response → ActionCompletionResponse */
function mapCompletionResponse(raw: Record<string, unknown>, action: SuggestedAction): ActionCompletionResponse {
  const now = new Date().toISOString();
  const completionReply = (raw.completion_reply ?? raw.completionReply) as string | undefined;
  const askToRecord = (raw.ask_to_record ?? raw.askToRecord) as boolean | undefined;
  const recordPrompt = (raw.record_prompt ?? raw.recordPrompt) as string | undefined;
  const suggestedRecord = (raw.suggested_record ?? raw.suggestedRecord) as
    ActionCompletionResponse["suggestedRecord"] | undefined;
  const userOptions = (raw.user_options ?? raw.userOptions) as string[] | undefined;
  return {
    id:               `comp_${Date.now()}`,
    actionId:         action.id,
    completedAt:      now,
    reflectionPrompt: recordPrompt ?? "要记录这次吗？",
    safetyDisclaimer: SAFETY_DISCLAIMER,
    completionReply:  completionReply ?? "完成了，做得很好。",
    askToRecord:      askToRecord ?? true,
    recordPrompt:     recordPrompt ?? "要记录这次吗？",
    suggestedRecord,
    userOptions:      userOptions ?? ["save", "do_not_save"],
    proposedRecord: {
      id:               `rec_${Date.now()}`,
      createdAt:        now,
      kind:             "action" as const,
      title:            suggestedRecord?.related_action ?? action.title,
      summary:          suggestedRecord?.summary ?? completionReply ?? action.title,
      tags:             [] as string[],
      completedAction: {
        type: action.type,
        title: suggestedRecord?.related_action ?? action.title,
        durationSeconds: action.durationSeconds ?? action.estimatedMinutes * 60,
      },
      safetyDisclaimer: SAFETY_DISCLAIMER,
    },
  };
}

// ── AI Service ───────────────────────────────────────────────────────────────

export const webAiService = {
  understandUserInput: (input: UserInput): Promise<AIUnderstandResponse> =>
    post<RawUnderstandResponse>("/ai/understand", {
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
      durationSeconds: (raw.duration_seconds ?? raw.durationSeconds ?? action.durationSeconds ?? action.estimatedMinutes * 60) as number,
      tone:            "quiet",
      prompts:         ((raw.steps ?? raw.prompts ?? []) as Record<string, unknown>[]).map(
        (s, i) => ({
          id:      (s.step_id as string) ?? `step_${i}`,
          text:    (s.instruction_zh ?? s.instruction ?? s.text) as string,
          seconds: (s.duration_seconds ?? s.seconds ?? 15) as number,
        })
      ),
      safetyDisclaimer: (raw.safety_note ?? raw.safetyDisclaimer ?? SAFETY_DISCLAIMER) as string,
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
      durationSeconds: (raw.duration_seconds ?? raw.durationSeconds ?? action.durationSeconds ?? action.estimatedMinutes * 60) as number,
      intensity:       "gentle",
      avoidIf:         (raw.avoid ?? []) as string[],
      steps:           ((raw.moves ?? raw.steps ?? []) as Record<string, unknown>[]).map(
        (s, i) => ({
          id:          (s.step_id as string) ?? `step_${i}`,
          instruction: (s.instruction_zh ?? s.name_zh ?? s.instruction) as string,
          seconds:     (s.duration_seconds ?? s.seconds ?? 30) as number,
        })
      ),
      safetyDisclaimer: (raw.safety_note ?? raw.safetyDisclaimer ?? SAFETY_DISCLAIMER) as string,
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
    post<{ user_id: string; timeline: unknown[]; tag_counts: Record<string, number> }>("/ai/memory/timeline", {
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
