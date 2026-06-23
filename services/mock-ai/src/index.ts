import type {
  AIUnderstandResponse,
  ActionCompletionResponse,
  CalmScript,
  ExercisePlan,
  SuggestedAction,
  UserInput
} from "@ai-otter/shared-types";

const SAFETY_DISCLAIMER = "这只是根据记录整理，不是医学诊断。";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export interface AiAgentService {
  understandUserInput(input: UserInput): Promise<AIUnderstandResponse>;
  createCalmScript(action: SuggestedAction): Promise<CalmScript>;
  createExercisePlan(action: SuggestedAction): Promise<ExercisePlan>;
  completeAction(action: SuggestedAction): Promise<ActionCompletionResponse>;
}

export class MockAiAgentService implements AiAgentService {
  async understandUserInput(input: UserInput): Promise<AIUnderstandResponse> {
    const text = input.text.toLowerCase();
    const wantsMove = /动|move|walk|stiff|僵|酸/.test(text);
    const bodySignals = [
      /膝|knee/.test(text) ? "knee discomfort" : undefined,
      /睡|sleep|醒/.test(text) ? "sleep change" : undefined,
      /热|hot|潮热/.test(text) ? "hot flash" : undefined,
      /累|tired|fatigue/.test(text) ? "tiredness" : undefined
    ].filter(Boolean) as string[];

    const suggestedAction: SuggestedAction = wantsMove
      ? {
          id: id("action"),
          type: "move",
          title: "2 分钟轻柔肩颈活动",
          reason: "先用很轻的动作让身体醒一点，不追求运动量。",
          estimatedMinutes: 2,
          pressureLevel: "very-low",
          primaryCta: "start",
          alternatives: ["skip", "change", "later"]
        }
      : {
          id: id("action"),
          type: "breathe",
          title: "1 分钟慢慢呼吸",
          reason: "先不用分析原因，让身体和情绪都慢下来一点。",
          estimatedMinutes: 1,
          pressureLevel: "very-low",
          primaryCta: "start",
          alternatives: ["skip", "change", "later"]
        };

    return {
      id: id("ai"),
      inputId: input.id,
      detectedState: {
        mood: /烦|anxious|焦虑|irritated/.test(text) ? "anxious" : /累|tired/.test(text) ? "tired" : "unclear",
        bodySignals,
        riskLevel: "normal",
        language: input.locale
      },
      reply: "我听到了。我们先做一个很小、没有压力的动作。",
      suggestedAction,
      safetyDisclaimer: SAFETY_DISCLAIMER,
      createdAt: now()
    };
  }

  async createCalmScript(action: SuggestedAction): Promise<CalmScript> {
    return {
      id: id("calm"),
      actionId: action.id,
      title: action.title,
      durationSeconds: 60,
      tone: "quiet",
      prompts: [
        { id: "p1", text: "把肩膀放松一点，先不用回答任何问题。", seconds: 15 },
        { id: "p2", text: "慢慢吸气，像把空气放进身体里。", seconds: 15 },
        { id: "p3", text: "慢慢呼气，把刚才的紧绷放下来。", seconds: 15 },
        { id: "p4", text: "很好，就这样，给自己一点点空间。", seconds: 15 }
      ],
      safetyDisclaimer: SAFETY_DISCLAIMER
    };
  }

  async createExercisePlan(action: SuggestedAction): Promise<ExercisePlan> {
    return {
      id: id("move"),
      actionId: action.id,
      title: action.title,
      durationSeconds: 120,
      intensity: "gentle",
      avoidIf: ["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
      steps: [
        { id: "m1", instruction: "坐稳或站稳，慢慢转动肩膀。", seconds: 30 },
        { id: "m2", instruction: "双手轻放大腿，慢慢抬头看远处。", seconds: 30 },
        { id: "m3", instruction: "手臂自然下垂，左右轻轻摆动。", seconds: 30 },
        { id: "m4", instruction: "停下来，感受呼吸和身体。", seconds: 30 }
      ],
      safetyDisclaimer: SAFETY_DISCLAIMER
    };
  }

  async completeAction(action: SuggestedAction): Promise<ActionCompletionResponse> {
    return {
      id: id("done"),
      actionId: action.id,
      completedAt: now(),
      reflectionPrompt: "要不要把这次状态简单记下来？",
      proposedRecord: {
        id: id("record"),
        actionId: action.id,
        kind: "action",
        title: action.type === "breathe" ? "完成了一次缓一缓" : "完成了一次轻活动",
        summary: `刚刚完成：${action.title}。`,
        tags: [action.type, "low-pressure"],
        completedAction: {
          type: action.type,
          title: action.title,
          durationSeconds: action.estimatedMinutes * 60
        },
        createdAt: now(),
        safetyDisclaimer: SAFETY_DISCLAIMER
      },
      safetyDisclaimer: SAFETY_DISCLAIMER
    };
  }
}

export const aiAgentService: AiAgentService = new MockAiAgentService();
export { SAFETY_DISCLAIMER };
