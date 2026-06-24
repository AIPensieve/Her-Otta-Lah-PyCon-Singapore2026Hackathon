#!/usr/bin/env python3
"""
向 ESP32 发送表盘状态命令。
使用 POST /api/device/command，不需要直连 WebSocket。

用法：
  python scripts/test_device_ws.py [state] [options]
  python scripts/test_device_ws.py --loop         # 自动遍历所有状态
  python scripts/test_device_ws.py breathing --text "跟着呼吸" --duration 30
  python scripts/test_device_ws.py --status       # 查看设备当前状态

支持的 state：
  idle  listening  thinking  breathing
  exercise_countdown  next_move  night_calm
  hot_flash_calm  location_confirm  location_sent
  sleeping  reminder  low_battery
"""

import time
import json
import argparse
import urllib.request
import urllib.error

DEFAULT_HOST = "localhost"
DEFAULT_PORT = 8000

ALL_STATES = [
    ("idle",               "小水獭在这里",     0),
    ("listening",          "我在听，慢慢说",   0),
    ("thinking",           "整理一下",         0),
    ("breathing",          "跟着呼吸，慢慢来", 30),
    ("exercise_countdown", "转动肩膀",         20),
    ("next_move",          "下一个动作",        0),
    ("night_calm",         "夜里陪你",         60),
    ("hot_flash_calm",     "慢慢冷静",         30),
    ("location_confirm",   "确认位置？",        0),
    ("location_sent",      "已发送",            0),
]

def build_command(state: str, text: str = "", duration: int = 0) -> dict:
    return {
        "type": "DEVICE_STATE",
        "payload": {
            "state": state,
            "screen_text": text,
            "duration_seconds": duration,
            "voice_text": text,
            "light_mode": "breathing" if state == "breathing" else "soft",
            "vibration": "none",
        }
    }

def post_command(host: str, port: int, cmd: dict) -> dict:
    url = f"http://{host}:{port}/api/device/command"
    body = json.dumps(cmd).encode()
    req = urllib.request.Request(url, data=body,
                                  headers={"Content-Type": "application/json"},
                                  method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}

def get_status(host: str, port: int) -> dict:
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/api/device/state", timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def send_one(host, port, state, text, duration):
    cmd = build_command(state, text, duration)
    print(f"[→] POST /api/device/command")
    print(f"    state={state}  text={text!r}  duration={duration}s")
    result = post_command(host, port, cmd)
    sent = result.get("sent") or result.get("Sent") or (result == {"sent": True})
    # JSON true → Python True; tolerate both
    if sent is True or sent == "True" or sent == 1:
        print(f"[✓] Sent — ESP32 serial should show: [Screen] {state}")
    elif "error" in result:
        print(f"[✗] Error: {result['error']}")
        print(f"\nHint: Is the backend running?")
        print(f"  cd services/backend && .venv/bin/uvicorn main:app --host 0.0.0.0 --port {port}")
    else:
        print(f"[!] sent=False — ESP32 not connected to backend WS")
        print(f"    Check ESP32 serial: python3 -c \"import serial; s=serial.Serial('/dev/cu.usbmodem1101',115200,timeout=2,dsrdtr=False); [print(s.readline().decode(errors='replace').rstrip()) for _ in range(20)]; s.close()\"")

def send_loop(host, port, interval=2.5):
    print(f"[Loop] Cycling all states every {interval}s. Ctrl-C to stop.\n")
    try:
        while True:
            for state, text, dur in ALL_STATES:
                cmd = build_command(state, text, dur)
                result = post_command(host, port, cmd)
                tick = "✓" if result.get("sent") else ("!" if not result.get("error") else "✗")
                print(f"[{tick}] {state:22s} | {text}")
                time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[Loop] Stopped.")

def main():
    parser = argparse.ArgumentParser(description="ESP32 表盘测试工具")
    parser.add_argument("state", nargs="?", default="idle")
    parser.add_argument("--text", default="")
    parser.add_argument("--duration", type=int, default=0)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--loop", action="store_true", help="自动遍历所有状态")
    parser.add_argument("--status", action="store_true", help="查看设备状态")
    args = parser.parse_args()

    if args.status:
        s = get_status(args.host, args.port)
        print(json.dumps(s, indent=2, ensure_ascii=False))
    elif args.loop:
        send_loop(args.host, args.port)
    else:
        send_one(args.host, args.port, args.state, args.text, args.duration)

if __name__ == "__main__":
    main()
