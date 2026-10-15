"""ScamLens: a loopback-only server. Runtime inference and OCR never call the internet."""
from __future__ import annotations

import argparse
import base64
import binascii
import io
import json
import os
from pathlib import Path
import re
import secrets
import socket
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import webbrowser

from engine import analyze, response_schema_for_prompt

ROOT = Path(__file__).resolve().parent
VERSION = "1.0.0"
MAX_TEXT = 12_000
MAX_IMAGE = 8 * 1024 * 1024
MAX_BODY = 12 * 1024 * 1024
OLLAMA = "http://127.0.0.1:11434"
MODEL = "qwen2.5:1.5b"
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "Local inference redirects are refused.", headers, fp)


LOCAL_HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
INFERENCE_LOCK = threading.Lock()
OCR_LOCK = threading.Lock()
OCR_ENGINE = None
OCR_ERROR = None


def local_json(path, payload=None, timeout=3):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(OLLAMA + path, data=data,
                                     headers={"Content-Type": "application/json"})
    with LOCAL_HTTP.open(request, timeout=timeout) as response:
        raw = response.read(4 * 1024 * 1024 + 1)
    if len(raw) > 4 * 1024 * 1024:
        raise ValueError("Local model response exceeded its size limit.")
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise ValueError("Local model returned an invalid response.")
    return value


def model_status():
    try:
        data = local_json("/api/tags", timeout=2)
        names = [item.get("name", "") for item in data.get("models", []) if isinstance(item, dict)]
        available = MODEL in names
        return {"name": MODEL, "available": available, "running": True,
                "models": names, "error": None if available else
                f"Model not downloaded. Run: ollama pull {MODEL}"}
    except Exception:
        return {"name": MODEL, "available": False, "running": False, "models": [],
                "error": "Ollama is not reachable. Open the Ollama desktop app, then refresh status."}


def generate(prompt):
    try:
        result = local_json("/api/generate", {
            "model": MODEL, "prompt": prompt, "stream": False, "format": response_schema_for_prompt(prompt),
            "keep_alive": "10m", "options": {
                "temperature": 0, "num_ctx": 4096, "num_predict": 320,
                "num_thread": max(1, min(os.cpu_count() or 2, 4)),
            }}, timeout=180)
        if result.get("error"):
            raise RuntimeError("Ollama could not run the selected model. Check its terminal and available memory.")
        answer = result.get("response")
        if not isinstance(answer, str) or not answer.strip():
            raise RuntimeError("The local model returned no explanation.")
        return answer
    except (TimeoutError, socket.timeout):
        raise RuntimeError("Local AI took longer than 180 seconds. Try a shorter message or close other applications.") from None
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise RuntimeError(f"Download the model first: ollama pull {MODEL}") from None
        raise RuntimeError("Ollama could not run the model. Check that sufficient RAM is available.") from None
    except urllib.error.URLError:
        raise RuntimeError("Ollama is not running. Open Ollama and refresh the local model status.") from None


def init_ocr():
    global OCR_ENGINE, OCR_ERROR
    if OCR_ENGINE is not None:
        return
    from rapidocr_onnxruntime import RapidOCR
    # OCR weights ship in the installed wheel. Explicit CPU limits avoid oversubscription.
    OCR_ENGINE = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)
    OCR_ERROR = None


def ocr_status():
    global OCR_ERROR
    try:
        import importlib.util
        if not all(importlib.util.find_spec(name) for name in ("rapidocr_onnxruntime", "PIL")):
            return {"available": False, "error": "Screenshot support is not installed. Run Setup-Windows.cmd."}
        return {"available": OCR_ERROR is None, "error": OCR_ERROR}
    except Exception:
        return {"available": False, "error": "Screenshot support needs repair. Run Setup-Windows.cmd again."}


def extract_image(data_url):
    global OCR_ERROR
    if not isinstance(data_url, str):
        raise ValueError("Choose a PNG, JPEG, or WebP screenshot.")
    match = re.fullmatch(r"data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\r\n]+)", data_url)
    if not match:
        raise ValueError("Unsupported image. Choose a PNG, JPEG, or WebP screenshot.")
    try:
        raw = base64.b64decode(match.group(2), validate=True)
    except (ValueError, binascii.Error):
        raise ValueError("The image could not be decoded. Try selecting it again.") from None
    if not raw or len(raw) > MAX_IMAGE:
        raise ValueError("Images must be no larger than 8 MB.")
    try:
        from PIL import Image, ImageOps, UnidentifiedImageError
        import numpy as np
    except ImportError:
        raise RuntimeError("Screenshot support is not installed. Run Setup-Windows.cmd.") from None
    try:
        image = Image.open(io.BytesIO(raw))
        if image.format not in {"PNG", "JPEG", "WEBP"}:
            raise ValueError("Only PNG, JPEG, and WebP screenshots are accepted.")
        if image.width * image.height > 20_000_000 or min(image.size) < 20:
            raise ValueError("Use an image between 20 pixels and 20 megapixels.")
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((2400, 2400))
        image_array = np.asarray(image)[:, :, ::-1].copy()  # RapidOCR expects BGR.
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError):
        raise ValueError("The screenshot is damaged or too large. Export it as a smaller PNG.") from None
    if not OCR_LOCK.acquire(blocking=False):
        raise RuntimeError("Another screenshot is being read. Please wait and try again.")
    try:
        init_ocr()
        results, _ = OCR_ENGINE(image_array)
    except ImportError:
        OCR_ERROR = "OCR dependencies are missing. Run Setup-Windows.cmd again."
        raise RuntimeError(OCR_ERROR) from None
    except Exception as exc:
        OCR_ERROR = "The OCR engine could not start. Run Setup-Windows.cmd again."
        raise RuntimeError(OCR_ERROR) from exc
    finally:
        OCR_LOCK.release()
    lines = [str(item[1]).strip() for item in (results or []) if len(item) >= 3 and str(item[1]).strip()]
    text = "\n".join(lines)
    warnings = ["Review the extracted text, especially links, names, and numbers, before analyzing."]
    if not text:
        warnings.append("No text was found. Use a sharper screenshot or paste the message manually.")
    elif any(float(item[2]) < 0.8 for item in (results or [])):
        warnings.append("Some words were unclear. Correct them in the message box before analysis.")
    if len(text) > MAX_TEXT:
        text = text[:MAX_TEXT]
        warnings.append("The extracted text was shortened to 12,000 characters.")
    return {"text": text, "warnings": warnings}


