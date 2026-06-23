import { useEffect, useState } from "react";
import type { ActionCompletionResponse, CalmScript, SuggestedAction } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { SaveRecordPrompt } from "../components/SaveRecordPrompt";
import { recordRepository } from "../store/localRecords";
import { LoadingSpinner } from "../components/LoadingStates";

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
  const [completion, setCompletion] = useState<ActionCompletionResponse | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScript(null); // Set to null first to trigger loading spinner
    aiAgentService.createCalmScript(action).then(setScript);
    setCompletion(null);
    setSaved(false);
  }, [action]);

  const complete = async () => {
    setCompletion(await aiAgentService.completeAction(action));
    setSaved(false);
  };

  const confirmSave = async () => {
    if (!completion || saved) return;
    await recordRepository.create(completion.proposedRecord);
    setSaved(true);
  };

  return (
    <PageShell title="缓一缓">
      {!script ? (
        <LoadingSpinner message="正在生成呼吸引导..." />
      ) : (
        <Panel className="text-center px-4 py-8 shadow-sm border-slate-200">
          <div className="relative mx-auto mb-10 mt-6 grid size-48 place-items-center">
            <div className="absolute inset-0 rounded-full bg-teal-100/50 animate-breathe" />
            <div className="absolute inset-4 rounded-full bg-teal-200/50 animate-breathe" style={{ animationDelay: "1s" }} />
            <div className="relative grid size-28 place-items-center rounded-full bg-teal-600 text-white shadow-lg text-lg font-medium">
              呼吸
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900">{script.title}</h2>
          <div className="my-6 flex min-h-24 items-center justify-center rounded-xl bg-stone-50 p-4">
            <p className="text-xl font-medium text-slate-800 leading-relaxed">
              {script.prompts[step]?.text ?? action.reason}
            </p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button tone="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</Button>
            <Button onClick={() => setStep((value) => Math.min((script.prompts.length) - 1, value + 1))}>下一步</Button>
          </div>
          
          <Button className="mt-4 w-full bg-slate-900 text-white active:bg-slate-800" onClick={complete}>完成并记录</Button>
          <p className="mt-6 text-xs italic text-slate-400">{script.safetyDisclaimer}</p>
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
