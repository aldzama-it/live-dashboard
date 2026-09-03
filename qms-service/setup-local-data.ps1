$ErrorActionPreference = "Stop"

$repo = "D:\Program\xampp\htdocs\live-dashboard-aldzama"
$oldQms = "D:\Program\xampp\htdocs\live-dashboard\python-services\qms-live-kpi-python"
$newQms = Join-Path $repo "qms-service"

if (-not (Test-Path $newQms)) {
    throw "qms-service belum ada di repo perusahaan: $newQms"
}

New-Item -ItemType Directory -Force (Join-Path $newQms "data") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $newQms "storage\uploads") | Out-Null

if (Test-Path (Join-Path $oldQms "data")) {
    Copy-Item (Join-Path $oldQms "data\*.xlsx") (Join-Path $newQms "data") -Force -ErrorAction SilentlyContinue
}

if (Test-Path (Join-Path $oldQms "storage\uploads")) {
    Copy-Item (Join-Path $oldQms "storage\uploads\*") (Join-Path $newQms "storage\uploads") -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Data QMS lokal sudah disalin. File Excel/runtime tetap di-ignore oleh Git." -ForegroundColor Green
