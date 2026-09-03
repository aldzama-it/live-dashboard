$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    throw "Virtual environment belum ada. Jalankan .\setup.ps1 terlebih dahulu."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "File .env dibuat otomatis. Sumber Excel dapat dipilih langsung dari dashboard." -ForegroundColor Yellow
}

& ".\.venv\Scripts\python.exe" app.py
