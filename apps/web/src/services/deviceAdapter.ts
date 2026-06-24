/**
 * DeviceAdapter — unified interface for sending device state commands.
 *
 * When ESP32 is connected: forwards to real hardware via WebSocket.
 * When ESP32 is disconnected: updates local simulator state, logs fallback.
 * App actions never block on hardware success.
 */
import type {
  DeviceCommand,
  DeviceLightMode,
  DeviceScreenState,
  WatchfacePayload,
  WatchfaceScreen
} from "@ai-otter/shared-types";
import { deviceSimulator } from "./deviceSimulator";

export type DeviceStatePayload = {
  state: DeviceScreenState;
  screen_text: string;
  duration_seconds: number;
  voice_text?: string;
  light_mode: DeviceLightMode;
  vibration: "none" | "short" | "long" | "double";
};

function _mapToScreenState(state: DeviceScreenState): DeviceScreenState {
  return state;
}

function _mapToLightMode(state: DeviceScreenState, lightMode: DeviceLightMode): DeviceLightMode {
  if (lightMode !== "soft") return lightMode;
  if (state === "night_calm" || state === "sleeping") return "night";
  if (state === "breathing") return "breathing";
  return "soft";
}

function _mapStateToWatchface(state: DeviceScreenState, mode?: "breathe" | "move"): WatchfaceScreen {
  if (mode === "breathe") return "breathing";
  if (mode === "move") return state === "next_move" ? "next-move" : "exercise-countdown";
  const map: Partial<Record<DeviceScreenState, WatchfaceScreen>> = {
    idle: "default",
    listening: "listening",
    thinking: "thinking",
    breathing: "breathing",
    night_calm: "night-wake",
    hot_flash_calm: "hot-flash",
    exercise_countdown: "exercise-countdown",
    next_move: "next-move",
    reminder: "daily-reminder",
    location_confirm: "send-location",
    location_sent: "location-sent",
  };
  return map[state] ?? "default";
}

export const deviceAdapter = {
  /** Send production watchface command. This is the contract the ESP32 should implement. */
  showWatchface(payload: WatchfacePayload): void {
    const isConnected = deviceSimulator.getState().connection === "connected";
    if (!isConnected) {
      console.info("[Device] fallback / simulated – ESP32 not connected");
    }
    deviceSimulator.sendWatchface(payload);
  },

  /** Send unified DEVICE_STATE command. Falls back gracefully if hardware absent. */
  sendState(payload: DeviceStatePayload): void {
    const isConnected = deviceSimulator.getState().connection === "connected";
    if (!isConnected) {
      console.info("[Device] fallback / simulated – ESP32 not connected");
    }
    deviceSimulator.sendCommand({
      type: "DEVICE_STATE",
      payload,
    } as DeviceCommand);
  },

  /** Convenience: enter a named skill step on the device. */
  showStep(opts: {
    state: DeviceScreenState;
    text: string;
    stepNum: number;
    totalSteps: number;
    durationSeconds: number;
    mode: "breathe" | "move";
  }): void {
    this.showWatchface({
      screen: _mapStateToWatchface(opts.state, opts.mode),
      title: opts.mode === "breathe" ? "缓一缓" : "运动倒计时",
      subtitle: opts.text,
      locale: "mixed",
      step: opts.stepNum,
      totalSteps: opts.totalSteps,
      remainingSeconds: opts.durationSeconds,
      lightMode: _mapToLightMode(opts.state, "soft"),
      vibration: opts.stepNum > 1 ? "short" : "none",
    });
    this.sendState({
      state: opts.state,
      screen_text: opts.text,
      duration_seconds: opts.durationSeconds,
      light_mode: _mapToLightMode(opts.state, "soft"),
      vibration: opts.stepNum > 1 ? "short" : "none",
    });
    // Also send legacy SHOW_STEP so existing BreathePage/MovePage code still works
    deviceSimulator.sendCommand({
      type: "SHOW_STEP",
      payload: {
        text: opts.text,
        stepNum: opts.stepNum,
        totalSteps: opts.totalSteps,
        mode: opts.mode,
      },
    });
  },

  /** Convenience: mark skill complete. */
  showComplete(message: string): void {
    this.showWatchface({
      screen: "default",
      title: "完成了",
      subtitle: message,
      locale: "mixed",
      lightMode: "soft",
      vibration: "double",
    });
    this.sendState({
      state: "idle",
      screen_text: message,
      duration_seconds: 0,
      voice_text: message,
      light_mode: "soft",
      vibration: "double",
    });
    deviceSimulator.sendCommand({
      type: "SHOW_COMPLETE",
      payload: { message },
    });
  },

  /** Convenience: enter listening/AI-thinking state. */
  setListening(text?: string): void {
    this.showWatchface({
      screen: "listening",
      title: "Listening",
      subtitle: text ?? "我在听",
      locale: "mixed",
      lightMode: "pulse",
      vibration: "none",
    });
    this.sendState({
      state: "listening",
      screen_text: text ?? "小水獭在听",
      duration_seconds: 0,
      light_mode: "pulse",
      vibration: "none",
    });
  },

  setThinking(text?: string): void {
    this.showWatchface({
      screen: "thinking",
      title: "整理中",
      subtitle: text ?? "小水獭正在整理",
      locale: "mixed",
      lightMode: "soft",
      vibration: "none",
    });
    this.sendState({
      state: "thinking",
      screen_text: text ?? "小水獭正在整理",
      duration_seconds: 0,
      light_mode: "soft",
      vibration: "none",
    });
  },

  getState() {
    return deviceSimulator.getState();
  },

  isConnected(): boolean {
    return deviceSimulator.getState().connection === "connected";
  },

  subscribe: deviceSimulator.subscribe.bind(deviceSimulator),
};
