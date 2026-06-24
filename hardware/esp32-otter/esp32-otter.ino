/*
 * AI Otter Coach — ESP32-S3-Touch-AMOLED-1.75
 * Display: RM67162  368×448  QSPI AMOLED
 *
 * Required libraries (Tools → Manage Libraries):
 *   • LovyanGFX    by lovyan03   (search "LovyanGFX")
 *   • WebSockets   by Markus Sattler
 *   • ArduinoJson  by Benoit Blanchon (>= 7)
 *
 * Board: ESP32S3 Dev Module
 *   Flash Size:       16MB (128Mb)
 *   PSRAM:            OPI PSRAM
 *   USB CDC On Boot:  Enabled
 *   Upload Speed:     921600
 */

#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include "config.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ── LovyanGFX: Waveshare ESP32-S3-Touch-AMOLED-1.75 (RM67162 QSPI) ──────────
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_RM67162 _panel;
  lgfx::Bus_QSPI      _bus;
public:
  LGFX() {
    {
      auto cfg = _bus.config();
      cfg.spi_host   = SPI2_HOST;
      cfg.freq_write = 80000000;
      cfg.pin_sclk   = 38;
      cfg.pin_d0     = 4;
      cfg.pin_d1     = 5;
      cfg.pin_d2     = 6;
      cfg.pin_d3     = 7;
      cfg.pin_cs     = 12;
      _bus.config(cfg);
      _panel.setBus(&_bus);
    }
    {
      auto cfg = _panel.config();
      cfg.pin_cs       = -1;   // managed by bus
      cfg.pin_rst      = 39;
      cfg.pin_busy     = -1;
      cfg.memory_width  = 368;
      cfg.memory_height = 448;
      cfg.panel_width   = 368;
      cfg.panel_height  = 448;
      cfg.offset_x      = 0;
      cfg.offset_y      = 0;
      cfg.offset_rotation = 0;
      cfg.invert        = true;  // AMOLED typically needs invert
      cfg.rgb_order     = false;
      cfg.readable      = false;
      cfg.bus_shared    = false;
      _panel.config(cfg);
    }
    setPanel(&_panel);
  }
};

static LGFX display;

#define SCREEN_W 368
#define SCREEN_H 448

// ── Colours (RGB565) ──────────────────────────────────────────────────────────
#define C_BLACK      0x0000
#define C_WHITE      0xFFFF
#define C_WARM_BEIGE 0xF7D4
#define C_DARK_GREEN 0x0323
#define C_MID_GREEN  0x0564
#define C_TEAL       0x0666
#define C_DARK_BLUE  0x0228
#define C_DARK_GRAY  0x2104
#define C_YELLOW     0xFFE0

// ── Device state ─────────────────────────────────────────────────────────────
struct DeviceState {
  String screenState  = "idle";
  String screenText   = "";
  int    countdown    = 0;
  int    batteryLevel = 86;
  String lightMode    = "soft";
};
DeviceState devState;

// ── WebSocket ─────────────────────────────────────────────────────────────────
WebSocketsClient ws;
bool wsConnected = false;

void renderState();
void sendDeviceState();

// ── Visual config per state ───────────────────────────────────────────────────
struct Visual { uint16_t bg, fg; const char* label; };

Visual getVisual(const String& s) {
  if (s == "listening")          return {C_DARK_GREEN,  C_WHITE,      "LISTENING"};
  if (s == "thinking")           return {C_MID_GREEN,   C_WHITE,      "THINKING"};
  if (s == "breathing")          return {C_TEAL,        C_WHITE,      "BREATHE"};
  if (s == "night_calm")         return {C_DARK_BLUE,   0x8AD0,       "NIGHT"};
  if (s == "hot_flash_calm")     return {0x5280,        0xFBE0,       "COOL DOWN"};
  if (s == "exercise_countdown") return {0x0924,        0xD7F0,       "MOVE"};
  if (s == "next_move")          return {0x09A3,        C_YELLOW,     "NEXT"};
  if (s == "moving")             return {0x0924,        0xD7F0,       "MOVING"};
  if (s == "sleeping")           return {C_DARK_GRAY,   0x6070,       "ZZZ"};
  if (s == "reminder")           return {0x5920,        0xFCC0,       "REMINDER"};
  if (s == "low_battery")        return {0x5800,        0xF800,       "LOW BATT"};
  if (s == "location_confirm")   return {C_MID_GREEN,   C_WHITE,      "LOCATION?"};
  if (s == "location_sent")      return {C_DARK_GREEN,  C_WHITE,      "SENT"};
  return {C_WARM_BEIGE, 0x6320, "IDLE"};
}

// ── Rendering ─────────────────────────────────────────────────────────────────
void centreText(const char* txt, int y, uint16_t col, uint8_t sz) {
  display.setTextSize(sz);
  display.setTextColor(col);
  int w = strlen(txt) * 6 * sz;
  display.setCursor(max(0, (SCREEN_W - w) / 2), y);
  display.print(txt);
}

