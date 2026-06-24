"""
display_states.py — Maps DeviceState strings to display output.

On the Waveshare ESP32-S3-Touch-AMOLED-1.75, MicroPython currently cannot
drive the CO5300 AMOLED over QSPI (no native driver in standard MicroPython).
This module provides the state-to-serial-output mapping and a hook
for a future display driver integration.

To add real display support:
  1. Build custom MicroPython with LVGL bindings, OR
  2. Switch to the Arduino firmware in hardware/esp32-otter/pio/
"""

# State → (emoji label, short display text)
STATE_MAP: dict[str, tuple[str, str]] = {
    "idle":               ("🦦", "IDLE"),
    "listening":          ("👂", "LISTENING"),
    "thinking":           ("🤔", "THINKING"),
    "breathing":          ("🌊", "BREATHE"),
    "moving":             ("🏃", "MOVING"),
    "sleeping":           ("😴", "ZZZ"),
    "night_calm":         ("🌙", "NIGHT CALM"),
    "hot_flash_calm":     ("❄️",  "COOL DOWN"),
    "exercise_countdown": ("⏱️",  "EXERCISE"),
    "next_move":          ("➡️",  "NEXT MOVE"),
    "reminder":           ("🔔", "REMINDER"),
    "location_confirm":   ("📍", "LOCATE?"),
    "location_sent":      ("✅", "SENT"),
    "low_battery":        ("🔋", "LOW BATT"),
}

_display_driver = None   # set by init_display() if a driver is available


def init_display() -> bool:
    """
    Attempt to initialise hardware display driver.
    Returns True if a real driver was loaded, False if serial-only mode.
    """
    global _display_driver
    try:
        # Future: import custom_co5300 or lvgl driver here
        # import custom_co5300 as drv
        # _display_driver = drv
        # drv.init(cs=12, rst=39, sclk=38, d0=4, d1=5, d2=6, d3=7)
        # return True
        pass
    except Exception as e:
        print(f"[Display] Driver load failed: {e}")
    return False


def update(screen_state: str, text: str = "", countdown: int = 0) -> None:
    """
    Update the display to reflect the given screen state.
    Falls back to serial output if no hardware driver is available.
    """
    emoji, label = STATE_MAP.get(screen_state, ("❓", screen_state.upper()))

    if _display_driver:
        # Future: call real display render functions
        # _display_driver.fill_screen(STATE_COLORS[screen_state])
        # _display_driver.draw_text(label, ...)
        pass

    # Serial output (always — useful for debugging)
    suffix = f" | {text}" if text else ""
    timer = f" | {countdown}s" if countdown else ""
    print(f"[Screen] {emoji} {label}{suffix}{timer}")
