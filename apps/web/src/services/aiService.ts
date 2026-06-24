/**
 * Unified AI service entry point.
 *
 * When VITE_API_BASE_URL is set → calls Python backend (webAiService).
 * Otherwise, or when backend errors → TypeScript mock-ai (no network needed).
 *
 * Pages always import from here, never directly from @ai-otter/mock-ai.
 */
import type { AiAgentService } from "@ai-otter/mock-ai";
import { aiAgentService as mockAiService } from "@ai-otter/mock-ai";
import { webAiService } from "./webApiService";

const hasBackend = Boolean(import.meta.env.VITE_API_BASE_URL);

if (hasBackend) {
  console.info(`[AI] Backend: ${import.meta.env.VITE_API_BASE_URL}`);
} else {
  console.info("[AI] No VITE_API_BASE_URL – using mock AI");
}

// Wraps every webAiService method: on any error, log a warning and fall back to mock.
// This means a backend restart / CORS issue never hard-blocks the demo.
function withFallback<T extends AiAgentService>(real: T, mock: T): T {
  return new Proxy(real, {
    get(target, prop) {
      const fn = target[prop as keyof T];
      if (typeof fn !== "function") return fn;
      return async (...args: unknown[]) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (fn as (...a: unknown[]) => Promise<unknown>).apply(target, args);
        } catch (err) {
          console.warn(`[AI] Backend error on ${String(prop)}, falling back to mock:`, err);
          const mockFn = mock[prop as keyof T];
          if (typeof mockFn === "function") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (mockFn as (...a: unknown[]) => Promise<unknown>).apply(mock, args);
          }
          throw err;
        }
      };
    },
  }) as T;
}

export const aiService: AiAgentService = hasBackend
  ? withFallback(webAiService as AiAgentService, mockAiService)
  : mockAiService;
