import { useEffect, useState } from "react";
import type { ExercisePlan, SuggestedAction } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { saveRecord } from "../store/localRecords";

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    aiAgentService.createExercisePlan(action).then(setPlan);
  }, [action]);

  const complete = async () => {
    const completion = await aiAgentService.completeAction(action);
    saveRecord(completion.proposedRecord);
    setSaved(true);
  };

  return (
    <PageShell title="动一动">
      <Panel>
        <h2 className="text-2xl font-bold">{plan?.title ?? action.title}</h2>
        <p className="mt-2 text-slate-600">强度：轻柔。任何明显不舒服都可以立刻停下。</p>
        <div className="my-5 rounded-lg bg-amber-50 p-4 text-lg font-semibold text-amber-950">
          {plan?.steps[step]?.instruction ?? action.reason}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button tone="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</Button>
          <Button onClick={() => setStep((value) => Math.min((plan?.steps.length ?? 1) - 1, value + 1))}>下一步</Button>
        </div>
        <Button className="mt-3 w-full" onClick={complete}>完成并记录</Button>
        {saved && <p className="mt-3 font-semibold text-teal-800">已保存到记录。</p>}
        <p className="mt-4 text-sm text-slate-500">{plan?.safetyDisclaimer}</p>
      </Panel>
    </PageShell>
  );
}
