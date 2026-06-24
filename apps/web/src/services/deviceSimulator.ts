import type { DeviceCommand, DeviceState } from "@ai-otter/shared-types";
import { sendDeviceCommand } from "./webApiService";

export type DeviceSimulatorListener = (state: DeviceState) => void;

const HAS_BACKEND = Boolean(import.meta.env.VITE_API_BASE_URL);

export class DeviceSimulator {
  private state: DeviceState = {
    deviceId: "otter-sim-001",
    connection: "connected",
    batteryLevel: 86,
    screenState: "idle",
    lightMode: "soft",
    volume: 35,
    lastSeenAt: new Date().toISOString()
  };

  private listeners = new Set<DeviceSimulatorListener>();
  private ws: WebSocket | null = null;

  constructor() {
    if (HAS_BACKEND) {
      this._connectWebSocket();
    }
  }

  private _connectWebSocket() {
    const base = (import.meta.env.VITE_API_BASE_URL as string).replace(/^http/, "ws");
    const url = `${base}/ws/frontend`;

    const connect = () => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.info("[Device] WebSocket connected to backend");
        this.state = { ...this.state, connection: "connected" };
        this.notify();
      };

      ws.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data as string) as Partial<DeviceState>;
          this.state = { ...this.state, ...incoming };
          this.notify();
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        console.info("[Device] WebSocket closed – reconnecting in 3s");
        this.state = { ...this.state, connection: "disconnected" };
        this.notify();
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
      // Fire-and-forget to backend; it forwards to the ESP32
      sendDeviceCommand(command).then((sent) => {
        if (!sent) console.warn("[Device] Command not delivered (no ESP32 connected)");
      });
    }

    // Always update local state immediately for UI responsiveness
    this._applyCommandLocally(command);
    this.notify();
    return this.state;
  }

  private _applyCommandLocally(command: DeviceCommand) {
    const now = new Date().toISOString();
    if (command.type === "SET_SCREEN_STATE") {
      this.state = { ...this.state, screenState: command.payload.screenState, lastSeenAt: now };
    } else if (command.type === "SET_LIGHT_MODE") {
      this.state = { ...this.state, lightMode: command.payload.lightMode, lastSeenAt: now };
    } else if (command.type === "SET_VOLUME") {
      this.state = { ...this.state, volume: command.payload.volume, lastSeenAt: now };
    } else if (command.type === "PLAY_SHORT_REPLY") {
      this.state = { ...this.state, screenState: "listening", lastSeenAt: now };
      setTimeout(() => {
        this._applyCommandLocally({ type: "SET_SCREEN_STATE", payload: { screenState: "idle" } });
        this.notify();
      }, 2000);
    } else if (command.type === "SHOW_STEP") {
      const screenState = command.payload.mode === "breathe" ? "breathing" : "moving";
      this.state = { ...this.state, screenState, lastSeenAt: now };
    } else if (command.type === "SHOW_COMPLETE") {
      this.state = { ...this.state, screenState: "idle", lastSeenAt: now };
    }
  }
}

export const deviceSimulator = new DeviceSimulator();
