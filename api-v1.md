# Unified Asset API v1

API ini menyediakan daftar, detail, dan riwayat aset secara baca-saja untuk integrasi server-ke-server. URL dasar adalah `${NEXT_PUBLIC_APP_URL}/api/v1/assets` (contoh lokal: `http://localhost:3000/api/v1/assets`). Semua respons berformat JSON. Endpoint tidak mengaktifkan CORS untuk browser lintas origin.

## Autentikasi

Atur `ASSET_API_V1_TOKEN` pada environment server dengan nilai acak yang panjang, lalu kirim header `Authorization: Bearer <token>` pada setiap permintaan. Jangan memakai token ini di browser. Jika token belum dikonfigurasi, endpoint merespons `503`; token hilang atau salah menghasilkan `401`.

## Kategori dan identitas

| group | category |
| --- | --- |
| `physical` | `camera`, `cctv`, `dashcam`, `ht`, `laptop`, `general-inventory`, `network-device`, `printer`, `starlink`, `tablet`, `general-asset` |
| `digital` | `email`, `vpn`, `synology`, `external-app`, `admin-software`, `infrastructure`, `office-phone` |

`general-asset` memuat semua record `GeneralAsset`; `attributes.category_id` dan `attributes.category` (berisi `id`, `name`, `prefix`) menunjukkan kategori dinamis dari tabel `AssetCategory`. Identitas aset selalu berupa gabungan `group`, `category`, dan `id` sumber. Gunakan ketiganya untuk detail atau riwayat, terutama saat `asset_code` bernilai `null`.

## Daftar

`GET /api/v1/assets`

| Parameter | Keterangan |
| --- | --- |
| `group` | Opsional: `physical` atau `digital` |
| `category` | Opsional: salah satu slug pada tabel di atas; dapat dipakai bersama `group` |
| `search` | Opsional, maksimal 200 karakter; mencari nama, kode aset, lokasi, penerima, spesifikasi, dan atribut teks yang aman |
| `page` | Bilangan bulat positif; default `1` |
| `limit` | Bilangan bulat `1` sampai `100`; default `20` |

Daftar diurutkan berdasarkan `updated_at` terbaru, kemudian `category` dan `id`. `meta` memuat `total`, `page`, `limit`, `total_pages`, `has_next_page`, dan `has_previous_page`. Halaman di luar jumlah data mengembalikan `data: []`.

Untuk `camera`, `ht`, `laptop`, `general-inventory`, dan `tablet`, beberapa record dapat memakai `asset_code` yang sama sebagai riwayat penyerahan. Daftar hanya menampilkan satu record per kode: record dengan `return_date = null` diutamakan; jika tidak ada, record terbaru dipakai. Record tanpa kode tetap tampil menurut ID masing-masing. Pencarian pada kategori tersebut diterapkan pada record terpilih.

Setiap item memiliki `id`, `group`, `category`, `name`, `asset_code`, `location`, `status`, `condition`, `receiver_name`, `department`, `division_project`, `handover_date`, `specification`, `attributes`, dan `updated_at`. Field umum yang tidak tersedia pada sumber bernilai `null`. `attributes` berisi field khusus dengan nama asli dari model Prisma dan hanya kolom yang masuk daftar aman. Nilai `status` untuk kategori penyerahan berulang mengikuti status daftar yang ada: `Tersedia` jika dikembalikan atau tanpa penerima, `Aktif` untuk laptop aktif, dan `Dipakai` untuk kategori penyerahan lain yang aktif. Kategori tanpa sumber status mengembalikan `null`.

Contoh ringkas aset fisik:

```json
{
  "id": 42,
  "group": "physical",
  "category": "laptop",
  "name": "Lenovo ThinkPad",
  "asset_code": "LPT-042",
  "location": "Jakarta",
  "status": "Aktif",
  "condition": "Baik",
  "receiver_name": "Ayu",
  "department": "Finance",
  "division_project": "Operations",
  "handover_date": "2026-10-01T00:00:00.000Z",
  "specification": "Lenovo ThinkPad Core i5 16 GB 512 GB",
  "attributes": { "job_level": "Staff", "screen_size": "14", "mac_address": null, "return_date": null },
  "updated_at": "2026-10-01T08:00:00.000Z"
}
```

Contoh ringkas aset digital:

```json
{
  "id": 7,
  "group": "digital",
  "category": "email",
  "name": "Ayu",
  "asset_code": null,
  "location": "Jakarta",
  "status": "Aktif",
  "condition": null,
  "receiver_name": "Ayu",
  "department": "Finance",
  "division_project": "Operations",
  "handover_date": null,
  "specification": null,
  "attributes": { "email": "ayu@example.com", "domain": "example.com", "job_level": "Staff", "deleted_at": null },
  "updated_at": "2026-10-01T08:00:00.000Z"
}
```

Contoh pemanggilan:

```bash
curl -H "Authorization: Bearer $ASSET_API_V1_TOKEN" \
  'http://localhost:3000/api/v1/assets?group=physical&category=laptop&search=Lenovo&page=1&limit=20'
```

Respons daftar menggunakan `{ "success": true, "data": [...], "meta": { ... } }`.

## Detail

`GET /api/v1/assets/{group}/{category}/{id}` mengembalikan `{ "success": true, "data": { ... } }` dengan bentuk item yang sama seperti daftar. `id` adalah ID record sumber. Jika ID berasal dari record penyerahan lama, detail menampilkan record tersebut; daftar selalu memakai record terpilih yang terkini.

## Riwayat

`GET /api/v1/assets/{group}/{category}/{id}/history?page=1&limit=20` mengembalikan `data` dan `meta` dengan pagination yang sama. Tiap entri memuat `id` berbentuk `history:<id>` atau `assignment:<id>`, `source`, `action`, `event_at`, `asset_id`, `from_employee`, `to_employee`, `from_location`, `to_location`, `old_condition`, `new_condition`, dan `changed_by`. Urutan terbaru lebih dahulu. Catatan penyerahan dapat muncul bersama event `AssetHistory` yang merekam penyerahan yang sama; `source` membedakannya.

Riwayat fisik mengambil event `AssetHistory` untuk kategori tersebut dan, pada kategori penyerahan berulang, record penugasan yang memakai kode aset sama. Jika kode tidak tersedia, riwayat dibatasi ke ID record. Riwayat digital mengembalikan daftar kosong karena skema belum menyimpan lifecycle akun digital. Riwayat hanya mencakup data yang masih tersimpan; API tidak merekonstruksi event yang tidak pernah dicatat.

## Error dan keamanan data

Error memakai `{ "success": false, "message": "..." }`, dengan `errors` opsional untuk parameter yang gagal validasi. Status yang mungkin: `400` untuk parameter/identitas tidak valid, `401` untuk autentikasi, `404` untuk aset yang tidak ada, `500` untuk kegagalan baca database, dan `503` jika token server belum dikonfigurasi.

Semua query memakai pilihan kolom eksplisit. Password, token, kode akses, kolom username login, URL aplikasi yang mungkin membawa token, dan catatan teks bebas tidak diambil ataupun dikirim. Tidak ada endpoint tulis pada versi ini.
