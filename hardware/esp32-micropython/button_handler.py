"""
button_handler.py — Physical button input for the Waveshare ESP32-S3-AMOLED.

The board has a BOOT button (GPIO0). We use it for user interactions:
  - Single press:  acknowledge / confirm current prompt
  - Long press (>1s): skip current action
  - Double press:  request a different suggestion

Callbacks are registered by main.py and called from the interrupt handler.
"""
import machine
import time

_DEBOUNCE_MS = 50
_LONG_PRESS_MS = 1000
_DOUBLE_TAP_WINDOW_MS = 400

_on_single: callable | None = None
_on_long:   callable | None = None
_on_double: callable | None = None

_last_press_time: int = 0
_press_count: int = 0
_press_start: int = 0


def register(
    on_single: callable | None = None,
    on_long:   callable | None = None,
    on_double: callable | None = None,
) -> None:
    """Register callbacks for button events."""
    global _on_single, _on_long, _on_double
    _on_single = on_single
    _on_long   = on_long
    _on_double = on_double


def _irq_handler(pin: machine.Pin) -> None:
    global _last_press_time, _press_count, _press_start
    now = time.ticks_ms()

    if pin.value() == 0:                         # button pressed (active low)
        _press_start = now
    else:                                         # button released
        duration = time.ticks_diff(now, _press_start)
        if duration < _DEBOUNCE_MS:
            return

        if duration >= _LONG_PRESS_MS:
            _press_count = 0
            if _on_long:
                _on_long()
            return

        # Check double tap
        gap = time.ticks_diff(now, _last_press_time)
        _last_press_time = now
        if gap < _DOUBLE_TAP_WINDOW_MS and _press_count == 1:
            _press_count = 0
            if _on_double:
                _on_double()
        else:
            _press_count = 1


def _check_single_delayed() -> None:
    """Call after DOUBLE_TAP_WINDOW_MS to fire single if no second tap arrived."""
    global _press_count
    if _press_count == 1:
        _press_count = 0
        if _on_single:
            _on_single()


def init(boot_pin: int = 0) -> machine.Pin:
    """
    Set up interrupt on the BOOT button. Returns the Pin object.
    main.py should call check_pending() in its loop for single-tap detection.
    """
    btn = machine.Pin(boot_pin, machine.Pin.IN, machine.Pin.PULL_UP)
    btn.irq(trigger=machine.Pin.IRQ_FALLING | machine.Pin.IRQ_RISING, handler=_irq_handler)
    return btn


def check_pending() -> None:
    """
    Poll in main loop: fires single-tap callback after the double-tap window.
    Call roughly every 50 ms.
    """
    global _press_count, _last_press_time
    if _press_count == 1:
        gap = time.ticks_diff(time.ticks_ms(), _last_press_time)
        if gap >= _DOUBLE_TAP_WINDOW_MS:
            _press_count = 0
            if _on_single:
                _on_single()
