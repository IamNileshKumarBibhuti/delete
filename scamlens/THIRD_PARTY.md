# Third-party software and models

ScamLens application code is MIT-licensed. Third-party components retain their original terms. No model weights or vendored dependency binaries are included in the small source ZIP. The Git repository stores the optional Qwen weights through Git LFS, with their original license at `model/LICENSE.txt`.

| Component | Use | Upstream / terms |
|---|---|---|
| Qwen2.5-1.5B-Instruct (`qwen2.5:1.5b`) | Local language model, downloaded separately | [QwenLM/Qwen2.5](https://github.com/QwenLM/Qwen2.5), Apache-2.0 for this 1.5B model; weights are downloaded separately |
| Ollama | Local model distribution/inference, installed separately | [ollama/ollama](https://github.com/ollama/ollama), MIT for Ollama code; individual models retain their own terms |
| RapidOCR / `rapidocr-onnxruntime` | Offline OCR and bundled OCR assets | [RapidAI/RapidOCR](https://github.com/RapidAI/RapidOCR), Apache-2.0 for repository code; inspect included asset/dependency terms for redistribution |
| ONNX Runtime | CPU inference for OCR | [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime), MIT |
| Pillow | Screenshot image loading | [python-pillow/Pillow](https://github.com/python-pillow/Pillow), HPND |
| NumPy | Image array processing | [numpy/numpy](https://github.com/numpy/numpy), BSD-3-Clause |
| OpenCV | OCR image operations | [opencv/opencv](https://github.com/opencv/opencv), Apache-2.0; binary builds include additional third-party notices |

Other pinned transitive packages appear in `requirements.txt`; consult each installed distribution's metadata and license for redistribution. The Windows setup uses the official Python package index through pip with its normal TLS verification. Ollama verifies downloaded model layers. Install Python and Ollama only through their official sources.

The synthetic example messages and generated screenshot are included under the application's MIT license. All displayed `.example` URLs are reserved demonstration domains.
