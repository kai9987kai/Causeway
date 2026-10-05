"""Serve Causeway on loopback using only the Python standard library."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import argparse
import threading
import webbrowser


ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"
PORT = int(os.environ.get("CAUSEWAY_PORT", "8765"))


class CausewayHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; connect-src 'self'; object-src 'none'; "
            "base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
        )
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description="Run the local Causeway workbench.")
    parser.add_argument("--no-open", action="store_true", help="Start the server without opening a browser tab.")
    args = parser.parse_args()
    os.chdir(ROOT)
    server = ThreadingHTTPServer((HOST, PORT), CausewayHandler)
    url = f"http://{HOST}:{PORT}/"
    print(f"Causeway is serving locally at {url}")
    print("Keep this window open while using the app. Press Ctrl+C to stop.")
    try:
        if not args.no_open:
            threading.Timer(0.5, webbrowser.open, args=(url,)).start()
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCauseway server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
