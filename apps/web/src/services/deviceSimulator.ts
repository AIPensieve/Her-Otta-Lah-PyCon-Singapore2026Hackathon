import type { DeviceCommand, DeviceState, DeviceScreenState, DeviceLightMode } from "@ai-otter/shared-types";
import { sendDeviceCommand } from "./webApiService";

export type DeviceSimulatorListener = (state: DeviceState) => void;

const HAS_BACKEND = Boolean(import.meta.env.VITE_API_BASE_URL);

export class DeviceSimulator {
  private state: DeviceState = {
    deviceId: "otter-sim-001",
    connection: "connected",   // simulator is always "connected" locally
    batteryLevel: 86,
    screenState: "idle",
    lightMode: "soft",
    volume: 35,
    lastSeenAt: new Date().toISOString()
  };

  private listeners = new Set<DeviceSimulatorListener>();
  private ws: WebSocket | null = null;
  private _realDeviceConnected = false;

  constructor() {
    if (HAS_BACKEND) {
      this._connectWebSocket();
    }
  }

  /** True only if a real ESP32 is connected to the backend. */
  get realDeviceConnected(): boolean {
    return this._realDeviceConnected;
  }

  private _connectWebSocket() {
    const base = (import.meta.env.VITE_API_BASE_URL as string).replace(/^http/, "ws");
    const url = `${base}/ws/frontend`;

    const connect = () => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.info("[Device] WebSocket connected to backend");
      };

      ws.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data as string) as Partial<DeviceState>;
          const wasReal = this._realDeviceConnected;
          this._realDeviceConnected = incoming.connection === "connected";
          if (wasReal !== this._realDeviceConnected) {
            console.info(`[Device] ESP32 ${this._realDeviceConnected ? "connected" : "disconnected"}`);
          }
          // Merge real device state into our local copy
          this.state = { ...this.state, ...incoming };
          this.notify();
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        console.info("[Device] Backend WebSocket closed – reconnecting in 3s");
        this._realDeviceConnected = false;
        setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
  }

  getState(): DeviceState {
    return this.state;
  }

  subscribe(listener: DeviceSimulatorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  sendCommand(command: DeviceCommand): DeviceState {
    if (HAS_BACKEND) {
      sendDeviceCommand(command).then((sent) => {
        if (!sent) console.info("[Device] Command not delivered to ESP32 – simulated locally");
      });
    }
    this._applyCommandLocally(command);
    this.notify();
    return this.state;
  }

  private _applyCommandLocally(command: DeviceCommand) {
    const now = new Date().toISOString();

    switch (command.type) {
      case "SET_SCREEN_STATE":
        this.state = { ...this.state, screenState: command.payload.screenState as DeviceScreenState, lastSeenAt: now };
        break;

      case "SET_LIGHT_MODE":
        this.state = { ...this.state, lightMode: command.payload.lightMode as DeviceLightMode, lastSeenAt: now };
        break;

      case "SET_VOLUME":
        this.state = { ...this.state, volume: command.payload.volume, lastSeenAt: now };
        break;

      case "PLAY_SHORT_REPLY":
        this.state = { ...this.state, screenState: "listening", lastSeenAt: now };
        setTimeout(() => {
          this._applyCommandLocally({ type: "SET_SCREEN_STATE", payload: { screenState: "idle" } });
          this.notify();
        }, 2500);
        break;

      case "SHOW_STEP": {
        const screenState = command.payload.mode === "breathe" ? "breathing" : "exercise_countdown";
        this.state = { ...this.state, screenState, lastSeenAt: now };
        break;
      }

      case "SHOW_COMPLETE":
        this.state = { ...this.state, screenState: "idle", lastSeenAt: now };
        break;

      case "VIBRATE":
        // no-op for simulator; hardware handles this
        break;

      case "DEVICE_STATE": {
        const p = command.payload;
        this.state = {
          ...this.state,
          screenState: p.state as DeviceScreenState,
          lightMode: (p.light_mode as DeviceLightMode) ?? this.state.lightMode,
          lastSeenAt: now,
        };
        break;
      }
    }
  }
}

export const deviceSimulator = new DeviceSimulator();
