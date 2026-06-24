# AI Otter Coach – Hardware (ESP32-S3-Touch-AMOLED-1.75)

## Device

**Waveshare ESP32-S3-Touch-AMOLED-1.75**
- ESP32-S3-WROOM-1-N16R8 (Wi-Fi 2.4GHz + BLE 5.0)
- 1.75" AMOLED display, 368×448, RM67162 driver (QSPI)
- Capacitive touch
- USB Type-C (programming + power)
- Wiki: https://www.waveshare.net/wiki/ESP32-S3-Touch-AMOLED-1.75

## Communication

ESP32 connects to the Python backend over **Wi-Fi WebSocket**:

```
ESP32 → WiFi → Python Backend (ws://HOST:8000/ws/device)
```

Both devices must be on the **same local network** for a demo.

## Firmware Setup

### 1. Arduino IDE Prerequisites

Install these libraries via Library Manager (`Tools → Manage Libraries`):
- **WebSockets** by Markus Sattler
- **ArduinoJson** by Benoit Blanchon
- **Waveshare ESP32-S3-AMOLED library** – download from the Waveshare wiki above

Board settings (`Tools` menu):
```
Board:              ESP32S3 Dev Module
Flash Size:         16MB (128Mb)
PSRAM:              OPI PSRAM
USB CDC On Boot:    Enabled
```

### 2. Configure credentials

```bash
cd hardware/esp32-otter
cp config.h.example config.h
```

Edit `config.h`:
```cpp
#define WIFI_SSID     "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"
#define WS_HOST       "192.168.x.x"   // Your laptop's LAN IP
#define WS_PORT       8000
```

Find your laptop IP:
- macOS: `ifconfig | grep "inet " | grep -v 127`
- Windows: `ipconfig`
- Linux: `ip addr`

### 3. Flash

Open `esp32-otter/esp32-otter.ino` in Arduino IDE and click **Upload**.

## Protocol

The device communicates via JSON over WebSocket.

### Commands (Backend → ESP32)

```jsonc
// Show idle screen
{"type": "SET_SCREEN_STATE", "payload": {"screenState": "idle"}}

// ESP32 listens and shows "我在听"
{"type": "PLAY_SHORT_REPLY", "payload": {"text": "我在听", "locale": "mixed"}}

// Show a breathing step on screen
{"type": "SHOW_STEP", "payload": {
  "text": "慢慢呼气，把刚才的紧绷放下来。",
  "stepNum": 3, "totalSteps": 4, "mode": "breathe"
}}

// Show an exercise step
{"type": "SHOW_STEP", "payload": {
  "text": "坐稳，慢慢转动肩膀。",
  "stepNum": 1, "totalSteps": 4, "mode": "move"
}}

// Show completion
{"type": "SHOW_COMPLETE", "payload": {"message": "完成了，做得很好！"}}

// Light mode (stored in state, no physical LED on this board)
{"type": "SET_LIGHT_MODE", "payload": {"lightMode": "breathing"}}
```

### State (ESP32 → Backend)

Sent on connect and after each command:

```json
{
  "deviceId": "otter-001",
  "connection": "connected",
  "batteryLevel": 85,
  "screenState": "idle",
  "lightMode": "soft",
  "volume": 50
}
```

## Screen States

| State | Display |
|-------|---------|
| `idle` | Otter logo + "待机中" |
| `listening` | "我在听" + "说吧，我陪着你" |
| `breathing` | Concentric circles + step instruction |
| `moving` | Step counter + instruction |

## Notes

- The AMOLED display library API (class name, init call) may differ slightly between Waveshare library versions. Check the library examples if you see compile errors.
- `draw_wrapped()` in the sketch does a rough line-break. For better Chinese text layout, use LVGL or a proper UTF-8 font.
- There is no built-in vibration motor on this board. To add one, wire a vibration motor driver to a free GPIO and implement the `VIBRATE` command.
