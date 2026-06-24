import type {
  AIUnderstandResponse,
  ActionCompletionResponse,
  CalmScript,
  ExercisePlan,
  SuggestedAction,
  UserInput
} from "@ai-otter/shared-types";

const SAFETY_DISCLAIMER_ZH = "这只是根据记录整理，不是医学诊断。";
const SAFETY_DISCLAIMER_EN = "This is based on your records only, not medical advice.";
const SAFETY_DISCLAIMER = SAFETY_DISCLAIMER_ZH;

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function isEnglish(locale: string) {
  return locale === "en" || locale === "en-SG";
}

export interface AiAgentService {
  understandUserInput(input: UserInput): Promise<AIUnderstandResponse>;
  createCalmScript(action: SuggestedAction): Promise<CalmScript>;
  createExercisePlan(action: SuggestedAction): Promise<ExercisePlan>;
  completeAction(action: SuggestedAction): Promise<ActionCompletionResponse>;
}

export class MockAiAgentService implements AiAgentService {
  async understandUserInput(input: UserInput): Promise<AIUnderstandResponse> {
    const text = input.text.toLowerCase();
    const en = isEnglish(input.locale);
    const wantsMove = /动|move|walk|stiff|僵|酸|neck|shoulder/.test(text);
    const bodySignals = [
      /膝|knee/.test(text) ? (en ? "knee discomfort" : "膝盖不适") : undefined,
      /睡|sleep|醒/.test(text) ? (en ? "sleep change" : "睡眠变化") : undefined,
      /热|hot|潮热/.test(text) ? (en ? "hot flash" : "潮热") : undefined,
      /累|tired|fatigue/.test(text) ? (en ? "tiredness" : "疲惫") : undefined
    ].filter(Boolean) as string[];

    const suggestedAction: SuggestedAction = wantsMove
      ? {
          id: id("action"),
          type: "move",
          title: en ? "2-Min Gentle Neck & Shoulder Stretch" : "2 分钟轻柔肩颈活动",
          reason: en
            ? "A few gentle movements to wake your body up — no pressure at all."
            : "先用很轻的动作让身体醒一点，不追求运动量。",
          estimatedMinutes: 2,
          pressureLevel: "very-low",
          primaryCta: "start",
          alternatives: ["skip", "change", "later"]
        }
      : {
          id: id("action"),
          type: "breathe",
          title: en ? "1-Min Slow Breathing" : "1 分钟慢慢呼吸",
          reason: en
            ? "Let's just slow down together — no need to figure anything out right now."
            : "先不用分析原因，让身体和情绪都慢下来一点。",
          estimatedMinutes: 1,
          pressureLevel: "very-low",
          primaryCta: "start",
          alternatives: ["skip", "change", "later"]
        };

    const reply = en
      ? "I hear you. Let's try one small, gentle thing together — no pressure."
      : "我听到了。我们先做一个很小、没有压力的动作。";

    const petVoiceText = en
      ? "I'm right here with you. Let's take it one small step at a time."
      : "我在这里陪着你，我们一起来，慢慢来。";

    return {
      id: id("ai"),
      inputId: input.id,
      detectedState: {
        mood: /烦|anxious|焦虑|irritated/.test(text) ? "anxious" : /累|tired/.test(text) ? "tired" : "unclear",
        bodySignals,
        riskLevel: "normal",
        language: input.locale
      },
      reply,
      petVoiceText,
      suggestedAction,
      safetyDisclaimer: en ? SAFETY_DISCLAIMER_EN : SAFETY_DISCLAIMER_ZH,
      createdAt: now()
    };
  }

