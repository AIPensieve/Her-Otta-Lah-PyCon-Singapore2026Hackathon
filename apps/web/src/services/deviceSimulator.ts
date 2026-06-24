import type { DeviceCommand, DeviceState } from "@ai-otter/shared-types";

export type DeviceSimulatorListener = (state: DeviceState) => void;

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
    if (command.type === "SET_SCREEN_STATE") {
      this.state = { ...this.state, screenState: command.payload.screenState, lastSeenAt: new Date().toISOString() };
    }

    if (command.type === "SET_LIGHT_MODE") {
      this.state = { ...this.state, lightMode: command.payload.lightMode, lastSeenAt: new Date().toISOString() };
    }

    if (command.type === "SET_VOLUME") {
      this.state = { ...this.state, volume: command.payload.volume, lastSeenAt: new Date().toISOString() };
    }

    if (command.type === "PLAY_SHORT_REPLY") {
      this.state = { ...this.state, screenState: "listening", lastSeenAt: new Date().toISOString() };
      // Simulate going back to idle after a short delay
      setTimeout(() => {
        this.sendCommand({ type: "SET_SCREEN_STATE", payload: { screenState: "idle" } });
      }, 2000);
    }

    this.notify();
    return this.state;
  }
}

export const deviceSimulator = new DeviceSimulator();
