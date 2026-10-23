# Panduan API Project Software AZM ORBIT

Panduan ini menjelaskan cara website lain membaca project kategori **Software** dari AZM ORBIT. API ini hanya menyediakan operasi baca; data di AZM ORBIT tidak dapat diubah lewat API.

## 1. Akses dan autentikasi

Minta alamat website AZM ORBIT dari administrator. Alamat itu menjadi `BASE_URL`, misalnya `https://orbit.aldzama.com`. Semua endpoint memakai HTTPS dan format JSON, kecuali endpoint unduh file.

Setiap request API harus mengirim token pada header berikut:

```http
Authorization: Bearer TOKEN_ANDA
Accept: application/json
```
Token Sanctum dengan kemampuan `projects:read` diterbitkan untuk akun **Super Admin**. Administrator dapat menerbitkannya dari server AZM ORBIT:

Sebelum menerbitkan token pertama, jalankan migrasi database di server AZM ORBIT:

```bash
php artisan migrate --force
```

```bash
php artisan tinker
```

Di prompt Tinker, ganti `ID_AKUN_SUPER_ADMIN` dengan ID akun Super Admin:

```php
$user = App\Models\User::findOrFail(ID_AKUN_SUPER_ADMIN);
$user->createToken('integrasi-website-lain', ['projects:read'])->plainTextToken;
```

> Simpan token yang ditampilkan di tempat rahasia, misalnya secret/environment variable di server website Anda. Token hanya ditampilkan saat diterbitkan. Jangan memasukkannya ke kode frontend atau membagikannya di repositori.

Untuk mencabut token, administrator dapat menghapus token dengan nama yang sama melalui Tinker:

```php
$user = App\Models\User::findOrFail(ID_AKUN_SUPER_ADMIN);
$user->tokens()->where('name', 'integrasi-website-lain')->delete();
```

API menolak token yang bukan token Sanctum, token tanpa kemampuan `projects:read`, atau token yang pemiliknya bukan Super Admin.

## 2. Daftar project

```http
GET /api/v1/projects
```

Endpoint ini mengembalikan project kategori Software yang sudah disetujui. Project aktif dan selesai sama-sama disertakan. Pencocokan nama kategori tidak membedakan huruf besar dan kecil.

### Parameter

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `limit` | Tidak | Jumlah maksimum project per halaman. Default `25`, minimum `1`, maksimum `100`. |
| `cursor` | Tidak | ID terakhir dari halaman sebelumnya (`next_cursor`). Abaikan pada request pertama. |

Contoh:

```bash
curl --get "$BASE_URL/api/v1/projects" \
  --data-urlencode "limit=25" \
  -H "Authorization: Bearer $ORBIT_API_TOKEN" \
  -H "Accept: application/json"
```

Contoh respons:

```json
{
  "data": [
    {
      "id": 42,
      "title": "Portal Layanan Internal",
      "description": "Pembaruan layanan internal",
      "progress": 60,
      "is_completed": false,
      "approval_status": "APPROVED",
      "start_date": "2026-09-01",
      "deadline": "2026-12-31",
      "extended_deadline": null,
      "completed_at": null,
      "category": { "id": 3, "name": "Software" },
      "status": { "id": 2, "name": "On Progress", "type": "PROJECT" },
      "priority": { "id": 2, "name": "SEDANG", "level": 2 },
      "division": {
        "id": 5,
        "name": "Software Engineering",
        "code": "SE",
        "department": { "id": 2, "name": "Engineering", "code": "ENG" }
      },
      "requested_by": { "id": 12, "name": "Nama Pemilik" },
      "pic": { "id": 15, "name": "Nama PIC" },
      "created_at": "2026-09-01T02:00:00.000000Z",
      "updated_at": "2026-10-20T07:30:00.000000Z"
    }
  ],
  "next_cursor": 42,
  "has_more": true
}
```

Jika `has_more` bernilai `true`, ambil halaman berikutnya dengan nilai `next_cursor`:

```bash
curl --get "$BASE_URL/api/v1/projects" \
  --data-urlencode "limit=25" \
  --data-urlencode "cursor=42" \
  -H "Authorization: Bearer $ORBIT_API_TOKEN" \
  -H "Accept: application/json"
```

Ulangi sampai `has_more` bernilai `false` atau `next_cursor` bernilai `null`.

