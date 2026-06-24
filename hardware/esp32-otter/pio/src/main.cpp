/*
 * AI Otter Coach — ESP32-S3 serial/WebSocket bridge smoke firmware.
 *
 * Purpose:
 * - Keep display driver out of the first hardware bring-up loop.
 * - Verify USB CDC Serial, Wi-Fi, backend WebSocket, DeviceCommand receive,
 *   and DeviceState send.
 *
 * Next step after this passes: replace renderStateSerial() with the AMOLED
 * renderer once the exact CO5300/SH8601 panel config is confirmed.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "config.h"

WebSocketsClient ws;

struct DeviceState {
  String screenState = "idle";
  String screenText = "";
  int durationSeconds = 0;
  int batteryLevel = 86;
  String lightMode = "soft";
  String voiceText = "";
  String watchface = "";
  bool wsConnected = false;
};

DeviceState dev;

static void logLine(const String& msg) {
  Serial.println(msg);
  Serial.flush();
}

static void renderStateSerial() {
  Serial.printf(
    "[STATE] screen=%s text=%s duration=%d light=%s watchface=%s\n",
    dev.screenState.c_str(),
    dev.screenText.c_str(),
    dev.durationSeconds,
    dev.lightMode.c_str(),
    dev.watchface.c_str()
  );
  if (dev.voiceText.length()) {
    Serial.printf("[VOICE] %s\n", dev.voiceText.c_str());
  }
  Serial.flush();
}

static void sendDeviceState() {
  if (!dev.wsConnected) return;

  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["connection"] = "connected";
  doc["batteryLevel"] = dev.batteryLevel;
  doc["screenState"] = dev.screenState;
  doc["lightMode"] = dev.lightMode;
  doc["volume"] = 50;

  String out;
  serializeJson(doc, out);
  ws.sendTXT(out);
  Serial.printf("[WS->] %s\n", out.c_str());
  Serial.flush();
}

static const char* stateFromWatchface(const String& screen) {
  if (screen == "breathing") return "breathing";
  if (screen == "night-wake") return "night_calm";
  if (screen == "hot-flash") return "hot_flash_calm";
  if (screen == "exercise-countdown") return "exercise_countdown";
  if (screen == "next-move") return "next_move";
  if (screen == "daily-reminder") return "reminder";
  if (screen == "send-location") return "location_confirm";
  if (screen == "location-sent") return "location_sent";
  if (screen == "heel_drop_game_60s") return "playful_timer";
  if (screen == "neck_relax_game_60s") return "playful_timer";
  if (screen == "listening") return "listening";
  if (screen == "thinking") return "thinking";
  return "idle";
}

static void handleCommand(const String& raw) {
  Serial.printf("[WS<-] %s\n", raw.c_str());

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, raw);
  if (err) {
    Serial.printf("[CMD] bad json: %s\n", err.c_str());
    Serial.flush();
    return;
  }

  String type = doc["type"] | "";
  JsonVariant payload = doc["payload"];
  Serial.printf("[CMD] %s\n", type.c_str());

  if (type == "DEVICE_STATE") {
    // Accept both flattened legacy shape and nested payload shape.
    JsonVariant src = payload.isNull() ? doc.as<JsonVariant>() : payload;
    dev.screenState = src["state"] | "idle";
    dev.screenText = src["screen_text"] | "";
    dev.durationSeconds = src["duration_seconds"] | 0;
    dev.voiceText = src["voice_text"] | "";
    dev.lightMode = src["light_mode"] | "soft";
  } else if (type == "SET_WATCHFACE") {
    dev.watchface = payload["screen"] | "";
    dev.screenState = stateFromWatchface(dev.watchface);
    dev.screenText = payload["title"] | "";
    dev.durationSeconds = payload["remainingSeconds"] | 0;
    dev.lightMode = payload["lightMode"] | "soft";
  } else if (type == "SET_SCREEN_STATE") {
    dev.screenState = payload["screenState"] | "idle";
    dev.screenText = "";
    dev.durationSeconds = 0;
  } else if (type == "PLAY_SHORT_REPLY") {
    dev.screenState = "listening";
    dev.screenText = payload["text"] | "";
    dev.voiceText = dev.screenText;
  } else if (type == "SHOW_STEP") {
    String mode = payload["mode"] | "breathe";
    dev.screenState = mode == "move" ? "exercise_countdown" : "breathing";
    dev.screenText = payload["text"] | "";
    dev.durationSeconds = payload["durationSeconds"] | 30;
  } else if (type == "SHOW_COMPLETE") {
    dev.screenState = "idle";
    dev.screenText = payload["message"] | "完成了";
    dev.durationSeconds = 0;
  } else if (type == "SET_LIGHT_MODE") {
    dev.lightMode = payload["lightMode"] | "soft";
  } else if (type == "VIBRATE") {
    String pattern = payload["pattern"] | "short";
    Serial.printf("[VIBRATE] %s\n", pattern.c_str());
  } else {
    Serial.printf("[CMD] unknown type: %s\n", type.c_str());
  }

  renderStateSerial();
  sendDeviceState();
}

static void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      dev.wsConnected = true;
      logLine("[WS] connected");
      renderStateSerial();
      sendDeviceState();
      break;
    case WStype_DISCONNECTED:
      dev.wsConnected = false;
      logLine("[WS] disconnected");
      break;
    case WStype_TEXT:
      handleCommand(String((char*)payload).substring(0, length));
      break;
    default:
      break;
  }
}

static void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WiFi] connecting to SSID length=%d\n", (int)String(WIFI_SSID).length());

  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
    Serial.flush();
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] connected ip=%s rssi=%d\n",
      WiFi.localIP().toString().c_str(),
      WiFi.RSSI()
    );
  } else {
    Serial.printf("[WiFi] failed status=%d\n", WiFi.status());
  }
  Serial.flush();
}

static void connectWebSocket() {
  Serial.printf("[WS] connect ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
  ws.begin(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(3000);
  ws.enableHeartbeat(15000, 3000, 2);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  logLine("=== AI Otter Coach ESP32-S3 bridge ===");
  Serial.printf("[BOOT] CPU=%dMHz PSRAM=%d bytes\n",
    getCpuFrequencyMhz(),
    (int)ESP.getPsramSize()
  );

  renderStateSerial();
  connectWifi();
  connectWebSocket();
}

void loop() {
  ws.loop();

  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat >= 10000) {
    lastHeartbeat = millis();
    Serial.printf("[HB] wifi=%d ws=%d uptime=%lus\n",
      WiFi.status(),
      dev.wsConnected ? 1 : 0,
      millis() / 1000
    );
    sendDeviceState();
  }
}
