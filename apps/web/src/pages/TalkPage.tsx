import { useState } from "react";
import type { AIUnderstandResponse, SuggestedAction, UserInput } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { deviceSimulator } from "../services/deviceSimulator";
import { LoadingSpinner } from "../components/LoadingStates";

const examples = ["我有点累", "陪我缓一缓", "想动一动", "昨晚没睡好"];

type RecommendationStatus = "ready" | "skipped" | "later" | "changed";

export function TalkPage({ onStartAction }: { onStartAction: (action: SuggestedAction) => void }) {
  const [text, setText] = useState("");
  const [response, setResponse] = useState<AIUnderstandResponse | null>(null);
  const [status, setStatus] = useState<RecommendationStatus>("ready");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (value = text) => {
    const clean = value.trim();
    if (!clean) return;

    deviceSimulator.sendCommand({
      type: "PLAY_SHORT_REPLY",
      payload: { text: "我在听", locale: "mixed" }
    });

    setIsLoading(true);
    setResponse(null);

    const input: UserInput = {
      id: `input_${Date.now()}`,
      text: clean,
      inputMode: "voice-simulated",
      locale: "mixed",
      createdAt: new Date().toISOString()
    };

    setResponse(await aiAgentService.understandUserInput(input));
    setStatus("ready");
    setIsLoading(false);
  };

  const skipRecommendation = () => {
    setText("");
    setResponse(null);
    setStatus("skipped");
  };

  const changeRecommendation = async () => {
    const nextPrompt = response?.suggestedAction.type === "breathe"
      ? "我想换成一个非常轻柔的动一动"
      : "我想换成一个一分钟缓一缓";

    await submit(nextPrompt);
    setStatus("changed");
  };

  const keepForLater = () => {
    setStatus("later");
  };

  return (
    <PageShell title="说说">
      <section className="mb-5 rounded-xl bg-teal-700 p-6 text-white shadow-md">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid size-20 place-items-center rounded-full bg-white/20 text-4xl">🦦</div>
          <div>
            <p className="text-xl font-bold">今天想先说点什么？</p>
            <p className="mt-1 text-sm text-teal-100">身体和心情，都可以告诉我。</p>
          </div>
        </div>
        <textarea
          className="min-h-28 w-full rounded-xl border-0 bg-white/10 p-4 text-lg text-white placeholder-teal-200 outline-none focus:bg-white/20 transition-colors"
          placeholder="例如：我今天 very tired，不想运动。"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button className="mt-4 w-full bg-white text-teal-900 active:bg-teal-50" onClick={() => submit()}>
          模拟语音输入
        </Button>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {examples.map((example) => (
          <Button key={example} tone="secondary" onClick={() => submit(example)} className="text-slate-700 border-slate-200 bg-white shadow-sm hover:bg-slate-50">
            {example}
          </Button>
        ))}
      </div>

      {status === "skipped" && (
        <Panel className="mb-6 border-dashed border-2 border-slate-200 bg-stone-50 text-center py-6">
          <p className="text-lg font-bold text-slate-800">没关系，先不做也可以。</p>
          <p className="mt-2 text-slate-600">你可以随时回来，只说一句话就好。</p>
        </Panel>
      )}

      {isLoading && <LoadingSpinner message="小水獭正在思考..." />}

      {response && (
        <Panel className="border-teal-100 shadow-sm">
          <div className="mb-4 rounded-lg bg-teal-50 px-4 py-3">
            <p className="text-lg font-medium text-teal-900">{response.reply}</p>
          </div>
          
          {status === "changed" && (
            <p className="mb-4 rounded-lg bg-teal-100/50 p-3 text-sm font-semibold text-teal-900 border border-teal-200">
              已为你换成另一个更轻松的选择。
            </p>
          )}
          {status === "later" && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900 border border-amber-200">
              我先帮你留着。想开始的时候再点 Start。
            </p>
          )}
          
          <div className="rounded-xl bg-stone-50 border border-stone-100 p-5 shadow-inner">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xl font-bold text-slate-900">{response.suggestedAction.title}</p>
              <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 uppercase tracking-wide">
                约 {response.suggestedAction.estimatedMinutes} 分钟
              </span>
            </div>
            <p className="mt-3 text-base text-slate-700 leading-relaxed">{response.suggestedAction.reason}</p>
            
            <div className="mt-5">
              <Button className="w-full text-lg shadow-md" onClick={() => onStartAction(response.suggestedAction)}>开始 (Start)</Button>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <Button tone="quiet" onClick={keepForLater} className="text-sm font-medium">稍后</Button>
            <Button tone="quiet" onClick={changeRecommendation} className="text-sm font-medium">换一个</Button>
            <Button tone="quiet" onClick={skipRecommendation} className="text-sm font-medium">跳过</Button>
          </div>
          
          {response.safetyDisclaimer && (
            <p className="mt-5 text-xs italic text-slate-400 text-center">{response.safetyDisclaimer}</p>
          )}
        </Panel>
      )}
    </PageShell>
  );
}
