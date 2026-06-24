import { useState } from "react";
import type { SuggestedAction } from "@ai-otter/shared-types";

// Helper component to extract otter graphics directly from the full screenshot
const SpriteOtter = ({ x, y, w = 70, h = 70 }: { x: number; y: number; w?: number; h?: number }) => (
  <div
    style={{
      width: w,
      height: h,
      backgroundImage: `url('/assets/breathe-ui.png')`,
      backgroundSize: `390px auto`,
      backgroundPosition: `-${x}px -${y}px`,
      backgroundRepeat: "no-repeat",
    }}
  />
);

export function BreathePage({ activeAction }: { activeAction?: SuggestedAction | null }) {
  return (
    <div className="bp-page">
      {/* ── Status bar (Mocked to match screenshot) ── */}
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
        <button className="bp-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A6B53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="bp-header-title">
          <h1>缓一缓</h1>
          <p>给自己一点空间，慢慢来</p>
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
            <div className="bp-sec-letter bp-color-a">A</div>
            <div className="bp-sec-title">
              <h2>每天一点点</h2>
              <p>日常练习，积累好状态</p>
            </div>
          </div>
          <div className="bp-cards">
            <div className="bp-card bp-card-a">
              <div className="bp-card-info">
                <h3>1 分钟呼吸</h3>
                <p>一分钟，回到平静</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> 1 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={60} y={230} /></div>
              <div className="bp-card-arrow" />
            </div>
            <div className="bp-card bp-card-a">
              <div className="bp-card-info">
                <h3>睡前放松 <span className="bp-icon-moon">🌙</span></h3>
                <p>放松身心，好好睡一觉</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> 5 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={180} y={240} w={80} /></div>
              <div className="bp-card-arrow" />
            </div>
            <div className="bp-card bp-card-a">
              <div className="bp-card-info">
                <h3>午后恢复</h3>
                <p>提提神，轻松一下</p>
                <div className="bp-card-time"><span className="bp-icon-clock" /> 3 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={310} y={220} /></div>
              <div className="bp-card-arrow" />
            </div>
          </div>
        </div>

        {/* Section B */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-b">B</div>
            <div className="bp-sec-title">
              <h2>现在有点难受</h2>
              <p>情绪来了，我们陪你</p>
            </div>
          </div>
          <div className="bp-cards">
            <div className="bp-card bp-card-b">
              <div className="bp-card-info">
                <h3>突然烦躁</h3>
                <p>先不分析，陪你呼吸 60 秒</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> 1 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={60} y={400} /></div>
              <div className="bp-card-arrow bp-arrow-red" />
            </div>
            <div className="bp-card bp-card-b">
              <div className="bp-card-info">
                <h3>想哭一下</h3>
                <p>可以哭出来，会好一点</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> 3 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={180} y={400} /></div>
              <div className="bp-card-arrow bp-arrow-red" />
            </div>
            <div className="bp-card bp-card-b">
              <div className="bp-card-info">
                <h3>心里堵住了</h3>
                <p>一起把心里的话说出来</p>
                <div className="bp-card-time bp-time-red"><span className="bp-icon-clock" /> 5 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={310} y={400} /></div>
            </div>
          </div>
        </div>

        {/* Section C */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-c">C</div>
            <div className="bp-sec-title">
              <h2>身体需要缓一缓</h2>
              <p>身体不舒服时，温柔陪伴</p>
            </div>
          </div>
          <div className="bp-cards">
            <div className="bp-card bp-card-c">
              <div className="bp-card-info">
                <h3>夜里醒了</h3>
                <p>低亮度陪伴，帮你慢慢回到平静</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> 3 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={60} y={580} /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </div>
            <div className="bp-card bp-card-c">
              <div className="bp-card-info">
                <h3>潮热后</h3>
                <p>舒缓不适，慢慢平静下来</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> 3 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={180} y={580} /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </div>
            <div className="bp-card bp-card-c">
              <div className="bp-card-info">
                <h3>身体很累</h3>
                <p>放松身体，恢复一点能量</p>
                <div className="bp-card-time bp-time-blue"><span className="bp-icon-clock" /> 5 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={310} y={590} w={80} /></div>
              <div className="bp-card-arrow bp-arrow-blue" />
            </div>
          </div>
          {/* Pagination dots */}
          <div className="bp-pagination">
            <span className="bp-dot bp-dot-active" />
            <span className="bp-dot" />
            <span className="bp-dot" />
          </div>
        </div>

        {/* Section D */}
        <div className="bp-section">
          <div className="bp-sec-header">
            <div className="bp-sec-letter bp-color-d">D</div>
            <div className="bp-sec-title">
              <h2>想说出来</h2>
              <p>把心里的话，说给小水獭听</p>
            </div>
          </div>
          <div className="bp-cards">
            <div className="bp-card bp-card-d">
              <div className="bp-card-info">
                <h3>跟你说说</h3>
                <p>想说什么，跟我聊聊吧</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> 不限时</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={60} y={760} /></div>
              <div className="bp-card-arrow bp-arrow-purple" />
            </div>
            <div className="bp-card bp-card-d">
              <div className="bp-card-info">
                <h3>帮我整理一下</h3>
                <p>帮你理清思路，感觉会好一点</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> 5 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={180} y={760} /></div>
            </div>
            <div className="bp-card bp-card-d">
              <div className="bp-card-info">
                <h3>记下今天</h3>
                <p>把今天的感受，记下来</p>
                <div className="bp-card-time bp-time-purple"><span className="bp-icon-clock" /> 2 分钟</div>
              </div>
              <div className="bp-card-otter"><SpriteOtter x={310} y={760} /></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
