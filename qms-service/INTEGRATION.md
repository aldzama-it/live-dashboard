# QMS Company Integration — 13 Aug 2026

Tujuan paket ini adalah menampilkan dashboard QMS lama di slot **QMS & Audit** milik repo perusahaan dengan perubahan sekecil mungkin.

## File perusahaan yang berubah

Hanya:

- `frontend/src/pages/divisions/finance-admin/QMSAudit.jsx`

File tersebut memang merupakan placeholder khusus QMS.

## File baru

- `qms-service/` — service Python QMS yang diambil dari source QMS lama.
- `qms-service/setup-local-data.ps1` — helper lokal untuk menyalin data Excel/runtime dari project QMS lama. Data Excel tidak boleh di-commit.

Tidak ada perubahan ke `Dashboard.jsx`, `menuData.js`, Laravel backend, HRD, Finance, Legal, IT, atau divisi lain.

## Port lokal

- Talent Pool scraper: `127.0.0.1:8000`
- Laravel perusahaan: `127.0.0.1:8001` bila diperlukan untuk login/API perusahaan
- React perusahaan: `localhost:5173`
- QMS Python service: `127.0.0.1:5001`

## Setelah paket dicopy ke repo

1. Jalankan `qms-service/setup-local-data.ps1` jika ingin memakai data QMS lokal yang sudah ada.
2. Masuk ke `qms-service`.
3. Jalankan `setup.ps1` sekali.
4. Jalankan `run.ps1` dan cek `http://127.0.0.1:5001/api/health`.
5. Jalankan frontend perusahaan dengan `npm.cmd run dev`.
6. Login lalu buka `Finance & Administration > QMS & Audit > Overview`.
7. Audit `git status --short` dan `git diff --name-only` sebelum commit.

## Catatan keamanan data

Repo perusahaan terlihat bersifat public. Karena itu, file `.xlsx`, file upload aktif/history, `.env`, dan virtual environment sengaja tidak dimasukkan ke paket Git. Data runtime lokal tetap dapat digunakan karena folder tersebut di-ignore oleh `qms-service/.gitignore`.

## Production

`QMSAudit.jsx` membaca `VITE_QMS_SERVICE_URL`. Default lokal adalah `http://127.0.0.1:5001`. Untuk deployment server, URL service QMS harus diisi sesuai alamat service yang benar pada environment build/deploy. Jangan mengandalkan `127.0.0.1:5001` untuk browser user di production.
