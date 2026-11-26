#!/usr/bin/env python3
"""Development-only mock of the RAG API (POST /ask). Standard library only, no secrets.

Not part of the published site (see _config.yml). Run:  python3 dev/mock-api.py [port]
Then open  http://localhost:8000/?api=http://localhost:8787  (the ?api= override only works on localhost).

The question text picks the response, so every UI state can be tried from the page:
  (anything else)  200 with citations, a figure and a trace
  "429"            429 with Retry-After: 7
  "503"            503 daily budget reached
  "500"            500 server error
  "422"            422 invalid input
  "slow"           200 after 6 s (shows the cold-start hint)
  "hang"           no reply for 40 s (shows the 30 s timeout)
  "badjson"        200 with a body that is not JSON
  "xss"            200 with HTML in answer/snippet/doc (must show as literal text)
"""
import json, struct, sys, time, zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8787


def png(w=360, h=200):
    """A plain PNG made with the stdlib, standing in for a figure."""
    row = b"\x00" + bytes([235, 228, 220]) * w
    raw = row * h
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


OK = {
    "answer": "The standard temperature at 5,000 feet is 5.1 °C (41.2 °F) [1][2]. A marker like [9] has no source and stays plain text.",
    "citations": [
        {"doc": "FAA-H-8083-25C", "page": "4-3", "snippet": "Standard atmosphere: at 5,000 feet the temperature is 5.1 °C.", "image_url": "/figures/demo.png"},
        {"doc": "FAA-H-8083-25C", "page": "11-3", "page_end": "11-4", "snippet": "Table of standard atmosphere values by altitude."},
    ],
    "trace": [
        {"step": "retriever", "detail": "Hybrid search: 30 candidates", "ms": 1300},
        {"step": "reranker", "detail": "Kept 5 of 30", "ms": 1081},
        {"step": "answer", "detail": "Grounded answer with page citations", "ms": 3120},
    ],
}
XSS = {
    "answer": "<img src=x onerror=alert(1)> <b>bold</b> [1]",
    "citations": [{"doc": "<script>alert(2)</script>", "page": "<i>1</i>", "snippet": "<img src=x onerror=alert(3)>", "image_url": "//evil.example/x.png"}],
    "trace": [{"step": "<b>x</b>", "detail": "<u>y</u>", "ms": 5}],
}


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Expose-Headers", "Retry-After")

    def _send(self, code, body, ctype="application/json", extra=None):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/figures/demo.png":
            return self._send(200, png(), "image/png")
        self._send(404, {"detail": "not found"})

    def do_POST(self):
        if self.path != "/ask":
            return self._send(404, {"detail": "not found"})
        n = int(self.headers.get("Content-Length") or 0)
        try:
            q = str(json.loads(self.rfile.read(n) or b"{}").get("question", ""))
        except ValueError:
            return self._send(422, {"detail": "bad json"})
        if not q.strip() or len(q) > 500 or "422" in q:
            return self._send(422, {"detail": "invalid question"})
        if "429" in q:
            return self._send(429, {"detail": "rate limited"}, extra={"Retry-After": "7"})
        if "503" in q:
            return self._send(503, {"detail": "daily budget reached"})
        if "500" in q:
            return self._send(500, {"detail": "boom"})
        if "hang" in q:
            time.sleep(40)
        if "slow" in q:
            time.sleep(6)
        if "badjson" in q:
            return self._send(200, b"<html>not json</html>", "text/html")
        self._send(200, XSS if "xss" in q else OK)


if __name__ == "__main__":
    print(f"mock RAG API on http://localhost:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
