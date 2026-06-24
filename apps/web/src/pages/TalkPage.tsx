import { useState } from "react";
import type { AIUnderstandResponse, SuggestedAction, UserInput } from "@ai-otter/shared-types";
import { aiService as aiAgentService } from "../services/aiService";
import { deviceAdapter } from "../services/deviceAdapter";
import { useSpeech } from "../hooks/useSpeech";
import { useT, useLang } from "../locales";

type LocationStep = "confirm" | "success";

export function TalkPage({ onStartAction }: { onStartAction: (action: SuggestedAction) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIUnderstandResponse | null>(null);
  const [locationStep, setLocationStep] = useState<LocationStep | null>(null);
  const { speak } = useSpeech();
  const t = useT();
  const { lang, toggleLang } = useLang();
  const ttsLang = lang === "en" ? "en-US" as const : "zh-CN" as const;
  const locale = lang === "en" ? "en-SG" as const : "zh-SG" as const;

  const submit = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    deviceAdapter.setListening(lang === "zh" ? "我在听" : "Listening…");
    setIsLoading(true);
    setResponse(null);
    const input: UserInput = {
      id: `input_${Date.now()}`,
      text: clean,
      inputMode: "typed",
      locale,
      createdAt: new Date().toISOString()
    };
    deviceAdapter.setThinking(lang === "zh" ? "整理中" : "Thinking…");
    const result = await aiAgentService.understandUserInput(input);
    setResponse(result);
    setIsLoading(false);
    const voiceLine = result.petVoiceText ?? result.reply;
    if (voiceLine) setTimeout(() => speak(voiceLine, ttsLang), 300);
  };

  const clearResponse = () => {
    setResponse(null);
    deviceAdapter.showWatchface({
      screen: "default",
      title: lang === "zh" ? "默认陪伴" : "Companion",
      subtitle: lang === "zh" ? "我在这里陪着你" : "I'm right here with you",
      locale,
      lightMode: "soft",
      vibration: "none",
    });
  };

  if (isLoading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <p className="tp-loading-text">{t.talk.thinking}</p>
        </div>
      </div>
    );
  }

  if (response) {
    return (
      <div className="tp-page">
        <div className="tp-result-wrap">
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
              {t.common.start}
            </button>
            <div className="tp-btn-row">
              <button className="tp-btn-sec" onClick={clearResponse}>{t.common.skip}</button>
              <button className="tp-btn-sec" onClick={clearResponse}>{t.common.change}</button>
              <button className="tp-btn-sec" onClick={clearResponse}>{t.common.later}</button>
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
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 11h2v-2H1v2zm4 0h2v-4H5v4zm4 0h2v-7H9v7zm4 0h2V1h-2v10z"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 5.5c4-4 10-4 14 0M3.5 8c2.5-2.5 6.5-2.5 9 0M8 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/>
          </svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="20" height="10" rx="2.5"/>
            <path d="M23 4v4" strokeLinecap="round"/>
            <rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" stroke="none"/>
          </svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="tp-header">
        <div className="tp-header-left">
          <h1 className="tp-greeting">
            {t.talk.greetingMorning}<br />{t.talk.greetingCompanion}
          </h1>
          <div className="tp-badges">
            <div className="tp-badge tp-badge-gray">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A6B53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
              <span>{t.me.connected}</span>
            </div>
          </div>
        </div>
        <div className="tp-header-right">
          <button className="tp-badge tp-badge-white tp-lang-btn" onClick={toggleLang}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{t.common.langLabel}</span>
          </button>
          <div className="tp-battery-text">
            <svg width="22" height="11" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="20" height="10" rx="2.5"/>
              <path d="M23 4v4" strokeLinecap="round"/>
              <rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" stroke="none"/>
            </svg>
            <span>80%</span>
          </div>
        </div>
      </div>

      {/* ── Hero Image ── */}
      <div className="tp-hero">
        <img src="/assets/otter-hero-new.png" alt="Otter" className="tp-hero-img" />
      </div>

      {/* ── Main Content ── */}
      <div className="tp-content">
        <div className="tp-prompt-area">
          <h2 className="tp-prompt-title">{t.talk.greeting}</h2>
          <p className="tp-prompt-subtitle">{t.talk.subtitle}</p>
        </div>

        <button
          className="tp-hold-btn"
          onClick={() => {
            const val = window.prompt(t.talk.simulateVoice, t.talk.quickTiredInput);
            if (val) submit(val);
          }}
        >
          <svg className="tp-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
          <div className="tp-hold-text">
            <span className="tp-hold-title">{t.talk.holdTitle}</span>
            <span className="tp-hold-subtitle">{t.talk.holdSubtitle}</span>
          </div>
        </button>

        <div className="tp-grid">
          <button className="tp-grid-item tp-grid-green" onClick={() => submit(t.talk.quickTiredInput)}>
            <span className="tp-grid-icon">🦦</span>
            <span className="tp-grid-text">{t.talk.quickTired}</span>
          </button>
          <button className="tp-grid-item tp-grid-orange" onClick={() => submit(t.talk.quickNeckInput)}>
            <span className="tp-grid-icon">🤸</span>
            <span className="tp-grid-text">{t.talk.quickNeck}</span>
          </button>
          <button className="tp-grid-item tp-grid-purple" onClick={() => submit(t.talk.quickSleepInput)}>
            <span className="tp-grid-icon">🌙</span>
            <span className="tp-grid-text">{t.talk.quickSleep}</span>
          </button>
          <button className="tp-grid-item tp-grid-orange" onClick={() => submit(t.talk.quickHotInput)}>
            <span className="tp-grid-icon">🌡️</span>
            <span className="tp-grid-text">{t.talk.quickHot}</span>
          </button>
        </div>

        <button className="tp-record-link" onClick={() => { window.location.hash = "#/timeline"; }}>
          <div className="tp-record-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A6B53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M16 18h.01"></path>
            </svg>
            <span>{t.talk.noRecord}</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0B5B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* ── Share Location ── */}
        <button className="tp-location-btn" onClick={() => setLocationStep("confirm")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{t.talk.shareLocation}</span>
        </button>
      </div>

      {/* ── Location Share Modal ── */}
      {locationStep && (
        <div className="demo-modal-overlay" onClick={() => setLocationStep(null)}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
            {locationStep === "confirm" ? (
              <>
                <div className="demo-modal-icon">📍</div>
                <p className="demo-modal-title">{t.talk.shareLocationModalTitle}</p>
                <div className="tp-location-card">
                  <div className="tp-location-addr">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#638A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{t.talk.shareLocationModalAddr}</span>
                  </div>
                  <div className="tp-location-contact">
                    <span className="tp-location-label">{t.talk.shareLocationModalWith}</span>
                    <span className="tp-location-name">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#638A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {t.talk.shareLocationModalContact}
                    </span>
                  </div>
                </div>
                <button
                  className="demo-modal-close"
                  style={{ background: '#4A6B53' }}
                  onClick={() => setLocationStep("success")}
                >
                  {t.talk.shareLocationConfirm}
                </button>
                <button
                  className="demo-modal-close"
                  style={{ background: 'transparent', color: '#889891', fontSize: 13, marginTop: 0 }}
                  onClick={() => setLocationStep(null)}
                >
                  {t.common.skip}
                </button>
              </>
            ) : (
              <>
                <div className="demo-modal-icon">✅</div>
                <p className="demo-modal-title">{t.talk.shareLocationSuccess}</p>
                <p className="demo-modal-desc">{t.talk.shareLocationSuccessDesc}</p>
                <div className="tp-location-card" style={{ width: '100%' }}>
                  <div className="tp-location-addr">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#638A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{t.talk.shareLocationModalAddr}</span>
                  </div>
                  <div className="tp-location-contact">
                    <span className="tp-location-label">{t.talk.shareLocationModalWith}</span>
                    <span className="tp-location-name" style={{ color: '#638A5A' }}>
                      ✓ {t.talk.shareLocationModalContact}
                    </span>
                  </div>
                </div>
                <button className="demo-modal-close" onClick={() => setLocationStep(null)}>
                  {t.common.close}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
