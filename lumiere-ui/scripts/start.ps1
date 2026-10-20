$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $appRoot '.runtime'
New-Item -ItemType Directory -Force $runtime | Out-Null
$ollama = Join-Path $runtime 'ollama\ollama.exe'
if (!(Test-Path -LiteralPath $ollama)) { $ollama = (Get-Command ollama -ErrorAction Stop).Source }
$node = (Get-Command node -ErrorAction Stop).Source
function Test-VisionPython([string]$candidate) {
    if (!$candidate -or !(Test-Path -LiteralPath $candidate)) { return $false }
    try {
        & $candidate -c 'import cv2, numpy, PIL' *> $null
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}
$visionPython = Join-Path $appRoot '.venv\Scripts\python.exe'
if (!(Test-VisionPython $visionPython)) {
    $systemPython = (Get-Command python -ErrorAction SilentlyContinue).Source
    if ($systemPython -and (Test-VisionPython $systemPython)) { $visionPython = $systemPython }
    elseif ($systemPython) {
        $visionEnvironment = Join-Path $runtime 'vision-venv'
        $resolvedRoot = [IO.Path]::GetFullPath($appRoot).TrimEnd('\') + '\'
        $resolvedEnvironment = [IO.Path]::GetFullPath($visionEnvironment)
        if (!$resolvedEnvironment.StartsWith($resolvedRoot,[StringComparison]::OrdinalIgnoreCase)) { throw 'The Python setup path is outside the app folder.' }
        Write-Host 'Installing local photo-analysis packages...'
        & $systemPython -m venv --clear $visionEnvironment
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the photo-analysis Python environment.' }
        $visionPython = Join-Path $visionEnvironment 'Scripts\python.exe'
        & $visionPython -m pip install -r (Join-Path $appRoot 'vision\requirements.txt')
        if ($LASTEXITCODE -ne 0 -or !(Test-VisionPython $visionPython)) { throw 'Could not install the photo-analysis packages.' }
    } else { Write-Warning 'Python was not found. Chat will work, but photo analysis needs Python 3.10–3.13.'; $visionPython = '' }
}
if ($visionPython) { $env:LUMIERE_PYTHON = $visionPython }
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = Join-Path $appRoot '.models'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_CONTEXT_LENGTH = '8192'
$env:PORT = '4173'
try { $null = Invoke-RestMethod http://127.0.0.1:11434/api/tags -TimeoutSec 2 }
catch {
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden -WorkingDirectory $appRoot -RedirectStandardOutput (Join-Path $runtime 'ollama-out.log') -RedirectStandardError (Join-Path $runtime 'ollama-error.log')
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Seconds 1
        try { $null = Invoke-RestMethod http://127.0.0.1:11434/api/tags -TimeoutSec 2; break } catch {}
    }
}
$models = Invoke-RestMethod http://127.0.0.1:11434/api/tags -TimeoutSec 5
if (!($models.models | Where-Object name -eq 'qwen3:8b')) {
    Write-Host 'Downloading Qwen3 8B (about 5.2 GB)...'
    & $ollama pull qwen3:8b
    if ($LASTEXITCODE -ne 0) { throw 'The Qwen download failed. Run this launcher again to resume.' }
}
try { $null = Invoke-RestMethod http://127.0.0.1:4173/api/bootstrap -TimeoutSec 2 }
catch {
    Start-Process -FilePath $node -ArgumentList 'server.cjs' -WindowStyle Hidden -WorkingDirectory $appRoot -RedirectStandardOutput (Join-Path $runtime 'app-out.log') -RedirectStandardError (Join-Path $runtime 'app-error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Seconds 1
        try { $null = Invoke-RestMethod http://127.0.0.1:4173/api/bootstrap -TimeoutSec 2; $ready = $true; break } catch {}
    }
    if (!$ready) { throw 'The app could not start. Check .runtime\app-error.log. Port 4173 may already be in use.' }
}
Start-Process 'http://localhost:4173'
Write-Host 'Lumiere is running at http://localhost:4173. The app and local AI keep running after this window closes.'
