import { useCallback, useEffect, useState } from "react";
import type { ActionCompletionResponse, ExercisePlan, SuggestedAction, DeviceScreenState } from "@ai-otter/shared-types";
import { Button, PageShell } from "@ai-otter/ui";
import { SaveRecordPrompt } from "../components/SaveRecordPrompt";
import { LoadingSpinner } from "../components/LoadingStates";
import { OtterIllustration } from "../components/OtterIllustration";
import { aiService as aiAgentService } from "../services/aiService";
import { recordService as recordRepository } from "../services/recordService";
import { deviceAdapter } from "../services/deviceAdapter";
import { getSkill } from "../data/skillRegistry";
import { useCountdown } from "../hooks/useCountdown";
import { useSpeech } from "../hooks/useSpeech";

const fallbackAction: SuggestedAction = {
  id: "action_move_default",
  type: "move",
  title: "2 分钟轻柔肩颈活动",
  reason: "用很轻的动作让身体醒一点。",
  estimatedMinutes: 2,
  pressureLevel: "very-low",
  primaryCta: "start",
  alternatives: ["skip", "change", "later"],
  skillId: "neck_relax_3min",
};

function skillToExercisePlan(action: SuggestedAction): ExercisePlan | null {
  const skill = action.skillId ? getSkill(action.skillId) : null;
  if (!skill || skill.type !== "move") return null;
  return {
    id: `skill_${skill.skill_id}`,
    actionId: action.id,
    title: skill.title_zh,
    durationSeconds: skill.duration_seconds,
    intensity: "gentle",
    avoidIf: ["明显疼痛", "头晕", "胸闷", "医生建议避免活动"],
    steps: skill.steps.map((s) => ({ id: s.step_id, instruction: s.instruction_zh, seconds: s.duration_seconds })),
    safetyDisclaimer: skill.safety_note_zh,
  };
}

