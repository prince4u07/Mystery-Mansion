"""Local Python server for Mystery Mansion."""
from __future__ import annotations

import json
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from algorithms import a_star, backtracking, bfs, dfs, dijkstra

ROOT = Path(__file__).parent
GRAPH = {
    "hall": [("study", 2), ("dining", 4)],
    "study": [("hall", 2), ("gallery", 3)],
    "dining": [("hall", 4), ("basement", 2)],
    "gallery": [("study", 3), ("basement", 1)],
    "basement": [("dining", 2), ("gallery", 1)],
}
COORDINATES = {"hall": (0, 0), "study": (1, 1), "dining": (1, -1), "gallery": (2, 1), "basement": (2, -1)}
ALGORITHMS = {"BFS": bfs, "DFS": dfs, "DIJKSTRA": dijkstra, "A*": a_star, "BACKTRACKING": backtracking}


def estimate(node: str, target: str) -> float:
    x1, y1 = COORDINATES[node]
    x2, y2 = COORDINATES[target]
    return abs(x1 - x2) + abs(y1 - y2)


def run_algorithm(name: str) -> dict:
    if name == "A*":
        result = a_star(GRAPH, "hall", "basement", estimate)
    else:
        result = ALGORITHMS[name](GRAPH, "hall", "basement")
    result["algorithm"] = name
    result["start"] = "hall"
    result["target"] = "basement"
    result["edges_checked"] = sum(len(GRAPH[node]) for node in result["visited"])
    return result


class MansionHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/algorithm":
            name = parse_qs(parsed.query).get("name", ["BFS"])[0].upper()
            if name not in ALGORITHMS:
                self.send_error(400, "Unknown algorithm")
                return
            payload = json.dumps(run_algorithm(name)).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if parsed.path == "/api/health":
            payload = b'{"status":"ok","runtime":"python"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.path = "/index.html" if parsed.path == "/" else parsed.path
        super().do_GET()

    def log_message(self, format: str, *args: object) -> None:
        print(f"[mansion] {format % args}")


if __name__ == "__main__":
    port = 8000
    print(f"Mystery Mansion running at http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), lambda *args, **kwargs: MansionHandler(*args, directory=str(ROOT), **kwargs)).serve_forever()
