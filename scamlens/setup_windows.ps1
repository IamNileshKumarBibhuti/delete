param([switch]$Start)

# Windows PowerShell 5.1-compatible. No administrator access is requested.
# Downloads are performed by pip and the official Ollama client with their
# normal verification enabled. Only .venv and .local are created in this folder.
$ErrorActionPreference = 'Stop'
$ProjectRoot = $PSScriptRoot
$VenvPython = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
$ApiRoot = 'http://127.0.0.1:11434'
$ModelName = 'qwen2.5:1.5b'
$Probe = "import json,struct,sys; print(json.dumps({'major':sys.version_info.major,'minor':sys.version_info.minor,'bits':struct.calcsize('P')*8}))"
Set-Location -LiteralPath $ProjectRoot

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments, [string]$FailureMessage)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw $FailureMessage }
}

function Get-PythonInfo {
    param([string]$Executable, [string[]]$PrefixArguments = @())
    try {
        $Json = & $Executable @PrefixArguments -c $Probe 2>$null
        if ($LASTEXITCODE -ne 0) { return $null }
        $Info = ($Json | Out-String | ConvertFrom-Json)
        if ($Info.major -eq 3 -and $Info.minor -in @(11, 12) -and $Info.bits -eq 64) {
            return $Info
        }
    } catch { }
    return $null
}

function Find-Python {
    $Candidates = @(
        @{ Exe = 'py'; Args = @('-3.12') },
        @{ Exe = 'py'; Args = @('-3.11') },
        @{ Exe = 'python'; Args = @() },
        @{ Exe = 'python3'; Args = @() }
    )
    foreach ($Minor in @('312', '311')) {
        if ($env:LOCALAPPDATA) {
            $Candidates += @{ Exe = (Join-Path $env:LOCALAPPDATA "Programs\Python\Python$Minor\python.exe"); Args = @() }
        }
        if ($env:ProgramFiles) {
            $Candidates += @{ Exe = (Join-Path $env:ProgramFiles "Python$Minor\python.exe"); Args = @() }
        }
    }
    foreach ($Candidate in $Candidates) {
        $ResolvedCommand = Get-Command $Candidate.Exe -ErrorAction SilentlyContinue
        if (-not $ResolvedCommand) { continue }
        # Avoid opening the Microsoft Store's placeholder Python launcher.
        if ($ResolvedCommand.Source -like '*\Microsoft\WindowsApps\*') { continue }
        if (Get-PythonInfo -Executable $Candidate.Exe -PrefixArguments $Candidate.Args) { return $Candidate }
    }
    throw @'
Python 3.11 or 3.12 (64-bit) was not found.
Install Python 3.12 (Windows installer, 64-bit) from:
https://www.python.org/downloads/release/python-31210/
Keep the Python launcher selected during installation, then rerun Setup-Windows.cmd.
Python 3.13+ is not supported by the pinned OCR package. No GPU is required.
'@
}

