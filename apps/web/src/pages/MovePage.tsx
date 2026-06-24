import { useEffect, useState } from "react";
import type { ActionCompletionResponse, ExercisePlan, SuggestedAction } from "@ai-otter/shared-types";
import { Button, PageShell } from "@ai-otter/ui";
import { SaveRecordPrompt } from "../components/SaveRecordPrompt";
import { LoadingSpinner } from "../components/LoadingStates";
import { OtterIllustration } from "../components/OtterIllustration";
import { aiService as aiAgentService } from "../services/aiService";
import { recordService as recordRepository } from "../services/recordService";
import { deviceSimulator } from "../services/deviceSimulator";

const fallbackAction: SuggestedAction = {
  id: "action_move_default",
  type: "move",
  title: "2 分钟轻柔肩颈活动",
  reason: "用很轻的动作让身体醒一点。",
  estimatedMinutes: 2,
  pressureLevel: "very-low",
  primaryCta: "start",
  alternatives: ["skip", "change", "later"]
};

export function MovePage({ activeAction }: { activeAction: SuggestedAction | null }) {
  const action = activeAction?.type === "move" ? activeAction : fallbackAction;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [step, setStep] = useState(0);
  const [completion, setCompletion] = useState<ActionCompletionResponse | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPlan(null);
    aiAgentService.createExercisePlan(action).then(setPlan);
    setCompletion(null);
    setSaved(false);
  }, [action]);

  const goToStep = (next: number) => {
    setStep(next);
    if (plan) {
      deviceSimulator.sendCommand({
        type: "SHOW_STEP",
        payload: { text: plan.steps[next]?.instruction ?? "", stepNum: next + 1, totalSteps: plan.steps.length, mode: "move" }
      });
    }
  };

  const complete = async () => {
    deviceSimulator.sendCommand({ type: "SHOW_COMPLETE", payload: { message: "活动完成，做得很好！" } });
    setCompletion(await aiAgentService.completeAction(action));
    setSaved(false);
  };

  const confirmSave = async () => {
    if (!completion || saved) return;
    await recordRepository.create(completion.proposedRecord);
    setSaved(true);
  };

  const totalSteps = Math.max(plan?.steps.length ?? 1, 1);
  const currentStep = plan?.steps[step];
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <PageShell title="动一动">
      {!plan ? (
        <LoadingSpinner message="正在为您生成专属的小动作..." />
      ) : (
        <section className="text-center">
          <div className="mb-4 flex items-center justify-between rounded-full border border-[#e4d8c5] bg-white/72 px-3 py-2 text-sm text-[#53624e] shadow-[0_8px_18px_rgba(90,74,46,0.06)]">
            <span className="font-semibold">轻轻活动</span>
            <span className="rounded-full bg-[#446f4d] px-3 py-1 text-xs font-bold text-white">
              {step + 1} / {totalSteps}
            </span>
          </div>

          <div className="relative mx-auto mt-3 grid h-[250px] w-[250px] place-items-center">
            <div className="absolute inset-0 rounded-full bg-[#dfe8d2] shadow-[inset_0_0_0_1px_rgba(68,111,77,0.12)]" />
            <div
              className="absolute inset-2 rounded-full opacity-95"
              style={{
                background: `conic-gradient(#4b7a5a ${progress}%, rgba(255,255,255,0.76) ${progress}% 100%)`
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
          </div>

          <div className="mt-5">
            <h2 className="text-[1.35rem] font-semibold leading-tight text-[#20362b]">{plan.title}</h2>
            <p className="mt-2 text-sm text-[#7f7668]">身体觉得不舒服，随时可以停下。</p>
          </div>

          <div className="my-5 rounded-[22px] border border-[#e4d8c5] bg-white/78 px-5 py-5 text-left shadow-[0_10px_22px_rgba(90,74,46,0.07)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c846f]">Step {step + 1}</p>
            <p className="mt-2 text-[1.12rem] font-semibold leading-relaxed text-[#253b30]">
              {currentStep?.instruction ?? action.reason}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#6c705b]">
              <span className="rounded-full bg-[#eef4e8] px-3 py-1">轻柔</span>
              <span className="rounded-full bg-[#f6efe3] px-3 py-1">{currentStep?.seconds ?? 30} 秒</span>
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
              disabled={step === totalSteps - 1}
              onClick={() => goToStep(Math.min(totalSteps - 1, step + 1))}
            >
              下一步
            </Button>
          </div>

          <Button
            className="mt-4 w-full rounded-[20px] bg-[#20362b] py-4 text-white active:bg-[#16261e]"
            onClick={complete}
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