export function MovePage({ activeAction }: { activeAction: SuggestedAction | null }) {
  const action = activeAction?.type === "move" ? activeAction : fallbackAction;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [step, setStep] = useState(0);
  const [completion, setCompletion] = useState<ActionCompletionResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const { speak, stop } = useSpeech();

  const currentStep = plan?.steps[step];
  const stepSeconds = currentStep?.seconds ?? 30;
  const totalSteps = Math.max(plan?.steps.length ?? 1, 1);
  const isLastStep = step === totalSteps - 1;

  const advanceStep = useCallback(() => {
    if (!plan || !autoAdvance) return;
    if (isLastStep) {
      handleComplete();
    } else {
      goToStep(step + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, step, isLastStep, autoAdvance]);

  const { remaining, progress } = useCountdown(stepSeconds, advanceStep);

  useEffect(() => {
    setPlan(null);
    setCompletion(null);
    setSaved(false);
    setStep(0);
    const fromRegistry = skillToExercisePlan(action);
    if (fromRegistry) {
      setPlan(fromRegistry);
    } else {
      aiAgentService.createExercisePlan(action).then(setPlan);
    }
  }, [action]);

  // Speak instruction when step changes
  useEffect(() => {
    if (!currentStep) return;
    const timer = setTimeout(() => speak(currentStep.instruction), 400);
    return () => clearTimeout(timer);
  }, [step, currentStep?.instruction]);

  useEffect(() => () => stop(), []);

  function goToStep(next: number) {
    stop();
    setStep(next);
    if (plan) {
      const skill = action.skillId ? getSkill(action.skillId) : null;
      const rawState = (skill?.steps[next]?.screen_state ?? "exercise_countdown") as DeviceScreenState;
      deviceAdapter.showStep({
        state: rawState,
        text: plan.steps[next]?.instruction ?? "",
        stepNum: next + 1,
        totalSteps: plan.steps.length,
        durationSeconds: plan.steps[next]?.seconds ?? 30,
        mode: "move",
      });
    }
  }

  async function handleComplete() {
    stop();
    deviceAdapter.showComplete("活动完成，做得很好！");
    speak("完成了，做得很好。");
    setCompletion(await aiAgentService.completeAction(action));
    setSaved(false);
  }

  const confirmSave = async () => {
    if (!completion || saved) return;
    await recordRepository.create(completion.proposedRecord);
    setSaved(true);
  };

  const ringPct = Math.round(progress * 100);
  const overallProgress = Math.round(((step + (1 - progress)) / totalSteps) * 100);

  return (
    <PageShell title="动一动">
      {!plan ? (
        <LoadingSpinner message="正在为您生成专属的小动作..." />
      ) : (
        <section className="text-center">
          {/* Step counter */}
          <div className="mb-4 flex items-center justify-between rounded-full border border-[#e4d8c5] bg-white/72 px-3 py-2 text-sm text-[#53624e] shadow-[0_8px_18px_rgba(90,74,46,0.06)]">
            <span className="font-semibold">轻轻活动</span>
            <span className="rounded-full bg-[#446f4d] px-3 py-1 text-xs font-bold text-white">
              {step + 1} / {totalSteps}
            </span>
          </div>

          {/* Circular ring + otter + countdown */}
          <div className="relative mx-auto mt-3 grid h-[250px] w-[250px] place-items-center">
            <div className="absolute inset-0 rounded-full bg-[#dfe8d2]" />
            <div
              className="absolute inset-2 rounded-full opacity-95 transition-all duration-1000"
              style={{
                background: `conic-gradient(#4b7a5a ${overallProgress}%, rgba(255,255,255,0.76) ${overallProgress}% 100%)`,
              }}
            />
            {/* Step countdown ring */}
            <div
              className="absolute inset-4 rounded-full transition-all duration-1000"
              style={{
                background: `conic-gradient(rgba(74,122,90,0.55) ${ringPct}%, transparent ${ringPct}% 100%)`,
              }}
            />
            <div className="absolute inset-8 rounded-full bg-[#f1ecd9]" />
            <div className="absolute inset-10 rounded-full border-[10px] border-white/78" />

            <OtterIllustration
              variant="default"
              size="card"
              alt="小水獭动作引导"
              className="relative z-[1] scale-[1.5]"
            />

            {/* Countdown badge */}
            <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/85 px-3 py-0.5 text-sm font-bold text-[#446f4d] shadow-sm">
              {remaining}s
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-[1.35rem] font-semibold leading-tight text-[#20362b]">{plan.title}</h2>
            <p className="mt-1 text-xs text-[#9a9184]">
              {autoAdvance ? "自动跳步已开启" : "手动模式"}
              <button className="ml-2 underline" onClick={() => setAutoAdvance((v) => !v)}>
                {autoAdvance ? "切换手动" : "切换自动"}
              </button>
            </p>
          </div>

          {/* Step instruction */}
          <div className="my-5 rounded-[22px] border border-[#e4d8c5] bg-white/78 px-5 py-5 text-left shadow-[0_10px_22px_rgba(90,74,46,0.07)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c846f]">Step {step + 1}</p>
            <p className="mt-2 text-[1.12rem] font-semibold leading-relaxed text-[#253b30]">
              {currentStep?.instruction ?? action.reason}
            </p>
            <div className="mt-3 h-1 w-full rounded-full bg-[#e4d8c5]">
              <div
                className="h-1 rounded-full bg-[#4b7a5a] transition-all duration-1000"
                style={{ width: `${ringPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6c705b]">
              <span className="rounded-full bg-[#eef4e8] px-3 py-1">轻柔</span>
              <span className="rounded-full bg-[#f6efe3] px-3 py-1">{stepSeconds} 秒</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              tone="secondary"
              className="rounded-[18px] border-[#e4d8c5] bg-white/80 text-[#355f43]"
              disabled={step === 0}
              onClick={() => goToStep(Math.max(0, step - 1))}
            >
              上一步
            </Button>
            <Button
              className="rounded-[18px] bg-[#446f4d] text-white active:bg-[#385f42]"
              disabled={isLastStep}
              onClick={() => goToStep(Math.min(totalSteps - 1, step + 1))}
            >
              下一步
            </Button>
          </div>

          <Button
            className="mt-4 w-full rounded-[20px] bg-[#20362b] py-4 text-white active:bg-[#16261e]"
            onClick={handleComplete}
          >
            完成并记录
          </Button>

          <p className="mx-auto mt-5 max-w-[310px] text-xs leading-relaxed text-[#9a9184]">
            {plan.safetyDisclaimer}
          </p>
        </section>
      )}

      {completion && (
        <SaveRecordPrompt
          completion={completion}
          saved={saved}
          onDismiss={() => setCompletion(null)}
          onSave={confirmSave}
        />
      )}
    </PageShell>
  );
}