void renderState() {
  auto v = getVisual(devState.screenState);
  display.fillScreen(v.bg);

  // Big state label
  centreText(v.label, SCREEN_H / 2 - 40, v.fg, 4);

  // Sub-text
  if (devState.screenText.length() > 0) {
    String t = devState.screenText;
    int y = SCREEN_H / 2 + 20;
    while (t.length() > 0 && y < SCREEN_H - 30) {
      String line = t.substring(0, min((int)t.length(), 20));
      centreText(line.c_str(), y, v.fg, 2);
      t = t.substring(line.length());
      y += 24;
    }
  }

  // Countdown
  if (devState.countdown > 0) {
    String cs = String(devState.countdown) + "s";
    centreText(cs.c_str(), SCREEN_H / 2 + 90, v.fg, 5);
  }

  // Decorative ring for active states
  if (devState.screenState != "idle" && devState.screenState != "sleeping") {
    display.drawCircle(SCREEN_W/2, SCREEN_H/2, 170, v.fg & 0x3186);
  }

  // Breathing rings
  if (devState.screenState == "breathing") {
    display.drawCircle(SCREEN_W/2, SCREEN_H/2, 140, 0xFFFF);
    display.drawCircle(SCREEN_W/2, SCREEN_H/2, 100, 0xFFFF);
  }

  // Idle: battery + time placeholder
  if (devState.screenState == "idle") {
    String bat = String(devState.batteryLevel) + "%";
    display.setTextSize(1); display.setTextColor(v.fg);
    display.setCursor(SCREEN_W - 30, 10);
    display.print(bat);
    display.setTextSize(3); display.setTextColor(v.fg);
    display.setCursor(SCREEN_W/2 - 30, 60);
    display.print("--:--");
  }

  Serial.printf("[Screen] %s | %s | %ds\n",
    devState.screenState.c_str(), devState.screenText.c_str(), devState.countdown);
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
void sendDeviceState() {
  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["connection"]   = wsConnected ? "connected" : "disconnected";
  doc["batteryLevel"] = devState.batteryLevel;
  doc["screenState"]  = devState.screenState;
  doc["lightMode"]    = devState.lightMode;
  String out; serializeJson(doc, out);
  ws.sendTXT(out);
}

void handleCommand(const String& raw) {
  JsonDocument doc;
  if (deserializeJson(doc, raw)) { Serial.println("[CMD] bad json"); return; }

  String type = doc["type"].as<String>();
  Serial.printf("[CMD] %s\n", type.c_str());

  if (type == "DEVICE_STATE") {
    devState.screenState = doc["payload"]["state"] | "idle";
    devState.screenText  = doc["payload"]["screen_text"] | "";
    devState.countdown   = doc["payload"]["duration_seconds"] | 0;
    String v = doc["payload"]["voice_text"] | "";
    if (v.length()) Serial.printf("[Voice] %s\n", v.c_str());
  } else if (type == "SET_SCREEN_STATE") {
    devState.screenState = doc["payload"]["screenState"] | "idle";
    devState.screenText  = ""; devState.countdown = 0;
  } else if (type == "SHOW_STEP") {
    devState.screenText  = doc["payload"]["text"] | "";
    devState.countdown   = doc["payload"]["durationSeconds"] | 30;
    String mode = doc["payload"]["mode"] | "breathe";
    devState.screenState = (mode == "move") ? "exercise_countdown" : "breathing";
  } else if (type == "SHOW_COMPLETE") {
    devState.screenState = "idle";
    devState.screenText  = doc["payload"]["message"] | "完成！";
    devState.countdown   = 0;
  } else if (type == "PLAY_SHORT_REPLY") {
    devState.screenText  = doc["payload"]["text"] | "";
    devState.screenState = "listening";
  } else if (type == "SET_LIGHT_MODE") {
    devState.lightMode   = doc["payload"]["lightMode"] | "soft";
    return;
  } else {
    Serial.printf("[CMD] Unknown: %s\n", type.c_str());
    return;
  }
  renderState();
  sendDeviceState();
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("[WS] Connected");
      sendDeviceState();
      renderState();
      break;
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected – retrying");
      break;
    case WStype_TEXT:
      handleCommand(String((char*)payload));
      break;
    default: break;
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("=== AI Otter Coach ===");

  // Display
  Serial.println("[Display] init...");
  if (display.init()) {
    display.setRotation(0);
    display.setBrightness(200);
    display.fillScreen(C_BLACK);
    centreText("AI Otter", SCREEN_H/2 - 20, C_WHITE, 3);
    centreText("Starting...",  SCREEN_H/2 + 20, 0xAD55, 2);
    Serial.println("[Display] OK");
  } else {
    Serial.println("[Display] FAILED — check pins/library");
  }

  // WiFi
  display.fillScreen(C_BLACK);
  centreText("WiFi...", SCREEN_H/2, C_WHITE, 2);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] %s\n", WiFi.localIP().toString().c_str());
    display.fillScreen(C_DARK_GREEN);
    centreText("WiFi OK", SCREEN_H/2 - 20, C_WHITE, 3);
    centreText(WiFi.localIP().toString().c_str(), SCREEN_H/2 + 20, C_WHITE, 1);
    delay(800);
  } else {
    Serial.println("\n[WiFi] FAILED");
    display.fillScreen(0x5800);
    centreText("WiFi FAIL", SCREEN_H/2, C_WHITE, 2);
    delay(1500);
  }

  // WebSocket
  Serial.printf("[WS] ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
  ws.begin(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(3000);
  ws.enableHeartbeat(15000, 3000, 2);

  renderState();
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  ws.loop();

  static unsigned long lastTick = 0;
  if (devState.countdown > 0 && millis() - lastTick >= 1000) {
    lastTick = millis();
    if (--devState.countdown == 0) Serial.println("[Timer] done");
    renderState();
  }
}
