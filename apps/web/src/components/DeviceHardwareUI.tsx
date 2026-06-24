import { useEffect, useRef, useState } from "react";
import { deviceSimulator } from "../services/deviceSimulator";
import type { DeviceScreenState, DeviceState } from "@ai-otter/shared-types";
import { OtterIllustration } from "./OtterIllustration";

// ── State → visual config ──────────────────────────────────────────────────

type VisualConfig = {
  bg: string;
  ring: string;
  label: string;
  sub: string;
  otterVariant: "default" | "breathing" | "thinking" | "listening";
  textColor: string;
  pulse: boolean;
  showCountdown: boolean;
};

function getVisual(state: DeviceScreenState, timeStr: string): VisualConfig {
  switch (state) {
    case "listening":
      return { bg: "from-[#1c4d40] to-[#2f5d50]", ring: "#6ec6a8", label: "在听", sub: "慢慢说", otterVariant: "listening", textColor: "text-white", pulse: true, showCountdown: false };
    case "thinking":
      return { bg: "from-[#2b4a3c] to-[#3d5e4e]", ring: "#7ab5a0", label: "思考中", sub: "整理一下", otterVariant: "thinking", textColor: "text-white", pulse: true, showCountdown: false };
    case "breathing":
      return { bg: "from-[#7da89e] to-[#a8c8c4]", ring: "#4b9e8a", label: "缓一缓", sub: "跟着呼吸", otterVariant: "breathing", textColor: "text-[#1a4a3e]", pulse: false, showCountdown: true };
    case "night_calm":
      return { bg: "from-[#1a2535] to-[#243044]", ring: "#4a6a8a", label: "夜间陪伴", sub: "我在这里", otterVariant: "default", textColor: "text-[#8ab0d0]", pulse: false, showCountdown: true };
    case "hot_flash_calm":
      return { bg: "from-[#4a2a1a] to-[#6a3a2a]", ring: "#c08050", label: "潮热后", sub: "慢慢冷静", otterVariant: "breathing", textColor: "text-[#f0c080]", pulse: false, showCountdown: true };
    case "exercise_countdown":
      return { bg: "from-[#2a3e28] to-[#3e5a3a]", ring: "#6aaa50", label: "动起来", sub: "轻轻活动", otterVariant: "default", textColor: "text-[#d0f0b0]", pulse: false, showCountdown: true };
    case "next_move":
      return { bg: "from-[#3a3a28] to-[#5a5a38]", ring: "#c8b850", label: "下一个", sub: "准备好了", otterVariant: "default", textColor: "text-[#f0e890]", pulse: true, showCountdown: false };
    case "moving":
      return { bg: "from-[#2a3e28] to-[#3e5a3a]", ring: "#6aaa50", label: "动一动", sub: "", otterVariant: "default", textColor: "text-[#d0f0b0]", pulse: false, showCountdown: true };
    case "sleeping":
      return { bg: "from-[#141820] to-[#1c2030]", ring: "#303858", label: "🌙", sub: "晚安", otterVariant: "default", textColor: "text-[#6070a0]", pulse: false, showCountdown: false };
    case "reminder":
      return { bg: "from-[#3a2a10] to-[#5a4020]", ring: "#d09040", label: "提醒", sub: "", otterVariant: "default", textColor: "text-[#f0c860]", pulse: true, showCountdown: false };
    case "low_battery":
      return { bg: "from-[#3a1010] to-[#5a2020]", ring: "#c04040", label: "低电量", sub: "请充电", otterVariant: "default", textColor: "text-[#f08080]", pulse: true, showCountdown: false };
    default: // idle
      return { bg: "from-[#e8dcc8] to-[#f4ead8]", ring: "#a0905c", label: timeStr, sub: "小水獭在这里", otterVariant: "default", textColor: "text-[#5d4037]", pulse: false, showCountdown: false };
  }
}

// ── Countdown ring component ──────────────────────────────────────────────

