# Bundled offline model

ScamLens uses **Qwen2.5 1.5B Instruct**, created by Alibaba Cloud, in the
**Q4_K_M GGUF** format distributed by Ollama as `qwen2.5:1.5b`.
The model weights are unchanged; the original content-addressed blob has a
readable filename here. ScamLens adds its own analysis prompts in the application.

- Upstream model: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct
- Ollama distribution: https://ollama.com/library/qwen2.5:1.5b
- Model license: Apache License 2.0; copyright 2024 Alibaba Cloud.
  The original license is reproduced in [LICENSE.txt](LICENSE.txt).
- Model file: `Qwen2.5-1.5B-Instruct-Q4_K_M.gguf`
- Exact size: **986,048,512 bytes** (about 986 MB or 940 MiB).
- SHA-256: `183715c435899236895da3869489cc30ac241476b4971a20285b1a462818a5b4`

The accompanying Modelfile preserves the upstream chat template, default system
message, and license. The upstream manifest declares no additional parameter
layer, so Ollama uses its normal defaults. ScamLens supplies its own generation
settings when it calls the local model.

## Get the actual model file from GitHub

The GGUF file is stored with **Git Large File Storage (Git LFS)**. Install Git
with Git LFS support on Windows. After cloning the repository, run these commands
from its root:

```powershell
git lfs install
git lfs pull
```

GitHub's source ZIP may contain an LFS pointer instead of the model. A pointer is
a tiny text file starting with `version https://git-lfs.github.com/spec/v1`; it
cannot run inference. If the file is tiny, use Git LFS to download its real
contents. Access to LFS downloads depends on GitHub availability and the
repository owner's storage and bandwidth allowance.

Optional verification from PowerShell:

```powershell
(Get-Item model\Qwen2.5-1.5B-Instruct-Q4_K_M.gguf).Length
(Get-FileHash model\Qwen2.5-1.5B-Instruct-Q4_K_M.gguf -Algorithm SHA256).Hash
```

Compare the size and hash with the values above before importing the model.

## Import into Ollama

Install and start Ollama first. From the **project root**, run:

```powershell
ollama create qwen2.5:1.5b -f model/Modelfile
ollama list
```

The import reads the GGUF file locally. It does not call an AI API or download the
model again. The model name matches the name used by ScamLens, so the application
can use it immediately. Leave Ollama running and start ScamLens using the main
README instructions. After tools and application dependencies are installed and
the model is imported, analysis runs locally without internet or an API key.

If you already have the official `qwen2.5:1.5b` tag installed, the app can use it;
importing this bundle is optional. If the GGUF is unavailable, an alternative
one-time online download is `ollama pull qwen2.5:1.5b`.
