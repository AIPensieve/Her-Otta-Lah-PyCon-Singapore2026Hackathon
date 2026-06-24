import { useState } from "react";
import type { AIUnderstandResponse, SuggestedAction, UserInput } from "@ai-otter/shared-types";
import { aiAgentService } from "@ai-otter/mock-ai";

export function TalkPage({ onStartAction }: { onStartAction: (action: SuggestedAction) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIUnderstandResponse | null>(null);

  const submit = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setIsLoading(true);
    setResponse(null);
    const input: UserInput = {
      id: `input_${Date.now()}`,
      text: clean,
      inputMode: "typed",
      locale: "mixed",
      createdAt: new Date().toISOString()
    };
    setResponse(await aiAgentService.understandUserInput(input));
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          {/* Otter sprite from the spritesheet – default state */}
          <div className="tp-otter-sprite tp-otter-default tp-otter-pulse" />
          <p className="tp-loading-text">小水獭正在思考…</p>
        </div>
      </div>
    );
  }

  if (response) {
    return (
      <div className="tp-page">
        <div className="tp-result-wrap">
          <div className="tp-otter-sprite tp-otter-default tp-otter-sm" />
          <div className="tp-bubble">
            <p className="tp-bubble-text">{response.reply}</p>
          </div>
          <div className="tp-action-card">
            <p className="tp-action-title">{response.suggestedAction.title}</p>
            <p className="tp-action-reason">{response.suggestedAction.reason}</p>
            <button
              className="tp-btn-start"
              onClick={() => onStartAction(response.suggestedAction)}
            >
              开始
            </button>
            <div className="tp-btn-row">
              <button className="tp-btn-sec" onClick={() => setResponse(null)}>跳过</button>
              <button className="tp-btn-sec" onClick={() => setResponse(null)}>换一个</button>
              <button className="tp-btn-sec" onClick={() => setResponse(null)}>稍后</button>
            </div>
          </div>
          {response.safetyDisclaimer && (
            <p className="tp-disclaimer">{response.safetyDisclaimer}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* ── Status bar ── */}
      <div className="tp-statusbar">
        <span className="tp-statusbar-time">9:41</span>
        <div className="tp-statusbar-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="3" width="3" height="9" rx="0.5" fill="#2c2416"/>
            <rect x="4.5" y="2" width="3" height="10" rx="0.5" fill="#2c2416"/>
            <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="#2c2416"/>
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#2c2416"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.5C13.2 1.6 10.7 0.5 8 0.5C5.3 0.5 2.8 1.6 1 3.5L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill="#2c2416"/>
            <path d="M8 5.5C9.4 5.5 10.6 6.1 11.5 7L12.9 5.6C11.6 4.3 9.9 3.5 8 3.5C6.1 3.5 4.4 4.3 3.1 5.6L4.5 7C5.4 6.1 6.6 5.5 8 5.5Z" fill="#2c2416"/>
            <circle cx="8" cy="10" r="1.5" fill="#2c2416"/>
          </svg>
          <div className="tp-battery">
            <div className="tp-battery-inner" style={{width: '75%'}} />
          </div>
        </div>
      </div>

      {/* ── Header row ── */}
      <div className="tp-header">
        <div>
          <h1 className="tp-greeting">早上好！<br />我在这里陪着你 <span>☀️</span></h1>
          <div className="tp-connected-badge">
            <span className="tp-connected-dot" />
            <span>小水獭已连接</span>
          </div>
        </div>
        <button className="tp-lang-btn">
          <span className="tp-lang-icon">🌐</span>
          <span>中/En</span>
        </button>
      </div>

      {/* ── Otter illustration ── */}
      {/* Using the full spritesheet and positioning to show only the talk-page otter */}
      <div className="tp-otter-wrap">
        <div className="tp-otter-sprite tp-otter-default" />
        <div className="tp-heart">❤️</div>
      </div>

      {/* ── Prompt ── */}
      <p className="tp-prompt">今天想先说点什么？</p>
      <p className="tp-subprompt">我在，慢慢说。<br />身体和心情，都可以告诉我。</p>

      {/* ── Hold to Talk button ── */}
      <div className="tp-hold-wrap">
        <button
          className="tp-hold-btn"
          onClick={() => {
            const val = window.prompt("模拟语音输入：", "我今天有点累，不想动");
            if (val) submit(val);
          }}
        >
          <svg className="tp-mic" viewBox="0 0 24 24" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          按住说话
        </button>
      </div>

      {/* ── Shortcut chips ── */}
      <div className="tp-chips">
        <button className="tp-chip" onClick={() => submit("我有点累")}>
          <span className="tp-chip-icon">🔋</span> 我有点累
        </button>
        <button className="tp-chip" onClick={() => submit("陪我缓一缓")}>
          <span className="tp-chip-icon">🍃</span> 陪我缓一缓
        </button>
        <button className="tp-chip" onClick={() => submit("想动一动")}>
          <span className="tp-chip-icon">🏃‍♀️</span> 想动一动
        </button>
        <button className="tp-chip" onClick={() => submit("昨晚没睡好")}>
          <span className="tp-chip-icon">🌙</span> 昨晚没睡好
        </button>
      </div>

      {/* ── Footer notice ── */}
      <p className="tp-footer-note">今天还没有记录</p>
    </div>
  );
}