function CountdownRing({ seconds, running }: { seconds: number; running: boolean }) {
  const [remaining, setRemaining] = useState(seconds);
  const totalRef = useRef(seconds);

  useEffect(() => {
    totalRef.current = seconds;
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  const pct = totalRef.current > 0 ? Math.round((remaining / totalRef.current) * 100) : 0;
  const circumference = 2 * Math.PI * 118; // r=118 on 296px circle
  const offset = circumference * (1 - pct / 100);

  return (
    <svg className="absolute inset-0" viewBox="0 0 296 296" fill="none">
      {/* Track */}
      <circle cx="148" cy="148" r="118" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
      {/* Progress */}
      <circle
        cx="148" cy="148" r="118"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 148 148)"
        className="transition-all duration-1000"
      />
      {/* Number */}
      <text x="148" y="270" textAnchor="middle" fontSize="20" fontWeight="bold" fill="rgba(255,255,255,0.85)">
        {remaining}s
      </text>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function DeviceHardwareUI({ onClose }: { onClose: () => void }) {
  const [device, setDevice] = useState<DeviceState>(deviceSimulator.getState());
  const [timeStr, setTimeStr] = useState("");
  const [screenText, setScreenText] = useState("");
  const [countdownSecs, setCountdownSecs] = useState(0);

  useEffect(() => {
    const unsub = deviceSimulator.subscribe((state) => {
      setDevice(state);
    });
    return unsub;
  }, []);

  // Track DEVICE_STATE commands for text + countdown
  useEffect(() => {
    // Intercept by monkey-patching sendCommand — cleaner: listen via subscriber
    // DeviceSimulator already updates state; we read screenText from the last DEVICE_STATE
    // We piggyback on deviceSimulator's state updates (screenState changes)
  }, [device.screenState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setTimeStr(
        `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const visual = getVisual(device.screenState, timeStr);

  const isActive = !["idle", "sleeping"].includes(device.screenState);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
      <div className="relative flex flex-col items-center">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-1 text-sm font-bold text-white/80 hover:text-white"
        >
          关闭模拟器 ✕
        </button>

        <p className="mb-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          ESP32-S3 · 466×466 AMOLED · Simulator
        </p>

        {/* Watch bezel */}
        <div
          className="relative flex size-[296px] items-center justify-center rounded-full overflow-hidden"
          style={{ boxShadow: "0 0 0 14px #2a2a2a, 0 0 0 16px #444, 0 24px 48px rgba(0,0,0,0.6)" }}
        >
          {/* Screen background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${visual.bg} transition-all duration-700`} />

          {/* Countdown SVG ring (when active) */}
          {visual.showCountdown && (
            <CountdownRing seconds={countdownSecs || 30} running={isActive} />
          )}

          {/* Breathing pulse ring */}
          {device.screenState === "breathing" && (
            <div className="absolute inset-6 rounded-full border-4 border-white/20 animate-pulse" />
          )}

          {/* Content */}
          <div className={`relative z-10 flex flex-col items-center gap-1 ${visual.textColor}`}>
            <span className={`font-black tracking-tight ${device.screenState === "idle" ? "text-4xl" : "text-xl"}`}>
              {visual.label}
            </span>
            {visual.sub && (
              <span className="text-sm font-medium opacity-80">{visual.sub}</span>
            )}
          </div>

          {/* Otter — anchored to bottom */}
          <div className="absolute bottom-0 w-full flex justify-center">
            <OtterIllustration
              variant={visual.otterVariant}
              size="device"
              alt="Otter device state"
              className={`transition-all duration-500 ${
                visual.pulse ? "animate-bounce" : ""
              } ${device.screenState === "listening" ? "scale-110" : "scale-100"}`}
            />
          </div>

          {/* Battery dot (idle only) */}
          {device.screenState === "idle" && (
            <div className="absolute top-[52px] right-[72px] flex items-center gap-1 text-[10px] font-bold text-[#9a8060] opacity-70">
              <span>🔋</span>
              <span>{device.batteryLevel}%</span>
            </div>
          )}

          {/* Connection indicator */}
          <div
            className={`absolute top-[52px] left-[72px] size-2 rounded-full ${
              device.connection === "connected" ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
        </div>

        {/* Device state badge */}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2">
          <div className={`size-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <span className="text-xs font-mono font-bold text-slate-200">{device.screenState}</span>
          {device.connection !== "connected" && (
            <span className="text-xs text-amber-400 ml-1">(simulated)</span>
          )}
        </div>

        {/* Hardware buttons */}
        <div className="mt-6 flex w-[260px] justify-between">
          <div className="flex flex-col items-center gap-2">
            <button className="grid size-11 place-items-center rounded-full bg-[#e7e5e4] shadow-[0_4px_0_#a8a29e] active:translate-y-1 active:shadow-none transition-all text-lg">
              ⚪
            </button>
            <span className="text-[10px] font-bold text-slate-400">短按说话</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button className="grid size-11 place-items-center rounded-full bg-[#e7e5e4] shadow-[0_4px_0_#a8a29e] active:translate-y-1 active:shadow-none transition-all text-lg">
              🔴
            </button>
            <span className="text-[10px] font-bold text-slate-400">返回 / 紧急</span>
          </div>
        </div>

      </div>
    </div>
  );
}
