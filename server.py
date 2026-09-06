"""Local static server for Pathfinder Arcade."""
from __future__ import annotations

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent


class ArcadeHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if urlparse(self.path).path == "/api/health":
            payload = json.dumps({"status": "ok", "game": "pathfinder-arcade"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.path = "/index.html" if urlparse(self.path).path == "/" else self.path
        super().do_GET()

    def log_message(self, format: str, *args: object) -> None:
        print(f"[arcade] {format % args}")


if __name__ == "__main__":
    port = 8000
    print(f"Pathfinder Arcade running at http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), lambda *args, **kwargs: ArcadeHandler(*args, directory=str(ROOT), **kwargs)).serve_forever()
