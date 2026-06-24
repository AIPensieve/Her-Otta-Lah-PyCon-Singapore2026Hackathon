import { useEffect, useState } from "react";
import type { ActionCompletionResponse, CalmScript, SuggestedAction } from "@ai-otter/shared-types";
import { Button, PageShell } from "@ai-otter/ui";
import { SaveRecordPrompt } from "../components/SaveRecordPrompt";
import { LoadingSpinner } from "../components/LoadingStates";
import { OtterIllustration } from "../components/OtterIllustration";
import { aiService as aiAgentService } from "../services/aiService";
import { recordService as recordRepository } from "../services/recordService";
import { deviceSimulator } from "../services/deviceSimulator";

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

  const goToStep = (next: number) => {
    setStep(next);
    if (script) {
      deviceSimulator.sendCommand({
        type: "SHOW_STEP",
        payload: { text: script.prompts[next]?.text ?? "", stepNum: next + 1, totalSteps: script.prompts.length, mode: "breathe" }
      });
    }
  };

  const complete = async () => {
    deviceSimulator.sendCommand({ type: "SHOW_COMPLETE", payload: { message: "呼吸完成，做得很好！" } });
    setCompletion(await aiAgentService.completeAction(action));
    setSaved(false);
  };

  const confirmSave = async () => {
    if (!completion || saved) return;
    await recordRepository.create(completion.proposedRecord);
    setSaved(true);
  };

  const totalSteps = Math.max(script?.prompts.length ?? 1, 1);
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <PageShell title="缓一缓">
      {!script ? (
        <LoadingSpinner message="正在生成呼吸引导..." />
      ) : (
        <section className="text-center">
          <div className="mb-4 flex items-center justify-between rounded-full border border-[#e4d8c5] bg-white/72 px-3 py-2 text-sm text-[#53624e] shadow-[0_8px_18px_rgba(90,74,46,0.06)]">
            <span className="font-semibold">跟着小水獭</span>
            <span className="rounded-full bg-[#446f4d] px-3 py-1 text-xs font-bold text-white">
              {step + 1} / {totalSteps}
            </span>
          </div>

          <div className="relative mx-auto mt-3 grid h-[250px] w-[250px] place-items-center">
            <div className="absolute inset-0 rounded-full bg-[#d7e9e7] shadow-[inset_0_0_0_1px_rgba(64,111,102,0.10)]" />
            <div className="absolute inset-3 rounded-full bg-[#c6dde5]" />
            <div
              className="absolute inset-2 rounded-full opacity-90"
              style={{
                background: `conic-gradient(#4b7a5a ${progress}%, rgba(255,255,255,0.72) ${progress}% 100%)`
              }}
            />
            <div className="absolute inset-8 rounded-full bg-[#d6e8e5]" />
            <div className="absolute inset-10 rounded-full border-[10px] border-white/75" />
            <OtterIllustration
              variant="breathing"
              size="card"
              alt="小水獭呼吸引导"
              className="relative z-[1] scale-[1.55]"
            />
          </div>

          <div className="mt-5">
            <h2 className="text-[1.35rem] font-semibold leading-tight text-[#20362b]">{script.title}</h2>
            <p className="mt-2 text-sm text-[#7f7668]">跟着圆环，慢一点就好。</p>
          </div>

          <div className="my-5 min-h-[112px] rounded-[22px] border border-[#e4d8c5] bg-white/78 px-5 py-5 shadow-[0_10px_22px_rgba(90,74,46,0.07)]">
            <p className="text-[1.12rem] font-semibold leading-relaxed text-[#253b30]">
              {script.prompts[step]?.text ?? action.reason}
            </p>
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
            {script.safetyDisclaimer}
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