## 3. Detail project dan komponennya

```http
GET /api/v1/projects/{id}
```

Contoh:

```bash
curl "$BASE_URL/api/v1/projects/42" \
  -H "Authorization: Bearer $ORBIT_API_TOKEN" \
  -H "Accept: application/json"
```

Respons berisi objek project dalam `data`. Selain field ringkasan pada daftar, detail berisi:

- `board_statuses`: kolom/status pada board, termasuk status persetujuannya.
- `tasks`: daftar task beserta status, prioritas, tanggal, progress, status persetujuan, dan pembuat/pemberi persetujuan.
- `tasks[].members`, `tasks[].subtasks`: anggota dan checklist pada task.
- `tasks[].files`: metadata lampiran, pengguna pengunggah, anotasi, dan `download_url`.
- `tasks[].comments`: isi komentar, penulis, dan waktu komentar.
- `contributors`: kolaborator, tingkat akses, status undangan, serta pengundang.
- `notes` dan `activities`: catatan project dan riwayat aktivitas.
- `monthly_snapshots`: rekaman progress per bulan.
- `extension_requests`: permintaan perpanjangan tenggat beserta keputusan dan alasannya.
- `approved_by`, `completed_by`, `reject_reason`, dan informasi perpanjangan pada project.

Field relasi tunggal yang tidak memiliki data bernilai `null`. Relasi berbentuk daftar tetap berupa array dan bernilai `[]` bila belum ada data. Tanggal memakai format `YYYY-MM-DD`, sedangkan waktu memakai ISO 8601 UTC. Data identitas pengguna hanya memuat `id` dan `name`.

Contoh bentuk data detail (dipersingkat):

```json
{
  "data": {
    "id": 42,
    "title": "Portal Layanan Internal",
    "board_statuses": [],
    "tasks": [
      {
        "id": 101,
        "title": "Buat halaman login",
        "approval_status": "APPROVED",
        "members": [{ "id": 15, "name": "Nama Anggota" }],
        "subtasks": [],
        "files": [],
        "comments": []
      }
    ],
    "contributors": [],
    "notes": [],
    "activities": [],
    "monthly_snapshots": [],
    "extension_requests": []
  }
}
```

Project yang ID-nya tidak ada, bukan kategori Software, atau belum disetujui akan menghasilkan `404 Not Found`.

## 4. Mengunduh lampiran

Setiap item pada `tasks[].files` memiliki `download_url`. Request unduhan harus memakai token yang sama:

```bash
curl "$BASE_URL/api/v1/task-files/501" \
  -H "Authorization: Bearer $ORBIT_API_TOKEN" \
  --output lampiran
```

> Jangan menghapus header Authorization saat mengunduh. URL ini hanya dapat dipakai dengan token yang valid, dan file hanya tersedia jika masih ada di penyimpanan AZM ORBIT.

## 5. Contoh JavaScript

Jalankan kode di backend website Anda agar token tidak terekspos ke browser pengunjung:

```js
const response = await fetch(`${process.env.ORBIT_BASE_URL}/api/v1/projects?limit=25`, {
  headers: {
    Authorization: `Bearer ${process.env.ORBIT_API_TOKEN}`,
    Accept: 'application/json',
  },
});

if (!response.ok) {
  throw new Error(`AZM ORBIT API gagal: ${response.status}`);
}

const page = await response.json();
console.log(page.data);
```

## 6. Kode respons error

| HTTP | Arti | Yang perlu dilakukan |
| --- | --- | --- |
| `401 Unauthorized` | Token tidak dikirim, tidak valid, atau sudah dicabut. | Periksa secret token dan minta token baru dari administrator bila perlu. |
| `403 Forbidden` | Token valid, tetapi tidak memiliki kemampuan yang diperlukan atau bukan milik akun Super Admin. | Minta administrator menerbitkan token integrasi dengan konfigurasi yang benar. |
| `404 Not Found` | Project/file tidak ditemukan atau project tidak termasuk data Software yang disetujui. | Periksa ID project atau lampiran. |
| `422 Unprocessable Content` | Parameter paginasi tidak sesuai aturan. | Gunakan `limit` 1–100 dan `cursor` berupa ID positif. |

Contoh respons validasi:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "limit": ["The limit field must be between 1 and 100."]
  }
}
```
