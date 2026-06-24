import { useEffect, useState } from "react";
import type { SuggestedAction } from "@ai-otter/shared-types";
import { BottomNav } from "../components/BottomNav";
import { BreathePage } from "../pages/BreathePage";
import { MePage } from "../pages/MePage";
import { MovePage } from "../pages/MovePage";
import { TalkPage } from "../pages/TalkPage";
import { TimelinePage } from "../pages/TimelinePage";
import { WatchfacePage } from "../pages/WatchfacePage";
import { DeviceHardwareUI } from "../components/DeviceHardwareUI";
import { deviceAdapter } from "../services/deviceAdapter";
import { getRouteFromHash, type AppRoute } from "./routes";
import { LangProvider } from "../locales";

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash(window.location.hash));
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(null);
  const [showDevice, setShowDevice] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = "/talk";
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const startAction = (action: SuggestedAction) => {
    setActiveAction(action);
    if (action.type === "move") {
      deviceAdapter.showWatchface({
        screen: "next-move",
        title: "Next",
        subtitle: "下一个动作",
        locale: "mixed",
        lightMode: "soft",
        vibration: "short",
      });
    }
    if (action.type === "breathe") {
      deviceAdapter.showWatchface({
        screen: "breathing",
        title: "Breathe in",
        subtitle: "吸气",
        locale: "mixed",
        lightMode: "breathing",
        vibration: "short",
      });
    }
    window.location.hash = action.type === "move" ? "/move" : "/breathe";
  };

  return (
    <LangProvider>
      {route === "talk"       && <TalkPage onStartAction={startAction} />}
      {route === "breathe"    && <BreathePage activeAction={activeAction} />}
      {route === "move"       && <MovePage activeAction={activeAction} />}
      {route === "timeline"   && <TimelinePage />}
      {route === "me"         && <MePage />}
      {route === "watchfaces" && <WatchfacePage />}

      {route !== "watchfaces" && <BottomNav activeRoute={route} />}

      {/* Floating device simulator button — visible on all pages */}
      {route !== "watchfaces" && (
        <button
          onClick={() => setShowDevice(true)}
          title="打开表盘模拟器"
          style={{
            position: "fixed",
            bottom: "88px",
            right: "16px",
            zIndex: 90,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#2d5a3d,#446f4d)",
            border: "2px solid rgba(255,255,255,0.25)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "22px",
          }}
        >
          ⌚
        </button>
      )}

      {showDevice && <DeviceHardwareUI onClose={() => setShowDevice(false)} />}
    </LangProvider>
  );
}
