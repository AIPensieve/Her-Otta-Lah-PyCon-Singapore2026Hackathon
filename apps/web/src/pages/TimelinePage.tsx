import { useT } from "../locales";

export function TimelinePage() {
  const t = useT();
  const tl = t.timeline;

  return (
    <div className="tl-page">
      {/* ── Status bar ── */}
      <div className="tl-statusbar">
        <span className="tl-statusbar-time">9:41</span>
        <div className="tl-statusbar-icons">
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

      {/* ── Top Header Card ── */}
      <div className="tl-header-card">
        <div className="tl-header-top">
          <div className="tl-header-text">
            {tl.subtitle.split("\n").map((line, i) => <h2 key={i}>{line}</h2>)}
          </div>
          <button className="tl-calendar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D533C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {tl.calendarView}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D533C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="tl-header-otter">
          <img src="/assets/timeline-hero.png" alt="Recording Otter" />
        </div>

        <div className="tl-action-buttons">
          <button className="tl-action-btn tl-action-body">
            <div className="tl-action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#638A5A" stroke="#638A5A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
            </div>
            <div className="tl-action-text">
              <h3>{tl.recordBody}</h3>
              <p>{tl.recordBodyDesc}</p>
            </div>
          </button>

          <button className="tl-action-btn tl-action-mood">
            <div className="tl-action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#8A77A6" stroke="#8A77A6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </div>
            <div className="tl-action-text">
              <h3>{tl.recordMood}</h3>
              <p>{tl.recordMoodDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Timeline Section ── */}
      <div className="tl-container">
        <div className="tl-section-header">
          <h2>{tl.timelineTitle}</h2>
          <button className="tl-filter-btn">
            {tl.allRecords}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <div className="tl-list">
          <div className="tl-line" />

          {/* Item 1 – Body Check-In */}
          <div className="tl-item">
            <div className="tl-node">
              <div className="tl-node-icon tl-bg-green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#638A5A" stroke="#638A5A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /></svg>
              </div>
              <div className="tl-time">
                <div className="tl-date">{tl.today}</div>
                <div className="tl-clock">10:30</div>
              </div>
            </div>
            <div className="tl-card">
              <div className="tl-card-content">
                <h3>{tl.tag_body}</h3>
                <p>{tl.item1_desc}</p>
                <div className="tl-tags">
                  <span className="tl-tag tl-tag-green">{tl.item1_tag1}</span>
                  <span className="tl-tag tl-tag-green">{tl.item1_tag2}</span>
                </div>
              </div>
              <div className="tl-card-otter"><img src="/assets/timeline-otters/t1.png" alt="otter" /></div>
              <div className="tl-arrow" />
            </div>
          </div>

          {/* Item 2 – Mood Check-In */}
          <div className="tl-item">
            <div className="tl-node">
              <div className="tl-node-icon tl-bg-purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#8A77A6" stroke="#8A77A6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </div>
              <div className="tl-time">
                <div className="tl-date">{tl.today}</div>
                <div className="tl-clock">10:28</div>
              </div>
            </div>
            <div className="tl-card">
              <div className="tl-card-content">
                <h3>{tl.tag_mood}</h3>
                <p>{tl.item2_desc}</p>
                <div className="tl-tags">
                  <span className="tl-tag tl-tag-brown">{tl.item2_tag1}</span>
                  <span className="tl-tag tl-tag-green">{tl.item2_tag2}</span>
                </div>
              </div>
              <div className="tl-card-otter"><img src="/assets/timeline-otters/t2.png" alt="otter" /></div>
              <div className="tl-arrow" />
            </div>
          </div>

          {/* Item 3 – Move */}
          <div className="tl-item">
            <div className="tl-node">
              <div className="tl-node-icon tl-bg-orange">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F48A42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" fill="#F48A42"/><path d="M5 22h14"/><path d="M12 15v7"/><path d="M9 15l-3 4"/><path d="M15 15l3 4"/><path d="M7 10h10"/><path d="M12 7v8"/></svg>
              </div>
              <div className="tl-time">
                <div className="tl-date">{tl.today}</div>
                <div className="tl-clock">09:15</div>
              </div>
            </div>
            <div className="tl-card">
              <div className="tl-card-content">
                <h3>{tl.tag_move}</h3>
                <p>{tl.item3_desc}</p>
                <div className="tl-tags">
                  <span className="tl-tag tl-tag-gray">{tl.item3_tag1}</span>
                </div>
              </div>
              <div className="tl-card-otter"><img src="/assets/timeline-otters/t3.png" alt="otter" /></div>
              <div className="tl-arrow" />
            </div>
          </div>

          {/* Item 4 – Breathe */}
          <div className="tl-item">
            <div className="tl-node">
              <div className="tl-node-icon tl-bg-green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#638A5A" stroke="#638A5A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /></svg>
              </div>
              <div className="tl-time">
                <div className="tl-date tl-gray">{tl.yesterday}</div>
                <div className="tl-clock tl-gray">21:30</div>
              </div>
            </div>
            <div className="tl-card">
              <div className="tl-card-content">
                <h3>{tl.tag_breathe}</h3>
                <p>{tl.item4_desc}</p>
                <div className="tl-tags">
                  <span className="tl-tag tl-tag-gray">{tl.item4_tag1}</span>
                </div>
              </div>
              <div className="tl-card-otter"><img src="/assets/timeline-otters/t4.png" alt="otter" /></div>
              <div className="tl-arrow" />
            </div>
          </div>

          {/* Item 5 – Sleep */}
          <div className="tl-item">
            <div className="tl-node">
              <div className="tl-node-icon tl-bg-darkpurple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#4B3A60" stroke="#4B3A60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </div>
              <div className="tl-time">
                <div className="tl-date tl-gray">{tl.yesterday}</div>
                <div className="tl-clock tl-gray">07:45</div>
              </div>
            </div>
            <div className="tl-card">
              <div className="tl-card-content">
                <h3>{tl.tag_sleep}</h3>
                <p>{tl.item5_desc}</p>
                <div className="tl-tags">
                  <span className="tl-tag tl-tag-green">{tl.item5_tag1}</span>
                </div>
              </div>
              <div className="tl-card-otter"><img src="/assets/timeline-otters/t5.png" alt="otter" /></div>
              <div className="tl-arrow" />
            </div>
          </div>

        </div>

        <button className="tl-load-more">
          {tl.loadMore}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

      </div>

    </div>
  );
}
