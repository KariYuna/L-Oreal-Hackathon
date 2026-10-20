$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    if (!$processInfo -or $processInfo.Name -ne 'node.exe' -or $processInfo.CommandLine -notmatch '(^|\s|["''])server\.cjs(["'']|\s|$)') {
        throw 'Port 4173 belongs to another program. It was not stopped.'
    }
    try {
        $response = Invoke-RestMethod 'http://127.0.0.1:4173/api/bootstrap' -TimeoutSec 3
        if (!$response.state -or !$response.catalog -or !$response.token) { throw 'unexpected response' }
    } catch { throw 'The service on port 4173 could not be verified as Lumière. It was not stopped.' }
    Stop-Process -Id $listener.OwningProcess -ErrorAction Stop
    Start-Sleep -Seconds 1
}
& (Join-Path $PSScriptRoot 'start.ps1')
