const fs = require('fs');

const bottomNavCSS = `
/* ==============================
   BOTTOM NAV  (shared)
   ============================== */

/* existing bottom nav styles from @ai-otter/ui are kept */

.talk-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.talk-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0,0,0,0.05);
  z-index: 50;
}

.talk-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 30px;
  transition: all 0.2s;
  min-width: 60px;
}

.talk-nav-item.active {
  background: #466A51;
  color: white;
}

.talk-nav-item:not(.active) {
  color: #a0a0a0;
}

.talk-nav-item svg {
  width: 24px;
  height: 24px;
  color: inherit;
}

.talk-nav-item span {
  font-size: 10px;
  font-weight: 500;
  color: inherit;
}

/* Home Page specific styles */
.home-page {
  padding-bottom: 80px; /* space for nav */
}
`;

const newCSS = \`
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  font-family: 'PingFang SC', 'Hiragino Sans GB', Inter, ui-sans-serif, system-ui, sans-serif;
  background: #FCFAF5;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  background: #FCFAF5;
  -webkit-font-smoothing: antialiased;
}

button,
a,
textarea {
  -webkit-tap-highlight-color: transparent;
}

/* ==============================
   TALK PAGE  (tp-)
   ============================== */

.tp-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  max-width: 390px;
  margin: 0 auto;
  position: relative;
  overflow-x: hidden;
  background-color: #FCFAF5;
}

/* Status bar */
.tp-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px 0;
  position: relative;
  z-index: 10;
}
.tp-statusbar-time {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}
.tp-statusbar-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1a1a1a;
}

/* Header */
.tp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 22px 0;
  position: relative;
  z-index: 10;
}
.tp-header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tp-greeting {
  font-size: 22px;
  font-weight: 600;
  color: #1C3B31;
  line-height: 1.4;
  margin: 0;
  letter-spacing: 0.5px;
}
.tp-sun {
  font-size: 20px;
  margin-left: 4px;
}
.tp-badges {
  display: flex;
  gap: 8px;
}
.tp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.tp-badge-gray {
  background: #F0F2EB;
  color: #4A6B53;
}
.tp-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}
.tp-badge-white {
  background: #FFFFFF;
  color: #4A6B53;
  border: 1px solid #E6E8E3;
  cursor: pointer;
}
.tp-battery-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #1C3B31;
}

/* Hero Image */
.tp-hero {
  position: relative;
  width: 100%;
  margin-top: -60px; /* Overlap with header */
  z-index: 1;
}
.tp-hero-img {
  width: 100%;
  height: auto;
  display: block;
}

/* Main Content Area */
.tp-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 22px 90px;
  position: relative;
  z-index: 10;
  margin-top: -10px;
}

/* Prompt */
.tp-prompt-area {
  text-align: center;
  margin-bottom: 24px;
}
.tp-prompt-title {
  font-size: 22px;
  font-weight: 600;
  color: #1C3B31;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}
.tp-prompt-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #6B7B73;
  margin: 0;
  letter-spacing: 0.5px;
}

/* Hold to Talk Button */
.tp-hold-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  background: linear-gradient(180deg, #577D61 0%, #466A51 100%);
  border: none;
  border-radius: 40px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 16px rgba(70, 106, 81, 0.2);
  cursor: pointer;
  transition: transform 0.1s;
}
.tp-hold-btn:active {
  transform: scale(0.98);
}
.tp-mic-icon {
  width: 36px;
  height: 36px;
  color: #FFFFFF;
}
.tp-hold-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: #FFFFFF;
}
.tp-hold-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 2px;
}
.tp-hold-subtitle {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.8;
  letter-spacing: 1px;
}

/* Grid Shortcuts */
.tp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.tp-grid-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 14px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s;
}
.tp-grid-item:active {
  transform: scale(0.98);
}
.tp-grid-green { background: #F2F6ED; }
.tp-grid-orange { background: #FFF3E6; }
.tp-grid-purple { background: #F6EEF6; }

.tp-grid-icon {
  font-size: 24px;
  line-height: 1;
}
.tp-grid-text {
  font-size: 15px;
  font-weight: 500;
  color: #1C3B31;
}

/* Record Link */
.tp-record-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E6E8E3;
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.tp-record-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tp-record-left span {
  font-size: 14px;
  font-weight: 500;
  color: #1C3B31;
}

/* Result / Loading States */
.tp-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
.tp-loading-text {
  font-size: 16px;
  color: #7a7060;
  font-weight: 500;
}
.tp-result-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px 20px;
  gap: 12px;
}
.tp-bubble {
  width: 100%;
  background: rgba(255,255,255,0.85);
  border: 1px solid #d5cdc0;
  border-radius: 18px;
  padding: 16px 18px;
}
.tp-bubble-text {
  font-size: 15px;
  color: #2c2416;
  line-height: 1.6;
  margin: 0;
}
.tp-action-card {
  width: 100%;
  background: rgba(255,255,255,0.85);
  border: 1px solid #d5cdc0;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tp-action-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.tp-action-reason {
  font-size: 13px;
  color: #7a7060;
  line-height: 1.5;
  margin: 0 0 4px;
}
.tp-btn-start {
  width: 100%;
  padding: 13px;
  background: #3a6b4a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.tp-btn-row {
  display: flex;
  gap: 8px;
}
.tp-btn-sec {
  flex: 1;
  padding: 10px;
  background: rgba(255,255,255,0.7);
  border: 1px solid #d5cdc0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #5a5040;
  cursor: pointer;
}
.tp-disclaimer {
  font-size: 11px;
  color: #b0a898;
  text-align: center;
  line-height: 1.5;
}
\` + bottomNavCSS;

fs.writeFileSync('apps/web/src/styles/index.css', newCSS);
