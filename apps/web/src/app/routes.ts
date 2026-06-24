export type AppRoute = "talk" | "breathe" | "move" | "timeline" | "me" | "watchfaces";

export const routes: Array<{ id: Exclude<AppRoute, "watchfaces">; label: string; path: string }> = [
  { id: "talk", label: "说说", path: "#/talk" },
  { id: "breathe", label: "缓一缓", path: "#/breathe" },
  { id: "move", label: "动一动", path: "#/move" },
  { id: "timeline", label: "记录", path: "#/timeline" },
  { id: "me", label: "我的", path: "#/me" }
];

export function getRouteFromHash(hash: string): AppRoute {
  const route = hash.replace("#/", "") as AppRoute;
  if (route === "watchfaces") return route;
  return routes.some((item) => item.id === route) ? route : "talk";
}
