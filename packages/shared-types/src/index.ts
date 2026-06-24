export type LocaleCode = "zh-SG" | "en-SG" | "mixed";

export type UserInput = {
  id: string;
  userId?: string;
  text: string;
  inputMode: "typed" | "voice-simulated" | "voice";
  locale: LocaleCode;
  createdAt: string;
};

export type SuggestedActionType = "breathe" | "move" | "record" | "talk";

export type SuggestedAction = {
  id: string;
  type: SuggestedActionType;
  title: string;
  reason: string;
  estimatedMinutes: number;
  pressureLevel: "very-low" | "low" | "medium";
  primaryCta: "start";
  alternatives: Array<"skip" | "change" | "later">;
};

export type AIUnderstandResponse = {
  id: string;
  inputId: string;
  detectedState: {
    mood?: "tired" | "anxious" | "sad" | "irritated" | "calm" | "unclear";
    bodySignals: string[];
    riskLevel: "normal" | "needs-human-help";
    language: LocaleCode;
  };
  reply: string;
  suggestedAction: SuggestedAction;
  safetyDisclaimer: string;
  createdAt: string;
};

export type ExercisePlan = {
  id: string;
  actionId: string;
  title: string;
  durationSeconds: number;
  intensity: "gentle" | "easy";
  avoidIf: string[];
  steps: Array<{
    id: string;
    instruction: string;
    seconds: number;
  }>;
  safetyDisclaimer: string;
};

export type CalmScript = {
  id: string;
  actionId: string;
  title: string;
  durationSeconds: number;
  tone: "warm" | "quiet" | "sleepy";
  prompts: Array<{
    id: string;
    text: string;
    seconds: number;
  }>;
  safetyDisclaimer: string;
};

export type RecordCard = {
  id: string;
  userId?: string;
  sourceInputId?: string;
  actionId?: string;
  kind: "body" | "mood" | "action" | "mixed";
  title: string;
  summary: string;
  tags: string[];
  completedAction?: {
    type: SuggestedActionType;
    title: string;
    durationSeconds: number;
  };
  createdAt: string;
  safetyDisclaimer: string;
};

export type ActionCompletionResponse = {
  id: string;
  actionId: string;
  completedAt: string;
  reflectionPrompt: string;
  proposedRecord: RecordCard;
  safetyDisclaimer: string;
};

export type DeviceState = {
  deviceId: string;
  connection: "disconnected" | "connecting" | "connected";
  batteryLevel: number;
  screenState: "idle" | "listening" | "breathing" | "moving" | "sleeping";
  lightMode: "off" | "soft" | "breathing" | "alert";
  volume: number;
  lastSeenAt?: string;
};

export type DeviceCommand =
  | {
      type: "SET_SCREEN_STATE";
      payload: Pick<DeviceState, "screenState">;
    }
  | {
      type: "SET_LIGHT_MODE";
      payload: Pick<DeviceState, "lightMode">;
    }
  | {
      type: "SET_VOLUME";
      payload: Pick<DeviceState, "volume">;
    }
  | {
      type: "PLAY_SHORT_REPLY";
      payload: { text: string; locale: LocaleCode };
    }
  | {
      type: "SHOW_STEP";
      payload: {
        text: string;
        stepNum: number;
        totalSteps: number;
        mode: "breathe" | "move";
      };
    }
  | {
      type: "SHOW_COMPLETE";
      payload: { message: string };
    }
  | {
      type: "VIBRATE";
      payload: { pattern: "short" | "long" | "double" };
    };
