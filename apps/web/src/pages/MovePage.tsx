import { useEffect, useState } from "react";
import type { ActionCompletionResponse, ExercisePlan, SuggestedAction } from "@ai-otter/shared-types";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { SaveRecordPrompt } from "../components/SaveRecordPrompt";
import { LoadingSpinner } from "../components/LoadingStates";
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

  return (
    <PageShell title="动一动">
      {!plan ? (
        <LoadingSpinner message="正在为您生成专属的小动作..." />
      ) : (
        <Panel className="p-5">
          <h2 className="text-2xl font-bold text-slate-900">{plan.title}</h2>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-teal-50 px-3 py-2">
            <div className="mt-0.5 text-teal-600">i</div>
            <p className="text-sm font-medium text-teal-900">强度：轻柔。任何明显不舒服都可以立刻停下。</p>
          </div>
          
          <div className="my-6 min-h-32 rounded-xl bg-stone-50 border border-stone-100 p-5 shadow-inner">
            <p className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">Step {step + 1}</p>
            <p className="text-xl font-semibold text-slate-800 leading-relaxed">
              {plan.steps[step]?.instruction ?? action.reason}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button tone="secondary" onClick={() => goToStep(Math.max(0, step - 1))}>上一步</Button>
            <Button onClick={() => goToStep(Math.min(plan.steps.length - 1, step + 1))}>下一步</Button>
          </div>
          
          <Button className="mt-4 w-full bg-slate-900 text-white active:bg-slate-800" onClick={complete}>完成并记录</Button>
          <p className="mt-6 text-xs italic text-slate-400">{plan.safetyDisclaimer}</p>
        </Panel>
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
