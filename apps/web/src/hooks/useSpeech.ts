import { useEffect, useRef } from "react";

// ── ElevenLabs config ──────────────────────────────────────────────────────
const EL_API_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const EL_VOICE_ID = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined)
                    ?? "XB0fDUnXU5powFXDhCwa";   // Charlotte — multilingual female
const EL_MODEL    = "eleven_multilingual_v2";

// ── AudioContext (singleton) — bypasses autoplay policy ───────────────────
let _ctx: AudioContext | null = null;
let _currentSource: AudioBufferSourceNode | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (happens after page load until first gesture)
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function stopCurrent() {
  try { _currentSource?.stop(); } catch { /* already stopped */ }
  _currentSource = null;
}

async function playArrayBuffer(buf: ArrayBuffer): Promise<void> {
  const ctx     = getCtx();
  const decoded = await ctx.decodeAudioData(buf);
  stopCurrent();
  const src     = ctx.createBufferSource();
  src.buffer    = decoded;
  src.connect(ctx.destination);
  src.start();
  _currentSource = src;
}

// ── Session audio cache: text → ArrayBuffer (zero extra tokens per repeat) ──
const _cache = new Map<string, ArrayBuffer>();

async function elevenLabsSpeak(text: string, signal: AbortSignal): Promise<boolean> {
  if (!EL_API_KEY || text.trim().length < 3) return false;

  if (_cache.has(text)) {
    // Clone the cached buffer (AudioContext consumes it on decode)
    await playArrayBuffer(_cache.get(text)!.slice(0));
    return true;
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}`,
      {
        method: "POST",
        signal,
        headers: {
          "xi-api-key": EL_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: EL_MODEL,
          voice_settings: {
            stability: 0.70,
            similarity_boost: 0.85,
            style: 0.12,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok || signal.aborted) return false;

    const buf = await res.arrayBuffer();
    _cache.set(text, buf);
    await playArrayBuffer(buf.slice(0));
    return true;
  } catch (e) {
    if ((e as Error).name === "AbortError") return false;
    console.warn("[useSpeech] ElevenLabs error, falling back:", e);
    return false;
  }
}

// ── Browser TTS fallback ───────────────────────────────────────────────────
// macOS best Chinese voices (in preference order)
const ZH_PREFERRED = ["Ting-Ting", "Meijia", "Sin-ji", "Yu-shu", "Li-mu"];
const EN_PREFERRED = ["Samantha", "Karen", "Moira", "Fiona"];

function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const preferred = lang.startsWith("zh") ? ZH_PREFERRED : EN_PREFERRED;
  // Try preferred names first
  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name));
    if (v) return v;
  }
  // Any matching lang
  return voices.find((v) => v.lang.startsWith(lang)) ?? null;
}

function browserSpeak(text: string, lang: "zh-CN" | "en-US") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter   = new SpeechSynthesisUtterance(text);
  utter.lang    = lang;
  utter.rate    = 0.78;   // slower = more breathing room, less robotic feel
  utter.pitch   = 0.92;   // slightly lower pitch = warmer
  utter.volume  = 0.92;
  const voice   = getBestVoice(lang.startsWith("zh") ? "zh" : "en");
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useSpeech() {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    // Pre-load voice list
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);

    // Warm up AudioContext on first mount (needs to happen close to a gesture)
    getCtx();

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      window.speechSynthesis.cancel();
      abortRef.current?.abort();
      stopCurrent();
    };
  }, []);

  const speak = (text: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    window.speechSynthesis?.cancel();
    stopCurrent();

    const isChinese = /[一-鿿]/.test(text);
    const lang: "zh-CN" | "en-US" = isChinese ? "zh-CN" : "en-US";

    elevenLabsSpeak(text, ac.signal).then((ok) => {
      if (!ok && !ac.signal.aborted) {
        browserSpeak(text, lang);
      }
    });
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopCurrent();
    window.speechSynthesis?.cancel();
  };

  return { speak, stop };
}
