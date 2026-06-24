"""Minimal WebSocket client for MicroPython."""
import socket, struct, os, binascii


class WebSocketClient:
    def __init__(self):
        self._sock = None

    def connect(self, host, port, path):
        addr = socket.getaddrinfo(host, port, 0, socket.SOCK_STREAM)[0][-1]
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)

        key_raw = os.urandom(16)
        key = binascii.b2a_base64(key_raw).strip().decode()
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
            raise OSError(f"WS handshake failed:\n{resp[:200]}")

        s.settimeout(0.1)   # non-blocking for recv
        self._sock = s
        return True

    def send_text(self, text):
        if self._sock is None:
            return
        data = text.encode() if isinstance(text, str) else text
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        n = len(data)
        if n < 126:
            header = bytes([0x81, 0x80 | n]) + mask
        else:
            header = bytes([0x81, 0x80 | 126]) + struct.pack(">H", n) + mask
        self._sock.sendall(header + masked)

    def _recvall(self, n):
        """Read exactly n bytes; return None on timeout, raise on closed."""
        data = b""
        while len(data) < n:
            try:
                chunk = self._sock.recv(n - len(data))
            except OSError as e:
                if e.args[0] in (11, 116):   # EAGAIN / ETIMEDOUT
                    if not data:
                        return None          # nothing started yet → caller gets None
                    continue                  # partial read → keep going
                raise
            if not chunk:
                raise OSError("WS: connection closed")
            data += chunk
        return data

    def recv_text(self):
        """Return next text frame, None if nothing available, raise on error."""
        if self._sock is None:
            raise OSError("not connected")
        h = self._recvall(2)
        if h is None:
            return None

        opcode = h[0] & 0x0F
        length = h[1] & 0x7F
        if length == 126:
            length = struct.unpack(">H", self._recvall(2))[0]
        if opcode == 8:          # close frame
            raise OSError("WS: server closed")
        if opcode == 9:          # ping → pong
            self._send_pong()
            return None

        data = self._recvall(length)
        if data is None:
            return None
        return data.decode()

    def _send_pong(self):
        if self._sock:
            self._sock.sendall(bytes([0x8A, 0x00]))

    def close(self):
        if self._sock:
            try:
                self._sock.sendall(bytes([0x88, 0x00]))
            except Exception:
                pass
            self._sock.close()
            self._sock = None
