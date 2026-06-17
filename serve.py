#!/usr/bin/env python3
"""Tiny zero-dependency dev server for KCNA Prep.

Serves the app on the first free port from 4178, opens your browser, and adds
the same security headers the production deploys use (so what you test locally
matches what ships). Works on macOS, Linux, and Windows with stock Python 3.

    python3 serve.py            # serve + open browser
    python3 serve.py --port 9000
    python3 serve.py --no-open
"""
from __future__ import annotations

import argparse
import contextlib
import functools
import http.server
import socket
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent

CSP = (
    "default-src 'self'; base-uri 'self'; object-src 'none'; "
    "frame-ancestors 'none'; img-src 'self' data:; "
    "font-src 'self' https://fonts.gstatic.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "script-src 'self'; "
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; "
    "manifest-src 'self'; worker-src 'self'; form-action 'none'"
)


class Handler(http.server.SimpleHTTPRequestHandler):
    """Static handler that mirrors production security + cache headers."""

    def end_headers(self) -> None:  # noqa: D102
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), interest-cohort=()",
        )
        if self.path in ("/service-worker.js", "/index.html", "/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:  # quieter logs
        sys.stderr.write("  %s\n" % (fmt % args))


def free_port(start: int) -> int:
    port = start
    while port < start + 100:
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
        port += 1
    raise SystemExit("No free port found near %d" % start)


def main() -> int:
    ap = argparse.ArgumentParser(description="Serve KCNA Prep locally.")
    ap.add_argument("--port", type=int, default=4178)
    ap.add_argument("--no-open", action="store_true", help="don't open the browser")
    args = ap.parse_args()

    port = free_port(args.port)
    handler = functools.partial(Handler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    url = f"http://localhost:{port}"

    print(f"\n  KCNA Prep is running at  {url}")
    print("  Press Ctrl+C to stop.\n")

    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped. Happy studying!")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
