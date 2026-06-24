# Handoff For Cloud / Claude

## Current Status

This repo now has the main Hackathon app flow plus a standalone watchface preview/protocol page.

Frontend app:

- `#/talk` - Talk entry flow.
- `#/breathe` - Breathe catalogue UI currently visual-focused.
- `#/move` - Move in-progress page with countdown, browser TTS fallback, and device step commands.
- `#/timeline` - Record timeline.
- `#/me` - Settings/device area.
- `#/watchfaces` - Standalone watchface preview page.

The watchface UI assets are generated/cut from reference images and live in:

- `apps/web/public/watchfaces/`

## Hardware Integration Contract

The forward-looking hardware command is:

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

Shared TypeScript types:

- `packages/shared-types/src/index.ts`
  - `WatchfaceScreen`
  - `WatchfacePayload`
  - `DeviceCommand` includes `SET_WATCHFACE`
  - `DeviceState.watchface`

Protocol docs:

- `docs/DEVICE_PROTOCOL.md`

## Frontend Device Adapter

Use this as the frontend boundary for hardware commands:

- `apps/web/src/services/deviceAdapter.ts`

Important methods:

- `showWatchface(payload)`
- `setListening(text?)`
- `setThinking(text?)`
- `showStep(opts)`
- `showComplete(message)`

`showStep` currently sends both:

- New `SET_WATCHFACE`
- Legacy `DEVICE_STATE` / `SHOW_STEP` compatibility commands

This lets backend/hardware migrate gradually.

## Backend Bridge

The current FastAPI backend accepts arbitrary device command dictionaries:

- `services/backend/main.py`
  - `POST /api/device/command`
  - forwards command dict through `device_bridge`

This means `SET_WATCHFACE` can pass through without changing backend validation first.

Recommended next backend task:

- Add Pydantic model coverage for `SET_WATCHFACE`.
- Keep `dict` passthrough or a discriminated union while firmware is still evolving.

## Firmware Work Needed

ESP32 should implement:

```cpp
if (command.type == "SET_WATCHFACE") {
  renderWatchface(command.payload.screen, command.payload);
}
```

Suggested renderer mapping:

- `default`
- `listening`
- `thinking`
- `breathing`
- `night-wake`
- `hot-flash`
- `exercise-countdown`
- `next-move`
- `daily-reminder`
- `send-location`
- `location-sent`
- `connection`

For the hackathon, firmware can map these to local bitmap assets or native drawing functions.

## Safety Notes

- `send-location` and `location-sent` must only happen after explicit user action.
- Do not implement covert or continuous location monitoring.
- Health content remains record/companionship only, not diagnosis.
- Do not commit API keys, `.env`, real contacts, or real locations.

## Known Gaps

- App UI is not fully 1:1 with the desired reference screenshots.
- Watchface preview uses generated/cropped bitmap assets, not native firmware drawing.
- `DeviceHardwareUI` still needs to be replaced with a preview backed by `DeviceState.watchface`.
- Backend Python models do not yet explicitly model `SET_WATCHFACE`.
- ESP32 firmware still needs the actual `SET_WATCHFACE` handler and asset/render mapping.
