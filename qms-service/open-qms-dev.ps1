$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$repoRoot = Split-Path -Parent $PSScriptRoot
$credentialFile = Join-Path $repoRoot "frontend\public\qms\qms-dev-login.json.local"
$setupScript = Join-Path $PSScriptRoot "setup-qms-dev-login.ps1"

if (-not (Test-Path -LiteralPath $credentialFile)) {
    & $setupScript
}

$requiredPorts = @(
    @{ Name = "Frontend Vite"; Port = 5173 },
    @{ Name = "Laravel Auth"; Port = 8001 },
    @{ Name = "QMS Service"; Port = 5002 }
)

$missing = @()
foreach ($service in $requiredPorts) {
    $listening = Get-NetTCPConnection -State Listen -LocalPort $service.Port -ErrorAction SilentlyContinue
    if (-not $listening) {
        $missing += "$($service.Name) :$($service.Port)"
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Service berikut belum aktif:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
    Write-Host "Login helper tetap dapat dibuka, tetapi QMS tidak akan lengkap sampai semua service aktif." -ForegroundColor Yellow
}

Start-Process "http://localhost:5173/qms/qms-dev-login.html"
