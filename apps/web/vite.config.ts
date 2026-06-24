import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_BASE_URL ?? "";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
      strictPort: false,
      // Proxy /ai/* and /ws/* to the Python backend when VITE_API_BASE_URL is set.
      // This avoids CORS in dev without needing backend CORS headers.
      proxy: backendUrl
        ? {
            "/ai": {
              target: backendUrl,
              changeOrigin: true,
              rewrite: (p) => p,
            },
            "/ws": {
              target: backendUrl.replace(/^http/, "ws"),
              ws: true,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
