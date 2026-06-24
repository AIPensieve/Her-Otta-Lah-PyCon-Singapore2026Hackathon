import { useState } from "react";
import type { SuggestedAction } from "@ai-otter/shared-types";
import { useT } from "../locales";
import { DemoModal } from "../components/DemoModal";

interface CardModal { title: string; desc: string }

export function BreathePage({ activeAction }: { activeAction?: SuggestedAction | null }) {
  const t = useT();
  const b = t.breathe;
  const [modal, setModal] = useState<CardModal | null>(null);

  const openCard = (title: string) =>
    setModal({ title: b.startSession, desc: `${title} — ${b.startSessionDesc}` });

  return (
    <div className="bp-page">
      {/* ── Status bar ── */}
      <div className="bp-statusbar">
        <span className="bp-statusbar-time">9:41</span>
        <div className="bp-statusbar-icons">
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
      <div className="bp-header">
        <button className="bp-back-btn" onClick={() => { window.location.hash = "#/talk"; }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A6B53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="bp-header-title">
          <h1>{b.title}</h1>
          <p>{b.subtitle}</p>
        </div>
        <div className="bp-header-otter">
          <img src="/assets/otter-breathe-header.png" alt="Meditating Otter" />
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className="bp-content">

        {/* Section A */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-a">{b.secA_letter}</div>
            <div className="bp-sec-title">
              <h2>{b.secA_title}</h2>
              <p>{b.secA_desc}</p>
            </div>
          </div>
          <div className="bp-cards">
            <button className="bp-card bp-card-a" onClick={() => openCard(b.a1_title)}>
              <div className="bp-card-info">
                <h3>{b.a1_title}</h3>
                <p>{b.a1_desc}</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> {b.a1_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/a1.png" alt="otter" /></div>
              <div className="bp-card-arrow" />
            </button>
            <button className="bp-card bp-card-a" onClick={() => openCard(b.a2_title)}>
              <div className="bp-card-info">
                <h3>{b.a2_title} <span className="bp-icon-moon">🌙</span></h3>
                <p>{b.a2_desc}</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> {b.a2_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/a2.png" alt="otter" /></div>
              <div className="bp-card-arrow" />
            </button>
            <button className="bp-card bp-card-a" onClick={() => openCard(b.a3_title)}>
              <div className="bp-card-info">
                <h3>{b.a3_title}</h3>
                <p>{b.a3_desc}</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> {b.a3_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/a3.png" alt="otter" /></div>
              <div className="bp-card-arrow" />
            </button>
          </div>
        </div>

        {/* Section B */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-b">{b.secB_letter}</div>
            <div className="bp-sec-title">
              <h2>{b.secB_title}</h2>
              <p>{b.secB_desc}</p>
            </div>
          </div>
          <div className="bp-cards">
            <button className="bp-card bp-card-b" onClick={() => openCard(b.b1_title)}>
              <div className="bp-card-info">
                <h3>{b.b1_title}</h3>
                <p>{b.b1_desc}</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> {b.b1_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/b1.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-red" />
            </button>
            <button className="bp-card bp-card-b" onClick={() => openCard(b.b2_title)}>
              <div className="bp-card-info">
                <h3>{b.b2_title}</h3>
                <p>{b.b2_desc}</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> {b.b2_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/b2.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-red" />
            </button>
            <button className="bp-card bp-card-b" onClick={() => openCard(b.b3_title)}>
              <div className="bp-card-info">
                <h3>{b.b3_title}</h3>
                <p>{b.b3_desc}</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> {b.b3_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/b3.png" alt="otter" /></div>
            </button>
          </div>
        </div>

        {/* Section C */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-c">{b.secC_letter}</div>
            <div className="bp-sec-title">
              <h2>{b.secC_title}</h2>
              <p>{b.secC_desc}</p>
            </div>
          </div>
          <div className="bp-cards">
            <button className="bp-card bp-card-c" onClick={() => openCard(b.c1_title)}>
              <div className="bp-card-info">
                <h3>{b.c1_title}</h3>
                <p>{b.c1_desc}</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> {b.c1_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/c1.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </button>
            <button className="bp-card bp-card-c" onClick={() => openCard(b.c2_title)}>
              <div className="bp-card-info">
                <h3>{b.c2_title}</h3>
                <p>{b.c2_desc}</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> {b.c2_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/c2.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </button>
            <button className="bp-card bp-card-c" onClick={() => openCard(b.c3_title)}>
              <div className="bp-card-info">
                <h3>{b.c3_title}</h3>
                <p>{b.c3_desc}</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> {b.c3_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/c3.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </button>
          </div>
          <div className="bp-pagination">
            <span className="bp-dot bp-dot-active" />
            <span className="bp-dot" />
            <span className="bp-dot" />
          </div>
        </div>

        {/* Section D */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-d">{b.secD_letter}</div>
            <div className="bp-sec-title">
              <h2>{b.secD_title}</h2>
              <p>{b.secD_desc}</p>
            </div>
          </div>
          <div className="bp-cards">
            <button className="bp-card bp-card-d" onClick={() => openCard(b.d1_title)}>
              <div className="bp-card-info">
                <h3>{b.d1_title}</h3>
                <p>{b.d1_desc}</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> {b.d1_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/d1.png" alt="otter" /></div>
              <div className="bp-card-arrow bp-arrow-purple" />
            </button>
            <button className="bp-card bp-card-d" onClick={() => openCard(b.d2_title)}>
              <div className="bp-card-info">
                <h3>{b.d2_title}</h3>
                <p>{b.d2_desc}</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> {b.d2_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/d2.png" alt="otter" /></div>
            </button>
            <button className="bp-card bp-card-d" onClick={() => openCard(b.d3_title)}>
              <div className="bp-card-info">
                <h3>{b.d3_title}</h3>
                <p>{b.d3_desc}</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> {b.d3_time}</div>
              </div>
              <div className="bp-card-otter"><img src="/assets/breathe-otters/d3.png" alt="otter" /></div>
            </button>
          </div>
        </div>

      </div>

      {modal && (
        <DemoModal
          icon="🌬️"
          title={modal.title}
          desc={modal.desc}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
