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
| `breathing` | Breathing exercise in progress |
| `moving` | Movement exercise in progress |
| `sleeping` | Low-power / night mode |

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

## TypeScript Types

All types are in `packages/shared-types/src/index.ts`.
Python equivalents are in `services/backend/models.py`.

## Safety

- No covert GPS tracking or real-time location monitoring.
- No caregiver monitoring without explicit user consent.
- The device only displays what the user initiates on the app.

## Hardware Details

See `hardware/README.md` for board pinout, library setup, and flashing instructions.
