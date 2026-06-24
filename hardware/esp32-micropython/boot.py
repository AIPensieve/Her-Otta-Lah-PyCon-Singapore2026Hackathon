"""
boot.py — runs once on MicroPython startup before main.py.
Disables debug output and sets up GC.
"""
import gc
gc.enable()
gc.collect()
