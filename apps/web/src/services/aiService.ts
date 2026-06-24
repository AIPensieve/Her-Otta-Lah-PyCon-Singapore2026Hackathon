/**
 * Unified AI service entry point.
 *
 * When VITE_API_BASE_URL is set → calls Python backend.
 * Otherwise               → uses TypeScript mock-ai (no backend needed).
 *
 * Pages should import from here, never directly from @ai-otter/mock-ai.
 */
import type { AiAgentService } from "@ai-otter/mock-ai";
import { aiAgentService as mockAiService } from "@ai-otter/mock-ai";
import { webAiService } from "./webApiService";

const hasBackend = Boolean(import.meta.env.VITE_API_BASE_URL);

if (hasBackend) {
  console.info(`[AI] Using Python backend: ${import.meta.env.VITE_API_BASE_URL}`);
} else {
  console.info("[AI] No VITE_API_BASE_URL – using mock AI");
}

export const aiService: AiAgentService = hasBackend ? webAiService : mockAiService;
