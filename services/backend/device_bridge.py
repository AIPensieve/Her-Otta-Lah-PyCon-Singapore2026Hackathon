"""
Device bridge: manages the WebSocket connection from the ESP32-S3
and lets the REST API forward DeviceCommands to the device.

Connection model:
  ESP32 connects to  WS /ws/device
  Frontend connects to  WS /ws/frontend  (optional – for live state push)
  REST POST /api/device/command  sends a command to the connected ESP32
"""
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect
from models import DeviceState


class DeviceBridge:
    def __init__(self):
        self._device_ws: Optional[WebSocket] = None
        self._frontend_sockets: set[WebSocket] = set()
        self.state = DeviceState()

    # ------------------------------------------------------------------
    # Device (ESP32) side
    # ------------------------------------------------------------------

    async def device_connect(self, ws: WebSocket):
        await ws.accept()
        self._device_ws = ws
        self.state.connection = "connected"
        self.state.lastSeenAt = _now()
        print(f"[Bridge] ESP32 connected from {ws.client}")
        await self._push_state_to_frontends()

        try:
            async for raw in ws.iter_text():
                try:
                    data = json.loads(raw)
                    # ESP32 sends partial DeviceState updates
                    for key, val in data.items():
                        if hasattr(self.state, key):
                            setattr(self.state, key, val)
                    self.state.lastSeenAt = _now()
                    await self._push_state_to_frontends()
                except Exception as e:
                    print(f"[Bridge] Bad message from device: {e}")
        except WebSocketDisconnect:
            pass
        finally:
            self._device_ws = None
            self.state.connection = "disconnected"
            await self._push_state_to_frontends()
            print("[Bridge] ESP32 disconnected")

    # ------------------------------------------------------------------
    # Frontend side (optional live status)
    # ------------------------------------------------------------------

    async def frontend_connect(self, ws: WebSocket):
        await ws.accept()
        self._frontend_sockets.add(ws)
        # Send current state immediately
        await ws.send_text(self.state.model_dump_json())
        try:
            async for _ in ws.iter_text():
                pass  # frontend → backend messages not used
        except WebSocketDisconnect:
            pass
        finally:
            self._frontend_sockets.discard(ws)

    # ------------------------------------------------------------------
    # Command forwarding
    # ------------------------------------------------------------------

    async def send_command(self, command: dict) -> bool:
        """Forward a DeviceCommand JSON to the connected ESP32.
        Returns True if the device was connected and the message was sent."""
        if self._device_ws is None:
            print(f"[Bridge] No device connected – command dropped: {command.get('type')}")
            return False
        try:
            await self._device_ws.send_text(json.dumps(command))
            return True
        except Exception as e:
            print(f"[Bridge] Send error: {e}")
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _push_state_to_frontends(self):
        dead: set[WebSocket] = set()
        payload = self.state.model_dump_json()
        for ws in self._frontend_sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        self._frontend_sockets -= dead


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# Singleton
device_bridge = DeviceBridge()
