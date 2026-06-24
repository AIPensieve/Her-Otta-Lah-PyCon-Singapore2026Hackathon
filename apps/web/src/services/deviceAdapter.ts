/**
 * DeviceAdapter — unified interface for sending device state commands.
 *
 * When ESP32 is connected: forwards to real hardware via WebSocket.
 * When ESP32 is disconnected: updates local simulator state, logs fallback.
 * App actions never block on hardware success.
 */
import type { DeviceScreenState, DeviceLightMode, DeviceCommand } from "@ai-otter/shared-types";
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

export const deviceAdapter = {
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
    this.sendState({
      state: "listening",
      screen_text: text ?? "小水獭在听",
      duration_seconds: 0,
      light_mode: "pulse",
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
