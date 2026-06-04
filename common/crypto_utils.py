import base64
import json


class CryptoEngine:
    """Minimal symmetric JSON crypto helper used by the implant and backend."""

    def __init__(self, shared_key: str):
        key_bytes = base64.b64decode(shared_key.encode("utf-8")) if shared_key else b"\x00" * 32
        self._key = key_bytes[:32].ljust(32, b"\x00")

    def _xor_bytes(self, data: bytes) -> bytes:
        return bytes(b ^ self._key[i % len(self._key)] for i, b in enumerate(data))

    def encrypt_json(self, payload: dict) -> str:
        raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        return base64.b64encode(self._xor_bytes(raw)).decode("ascii")

    def decrypt_json(self, payload: str) -> dict:
        raw = base64.b64decode(payload.encode("ascii"))
        return json.loads(self._xor_bytes(raw).decode("utf-8"))