class Handler(BaseHTTPRequestHandler):
    server_version = "ScamLens/" + VERSION
    sys_version = ""

    def log_message(self, fmt, *args):
        # Do not log submitted text, screenshot contents, or model responses.
        if args and isinstance(args[0], str):
            route = args[0].split(" ")[1] if " " in args[0] else "request"
            if "?" in route:
                route = route.split("?", 1)[0]
            print(f"[local] {self.command} {route[:80]} {args[1] if len(args) > 1 else ''}")

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
        super().end_headers()

    def json_response(self, code, value):
        body = json.dumps(value, ensure_ascii=True).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def valid_host(self):
        return self.headers.get("Host", "").lower() in {
            f"localhost:{self.server.server_port}", f"127.0.0.1:{self.server.server_port}"}

    def do_GET(self):
        if not self.valid_host():
            return self.json_response(403, {"error": "Only local requests are allowed."})
        route = self.path.split("?", 1)[0]
        if route == "/api/health":
            return self.json_response(200, {"status": "ok", "version": VERSION,
                "model": model_status(), "ocr": ocr_status()})
        if route == "/api/samples":
            try:
                samples = json.loads((ROOT / "demo" / "samples.json").read_text(encoding="utf-8"))
                return self.json_response(200, samples)
            except Exception:
                return self.json_response(500, {"error": "Demo samples could not be read."})
        routes = {"/": ("index.html", "text/html"), "/index.html": ("index.html", "text/html"),
                  "/app.css": ("app.css", "text/css"), "/app.js": ("app.js", "application/javascript")}
        if route == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        if route not in routes:
            return self.json_response(404, {"error": "Not found."})
        filename, mime = routes[route]
        try:
            data = (ROOT / "static" / filename).read_bytes()
        except OSError:
            return self.json_response(500, {"error": "An application asset is missing. Extract the ZIP again."})
        self.send_response(200)
        self.send_header("Content-Type", mime + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if not self.valid_host():
            return self.json_response(403, {"error": "Only local requests are allowed."})
        origin = self.headers.get("Origin")
        valid_origins = {f"http://127.0.0.1:{self.server.server_port}",
                         f"http://localhost:{self.server.server_port}"}
        if origin is not None and origin not in valid_origins:
            return self.json_response(403, {"error": "Cross-site requests are not allowed."})
        if self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
            return self.json_response(415, {"error": "Send application/json."})
        if self.path not in {"/api/analyze", "/api/ocr"}:
            return self.json_response(404, {"error": "Not found."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY:
                return self.json_response(413, {"error": "Request is empty or exceeds the upload limit."})
            self.connection.settimeout(20)
            raw = self.rfile.read(length)
            body = json.loads(raw)
            if not isinstance(body, dict):
                raise ValueError("The request must contain a JSON object.")
        except (ValueError, UnicodeDecodeError, RecursionError):
            return self.json_response(400, {"error": "Invalid JSON request."})
        except (TimeoutError, socket.timeout):
            return self.json_response(408, {"error": "Upload timed out. Please retry."})
        if self.path == "/api/ocr":
            try:
                return self.json_response(200, extract_image(body.get("image")))
            except ValueError as exc:
                return self.json_response(400, {"error": str(exc)})
            except RuntimeError as exc:
                return self.json_response(503, {"error": str(exc)})
        text = body.get("text")
        if not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT:
            return self.json_response(400, {"error": "Enter a message between 1 and 12,000 characters."})
        if not INFERENCE_LOCK.acquire(blocking=False):
            return self.json_response(429, {"error": "An analysis is already running. Wait for it to finish, then retry."})
        try:
            result = analyze(text.strip(), generate=generate, model_name=MODEL)
            result["request_id"] = secrets.token_hex(6)
            code = 200
        except ValueError as exc:
            code, result = 400, {"error": str(exc)}
        except Exception:
            code, result = 500, {"error": "Analysis could not finish. Check the terminal, then retry."}
        finally:
            INFERENCE_LOCK.release()
        # Release computation capacity before publishing a completed response.
        return self.json_response(code, result)



def main():
    parser = argparse.ArgumentParser(description="ScamLens offline message assistant")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--open-browser", action="store_true")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("Choose a port between 1024 and 65535.")
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    except OSError:
        raise SystemExit(f"Port {args.port} is in use. Close the other ScamLens window, or run: python server.py --port {args.port + 1}")
    print(f"\nScamLens {VERSION} | http://127.0.0.1:{args.port}")
    print(f"Local model: {MODEL} | No accounts. No API keys. No message storage.")
    print("Keep this window open. Press Ctrl+C to stop.\n")
    if args.open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(f"http://127.0.0.1:{args.port}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nScamLens stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
