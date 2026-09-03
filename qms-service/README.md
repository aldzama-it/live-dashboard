# QMS Live KPI — Modul Python

Modul ini hanya menangani **LIVE KPI**. Sheet `LIST` dan `MENU` diabaikan. Nama setiap sheet lain dianggap sebagai nama divisi.

## Informasi yang ditampilkan

- Divisi yang memenuhi KPI pada bulan terpilih.
- Divisi yang tidak memenuhi KPI pada bulan terpilih.
- Persentase divisi yang memenuhi.
- Detail KPI per divisi saat nama divisi diklik.
- Status netral untuk data yang belum lengkap agar bulan yang belum diisi tidak dianggap gagal.

Tidak ada tampilan TRUE/FALSE.

## Cara penilaian

Parser mencari secara otomatis:

- Baris header bulan.
- Kolom yang berisi label `Plan` dan `Actual`.
- Kolom nama KPI, Variable, Unit of Measurement, dan Target.

Aturan umum:

- Actual lebih besar atau sama dengan Plan → memenuhi.
- KPI dengan kata seperti `maksimal`, `tidak melebihi`, `zero incident`, `budget utilization`, dan simbol `<=` atau `≤` menggunakan aturan Actual lebih kecil atau sama dengan Plan.
- Plan ada tetapi Actual kosong → belum lengkap.
- Plan dan Actual kosong → tidak dijadwalkan.
- Satu KPI gagal membuat status divisi menjadi tidak memenuhi.

## Instalasi Windows

Buka PowerShell di folder ini, kemudian:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\setup.ps1
notepad .env
```

Pastikan `.env` berisi:

```env
KPI_EXCEL_PATH=D:/PT ALDZAMA/IT/Dashboard/Dataset QMS/1. Monitoring KPI 2026.xlsx
KPI_IGNORED_SHEETS=MENU,LIST
KPI_DEFAULT_MONTH=8
KPI_REFRESH_SECONDS=60
HOST=127.0.0.1
PORT=5002
ALLOWED_ORIGIN=http://127.0.0.1:8001
```

Lalu jalankan:

```powershell
.\run-qms-dev.ps1
```

Buka:

```text
http://127.0.0.1:5002/live-kpi
```

API JSON:

```text
http://127.0.0.1:5002/api/live-kpi?month=8
```

Health check:

```text
http://127.0.0.1:5002/api/health
```

## Port aplikasi

- Talent Pool Scraper: `127.0.0.1:8000`
- Laravel Dashboard: `127.0.0.1:8001`
- Python KPI Service: `127.0.0.1:5002`

Python hanya menjadi pengolah data KPI. Nantinya halaman Laravel dapat mengambil endpoint JSON tersebut sehingga seluruh modul QMS tetap berada pada satu halaman Laravel.

## Jika hasil pembacaan belum tepat

Buka detail divisi. Setiap KPI menampilkan Plan, Actual, status, alasan, serta nomor baris Plan dan Actual pada respons API. Karena posisi tabel antar-sheet dapat berbeda, parser memakai deteksi pola dan bukan nomor kolom tetap.
