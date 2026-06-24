"""
AI Otter Coach — ESP32-S3-Touch-AMOLED-1.75 MicroPython Firmware
=================================================================
Board:   Waveshare ESP32-S3-Touch-AMOLED-1.75
Display: CO5300 AMOLED 466×466 round (QSPI — serial-only fallback in MicroPython)
Backend: FastAPI WebSocket at WS_HOST:WS_PORT/WS_PATH

SETUP
-----
1. Copy config.py.example → config.py and fill in your WiFi + backend IP.
2. Deploy all .py files to the board via mpremote or Thonny.
3. The board connects to the backend WebSocket and shows device states.

DISPLAY NOTE
------------
Standard MicroPython has no CO5300/RM67162 QSPI driver. The board will
operate in serial-only mode (display stays off) until a custom firmware
with LVGL/CO5300 support is built. For a working display, use the Arduino
firmware in hardware/esp32-otter/pio/ instead.

BUTTON
------
BOOT button (GPIO 0):
  single press → acknowledge current prompt
  long press   → skip current action
  double press → request different suggestion
"""
import json
import time
import machine
import network

import config
from websocket_client import WebSocketClient
from display_states import init_display, update as display_update
import button_handler


# ── Device state (mirrors TypeScript DeviceState) ─────────────────────────────

state: dict = {
    "deviceId":     config.DEVICE_ID,
    "connection":   "disconnected",
    "batteryLevel": 85,
    "screenState":  "idle",
    "lightMode":    "soft",
    "volume":       50,
}


# ── WiFi ─────────────────────────────────────────────────────────────────────

def connect_wifi() -> bool:
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if wlan.isconnected():
        print(f"[WiFi] Already connected: {wlan.ifconfig()[0]}")
        return True
    print(f"[WiFi] Connecting to {config.WIFI_SSID}…")
    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)
    for _ in range(30):
        if wlan.isconnected():
            print(f"[WiFi] OK — IP: {wlan.ifconfig()[0]}")
            return True
        time.sleep(1)
    print("[WiFi] FAILED")
    return False


# ── Command handler ──────────────────────────────────────────────────────────

def handle_command(raw: str) -> bool:
    """Parse DeviceCommand JSON → update state + display. Returns True on change."""
    try:
        cmd = json.loads(raw)
    except Exception:
        print(f"[CMD] Bad JSON: {raw[:60]}")
        return False

    t = cmd.get("type", "")
    p = cmd.get("payload", {})
    print(f"[CMD] {t}")

    changed = True
    if t == "DEVICE_STATE":
        state["screenState"] = p.get("state", "idle")
        screen_text = p.get("screen_text", "")
        countdown   = int(p.get("duration_seconds", 0))
        voice_text  = p.get("voice_text", "")
        if voice_text:
            print(f"[Voice] {voice_text}")
        display_update(state["screenState"], screen_text, countdown)

    elif t == "SET_SCREEN_STATE":
        state["screenState"] = p.get("screenState", "idle")
        display_update(state["screenState"])

    elif t == "SET_LIGHT_MODE":
        state["lightMode"] = p.get("lightMode", "soft")
        changed = False   # no display change needed

    elif t == "SET_VOLUME":
        state["volume"] = int(p.get("volume", 50))
        changed = False

    elif t == "PLAY_SHORT_REPLY":
        state["screenState"] = "listening"
        display_update("listening", p.get("text", ""))

    elif t == "SHOW_STEP":
        mode = p.get("mode", "breathe")
        state["screenState"] = "breathing" if mode == "breathe" else "exercise_countdown"
        step_num = p.get("stepNum", 1)
        total    = p.get("totalSteps", 1)
        display_update(state["screenState"], f"[{step_num}/{total}] {p.get('text', '')}")

    elif t == "SHOW_COMPLETE":
        state["screenState"] = "idle"
        display_update("idle", p.get("message", "完成！"))

    elif t == "VIBRATE":
        print(f"[VIB] {p.get('pattern', 'short')} (no motor on this board)")
        changed = False

    else:
        print(f"[CMD] Unknown: {t}")
        changed = False

    return changed


# ── Button callbacks ─────────────────────────────────────────────────────────

_ws_ref: WebSocketClient | None = None


def _on_single() -> None:
    print("[BTN] Single press — acknowledge")
    if _ws_ref and _ws_ref.connected:
        _ws_ref.send_text(json.dumps({"type": "USER_ACK", "deviceId": config.DEVICE_ID}))


def _on_long() -> None:
    print("[BTN] Long press — skip")
    if _ws_ref and _ws_ref.connected:
        _ws_ref.send_text(json.dumps({"type": "USER_SKIP", "deviceId": config.DEVICE_ID}))


def _on_double() -> None:
    print("[BTN] Double press — change suggestion")
    if _ws_ref and _ws_ref.connected:
        _ws_ref.send_text(json.dumps({"type": "USER_CHANGE", "deviceId": config.DEVICE_ID}))


# ── Main loop ────────────────────────────────────────────────────────────────

def run() -> None:
    global _ws_ref
    ws = WebSocketClient()
    _ws_ref = ws

    while True:
        while not connect_wifi():
            time.sleep(5)

        print(f"[WS] Connecting → ws://{config.WS_HOST}:{config.WS_PORT}{config.WS_PATH}")
        try:
            ws.connect(config.WS_HOST, config.WS_PORT, config.WS_PATH)
        except Exception as e:
            print(f"[WS] Connect failed: {e} — retry in 3 s")
            time.sleep(3)
            continue

        state["connection"] = "connected"
        ws.send_text(json.dumps(state))
        display_update("idle")
        print("[WS] Connected")

        try:
            last_button_check = time.ticks_ms()
            while True:
                msg = ws.recv_text()
                if msg is not None:
                    changed = handle_command(msg)
                    if changed:
                        ws.send_text(json.dumps(state))

                # Poll button every 50 ms
                if time.ticks_diff(time.ticks_ms(), last_button_check) >= 50:
                    button_handler.check_pending()
                    last_button_check = time.ticks_ms()

        except OSError as e:
            print(f"[WS] Dropped: {e} — reconnecting in 3 s")
        except Exception as e:
            print(f"[WS] Error: {e}")
        finally:
            ws.close()
            state["connection"] = "disconnected"
            time.sleep(3)


# ── Entry point ───────────────────────────────────────────────────────────────

print("=" * 48)
print("  AI Otter Coach — ESP32-S3 MicroPython")
print("=" * 48)

display_ok = init_display()
if display_ok:
    print("[Display] Hardware driver loaded")
else:
    print("[Display] Serial-only mode (no QSPI driver)")

button_handler.register(on_single=_on_single, on_long=_on_long, on_double=_on_double)
button_handler.init(boot_pin=0)

run()
