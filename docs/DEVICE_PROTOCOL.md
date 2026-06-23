# Device Protocol

The desktop otter is represented by shared protocol types in `packages/shared-types`.

Current demo types:

- `DeviceState`
- `DeviceCommand`

Current commands:

- `SET_SCREEN_STATE`
- `SET_LIGHT_MODE`
- `SET_VOLUME`
- `PLAY_SHORT_REPLY`

The Web demo uses `DeviceSimulator`. Future adapters can implement the same command boundary over Bluetooth, Wi-Fi, or a local bridge service.

No covert GPS, caregiver tracking, or real-time monitoring should be added without explicit user permission and privacy controls.
