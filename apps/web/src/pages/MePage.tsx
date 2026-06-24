import { useT, useLang } from "../locales";

export function MePage() {
  const t = useT();
  const { lang, toggleLang } = useLang();
  const isNightMode = true; // UI display only

  return (
    <div className="me-page">
      {/* ── Status bar ── */}
      <div className="me-statusbar">
        <span className="me-statusbar-time">9:41</span>
        <div className="me-statusbar-icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M1 10h3v2H1zm4-3h3v5H5zm4-3h3v8H9zm4-4h3v12h-3z"/></svg>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M9 12A13 13 0 010 3l2-2a10 10 0 0014 0l2 2a13 13 0 01-9 9z"/></svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor"><rect x="1" y="1" width="20" height="10" rx="3"/><path d="M23 4v4"/></svg>
        </div>
      </div>

      {/* ── Language Toggle Button ── */}
      <button className="me-lang-btn" onClick={toggleLang} aria-label="Switch language">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00351f" strokeWidth="2" style={{ marginRight: 4 }}>
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
        <span style={{ fontWeight: 500, color: '#00351f' }}>{t.me.langBtn}</span>
      </button>

      {/* ── Header ── */}
      <div className="me-header">
        <div className="me-header-text">
          <h1>{t.me.title}</h1>
          <p>{t.me.companionPrefix}</p>
          <div className="me-days">
            <strong>28</strong> {t.me.companionSuffix}
          </div>
        </div>
        <div className="me-header-otter">
          <img src="/assets/me-hero.png" alt="Otter with heart" />
        </div>
      </div>

      {/* ── Avatar Card ── */}
      <div className="me-avatar-card">
        <div className="me-avatar">
          <img src="/assets/me-avatar.png" alt="Avatar" />
          <div className="me-avatar-badge" />
        </div>
        <div className="me-avatar-info">
          <h2>{t.me.deviceName}</h2>
          <div className="me-device-status">
            <span className="me-wifi">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="#638A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M1 3.5a10.5 10.5 0 0112 0M3.5 6a6 6 0 017 0M7 8.5h.01"/></svg>
              {t.me.connected}
            </span>
            <span className="me-battery">
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="#638A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="1" y="1" width="10" height="6" rx="1"/><path d="M13 3v2"/></svg>
              {t.me.battery}
            </span>
          </div>
        </div>
        <div className="me-arrow" />
      </div>

      {/* ── Settings List ── */}
      <div className="me-settings-list">

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51724B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="10" width="4" height="10"/><rect x="10" y="4" width="4" height="16"/><rect x="2" y="14" width="4" height="6"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.stats}</h3>
            <p>{t.me.statsDesc}</p>
          </div>
          <div className="me-arrow" />
        </div>

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51724B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.goals}</h3>
            <p>{t.me.goalsDesc}</p>
          </div>
          <div className="me-arrow" />
        </div>

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51724B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.reminders}</h3>
            <p>{t.me.remindersDesc}</p>
          </div>
          <div className="me-arrow" />
        </div>

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path fill="#4a5568" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.nightMode}</h3>
            <p>{t.me.nightModeDesc}</p>
          </div>
          <div className="me-switch">
            <div className={`me-switch-track ${isNightMode ? 'active' : ''}`}>
              <div className="me-switch-thumb" />
            </div>
          </div>
        </div>

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51724B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.voice}</h3>
            <p>{t.me.voiceDesc}</p>
          </div>
          <div className="me-arrow" />
        </div>

        <div className="me-setting-item">
          <div className="me-setting-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#51724B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </div>
          <div className="me-setting-content">
            <h3>{t.me.settings}</h3>
            <p>{t.me.settingsDesc}</p>
          </div>
          <div className="me-arrow" />
        </div>

      </div>

      {/* ── Feedback Button ── */}
      <div className="me-feedback-btn">
        <div className="me-feedback-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D16B58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </div>
        <div className="me-setting-content">
          <h3 style={{ color: '#1a1a1a', margin: 0, fontSize: 16 }}>{t.me.feedback}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#889891' }}>{t.me.feedbackDesc}</p>
        </div>
        <div className="me-arrow" style={{ marginLeft: 'auto' }} />
      </div>

    </div>
  );
}
