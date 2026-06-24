import { useState } from "react";
import type { WatchfaceScreen } from "@ai-otter/shared-types";
import { deviceSimulator } from "../services/deviceSimulator";

type WatchfaceState = {
  id: WatchfaceScreen;
  label: string;
  title: string;
  subtitle: string;
  asset: string;
  category: "core" | "care" | "action" | "safety" | "system";
};

const states: WatchfaceState[] = [
  {
    id: "default",
    label: "Default",
    title: "默认陪伴",
    subtitle: "安静待机、时间、电量与连接状态",
    asset: "/watchfaces/default.png",
    category: "core"
  },
  {
    id: "listening",
    label: "Listening",
    title: "正在倾听",
    subtitle: "用户说话时的短反馈",
    asset: "/watchfaces/listening.png",
    category: "core"
  },
  {
    id: "thinking",
    label: "Thinking",
    title: "整理中",
    subtitle: "AI 理解和组织回应时显示",
    asset: "/watchfaces/thinking.png",
    category: "core"
  },
  {
    id: "breathing",
    label: "Breathing",
    title: "呼吸冥想",
    subtitle: "呼吸圆环和小水獭同步引导",
    asset: "/watchfaces/breathing.png",
    category: "care"
  },
  {
    id: "night-wake",
    label: "Night Wake",
    title: "夜里醒了",
    subtitle: "低亮度夜间陪伴",
    asset: "/watchfaces/night-wake.png",
    category: "care"
  },
  {
    id: "hot-flash",
    label: "Hot Flash Calm",
    title: "潮热后缓一缓",
    subtitle: "慢呼吸与身体安抚",
    asset: "/watchfaces/hot-flash.png",
    category: "care"
  },
  {
    id: "exercise-countdown",
    label: "Countdown",
    title: "运动倒计时",
    subtitle: "动作步骤、倒计时和简短提示",
    asset: "/watchfaces/exercise-countdown.png",
    category: "action"
  },
  {
    id: "next-move",
    label: "Next Move",
    title: "下一个动作",
    subtitle: "简单箭头确认下一步",
    asset: "/watchfaces/next-move.png",
    category: "action"
  },
  {
    id: "daily-reminder",
    label: "Reminder",
    title: "日常提醒",
    subtitle: "喝水、休息等轻提醒",
    asset: "/watchfaces/daily-reminder.png",
    category: "care"
  },
  {
    id: "send-location",
    label: "Send Location",
    title: "发送位置确认",
    subtitle: "必须由用户主动确认",
    asset: "/watchfaces/send-location.png",
    category: "safety"
  },
  {
    id: "location-sent",
    label: "Location Sent",
    title: "位置已发送",
    subtitle: "只做主动分享反馈，不做实时监控",
    asset: "/watchfaces/location-sent.png",
    category: "safety"
  },
  {
    id: "connection",
    label: "Connection",
    title: "设备连接状态",
    subtitle: "Wi-Fi、蓝牙、电量状态",
    asset: "/watchfaces/connection.png",
    category: "system"
  }
];

const categoryLabel: Record<WatchfaceState["category"], string> = {
  core: "核心状态",
  care: "陪伴照护",
  action: "行动引导",
  safety: "主动安全",
  system: "设备系统"
};

export function WatchfacePage() {
  const [selectedId, setSelectedId] = useState<WatchfaceScreen>("default");
  const selected = states.find((state) => state.id === selectedId) ?? states[0];

  const selectWatchface = (state: WatchfaceState) => {
    setSelectedId(state.id);
    deviceSimulator.sendWatchface({
      screen: state.id,
      title: state.title,
      subtitle: state.subtitle,
      locale: "mixed",
      step: state.id === "exercise-countdown" ? 2 : undefined,
      totalSteps: state.id === "exercise-countdown" ? 5 : undefined,
      remainingSeconds: state.id === "exercise-countdown" ? 30 : undefined,
      batteryLevel: 80,
      lightMode: state.category === "safety" ? "alert" : state.category === "care" ? "breathing" : "soft",
      vibration: state.category === "safety" ? "short" : "none"
    });
  };

  return (
    <main className="min-h-dvh bg-[#f2ebdf] px-4 py-5 text-[#17382b]">
      <div className="mx-auto w-full max-w-[430px]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#7d7468]">Otter Device UI</p>
            <h1 className="mt-1 text-[2rem] font-bold leading-tight">表盘状态页</h1>
          </div>
          <a
            href="#/me"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#e5d8c5] bg-[#fffaf1] text-xl text-[#416446] shadow-[0_8px_20px_rgba(58,43,23,0.08)]"
            aria-label="返回"
          >
            ‹
          </a>
        </header>

        <section className="rounded-[30px] border border-[#dfd2bd] bg-[#fffaf0] p-5 shadow-[0_18px_42px_rgba(58,43,23,0.12)]">
          <div className="relative mx-auto grid h-[330px] w-[330px] place-items-center rounded-full bg-[#353331] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),0_20px_42px_rgba(31,25,18,0.24)]">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-[#efe5d3]">
              <img
                src={selected.asset}
                alt={selected.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8c806d]">
              {categoryLabel[selected.category]}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#17382b]">{selected.title}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#746d62]">{selected.subtitle}</p>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">状态选择</h2>
            <span className="rounded-full bg-[#dfead7] px-3 py-1 text-xs font-bold text-[#446a49]">
              {states.length} screens
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {states.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => selectWatchface(state)}
                className={`rounded-[20px] border p-2 text-left transition ${
                  selectedId === state.id
                    ? "border-[#5f875e] bg-[#edf5e8] shadow-[0_10px_20px_rgba(95,135,94,0.18)]"
                    : "border-[#e4d8c5] bg-[#fffaf1] active:bg-[#f4ecdf]"
                }`}
              >
                <div className="aspect-square overflow-hidden rounded-full bg-[#efe7d8]">
                  <img src={state.asset} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 truncate text-xs font-bold text-[#17382b]">{state.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-[#e4d8c5] bg-[#fffaf1] p-4 text-sm leading-relaxed text-[#746d62]">
          <p className="font-bold text-[#17382b]">硬件接口预览</p>
          <p className="mt-1">
            点击任一表盘会发送 <code className="rounded bg-[#efe6d8] px-1 py-0.5 text-xs">SET_WATCHFACE</code> 模拟命令。
            未来 ESP32 通过 WebSocket 收到同一命令后，可按 <code className="rounded bg-[#efe6d8] px-1 py-0.5 text-xs">payload.screen</code> 渲染对应表盘。
          </p>
        </section>
      </div>
    </main>
  );
}
