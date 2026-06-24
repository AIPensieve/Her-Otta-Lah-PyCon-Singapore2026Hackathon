"""
websocket_client.py — Minimal WebSocket client for MicroPython.

Implements RFC 6455 handshake and framing (text frames only).
No external dependencies — uses only MicroPython stdlib.
"""
import socket
import struct
import os
import binascii


class WebSocketClient:
    def __init__(self):
        self._sock: socket.socket | None = None

    # ── Connection ────────────────────────────────────────────────────────────

    def connect(self, host: str, port: int, path: str) -> bool:
        addr = socket.getaddrinfo(host, port, 0, socket.SOCK_STREAM)[0][-1]
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)

        key = binascii.b2a_base64(os.urandom(16)).strip().decode()
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(req.encode())

        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = s.recv(256)
            if not chunk:
                raise OSError("WS handshake: connection closed")
            resp += chunk

        if b" 101 " not in resp:
            raise OSError(f"WS handshake failed: {resp[:120]}")

        s.settimeout(0.1)   # non-blocking recv for main loop
        self._sock = s
        return True

    # ── Send ──────────────────────────────────────────────────────────────────

    def send_text(self, text: str) -> None:
        if self._sock is None:
            return
        data = text.encode() if isinstance(text, str) else text
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        n = len(data)
        header = (
            bytes([0x81, 0x80 | n]) + mask
            if n < 126
            else bytes([0x81, 0xFE]) + struct.pack(">H", n) + mask
        )
        self._sock.sendall(header + masked)

    # ── Receive ───────────────────────────────────────────────────────────────

    def _recvall(self, n: int) -> bytes | None:
        data = b""
        while len(data) < n:
            try:
                chunk = self._sock.recv(n - len(data))  # type: ignore
            except OSError as e:
                if e.args[0] in (11, 116):   # EAGAIN / ETIMEDOUT
                    return None if not data else None
                raise
            if not chunk:
                raise OSError("WS: connection closed by server")
            data += chunk
        return data

    def recv_text(self) -> str | None:
        """
        Return the next text frame, None if nothing available.
        Raises OSError if connection dropped.
        """
        if self._sock is None:
            raise OSError("not connected")
        header = self._recvall(2)
        if header is None:
            return None

        opcode = header[0] & 0x0F
        length = header[1] & 0x7F

        if length == 126:
            ext = self._recvall(2)
            if ext is None:
                return None
            length = struct.unpack(">H", ext)[0]
        elif length == 127:
            ext = self._recvall(8)
            if ext is None:
                return None
            length = struct.unpack(">Q", ext)[0]

        if opcode == 8:      # close frame
            raise OSError("WS: server sent close frame")
        if opcode == 9:      # ping → pong
            self._send_pong()
            return None

        payload = self._recvall(length)
        if payload is None:
            return None
        return payload.decode("utf-8")

    # ── Control ───────────────────────────────────────────────────────────────

    def _send_pong(self) -> None:
        if self._sock:
            self._sock.sendall(bytes([0x8A, 0x00]))

    def close(self) -> None:
        if self._sock:
            try:
                self._sock.sendall(bytes([0x88, 0x00]))   # close frame
            except Exception:
                pass
            self._sock.close()
            self._sock = None

    @property
    def connected(self) -> bool:
        return self._sock is not None
