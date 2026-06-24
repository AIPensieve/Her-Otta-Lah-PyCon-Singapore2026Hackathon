import type { SuggestedAction } from "@ai-otter/shared-types";
import { useT } from "../locales";

export function MovePage({ activeAction }: { activeAction?: SuggestedAction | null }) {
  const t = useT();
  const m = t.move;

  return (
    <div className="move-page">
      {/* ── Status bar ── */}
      <div className="move-statusbar">
        <span className="move-statusbar-time">9:41</span>
        <div className="move-statusbar-icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 11h2v-2H1v2zm4 0h2v-4H5v4zm4 0h2v-7H9v7zm4 0h2V1h-2v10z" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 5.5c4-4 10-4 14 0M3.5 8c2.5-2.5 6.5-2.5 9 0M8 11.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
          </svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="20" height="10" rx="2.5" />
            <path d="M23 4v4" strokeLinecap="round" />
            <rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="move-header">
        <button className="move-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A6B53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="move-header-title">
          <h1>{m.title}</h1>
          <p>{m.subtitle}</p>
        </div>
        <div className="move-header-otter">
          <img src="/assets/move-hero.png" alt="Stretching Otter" />
        </div>
      </div>

      {/* ── Daily Move Card ── */}
      <div className="move-daily-card">
        <div className="move-daily-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {m.recommended}
        </div>
        <div className="move-daily-content">
          <div className="move-daily-info">
            <h2>{m.daily_title}</h2>
            <p>{m.daily_desc}</p>
            <div className="move-daily-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{m.daily_meta}</span>
            </div>
          </div>
          <div className="move-daily-otter">
            <img src="/assets/move-daily-otter.png" alt="Daily Otter" />
          </div>
          <button className="move-play-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {m.daily_start}
          </button>
        </div>
      </div>

      {/* ── Selected Exercises ── */}
      <div className="move-exercises">
        <h2 className="move-section-title">{m.section_title}</h2>

        <div className="move-exercise-card">
          <div className="move-ex-icon" style={{ background: '#FFF1E5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F48A42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" fill="#F48A42" />
              <path d="M5 22h14M12 15v7M9 15l-3 4M15 15l3 4M7 10h10M12 7v8M12 7c-2 0-4-2-4-2s2-2 4-2 4 2 4 2-2 2-4 2z" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3>{m.ex1_title}</h3>
            <p>{m.ex1_desc}</p>
            <div className="move-ex-meta">{m.ex1_meta}</div>
          </div>
          <button className="move-ex-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>

        <div className="move-exercise-card">
          <div className="move-ex-icon" style={{ background: '#EAF2EB' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#608A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" fill="#608A63" />
              <path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3>{m.ex2_title}</h3>
            <p>{m.ex2_desc}</p>
            <div className="move-ex-meta">{m.ex2_meta}</div>
          </div>
          <button className="move-ex-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>

        <div className="move-exercise-card">
          <div className="move-ex-icon" style={{ background: '#F1E9F4' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A6B96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" fill="#8A6B96" />
              <path d="M12 10v12M8 15l4-5 4 5M8 22h8" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3>{m.ex3_title}</h3>
            <p>{m.ex3_desc}</p>
            <div className="move-ex-meta">{m.ex3_meta}</div>
          </div>
          <button className="move-ex-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>

        <div className="move-exercise-card">
          <div className="move-ex-icon" style={{ background: '#E6F0F9' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4C82B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" fill="#4C82B8" />
              <path d="M12 12v10M8 22h8M8 12l4-5 4 5" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3>{m.ex4_title}</h3>
            <p>{m.ex4_desc}</p>
            <div className="move-ex-meta">{m.ex4_meta}</div>
          </div>
          <button className="move-ex-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>

        <div className="move-exercise-card">
          <div className="move-ex-icon" style={{ background: '#FFF7E6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E6A23C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" fill="#E6A23C" />
              <path d="M12 10l-4 4M12 10l4 4M12 10v12M8 22h8M7 10h10" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3>{m.ex5_title}</h3>
            <p>{m.ex5_desc}</p>
            <div className="move-ex-meta">{m.ex5_meta}</div>
          </div>
          <button className="move-ex-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>

        <div className="move-exercise-card move-more-card">
          <div className="move-ex-icon" style={{ background: 'transparent' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#608A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div className="move-ex-info">
            <h3 style={{ color: '#1a1a1a' }}>{m.more_title}</h3>
            <p>{m.more_desc}</p>
          </div>
          <div className="move-more-arrow" />
        </div>
      </div>
    </div>
  );
}
