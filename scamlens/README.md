# ScamLens

**Pause. Check the message. Keep control.**

ScamLens is an English-language, offline assistant for people deciding what to do about a suspicious message. Paste text or read a screenshot, inspect the actual words behind each concern, and follow an independent verification step. It does not open suspicious links, ask for an account, or require an API key.

The practical problem: a warning such as “this may be a scam” often leaves someone unsure what to do. ScamLens connects each concern to quoted evidence and an action they can take before sending money or sharing a code.

## Start on Windows 10

1. **Extract the whole ZIP** to a normal folder, for example `Documents\ScamLens`. Do not run it from inside the ZIP.
2. Install **Python 3.12, 64-bit** from [python.org](https://www.python.org/downloads/release/python-31210/). Enable **Add Python to PATH**. Python 3.11 also works. Python 3.13+ is deliberately not used because the OCR dependency does not support it.
3. Install **Ollama for Windows** from [ollama.com/download/windows](https://ollama.com/download/windows), and open Ollama once.
4. Double-click **`Setup-Windows.cmd`**. Keep internet connected for this one-time step. It creates the local Python environment, installs pinned dependencies and bundled OCR assets, imports bundled `qwen2.5:1.5b` weights when present (or downloads them), and verifies OCR and a real model response. No login or API key is required.
5. Double-click **`Start-ScamLens.cmd`**. Your browser opens the local app. Keep the terminal window open while using it. Stop with `Ctrl+C`.

**After setup, disconnect the internet and use it offline.** The source ZIP excludes the roughly 1 GB model. In a Git clone, weights are stored with Git LFS under `model/`; setup imports a genuine bundled file after checking its size and SHA-256. If the file is missing or is only an LFS pointer, Ollama downloads the model once. Dependencies and Ollama need additional disk space. A dedicated GPU is not required. With unknown RAM, CPU speed and free memory, response time cannot be guaranteed: the first request loads the model and can be much slower. Close memory-heavy apps if needed. The app never silently substitutes a cloud model.

Only one analysis runs at a time. If the AI is missing, stopped, times out, or returns invalid evidence, the app clearly labels **checks only**. That mode is useful for diagnostics but is not a demonstration of working AI.

## Get the bundled model from GitHub

The repository stores `model/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf` through **Git LFS**. Install Git LFS, clone the `scamlens` branch, and run `git lfs pull` from the repository root to retrieve the actual weights. Open the `scamlens` project subfolder in VS Code.

GitHub's source ZIP may contain an LFS pointer instead of model bytes. The setup script detects that case and uses the normal Ollama download. It never imports an unverified pointer or damaged file. See `model/README.md` for the exact checksum and manual offline import command.

## Use it in VS Code

Open the extracted `ScamLens` folder with **File → Open Folder**. In the integrated PowerShell terminal:

```powershell
.\Setup-Windows.cmd
.\Start-ScamLens.cmd
```

There is no npm build, Node server, database, paid service, `.env` file, or API key to configure. You do not need to activate the virtual environment manually. For direct commands after setup:

```powershell
.\.venv\Scripts\python.exe server.py --open-browser
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The default address is `http://127.0.0.1:8765`. If that port is occupied:

```powershell
.\.venv\Scripts\python.exe server.py --port 8766 --open-browser
```

## A short demo

- Load **The tiny delivery fee**. Analyze it. Inspect the urgency/payment evidence and the independent verification advice.
- Upload **`demo/delivery-message.png`**. Review the OCR text, correct any mistakes, then analyze. OCR can misread domains and digits; analysis is never started automatically after extraction.
- Load **An ordinary sign-in code**. A legitimate notification that tells you *never to share a code* should not be treated as a request to disclose it.
- Load **A changed payment account**. Explain why a real-world ambiguous request needs a call to an already-known contact; the app cannot establish who sent the message.
- Disconnect Wi-Fi and repeat a request with Ollama running. All application assets, OCR, and inference are local.

Use the report-copy button to copy an explicit summary, evidence and limitations. Nothing is saved automatically. Example inputs are synthetic; `.example` domains are reserved, not live scam destinations.

## How it works

```text
Text ───────────────────────────────┐
Screenshot → local OCR → your review ├→ bounded message input
                                    ├→ deterministic evidence and URL checks
                                    └→ local Qwen interpretation via Ollama
                                              ↓
                                validated, quoted evidence
                                              ↓
                                concerns + verification steps
```

- **AI:** `qwen2.5:1.5b` through Ollama's local API. It selects a possible sensitive-request behavior and a source passage through a constrained output schema. Exact quotes and category support are checked before display. Unsupported model observations are discarded. Explanations and verification advice come from cautious application templates; generated instructions and invented destinations are never used.
- **Checks:** conservative evidence checks for credential requests, payment pressure, impersonation cues and suspicious URL structures. A genuine site cannot be verified merely from a message, and a professional-looking URL does not prove authenticity. URL parsing never performs DNS lookups or fetches the target.
- **OCR:** RapidOCR + ONNX Runtime, on CPU, with model assets supplied by the installed package. PNG/JPEG/WebP, up to 8 MB and 20 megapixels. English is the supported application language.
- **Local server:** Python standard library, bound only to `127.0.0.1`; no third-party web assets or analytics. Host/origin checks and a restrictive content-security policy reduce cross-site access to the local app.
- **State:** message/image contents live in memory while processing. There is no message history, database or automatic disk persistence. The browser clipboard is used only when you explicitly copy a report. OCR/model libraries and your operating system may manage their own ordinary process/cache memory; this is not a forensic secure-erasure tool.

The model provides interpretation, not proof. “Insufficient evidence” does **not** mean safe. Sender identity, account ownership, live domain reputation, attachments, QR destinations and actual payment settlement are not verified. The application is a prototype decision aid, not a bank transaction validator or a replacement for a security team.

## Files

| Location | Purpose |
|---|---|
| `server.py` | Local HTTP API, Ollama adapter, screenshot OCR, input limits |
| `engine.py` | Evidence checks, grounded model interpretation, safe next steps |
| `static/` | Plain HTML/CSS/JavaScript interface, no build tooling |
| `setup_windows.ps1`, two `.cmd` launchers | Windows dependency setup, checks and launch |
| `requirements.txt` | Pinned Python/OCR dependencies |
| `demo/` | Synthetic scenarios and a screenshot for testing |
| `model/` | Optional Git LFS weights, upstream license and tested local Ollama import file |
| `tests/` | Analysis and API regression tests |
| `TEST_REPORT.md` | Checks actually performed, including unverified boundaries |
| `LICENSE`, `THIRD_PARTY.md` | Application and dependency/model license information |

## Troubleshooting

| What you see | What to do |
|---|---|
| Python not found or unsupported version | Install 64-bit Python 3.12 from python.org, enable the launcher/PATH, reopen the terminal and rerun setup. |
| Ollama not found | Install the official Windows app, open it once, then rerun setup. |
| Model not downloaded | Run `ollama pull qwen2.5:1.5b` while connected to the internet; reopen ScamLens. |
| AI unavailable / checks only | Open Ollama, use the status refresh in the app, and check `ollama list`. A model download alone does not mean the service is running. |
| Slow first analysis | The model may be loading on CPU. Use a short message, close other apps, and keep Ollama open. The request timeout is 180 seconds. |
| Want to release model memory | Stop the app, then run `ollama stop qwen2.5:1.5b`. The downloaded weights stay installed. |
| Model cannot load / not enough memory | Close memory-heavy apps. Do not switch to a larger model. If even 1B cannot run, this PC does not currently meet the local AI requirement. |
| Screenshot support unavailable | Rerun `Setup-Windows.cmd`. OCR requires its pinned Python packages even though text-only checks do not. |
| Text extraction is wrong | Use a sharper screenshot or paste the message. Always review numbers and links. |
| Dependencies blocked by a corporate proxy | Use your organization's approved Python/proxy configuration. Keep TLS and package integrity checks enabled. |
| Port already in use | Close the other ScamLens terminal or use `--port 8766`. |
| Browser cannot connect | Keep the server terminal open; use the local address printed there. Do not open `index.html` directly. |

The tested runtime uses `qwen2.5:1.5b`. Cloud model tags are not supported. Model and prompt changes should be evaluated again before changing this default.

## Development and evaluation

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The tests exercise evidence grounding, malformed model output, legitimate notifications, suspicious inputs, HTTP validation, local-only access and screenshot boundaries. Mock model tests verify integration contracts; they are not measurements of Qwen's real-world scam-detection accuracy. See `TEST_REPORT.md` for live tests and limitations. No broad accuracy claim is made from the synthetic demo set. For long or noisy messages, the local model sees a bounded prefix; the app reports its scope, while automatic checks cover the full input.

On Linux/macOS, create a Python 3.11/3.12 environment, install `requirements.txt`, install Ollama from its official distribution, run `ollama pull qwen2.5:1.5b`, then `python server.py`. Windows 10 is the intended user workflow; exact Windows execution must be checked on the user's PC.

## License and publication

Original application code is MIT-licensed. Qwen2.5-1.5B-Instruct weights are Apache-2.0 licensed. They are stored separately through Git LFS; the small source ZIP excludes them. The upstream model license is included under `model/LICENSE.txt`. See `THIRD_PARTY.md`.

The application does not automatically upload your messages or source code. Git publication is an explicit development action. Keep `.venv`, caches and local logs out of Git; model weights use Git LFS as configured in the repository root. A public repository and license may be required for the hackathon submission.
