$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    throw "Python Launcher (py) tidak ditemukan. Instal Python terlebih dahulu dan aktifkan opsi Add Python to PATH."
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    py -m venv .venv
}

& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "File .env telah dibuat. Periksa KPI_EXCEL_PATH sebelum menjalankan aplikasi." -ForegroundColor Yellow
}

Write-Host "Setup selesai." -ForegroundColor Green
Write-Host "Jalankan .\run.ps1 untuk membuka service KPI."
