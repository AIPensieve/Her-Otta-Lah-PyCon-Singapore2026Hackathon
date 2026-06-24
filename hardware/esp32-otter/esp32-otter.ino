/*
 * AI Otter Coach – ESP32-S3-Touch-AMOLED-1.75 Firmware
 * ======================================================
 * Board: Waveshare ESP32-S3-Touch-AMOLED-1.75
 * Display: 1.75" AMOLED (368x448, RM67162 driver via QSPI)
 *
 * Required Arduino libraries (install via Library Manager):
 *   - WebSockets by Markus Sattler       (search: "WebSockets")
 *   - ArduinoJson by Benoit Blanchon     (search: "ArduinoJson")
 *   - Waveshare ESP32-S3 AMOLED          (download from Waveshare wiki or GitHub)
 *     Wiki: https://www.waveshare.net/wiki/ESP32-S3-Touch-AMOLED-1.75
 *
 * Board settings (Arduino IDE):
 *   Board: ESP32S3 Dev Module
 *   Flash: 16MB (128Mb)
 *   PSRAM: OPI PSRAM
 *   USB CDC On Boot: Enabled (for Serial monitor)
 *
 * Connection:
 *   ESP32 → WiFi → Python Backend WS /ws/device
 *   Receives: DeviceCommand JSON
 *   Sends:    DeviceState JSON updates
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Waveshare AMOLED library for ESP32-S3-Touch-AMOLED-1.75
// Adjust the include path to match the library you downloaded from Waveshare.
#include <LilyGo_AMOLED.h>   // or: #include "AMOLED_SH8601.h"

#include "config.h"

// ---------------------------------------------------------------------------
// Display & touch
// ---------------------------------------------------------------------------
LilyGo_Class amoled;           // Waveshare wrapper (adjust class name if needed)

// Display dimensions for this board
static const int DISP_W = 368;
static const int DISP_H = 448;

// ---------------------------------------------------------------------------
// WebSocket client
// ---------------------------------------------------------------------------
WebSocketsClient ws;
bool ws_connected = false;

// ---------------------------------------------------------------------------
// Device state (sent to backend on change)
// ---------------------------------------------------------------------------
struct OtterState {
  String screenState = "idle";
  String lightMode   = "soft";
  int    batteryLevel = 85;
};
OtterState state;

// ---------------------------------------------------------------------------
// Forward declarations
// ---------------------------------------------------------------------------
void handle_command(const String& json);
void draw_idle();
void draw_listening();
void draw_breathing(int step, int total, const String& text);
void draw_moving(int step, int total, const String& text);
void draw_complete(const String& msg);
void draw_text_centered(const String& line1, const String& line2 = "", uint32_t color = 0xFFFFFF);
void send_state();

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[Otter] Booting…");

  // Init AMOLED display
  // NOTE: The exact API depends on your Waveshare library version.
  // Check the library examples for the correct begin() call.
  amoled.begin();
  amoled.setBrightness(200);
  amoled.fillScreen(0x000000);
  draw_text_centered("AI Otter Coach", "启动中…", 0x44CCAA);

  // Connect WiFi
  Serial.printf("[WiFi] Connecting to %s …\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] FAILED – running offline");
    draw_text_centered("WiFi 未连接", "请检查 config.h", 0xFF4444);
    return;
  }
  Serial.printf("\n[WiFi] Connected: %s\n", WiFi.localIP().toString().c_str());

  // Connect WebSocket to Python backend
  ws.begin(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(ws_event);
  ws.setReconnectInterval(3000);
  ws.enableHeartbeat(15000, 3000, 2);

  draw_text_centered("连接后台中…", WS_HOST, 0xAAAAFF);
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
void loop() {
  ws.loop();
}

// ---------------------------------------------------------------------------
// WebSocket event handler
// ---------------------------------------------------------------------------
void ws_event(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      ws_connected = true;
      Serial.printf("[WS] Connected to ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
      state.screenState = "idle";
      send_state();
      draw_idle();
      break;

    case WStype_DISCONNECTED:
      ws_connected = false;
      Serial.println("[WS] Disconnected – will retry");
      draw_text_centered("断开连接", "重连中…", 0xFF8844);
      break;

    case WStype_TEXT:
      handle_command(String((char*)payload));
      break;

    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Command handler
// ---------------------------------------------------------------------------
void handle_command(const String& json) {
  Serial.printf("[CMD] %s\n", json.c_str());

  JsonDocument doc;
  if (deserializeJson(doc, json) != DeserializationError::Ok) {
    Serial.println("[CMD] JSON parse error");
    return;
  }

  const char* type = doc["type"];
  if (!type) return;

  // ── SET_SCREEN_STATE ────────────────────────────────────────────────────
  if (strcmp(type, "SET_SCREEN_STATE") == 0) {
    state.screenState = doc["payload"]["screenState"].as<String>();
    if (state.screenState == "idle")      draw_idle();
    else if (state.screenState == "listening") draw_listening();
    send_state();
  }

  // ── SET_LIGHT_MODE ──────────────────────────────────────────────────────
  else if (strcmp(type, "SET_LIGHT_MODE") == 0) {
    state.lightMode = doc["payload"]["lightMode"].as<String>();
    // No physical LED on this board, but store the state
    send_state();
  }

  // ── PLAY_SHORT_REPLY ────────────────────────────────────────────────────
  else if (strcmp(type, "PLAY_SHORT_REPLY") == 0) {
    String text = doc["payload"]["text"].as<String>();
    draw_listening();
    state.screenState = "listening";
    send_state();
    // Return to idle after 2 seconds (non-blocking via millis)
    // Simple approach: block 2s here (acceptable for demo)
    delay(2000);
    draw_idle();
    state.screenState = "idle";
    send_state();
  }

  // ── SHOW_STEP ───────────────────────────────────────────────────────────
  else if (strcmp(type, "SHOW_STEP") == 0) {
    String text      = doc["payload"]["text"].as<String>();
    int    stepNum   = doc["payload"]["stepNum"].as<int>();
    int    total     = doc["payload"]["totalSteps"].as<int>();
    String mode      = doc["payload"]["mode"].as<String>();

    if (mode == "breathe") {
      state.screenState = "breathing";
      draw_breathing(stepNum, total, text);
    } else {
      state.screenState = "moving";
      draw_moving(stepNum, total, text);
    }
    send_state();
  }

  // ── SHOW_COMPLETE ────────────────────────────────────────────────────────
  else if (strcmp(type, "SHOW_COMPLETE") == 0) {
    String msg = doc["payload"]["message"].as<String>();
    draw_complete(msg);
    state.screenState = "idle";
    send_state();
  }

  // ── VIBRATE ──────────────────────────────────────────────────────────────
  else if (strcmp(type, "VIBRATE") == 0) {
    // This board does not have a built-in vibration motor.
    // If you add one on a GPIO, drive it here.
    Serial.println("[VIB] Vibrate (no motor on this board)");
  }
}

// ---------------------------------------------------------------------------
// Send current state to backend
// ---------------------------------------------------------------------------
void send_state() {
  if (!ws_connected) return;

  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["connection"]   = "connected";
  doc["batteryLevel"] = state.batteryLevel;
  doc["screenState"]  = state.screenState;
  doc["lightMode"]    = state.lightMode;
  doc["volume"]       = 50;

  String out;
  serializeJson(doc, out);
  ws.sendTXT(out);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

// Background colors
static const uint32_t BG_IDLE      = 0x0D1B2A;  // dark navy
static const uint32_t BG_LISTEN    = 0x0F3D3D;  // teal dark
static const uint32_t BG_BREATHE   = 0x0A2A1A;  // dark green
static const uint32_t BG_MOVE      = 0x1A1A0A;  // dark warm
static const uint32_t BG_COMPLETE  = 0x0A1A0A;  // dark green

void draw_idle() {
  amoled.fillScreen(BG_IDLE);
  // Otter emoji as simple circle placeholder
  amoled.fillCircle(DISP_W / 2, DISP_H / 2 - 40, 60, 0x226655);
  // Text
  amoled.setTextColor(0x44DDBB);
  amoled.setTextSize(2);
  amoled.drawCentreString("🦦", DISP_W / 2, DISP_H / 2 - 55, 1);
  amoled.setTextColor(0xFFFFFF);
  amoled.setTextSize(2);
  amoled.drawCentreString("AI Otter", DISP_W / 2, DISP_H / 2 + 40, 1);
  amoled.setTextSize(1);
  amoled.setTextColor(0x888888);
  amoled.drawCentreString("待机中", DISP_W / 2, DISP_H / 2 + 70, 1);
}

void draw_listening() {
  amoled.fillScreen(BG_LISTEN);
  amoled.setTextColor(0x44FFCC);
  amoled.setTextSize(2);
  amoled.drawCentreString("我在听", DISP_W / 2, DISP_H / 2 - 20, 1);
  amoled.setTextSize(1);
  amoled.setTextColor(0xAAFFEE);
  amoled.drawCentreString("说吧，我陪着你", DISP_W / 2, DISP_H / 2 + 20, 1);
}

void draw_breathing(int step, int total, const String& text) {
  amoled.fillScreen(BG_BREATHE);

  // Concentric circles for breathing animation
  int cx = DISP_W / 2;
  int cy = 140;
  amoled.drawCircle(cx, cy, 80, 0x226644);
  amoled.drawCircle(cx, cy, 60, 0x338855);
  amoled.fillCircle(cx, cy, 40, 0x44AAAA);
  amoled.setTextColor(0xFFFFFF);
  amoled.setTextSize(1);
  amoled.drawCentreString("呼吸", cx, cy - 8, 1);

  // Step indicator
  amoled.setTextColor(0x88FFCC);
  amoled.setTextSize(1);
  String stepLabel = String(step) + " / " + String(total);
  amoled.drawCentreString(stepLabel.c_str(), DISP_W / 2, 240, 1);

  // Instruction text (wrapped manually for small display)
  amoled.setTextColor(0xFFFFFF);
  amoled.setTextSize(2);
  draw_wrapped(text, 20, 270, DISP_W - 40, 0xFFFFFF);
}

void draw_moving(int step, int total, const String& text) {
  amoled.fillScreen(BG_MOVE);

  amoled.setTextColor(0xFFDD88);
  amoled.setTextSize(1);
  amoled.drawCentreString("动一动", DISP_W / 2, 60, 1);

  String stepLabel = "Step " + String(step) + " / " + String(total);
  amoled.setTextColor(0xAAAAAA);
  amoled.setTextSize(1);
  amoled.drawCentreString(stepLabel.c_str(), DISP_W / 2, 100, 1);

  amoled.setTextColor(0xFFFFFF);
  amoled.setTextSize(2);
  draw_wrapped(text, 20, 160, DISP_W - 40, 0xFFFFFF);
}

void draw_complete(const String& msg) {
  amoled.fillScreen(BG_COMPLETE);
  amoled.setTextColor(0x44FF88);
  amoled.setTextSize(2);
  amoled.drawCentreString("完成！", DISP_W / 2, 160, 1);
  amoled.setTextColor(0xFFFFFF);
  amoled.setTextSize(1);
  draw_wrapped(msg, 20, 220, DISP_W - 40, 0xFFFFFF);
}

void draw_text_centered(const String& line1, const String& line2, uint32_t color) {
  amoled.fillScreen(0x000000);
  amoled.setTextColor(color);
  amoled.setTextSize(2);
  amoled.drawCentreString(line1.c_str(), DISP_W / 2, DISP_H / 2 - 20, 1);
  if (line2.length() > 0) {
    amoled.setTextSize(1);
    amoled.setTextColor(0xAAAAAA);
    amoled.drawCentreString(line2.c_str(), DISP_W / 2, DISP_H / 2 + 20, 1);
  }
}

// Simple text wrapper: breaks at spaces when line exceeds maxW pixels
// NOTE: For Chinese characters, each char is ~16px wide at textSize 2.
void draw_wrapped(const String& text, int x, int y, int maxW, uint32_t color) {
  amoled.setTextColor(color);
  amoled.setTextSize(2);

  // Rough char width for size-2 ASCII: 12px; Chinese: ~16px
  // For a proper implementation use TFT_eSPI textWidth() or similar.
  const int lineH = 28;
  int charW = 12;
  int charsPerLine = maxW / charW;

  String line = "";
  int lineY = y;
  for (int i = 0; i < (int)text.length(); i++) {
    char c = text[i];
    line += c;
    if ((int)line.length() >= charsPerLine) {
      amoled.drawString(line.c_str(), x, lineY, 1);
      lineY += lineH;
      line = "";
    }
  }
  if (line.length() > 0) {
    amoled.drawString(line.c_str(), x, lineY, 1);
  }
}