function Find-Ollama {
    $Command = Get-Command 'ollama.exe' -ErrorAction SilentlyContinue
    if ($Command) { return $Command.Source }
    $Candidates = @()
    if ($env:LOCALAPPDATA) { $Candidates += Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe' }
    if ($env:ProgramFiles) { $Candidates += Join-Path $env:ProgramFiles 'Ollama\ollama.exe' }
    foreach ($Candidate in $Candidates) {
        if (Test-Path -LiteralPath $Candidate -PathType Leaf) { return $Candidate }
    }
    return $null
}

function Get-LocalModels {
    try { return Invoke-RestMethod -Uri "$ApiRoot/api/tags" -Method Get -TimeoutSec 5 }
    catch { return $null }
}

function Test-BundledModel {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $File = Get-Item -LiteralPath $Path
    if ($File.Length -lt 1024) {
        $FirstLine = Get-Content -LiteralPath $Path -TotalCount 1
        if ($FirstLine -eq 'version https://git-lfs.github.com/spec/v1') {
            Write-Host 'The model file is a Git LFS pointer; the model weights have not been downloaded.'
            Write-Host 'Setup will download them using Ollama instead. Internet is needed for this step.'
        } else {
            Write-Warning 'The bundled model file is incomplete. It will not be imported; setup will use an Ollama download instead.'
        }
        return $false
    }
    if ($File.Length -ne 986048512) {
        Write-Warning 'The bundled model has an unexpected size. It will not be imported; setup will use an Ollama download instead.'
        return $false
    }
    $Stream = [System.IO.File]::OpenRead($Path)
    try {
        $Header = New-Object byte[] 4
        $Read = $Stream.Read($Header, 0, 4)
    } finally { $Stream.Dispose() }
    if ($Read -ne 4 -or [System.Text.Encoding]::ASCII.GetString($Header) -ne 'GGUF') {
        Write-Warning 'The bundled file is not a GGUF model. It will not be imported; setup will use an Ollama download instead.'
        return $false
    }
    Write-Host 'Verifying the bundled model SHA256 (approximately 986 MB)...'
    $Hash = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
    if ($Hash -ne '183715c435899236895da3869489cc30ac241476b4971a20285b1a462818a5b4') {
        Write-Warning 'The bundled model checksum did not match. It will not be imported; setup will use a verified Ollama download instead.'
        return $false
    }
    return $true
}

function Start-LocalOllama {
    param([string]$Ollama)
    # These variables apply to this script and its child processes only.
    $env:OLLAMA_HOST = '127.0.0.1:11434'
    $env:OLLAMA_NO_CLOUD = '1'
    $Models = Get-LocalModels
    if ($null -ne $Models) { return $Models }
    $LogRoot = Join-Path $ProjectRoot '.local'
    New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
    Write-Host 'Starting Ollama on this computer...'
    $Process = Start-Process -FilePath $Ollama -ArgumentList 'serve' -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $LogRoot 'ollama.log') `
        -RedirectStandardError (Join-Path $LogRoot 'ollama-errors.log')
    for ($Attempt = 0; $Attempt -lt 30; $Attempt++) {
        Start-Sleep -Milliseconds 500
        $Models = Get-LocalModels
        if ($null -ne $Models) { return $Models }
        if ($Process.HasExited) { break }
    }
    throw 'Ollama did not start at 127.0.0.1:11434. Open the Ollama desktop app, then retry. See .local\ollama-errors.log for details.'
}

try {
    if ($Start) {
        if (-not (Test-Path -LiteralPath $VenvPython -PathType Leaf)) {
            throw 'Run Setup-Windows.cmd once before starting the app.'
        }
        if (-not (Get-PythonInfo -Executable $VenvPython)) {
            throw 'The .venv Python is missing or unsupported. Install Python 3.12 (64-bit), remove only the generated .venv folder, then rerun Setup-Windows.cmd.'
        }
        $Ollama = Find-Ollama
        if ($Ollama) {
            try { Start-LocalOllama -Ollama $Ollama | Out-Null }
            catch { Write-Warning $_.Exception.Message }
        } else {
            Write-Warning 'Ollama was not found. The app can open, but AI analysis needs Ollama and qwen2.5:1.5b. Run Setup-Windows.cmd to finish setup.'
        }
        Write-Host ''
        Write-Host 'ScamLens is opening at http://127.0.0.1:8765'
        Write-Host 'Keep this window open. Press Ctrl+C to stop the app.'
        Invoke-Checked -Executable $VenvPython -Arguments @('server.py', '--open-browser') `
            -FailureMessage 'The web server stopped with an error. Check the message above.'
        exit 0
    }

    Write-Host ''
    Write-Host 'ScamLens | first-time local setup' -ForegroundColor Cyan
    Write-Host 'Internet is needed for these downloads only. Your messages stay on your computer.'
    Write-Host ''
    if (-not (Test-Path -LiteralPath $VenvPython -PathType Leaf)) {
        if (Test-Path -LiteralPath (Join-Path $ProjectRoot '.venv')) {
            throw 'An incomplete .venv folder already exists. Remove only that generated folder, then rerun Setup-Windows.cmd.'
        }
        $Python = Find-Python
        Write-Host '[1/4] Creating the local Python environment...'
        Invoke-Checked -Executable $Python.Exe -Arguments ($Python.Args + @('-m', 'venv', '.venv')) `
            -FailureMessage 'Python could not create .venv. Extract the ZIP to a folder you can write to, then retry.'
    } else {
        if (-not (Get-PythonInfo -Executable $VenvPython)) {
            throw 'The existing .venv is not Python 3.11/3.12 (64-bit). Remove only the generated .venv folder and rerun setup.'
        }
        Write-Host '[1/4] Reusing the local Python environment.'
    }

    Write-Host '[2/4] Installing the pinned OCR dependencies (CPU wheels only)...'
    Invoke-Checked -Executable $VenvPython -Arguments @('-m', 'pip', 'install', '--disable-pip-version-check', '--only-binary=:all:', '-r', 'requirements.txt') `
        -FailureMessage 'Dependency installation failed. Check internet access and the pip error above. Rerun this script after fixing it; do not disable certificate verification.'
    $OcrProbe = @'
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import numpy as np
ocr = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)
with Image.open('demo/delivery-message.png') as image:
    lines, _ = ocr(np.array(image.convert('RGB')))
text = ' '.join(line[1] for line in lines or [])
if len(text.strip()) < 20:
    raise RuntimeError('OCR did not read the included readiness screenshot. Keep the demo folder with the app.')
