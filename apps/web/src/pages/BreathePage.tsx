import { useEffect, useState } from "react";
import type { CalmScript, SuggestedAction } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { saveRecord } from "../store/localRecords";

const fallbackAction: SuggestedAction = {
  id: "action_breathe_default",
  type: "breathe",
  title: "1 分钟慢慢呼吸",
  reason: "给自己一点时间，把呼吸放慢。",
  estimatedMinutes: 1,
  pressureLevel: "very-low",
  primaryCta: "start",
  alternatives: ["skip", "change", "later"]
};

export function BreathePage({ activeAction }: { activeAction: SuggestedAction | null }) {
  const action = activeAction?.type === "breathe" ? activeAction : fallbackAction;
  const [script, setScript] = useState<CalmScript | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    aiAgentService.createCalmScript(action).then(setScript);
  }, [action]);

  const complete = async () => {
    const completion = await aiAgentService.completeAction(action);
    saveRecord(completion.proposedRecord);
    setSaved(true);
  };

  return (
    <PageShell title="缓一缓">
      <Panel className="text-center">
        <div className="mx-auto mb-6 grid size-44 place-items-center rounded-full bg-teal-100">
          <div className="grid size-28 place-items-center rounded-full bg-teal-600 text-white">呼吸</div>
        </div>
        <h2 className="text-2xl font-bold">{script?.title ?? action.title}</h2>
        <p className="mt-3 min-h-16 text-lg text-slate-700">{script?.prompts[step]?.text ?? action.reason}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button tone="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</Button>
          <Button onClick={() => setStep((value) => Math.min((script?.prompts.length ?? 1) - 1, value + 1))}>下一步</Button>
        </div>
        <Button className="mt-3 w-full" onClick={complete}>完成并记录</Button>
        {saved && <p className="mt-3 font-semibold text-teal-800">已保存到记录。</p>}
        <p className="mt-4 text-sm text-slate-500">{script?.safetyDisclaimer}</p>
      </Panel>
    </PageShell>
  );
}