  async createCalmScript(action: SuggestedAction): Promise<CalmScript> {
    const en = /[a-zA-Z]/.test(action.title) && !/[一-鿿]/.test(action.title);
    return {
      id: id("calm"),
      actionId: action.id,
      title: action.title,
      durationSeconds: 60,
      tone: "quiet",
      prompts: en
        ? [
            { id: "p1", text: "Let your shoulders drop. You don't need to answer anything right now.", seconds: 15 },
            { id: "p2", text: "Breathe in slowly… like you're filling a little space inside.", seconds: 15 },
            { id: "p3", text: "Breathe out… let go of whatever's been tightening.", seconds: 15 },
            { id: "p4", text: "Good. Just like that. Give yourself a little room.", seconds: 15 }
          ]
        : [
            { id: "p1", text: "把肩膀放松一点，先不用回答任何问题。", seconds: 15 },
            { id: "p2", text: "慢慢吸气，像把空气放进身体里。", seconds: 15 },
            { id: "p3", text: "慢慢呼气，把刚才的紧绷放下来。", seconds: 15 },
            { id: "p4", text: "很好，就这样，给自己一点点空间。", seconds: 15 }
          ],
      safetyDisclaimer: en ? SAFETY_DISCLAIMER_EN : SAFETY_DISCLAIMER_ZH
    };
  }

  async createExercisePlan(action: SuggestedAction): Promise<ExercisePlan> {
    const en = /[a-zA-Z]/.test(action.title) && !/[一-鿿]/.test(action.title);
    return {
      id: id("move"),
      actionId: action.id,
      title: action.title,
      durationSeconds: 120,
      intensity: "gentle",
      avoidIf: en
        ? ["noticeable pain", "dizziness", "chest tightness", "if your doctor advised against exercise"]
        : ["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
      steps: en
        ? [
            { id: "m1", instruction: "Sit or stand comfortably, and slowly roll your shoulders.", seconds: 30 },
            { id: "m2", instruction: "Hands resting on your thighs, slowly tilt your head up and look ahead.", seconds: 30 },
            { id: "m3", instruction: "Let your arms hang naturally, and gently sway side to side.", seconds: 30 },
            { id: "m4", instruction: "Come to a still. Notice your breath and how your body feels.", seconds: 30 }
          ]
        : [
            { id: "m1", instruction: "坐稳或站稳，慢慢转动肩膀。", seconds: 30 },
            { id: "m2", instruction: "双手轻放大腿，慢慢抬头看远处。", seconds: 30 },
            { id: "m3", instruction: "手臂自然下垂，左右轻轻摆动。", seconds: 30 },
            { id: "m4", instruction: "停下来，感受呼吸和身体。", seconds: 30 }
          ],
      safetyDisclaimer: en ? SAFETY_DISCLAIMER_EN : SAFETY_DISCLAIMER_ZH
    };
  }

  async completeAction(action: SuggestedAction): Promise<ActionCompletionResponse> {
    const en = /[a-zA-Z]/.test(action.title) && !/[一-鿿]/.test(action.title);
    return {
      id: id("done"),
      actionId: action.id,
      completedAt: now(),
      reflectionPrompt: en
        ? "Would you like to save a quick note about how you feel right now?"
        : "要不要把这次状态简单记下来？",
      proposedRecord: {
        id: id("record"),
        actionId: action.id,
        kind: "action",
        title: action.type === "breathe"
          ? (en ? "Completed a breathing session" : "完成了一次缓一缓")
          : (en ? "Completed a gentle stretch" : "完成了一次轻活动"),
        summary: en
          ? `Just completed: ${action.title}.`
          : `刚刚完成：${action.title}。`,
        tags: [action.type, "low-pressure"],
        completedAction: {
          type: action.type,
          title: action.title,
          durationSeconds: action.estimatedMinutes * 60
        },
        createdAt: now(),
        safetyDisclaimer: en ? SAFETY_DISCLAIMER_EN : SAFETY_DISCLAIMER_ZH
      },
      safetyDisclaimer: en ? SAFETY_DISCLAIMER_EN : SAFETY_DISCLAIMER_ZH
    };
  }
}

export const aiAgentService: AiAgentService = new MockAiAgentService();
export { SAFETY_DISCLAIMER };