print('OCR loaded and read the included screenshot locally.')
'@
    Invoke-Checked -Executable $VenvPython -Arguments @('-c', $OcrProbe) `
        -FailureMessage 'OCR could not initialize. If a DLL is missing, install Microsoft Visual C++ 2015-2022 Redistributable (x64) from https://aka.ms/vs/17/release/vc_redist.x64.exe and rerun setup. Read the actual error above.'

    Write-Host '[3/4] Checking the local AI runtime...'
    $Ollama = Find-Ollama
    if (-not $Ollama) {
        throw @'
Python and OCR are ready. Ollama is not installed yet.
Install the official Windows app from https://ollama.com/download/windows
Open Ollama once, then rerun Setup-Windows.cmd. Administrator elevation is not requested by this script.
Setup will import included, verified model weights or download qwen2.5:1.5b (approximately 986 MB).
'@
    }
    $Models = Start-LocalOllama -Ollama $Ollama
    $Installed = @($Models.models | Where-Object { $_.name -eq $ModelName -or $_.model -eq $ModelName })
    if ($Installed.Count -eq 0) {
        $BundledWeights = Join-Path $ProjectRoot 'model\Qwen2.5-1.5B-Instruct-Q4_K_M.gguf'
        $Modelfile = Join-Path $ProjectRoot 'model\Modelfile'
        $UseBundled = Test-BundledModel -Path $BundledWeights
        if ($UseBundled -and (Test-Path -LiteralPath $Modelfile -PathType Leaf)) {
            Write-Host 'Importing the verified bundled Qwen model into Ollama. No model download is needed...'
            Invoke-Checked -Executable $Ollama -Arguments @('create', $ModelName, '-f', $Modelfile) `
                -FailureMessage 'The verified local model could not be imported. Check the Ollama error above and model\Modelfile, then rerun setup.'
        } else {
            if ($UseBundled) { Write-Warning 'model\Modelfile is missing. Setup will download the Ollama model instead.' }
            Write-Host 'Downloading qwen2.5:1.5b (approximately 986 MB). This is a one-time download...'
            Invoke-Checked -Executable $Ollama -Arguments @('pull', $ModelName) `
                -FailureMessage 'Model download failed. Check internet access and free disk space, then rerun setup. Ollama resumes partial downloads.'
        }
    } else {
        Write-Host 'qwen2.5:1.5b is already downloaded.'
    }

    Write-Host '[4/4] Running a real offline AI check. First model load can take a moment...'
    $Body = @{
        model = $ModelName
        prompt = 'Reply with the word READY only.'
        stream = $false
        keep_alive = '2m'
        options = @{ temperature = 0; num_predict = 12; num_ctx = 2048 }
    } | ConvertTo-Json -Depth 5
    try {
        $Response = Invoke-RestMethod -Uri "$ApiRoot/api/generate" -Method Post -ContentType 'application/json' -Body $Body -TimeoutSec 240
    } catch {
        throw "Qwen did not complete its inference check: $($_.Exception.Message). Open Ollama and try 'ollama run qwen2.5:1.5b'. Model memory and speed depend on this computer."
    }
    if ([string]::IsNullOrWhiteSpace($Response.response)) {
        throw 'Ollama returned no model output. Run ollama run qwen2.5:1.5b to inspect its error, then rerun setup.'
    }
    Write-Host 'Checking ScamLens end to end with the local model...'
    $AppProbe = @'
import engine
import server
if server.MODEL != 'qwen2.5:1.5b':
    raise RuntimeError('The app default model does not match setup. Keep files from the same ScamLens ZIP together.')
message = 'Our bank account has changed. Please use the new payment details instead of the old account.'
result = engine.analyze(message, server.generate, model_name=server.MODEL)
if not result['model']['used']:
    raise RuntimeError(result['model']['error'])
if not any(signal['id'] == 'ai_payment_redirection' and signal['source'] == 'model' for signal in result['signals']):
    raise RuntimeError('The AI ran but missed the app readiness example. Rerun setup and inspect the local Ollama runtime.')
print('App AI check passed: a grounded warning about changed payment details was returned.')
'@
    Invoke-Checked -Executable $VenvPython -Arguments @('-c', $AppProbe) `
        -FailureMessage 'The ScamLens AI check did not pass. Read the error above, ensure the model and application files match, and rerun setup.'
    Write-Host ''
    Write-Host 'Setup complete: OCR and Qwen both ran successfully on this computer.' -ForegroundColor Green
    Write-Host 'Double-click Start-ScamLens.cmd. Later use does not require internet or an API key.'
    Write-Host 'Keep this project folder together. Do not copy .venv between computers.'
    exit 0
} catch {
    Write-Host ''
    Write-Host 'SETUP / START NEEDS ATTENTION' -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    exit 1
}
