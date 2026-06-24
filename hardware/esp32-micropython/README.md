# AI Otter Coach — ESP32-S3 MicroPython Firmware

## Hardware

**Board**: Waveshare ESP32-S3-Touch-AMOLED-1.75
- ESP32-S3, 240 MHz
- 16 MB Flash, 8 MB OPI PSRAM
- Round AMOLED display: CO5300, 466×466 px (QSPI)
- Native USB CDC
- BOOT button (GPIO 0)

## Setup

```bash
# Install mpremote (MicroPython remote tool)
pip install mpremote

# Copy and edit config
cp config.py.example config.py
# Edit config.py: WIFI_SSID, WIFI_PASSWORD, WS_HOST

# Flash MicroPython firmware (if not already installed)
# Download from: https://micropython.org/download/ESP32_GENERIC_S3/
esptool --chip esp32s3 --port /dev/cu.usbmodem* erase_flash
esptool --chip esp32s3 --port /dev/cu.usbmodem* write_flash 0x0 ESP32_GENERIC_S3-*.bin

# Deploy all Python files
mpremote connect /dev/cu.usbmodem* cp boot.py main.py websocket_client.py display_states.py button_handler.py config.py :
mpremote connect /dev/cu.usbmodem* reset
```

## Display Note

Standard MicroPython has no CO5300/RM67162 QSPI display driver. The firmware
runs in **serial-only mode** by default — the display stays off, but all state
changes are logged to the serial console.

To enable the display, either:
1. Build custom MicroPython with LVGL bindings + CO5300 driver
2. Use the Arduino firmware in `hardware/esp32-otter/pio/` (recommended for display testing)

## Button Controls

| Action | Result |
|--------|--------|
| Single press | Acknowledge / confirm current prompt |
| Long press (>1s) | Skip current action |
| Double press | Request a different suggestion |

## File Structure

| File | Purpose |
|------|---------|
| `main.py` | Main loop: WiFi → WebSocket → command handler |
| `boot.py` | MicroPython boot hook (GC setup) |
| `websocket_client.py` | RFC 6455 WebSocket client (no deps) |
| `display_states.py` | State-to-display mapping, driver hook |
| `button_handler.py` | BOOT button: single / long / double press |
| `config.py.example` | Template for WiFi + backend credentials |
| `config.py` | Your local config (gitignored) |

## WebSocket Protocol

The board connects to `ws://{WS_HOST}:{WS_PORT}/ws/device` and:
- Sends `DeviceState` JSON on connect and after each command
- Receives `DeviceCommand` JSON from the backend

See `docs/DEVICE_PROTOCOL.md` for the full protocol specification.
