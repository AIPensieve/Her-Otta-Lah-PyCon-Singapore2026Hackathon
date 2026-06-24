import { useEffect, useState, useMemo } from "react";
import { deviceSimulator } from "../services/deviceSimulator";
import type { DeviceState } from "@ai-otter/shared-types";

export function DeviceHardwareUI({ onClose }: { onClose: () => void }) {
  const [device, setDevice] = useState<DeviceState>(deviceSimulator.getState());
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const unsubscribe = deviceSimulator.subscribe(setDevice);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setTimeStr(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute visual state based on simulator state
  const visualState = useMemo(() => {
    if (device.screenState === "listening") {
      return {
        bgClass: "bg-gradient-to-b from-[#1c4d40] to-[#2f5d50]",
        title: "Listening",
        subtitle: "我在听",
        icon: "🎙️",
        textColor: "text-white"
      };
    }
    if (device.screenState === "breathing") {
      return {
        bgClass: "bg-gradient-to-b from-[#87b1a2] to-[#b4cdb8]",
        title: "Thinking",
        subtitle: "整理中",
        icon: "✨",
        textColor: "text-[#185d49]"
      };
    }
    // Default
    return {
      bgClass: "bg-[#f4ebd9]",
      title: timeStr,
      subtitle: "",
      icon: "",
      textColor: "text-[#5d4037]"
    };
  }, [device.screenState, timeStr]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      
      {/* Outer Device Casing (Squareish/Rounded) */}
      <div className="relative flex flex-col items-center">
        
        {/* Close overlay button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-1 text-sm font-bold text-white opacity-80 hover:opacity-100"
        >
          关闭模拟器 ✕
        </button>

        <p className="mb-6 text-xs font-bold tracking-widest text-slate-300 uppercase">Watchface UI Simulator</p>

        {/* The Circular Screen */}
        <div className="relative flex size-[320px] items-center justify-center rounded-full bg-black shadow-2xl overflow-hidden border-[12px] border-[#3e3e3e]">
          
          {/* Internal Screen Background */}
          <div className={`absolute inset-0 flex flex-col items-center pt-8 ${visualState.bgClass} transition-colors duration-700`}>
            
            {/* Top Bar (Wi-Fi, Time, Battery) */}
            {device.screenState === "idle" && (
              <div className="flex w-full items-start justify-between px-12 opacity-80">
                <span className="text-sm">📶</span>
                <span className="text-[10px] font-bold text-stone-600 bg-stone-300/50 px-1.5 rounded-sm">
                  🔋 {device.batteryLevel}%
                </span>
              </div>
            )}

            {/* Time or Title Display */}
            <div className={`mt-2 flex flex-col items-center ${visualState.textColor}`}>
              {visualState.icon && <span className="text-2xl mb-1">{visualState.icon}</span>}
              <h2 className={`${device.screenState === "idle" ? "text-4xl font-black tracking-tight" : "text-xl font-bold"}`}>
                {visualState.title}
              </h2>
              {visualState.subtitle && <p className="text-sm font-medium mt-1 opacity-90">{visualState.subtitle}</p>}
            </div>

            {/* Otter Illustration */}
            <div className="absolute bottom-[-10px] w-full flex justify-center">
               {/* 
                 Using the generated icon, but making it scale up from bottom. 
                 Since the original icon has a background, we just use css blend mode or border radius to make it look decent.
                 Ideally we would use a transparent PNG.
               */}
               <img 
                 src="/icons/icon-512x512.png" 
                 alt="Otter" 
                 className={`w-64 h-64 object-cover object-top mix-blend-multiply transition-transform duration-500 ${device.screenState === 'listening' ? 'scale-110 translate-y-4' : 'scale-100'}`}
                 style={{ WebkitMaskImage: 'radial-gradient(ellipse at bottom, black 50%, transparent 100%)' }}
               />
            </div>
            
            {/* Breathing Ring Overlay (Visible only when playing/breathing) */}
            {device.screenState === "breathing" && (
              <div className="absolute inset-0 rounded-full border-8 border-white/20 animate-pulse pointer-events-none scale-[0.85]" />
            )}
            
          </div>
        </div>

        {/* Hardware Buttons Layout (Below the screen to simulate desk stand) */}
        <div className="mt-8 flex w-[280px] justify-between">
          <div className="flex flex-col items-center gap-2">
            <button className="grid size-12 place-items-center rounded-full bg-[#e7e5e4] shadow-[0_4px_0_#a8a29e] active:translate-y-1 active:shadow-none transition-all">
              ⚪
            </button>
            <span className="text-[10px] font-bold text-slate-300">短按说话 / 确认</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button className="grid size-12 place-items-center rounded-full bg-[#e7e5e4] shadow-[0_4px_0_#a8a29e] active:translate-y-1 active:shadow-none transition-all">
              🔴
            </button>
            <span className="text-[10px] font-bold text-slate-300">短按返回 / 长按紧急</span>
          </div>
        </div>

      </div>
    </div>
  );
}
