"""
AI Otter Coach — ESP32-S3-Touch-AMOLED-1.75 MicroPython Firmware
================================================================
Board:   Waveshare ESP32-S3-Touch-AMOLED-1.75
Display: CO5300 AMOLED 466x466 round (QSPI — driver initialised separately)
WiFi:    connects to backend WebSocket at WS_HOST:WS_PORT/WS_PATH

Flow:
  1. Connect WiFi
  2. Open WebSocket to Python backend  (/ws/device)
  3. Send initial DeviceState (JSON)
  4. Loop:
     - Receive DeviceCommand JSON → update state / display
     - Re-send DeviceState after each command
     - Reconnect on drop
"""

import json, time, machine
import network
from ws_client import WebSocketClient
import config

# ── Pin definitions (confirmed from capsule-radar project) ──────────────────
PIN_LCD_CS   = 12
PIN_LCD_RST  = 39
PIN_LCD_SCLK = 38
PIN_LCD_D0   = 4
PIN_LCD_D1   = 5
PIN_LCD_D2   = 6
PIN_LCD_D3   = 7
PIN_I2C_SDA  = 15
PIN_I2C_SCL  = 14

# ── Device state ─────────────────────────────────────────────────────────────
state = {
    "deviceId":     config.DEVICE_ID,
    "connection":   "disconnected",
    "batteryLevel": 85,
    "screenState":  "idle",
    "lightMode":    "soft",
    "volume":       50,
}

# ── Display (best-effort) ────────────────────────────────────────────────────
display_ok = False

def init_display():
    """
    Attempt to initialise the CO5300 AMOLED over QSPI.
    Standard MicroPython lacks a CO5300 driver so this falls back gracefully.
    A future step: build custom MicroPython with lvgl-bindings or use the
    Arduino Arduino_GFX sketch in hardware/esp32-otter/esp32-otter.ino instead.
    """
    global display_ok
    try:
        # Hard-reset the panel
        rst = machine.Pin(PIN_LCD_RST, machine.Pin.OUT)
        rst.off(); time.sleep_ms(100)
        rst.on();  time.sleep_ms(120)
        print("[Display] Reset OK – CO5300 QSPI driver not yet in MicroPython firmware")
        print("[Display] Display will show nothing until a custom firmware build is used")
        display_ok = False
    except Exception as e:
        print(f"[Display] Init error: {e}")
        display_ok = False


def display_update(screen_state, text=""):
    """Placeholder: print to Serial until real display driver is available."""
    icons = {
        "idle":               "[idle]     IDLE",
        "listening":          "[listen]   LISTENING",
        "thinking":           "[think]    THINKING",
        "breathing":          "[breathe]  BREATHING",
        "moving":             "[move]     MOVING",
        "sleeping":           "[sleep]    SLEEPING",
        "night_calm":         "[night]    NIGHT CALM",
        "hot_flash_calm":     "[hot]      HOT FLASH CALM",
        "exercise_countdown": "[exercise] EXERCISE",
        "next_move":          "[next]     NEXT MOVE",
        "reminder":           "[remind]   REMINDER",
        "low_battery":        "[bat]      LOW BATTERY",
    }
    label = icons.get(screen_state, f"[{screen_state}]")
    print(f"[Screen] {label}  {text}")


# ── WiFi ─────────────────────────────────────────────────────────────────────
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if wlan.isconnected():
        print(f"[WiFi] Already connected: {wlan.ifconfig()[0]}")
        return True
    print(f"[WiFi] Connecting to {config.WIFI_SSID} …")
    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)
    for _ in range(30):
        if wlan.isconnected():
            print(f"[WiFi] Connected: {wlan.ifconfig()[0]}")
            return True
        time.sleep(1)
    print("[WiFi] FAILED")
    return False


# ── Command handler ──────────────────────────────────────────────────────────
def handle_command(raw: str) -> bool:
    """Parse a DeviceCommand JSON and update state. Returns True if state changed."""
    try:
        cmd = json.loads(raw)
    except Exception:
        print(f"[CMD] Bad JSON: {raw[:80]}")
        return False

    t = cmd.get("type", "")
    p = cmd.get("payload", {})
    print(f"[CMD] {t}")

    if t == "SET_SCREEN_STATE":
        state["screenState"] = p.get("screenState", "idle")
        display_update(state["screenState"])

    elif t == "SET_LIGHT_MODE":
        state["lightMode"] = p.get("lightMode", "soft")

    elif t == "SET_VOLUME":
        state["volume"] = int(p.get("volume", 50))

    elif t == "PLAY_SHORT_REPLY":
        text = p.get("text", "")
        state["screenState"] = "listening"
        display_update("listening", text)

    elif t == "SHOW_STEP":
        text     = p.get("text", "")
        step_num = p.get("stepNum", 1)
        total    = p.get("totalSteps", 1)
        mode     = p.get("mode", "breathe")
        state["screenState"] = "breathing" if mode == "breathe" else "moving"
        display_update(state["screenState"], f"[{step_num}/{total}] {text}")

    elif t == "SHOW_COMPLETE":
        msg = p.get("message", "完成！")
        display_update("idle", msg)
        state["screenState"] = "idle"

    elif t == "VIBRATE":
        pattern = p.get("pattern", "short")
        print(f"[VIB] {pattern} (no motor on this board)")

    elif t == "DEVICE_STATE":
        # Unified state command — preferred for new code
        new_state  = p.get("state", "idle")
        screen_txt = p.get("screen_text", "")
        voice_txt  = p.get("voice_text", "")
        duration   = p.get("duration_seconds", 0)
        vib        = p.get("vibration", "none")
        state["screenState"] = new_state
        display_update(new_state, screen_txt)
        if voice_txt:
            print(f"[Voice] {voice_txt}")
        if duration:
            print(f"[Timer] {duration}s")
        if vib != "none":
            print(f"[VIB] {vib}")

    else:
        print(f"[CMD] Unknown type: {t}")
        return False

    return True


# ── Main loop ────────────────────────────────────────────────────────────────
def run():
    ws = WebSocketClient()

    while True:
        # ── Connect WiFi ──────────────────────────────────────────────────
        while not connect_wifi():
            time.sleep(5)

        # ── Connect WebSocket ─────────────────────────────────────────────
        print(f"[WS] Connecting to ws://{config.WS_HOST}:{config.WS_PORT}{config.WS_PATH}")
        try:
            ws.connect(config.WS_HOST, config.WS_PORT, config.WS_PATH)
        except Exception as e:
            print(f"[WS] Connect failed: {e} – retry in 3 s")
            time.sleep(3)
            continue

        state["connection"] = "connected"
        ws.send_text(json.dumps(state))
        display_update("idle")
        print("[WS] Connected – sending state loop")

        # ── Message loop ──────────────────────────────────────────────────
        try:
            while True:
                msg = ws.recv_text()
                if msg is not None:
                    changed = handle_command(msg)
                    if changed:
                        ws.send_text(json.dumps(state))
                else:
                    time.sleep_ms(50)
        except OSError as e:
            print(f"[WS] Dropped: {e} – reconnecting in 3 s")
        except Exception as e:
            print(f"[WS] Unexpected error: {e}")
        finally:
            ws.close()
            state["connection"] = "disconnected"
            time.sleep(3)


# ── Entry point ───────────────────────────────────────────────────────────────
print("=" * 48)
print("  AI Otter Coach – ESP32-S3 MicroPython")
print("=" * 48)
init_display()
run()
