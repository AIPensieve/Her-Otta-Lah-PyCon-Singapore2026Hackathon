import { useState, useEffect, useRef } from "react";

/**
 * Counts from `seconds` down to 0, calling `onComplete` when it hits 0.
 * Resets automatically when `seconds` changes (i.e. when the step changes).
 *
 * @returns { remaining, progress (0–1), isComplete }
 */
export function useCountdown(
  seconds: number,
  onComplete?: () => void,
  autoStart = true
) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const completedRef = useRef(false);

  // Reset when seconds prop changes (new step)
  useEffect(() => {
    setRemaining(seconds);
    setRunning(autoStart);
    completedRef.current = false;
  }, [seconds, autoStart]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [remaining, onComplete]);

  return {
    remaining,
    progress: seconds > 0 ? Math.max(0, remaining / seconds) : 0,
    isComplete: remaining <= 0,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
  };
}
