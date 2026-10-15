# ScamLens 1.0 — verification report

Validated on 15 October 2026 in the development environment. This is a tested prototype, not a certified fraud detector.

## Results

| Check | Result |
|---|---|
| Engine regression tests | **37 passed** |
| HTTP/transport integration tests | **27 passed** |
| Combined command: `python -m unittest discover -s tests -v` | **64 passed; zero skipped** with the installed OCR dependencies |
| Pinned dependency installation and `pip check` | Passed on Python 3.12/Linux; no dependency conflicts |
| Windows x64 binary-wheel resolution | Passed for both Python 3.11 and 3.12 |
| JavaScript syntax check | Passed |
| Browser interaction checks | Passed: samples, editable draft, errors/retry, status/help, stale results, evidence rendering, clear, report copying and screenshot review |
| Responsive layouts | No horizontal overflow at 375, 390, 768, 1024, 1440 and 1920 pixel widths in the tested scenarios |
| Actual screenshot OCR | Passed on `demo/delivery-message.png`; fee `$1.99`, deadline `30 minutes` and `parcel-status.example` recognized |
| Real model, six synthetic demo scenarios | All six returned valid typed responses and met application expectations; details below |
| Real model, four additional benign controls | Ordinary invoice, urgent meeting, OTP notice and unchanged bank details remained **insufficient evidence** |
| Full browser → server → real model | Passed on changed bank details, with `ai_payment_redirection` and independent-verification advice |
| Full browser → OCR → review → real model | Passed on the included delivery screenshot |
| Browser privacy check | Zero external browser requests during the live flow; no normal-use JavaScript/CSP errors |
| Windows setup's exact embedded probes | Actual OCR and app-level AI analysis passed on Linux; Windows-specific execution remains unverified |
| Archive | Only application source, launchers, tests, demo inputs, docs and license; no virtual environment, cache, credentials, Git metadata or model weights |

## Actual model used

- **Qwen2.5-1.5B-Instruct**, Ollama tag `qwen2.5:1.5b`, quantized local weights of approximately 986 MB.
- Ollama **0.40.4**, CPU inference; no API key.
- Registry manifest SHA-256 at validation: `65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b`.
- Runtime archive verified against its official published checksum. Every model layer was verified against the official registry manifest before use.
- Fixed local inference address `127.0.0.1:11434`; application transport disables proxy routing for loopback calls and refuses redirects.
- Structured generation selects a behavior category and an exact source excerpt. Application validation checks both quotation grounding and minimum category support. Explanations and verification advice are supplied by the application, not generated instructions.

The cloud machine's normal Ollama pull hit a DNS restriction while checking a storage redirect. For this machine's test only, the official registry layers were retrieved over verified HTTPS and installed in the normal local cache after size/SHA-256 checks. The Windows setup uses the official Ollama pull command with its usual verification.

## Six-scenario live check

| Synthetic scenario | Application outcome | Observed model behavior |
|---|---|---|
| Tiny delivery fee | High concern | Unsupported model observation discarded; evidence checks retained |
| Account suspension + password/OTP request | High concern | Unsupported model observation discarded; evidence checks retained |
| Job equipment/training deposit | High concern | Grounded advance-fee observation accepted |
| Ordinary sign-in code with never-share advice | Insufficient evidence | Incorrect model observation suppressed by support checks |
| Ordinary meeting reminder | Insufficient evidence | Model selected no sensitive behavior |
| Changed bank/payment details | Some concern | Grounded payment-redirection observation accepted; explicit instruction to verify with a previously trusted contact |

These are controlled functional checks, **not a real-world accuracy benchmark**. Small local models can choose the wrong category even when they return valid JSON and a genuine quote. Unsupported observations are visibly disclosed as omitted. The application must not present raw model predictions as proof. “Insufficient evidence” never certifies safety.

Observed processing times on this development CPU were roughly 0.6–3.4 seconds per short sample in the six-case run. This machine has substantially more memory than some Windows laptops. These timings are not promises for the user's PC; first-load costs, free memory, background apps and CPU capabilities vary.

## Important regression coverage

- Legitimate OTP notifications and prohibitions versus actual disclosure requests.
- “Do not hesitate/forget to send your password” versus “Do not share your password.”
- Negated/unchanged bank details versus an actual change after a contrasting clause.
- URL user information, internationalized/numeric hosts, shortened URLs, brand-like domains and browser-style backslash parsing, without fetching any destination.
- Model prompt injection, unknown categories, invented quotes, malformed/oversized JSON, missing evidence and inappropriate behavior labels.
- Long/noisy input scope is bounded and disclosed; full-input message checks remain available.
- Host/origin validation, JSON/body limits, concurrency, error sanitization, locked-down static routes, image size/dimension/type limits and refusal to follow model-server redirects.

## What still needs checking on Windows

**No Windows virtual machine was available.** The `.cmd` launchers and full PowerShell flow were not executed on Windows 10. PowerShell parsing, interpreter/subprocess helper checks, dependency resolution and the exact Python probes were verified, but they cannot establish Windows-specific behavior or performance.

On the user's PC, complete setup, confirm Qwen status is ready, run the included tests, and try the screenshot and invoice examples. Then disconnect internet and repeat an analysis with Ollama running. If anything fails, preserve the terminal error text for troubleshooting; do not send private message contents or credentials.

The model and packages are downloaded once during setup. The source ZIP is not a fully preinstalled Python/Ollama distribution. It contains no GitHub upload automation and nothing was pushed to GitHub.
