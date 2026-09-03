$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    throw "Virtual environment QMS belum ada. Jalankan .\setup.ps1 terlebih dahulu."
}

Write-Host "QMS service development: http://127.0.0.1:5002" -ForegroundColor Cyan
& ".\.venv\Scripts\python.exe" -c "from app import app; app.run(host='127.0.0.1', port=5002, debug=False, use_reloader=False)"
