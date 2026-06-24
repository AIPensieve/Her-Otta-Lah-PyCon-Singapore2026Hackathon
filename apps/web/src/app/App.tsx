import { useEffect, useState } from "react";
import type { SuggestedAction } from "@ai-otter/shared-types";
import { BottomNav } from "../components/BottomNav";
import { BreathePage } from "../pages/BreathePage";
import { MePage } from "../pages/MePage";
import { MovePage } from "../pages/MovePage";
import { TalkPage } from "../pages/TalkPage";
import { TimelinePage } from "../pages/TimelinePage";
import { WatchfacePage } from "../pages/WatchfacePage";
import { deviceAdapter } from "../services/deviceAdapter";
import { getRouteFromHash, type AppRoute } from "./routes";

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash(window.location.hash));
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(null);

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
    <>
      {route === "talk" && <TalkPage onStartAction={startAction} />}
      {route === "breathe" && <BreathePage activeAction={activeAction} />}
      {route === "move" && <MovePage activeAction={activeAction} />}
      {route === "timeline" && <TimelinePage />}
      {route === "me" && <MePage />}
      {route === "watchfaces" && <WatchfacePage />}
      {route !== "watchfaces" && <BottomNav activeRoute={route} />}
    </>
  );
}
