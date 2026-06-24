# Device Protocol

## Overview

The Otter device (ESP32-S3-Touch-AMOLED-1.75) connects to the Python backend via **WebSocket over Wi-Fi**.

```
Web App → POST /api/device/command → Python Backend → WS /ws/device → ESP32
ESP32   → WS /ws/device → Python Backend → WS /ws/frontend → Web App
```

## DeviceState (ESP32 → Backend)

Sent on connect and after each command is handled.

```json
{
  "deviceId": "otter-001",
  "connection": "connected",
  "batteryLevel": 85,
  "screenState": "idle",
  "lightMode": "soft",
  "volume": 50,
  "lastSeenAt": "2026-06-24T10:00:00Z"
}
```

### screenState values

| Value | Meaning |
|-------|---------|
| `idle` | Default resting screen – otter logo |
| `listening` | User is talking – "我在听" |
| `thinking` | AI is organizing a reply |
| `breathing` | Breathing exercise in progress |
| `moving` | Movement exercise in progress |
| `sleeping` | Low-power / night mode |
| `night_calm` | Night wake calm screen |
| `hot_flash_calm` | Hot flash calming screen |
| `exercise_countdown` | Movement countdown screen |
| `next_move` | Prompt for next movement |
| `reminder` | Daily reminder screen |
| `location_confirm` | User-initiated location send confirmation |
| `location_sent` | Location sent confirmation |
| `low_battery` | Low battery screen |
| `playful_timer` | Game flow timer / score screen from AI game contract |

### lightMode values

| Value | Behavior |
|-------|---------|
| `off` | No light effect |
| `soft` | Dim warm glow |
| `breathing` | Slow pulse |
| `alert` | Attention / reminder |

## DeviceCommand (Backend → ESP32)

All commands are JSON sent over WebSocket.

### SET_SCREEN_STATE
```json
{"type": "SET_SCREEN_STATE", "payload": {"screenState": "idle"}}
```

### SET_LIGHT_MODE
```json
{"type": "SET_LIGHT_MODE", "payload": {"lightMode": "breathing"}}
```

### SET_VOLUME
```json
{"type": "SET_VOLUME", "payload": {"volume": 50}}
```

### PLAY_SHORT_REPLY
Makes the device show the listening state and display a short reply.
```json
{"type": "PLAY_SHORT_REPLY", "payload": {"text": "我在听", "locale": "mixed"}}
```

### SHOW_STEP
Show a guided step (breathing or exercise) on the AMOLED screen.
```json
{
  "type": "SHOW_STEP",
  "payload": {
    "text": "慢慢吸气，像把空气放进身体里。",
    "stepNum": 2,
    "totalSteps": 4,
    "mode": "breathe"
  }
}
```
`mode` is `"breathe"` or `"move"`.

### SHOW_COMPLETE
Show a completion message when the user finishes an action.
```json
{"type": "SHOW_COMPLETE", "payload": {"message": "完成了，做得很好！"}}
```

### VIBRATE
Trigger a vibration pattern (requires external motor on GPIO).
```json
{"type": "VIBRATE", "payload": {"pattern": "short"}}
```
`pattern` is `"short"`, `"long"`, or `"double"`.

### SET_WATCHFACE
Preferred command for the production AMOLED watchface UI. The web app sends this command when the app flow wants the device to show a named watchface. The ESP32 should map `payload.screen` to its local renderer or bitmap asset.

```json
{
  "type": "SET_WATCHFACE",
  "payload": {
    "screen": "exercise-countdown",
    "title": "运动倒计时",
    "subtitle": "肩颈拉伸",
    "locale": "mixed",
    "step": 2,
    "totalSteps": 5,
    "remainingSeconds": 30,
    "batteryLevel": 80,
    "lightMode": "soft",
    "vibration": "none"
  }
}
```

#### watchface screen values

| Value | Intended screen |
|-------|-----------------|
| `default` | Default companion |
| `listening` | Listening |
| `thinking` | Thinking / organizing |
| `breathing` | Breathing meditation |
| `night-wake` | Night wake |
| `hot-flash` | Hot flash calm |
| `exercise-countdown` | Movement countdown |
| `next-move` | Next movement |
| `daily-reminder` | Daily reminder |
| `send-location` | Send location confirmation |
| `location-sent` | Location sent |
| `connection` | Wi-Fi / Bluetooth / battery status |
| `heel_drop_game_60s` | Heel-drop game flow |
| `neck_relax_game_60s` | Neck-relax game flow |

For safety, `send-location` and `location-sent` must only be triggered after an explicit user action. They must not be used for covert or continuous location tracking.

## AI Game Flow Directive

When AI returns a game flow, the app and hardware split responsibilities:

- App uses `game_id`, `scoring`, `completion`, `hardware_directive.open_fixed_flow`, and `hardware_directive.watchface`.
- ESP32 uses `hardware_directive.round_screen_state`, `display_text`, `voice_text`, `countdown_seconds`, `sensor_events`, and `motion_detection.sensor_signal`.

Example hardware directive:

```json
{
  "skill_id": "heel_drop_game_60s",
  "open_fixed_flow": "heel_drop_game_60s",
  "round_screen_state": "playful_timer",
  "watchface": "heel_drop_game_60s",
  "display_text": "小水獭接红豆冰",
  "voice_text": "Small-small movement can already. Press when you finish one.",
  "countdown_seconds": 60,
  "effects": {
    "light": "playful_soft",
    "breathing_light": false,
    "vibration": "score_soft"
  }
}
```

Example ESP32 event back to backend:

```json
{
  "event": "motion_detected",
  "game_id": "heel_drop_game_60s",
  "signal": "imu_vertical_pulse",
  "timestamp": 123456
}
```

The ESP32 does not run AI or Pygame. It renders the watchface, runs the countdown, and reports IMU/button/touch events.

## TypeScript Types

All types are in `packages/shared-types/src/index.ts`.
Python equivalents are in `services/backend/models.py`.

## Safety

- No covert GPS tracking or real-time location monitoring.
- No caregiver monitoring without explicit user consent.
- The device only displays what the user initiates on the app.

## Hardware Details

See `hardware/README.md` for board pinout, library setup, and flashing instructions.
