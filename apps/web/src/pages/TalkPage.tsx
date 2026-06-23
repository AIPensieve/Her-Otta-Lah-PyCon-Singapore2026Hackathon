import { useState } from "react";
import type { AIUnderstandResponse, SuggestedAction, UserInput } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";
import { Button, PageShell, Panel } from "@ai-otter/ui";
import { deviceSimulator } from "../services/deviceSimulator";

const examples = ["我有点累", "陪我缓一缓", "想动一动", "昨晚没睡好"];

export function TalkPage({ onStartAction }: { onStartAction: (action: SuggestedAction) => void }) {
  const [text, setText] = useState("");
  const [response, setResponse] = useState<AIUnderstandResponse | null>(null);

  const submit = async (value = text) => {
    const clean = value.trim();
    if (!clean) return;

    deviceSimulator.sendCommand({
      type: "PLAY_SHORT_REPLY",
      payload: { text: "我在听", locale: "mixed" }
    });

    const input: UserInput = {
      id: `input_${Date.now()}`,
      text: clean,
      inputMode: "voice-simulated",
      locale: "mixed",
      createdAt: new Date().toISOString()
    };

    setResponse(await aiAgentService.understandUserInput(input));
  };

  return (
    <PageShell title="说说">
      <section className="mb-5 rounded-lg bg-teal-700 p-5 text-white">
        <div className="mb-4 flex items-center gap-4">
          <div className="grid size-20 place-items-center rounded-full bg-white text-4xl">o</div>
          <div>
            <p className="text-xl font-bold">今天想先说点什么？</p>
            <p className="mt-1 text-sm text-teal-50">身体和心情，都可以告诉我。</p>
          </div>
        </div>
        <textarea
          className="min-h-28 w-full rounded-lg border-0 p-4 text-lg text-slate-950 outline-none"
          placeholder="例如：我今天 very tired，不想运动。"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button className="mt-3 w-full bg-white text-teal-800" onClick={() => submit()}>
          模拟语音输入
        </Button>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {examples.map((example) => (
          <Button key={example} tone="secondary" onClick={() => submit(example)}>
            {example}
          </Button>
        ))}
      </div>

      {response && (
        <Panel>
          <p className="text-lg font-semibold">{response.reply}</p>
          <div className="mt-4 rounded-lg bg-stone-50 p-4">
            <p className="text-xl font-bold">{response.suggestedAction.title}</p>
            <p className="mt-2 text-base text-slate-700">{response.suggestedAction.reason}</p>
            <p className="mt-2 text-sm text-slate-500">约 {response.suggestedAction.estimatedMinutes} 分钟</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => onStartAction(response.suggestedAction)}>Start</Button>
            <Button tone="secondary" onClick={() => setText("")}>Skip</Button>
            <Button tone="secondary" onClick={() => submit("我想换一个更轻松的方式")}>Change</Button>
            <Button tone="quiet" onClick={() => setResponse(null)}>Later</Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">{response.safetyDisclaimer}</p>
        </Panel>
      )}
    </PageShell>
  );
}
