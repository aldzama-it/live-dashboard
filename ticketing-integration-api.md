# Ticketing Integration API

API ini menyediakan feed tiket read-only untuk integrasi backend, termasuk dashboard Asset IT.

## URL dan autentikasi

```text
GET https://<host-aplikasi>/api/v1/integrations/assets/tickets
```

Gunakan URL berversi ini untuk integrasi baru. URL lama `/integrations/assets/tickets` tetap tersedia sebagai alias kompatibilitas untuk klien yang sudah menggunakannya.

Sertakan token integrasi pada setiap permintaan:

```http
X-Integration-Token: <secret-token>
Accept: application/json
```

Server membaca token yang diharapkan dari `TICKETING_INTEGRATION_TOKEN`. Permintaan tanpa token yang benar menerima `401 Unauthorized`. Token adalah rahasia server-ke-server: jangan masukkan token ke JavaScript, aplikasi browser, atau kode frontend. Browser dari website lain juga tidak dapat memanggil endpoint ini langsung karena CORS dan token rahasia. Backend website tersebut dapat memanggil endpoint ini dan meneruskan hanya data yang diperlukan.

## Parameter query

| Parameter | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `date_from` | string tanggal `YYYY-MM-DD` | Disarankan untuk seluruh riwayat | Batas awal inklusif berdasarkan `created_at`. |
| `date_to` | string tanggal `YYYY-MM-DD` | Disarankan untuk seluruh riwayat | Batas akhir inklusif berdasarkan `created_at`; tidak boleh sebelum `date_from`. |
| `status` | string enum | Tidak | Filter status tiket. |
| `priority` | string enum | Tidak | Filter prioritas tiket. |
| `page` | integer ≥ 1 | Tidak | Halaman hasil; default `1`. |
| `per_page` | integer 1–100 | Tidak | Jumlah tiket per halaman; default `20`, maksimum `100`. |

Tanggal memakai format ISO `YYYY-MM-DD` (contoh `2026-09-01`). Rentang mencakup seluruh hari awal dan akhir. Filter tanggal berlaku pada waktu tiket dibuat (`created_at`). Jika tanggal tidak dikirim, endpoint menggunakan awal bulan berjalan sampai waktu saat ini. Untuk mengambil seluruh riwayat, kirim tanggal awal dan akhir yang mencakup periode yang dibutuhkan, lalu ambil halaman dari `1` hingga `last_page` sesuai `data.tickets.pagination`.

Status yang tersedia: `NEW`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, `CLOSED`.

Prioritas yang tersedia: `Low`, `Medium`, `High`, `Urgent`.

## Contoh permintaan

```bash
curl 'https://<host-aplikasi>/api/v1/integrations/assets/tickets?date_from=2026-01-01&date_to=2026-12-31&page=1&per_page=100' \
  -H 'X-Integration-Token: <secret-token>' \
  -H 'Accept: application/json'
```

Untuk mengambil halaman berikutnya, kirim `page=2`, lalu lanjutkan sampai `current_page` mencapai `last_page`. Parameter filter tetap sama pada setiap permintaan halaman.

## Bentuk respons

Respons sukses mempertahankan envelope dashboard yang sudah ada. Daftar tiket ada di `data.tickets.data`; metadata pagination ada di `data.tickets.pagination`. `summary`, `status_breakdown`, dan `trend` dihitung untuk rentang dan filter yang sama.

```json
{
  "data": {
    "filters": {
      "date_from": "2026-09-01",
      "date_to": "2026-09-30",
      "status": null,
      "priority": null
    },
    "summary": {
      "total_tickets": 1,
      "active_tickets": 1,
      "completed_tickets": 0,
      "urgent_tickets": 0
    },
    "status_breakdown": [{ "status": "NEW", "total": 1 }],
    "trend": [{ "date": "2026-09-01", "created": 1, "completed": 0 }],
    "tickets": {
      "data": [
        {
          "id": 42,
          "ticket_number": "TIC-2026-0042",
          "reporter_name": "Rina Pelapor",
          "reporter_phone": "08123456789",
          "reporter_email": "rina@example.test",
          "department_id": 2,
          "location_id": 3,
          "category_id": 4,
          "subject": "Koneksi jaringan",
          "description": "Tidak dapat mengakses jaringan kantor.",
          "attachment_path": "tickets/2026/09/bukti.png",
          "attachment_original_name": "bukti.png",
          "attachment_mime": "image/png",
          "attachment_size": 2048,
          "priority": "Medium",
          "status": "NEW",
          "assigned_to": "Nama Petugas",
          "assigned_to_id": 7,
          "resolved_at": null,
          "created_at": "2026-09-01T09:00:00+07:00",
          "updated_at": "2026-09-01T09:00:00+07:00",
          "category": "Network",
          "department": "IT",
          "location": "Jakarta",
          "detail_url": "https://<host-aplikasi>/app/tickets/42"
        }
      ],
      "pagination": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 100,
        "total": 1
      }
    }
  }
}
```

## Kolom tiket

Setiap item tiket memuat semua kolom tabel `tickets`. Foreign key numerik tersedia pada kolom `*_id`. Kolom relasi `department`, `category`, `location`, dan `assigned_to` tetap berisi nama untuk menjaga kompatibilitas. `assigned_to` adalah nama petugas; `assigned_to_id` adalah ID user numerik.

| Kolom | Tipe JSON | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | integer | Tidak | ID tiket. |
| `ticket_number` | string | Tidak | Nomor tiket. |
| `reporter_name` | string | Tidak | Nama pelapor. |
| `reporter_phone` | string | Ya | Nomor telepon pelapor. |
| `reporter_email` | string | Ya | Email pelapor. |
| `department_id` | integer | Tidak | Foreign key departemen. |
| `location_id` | integer | Tidak | Foreign key lokasi. |
| `category_id` | integer | Tidak | Foreign key kategori. |
| `subject` | string | Tidak | Subjek tiket. |
| `description` | string | Tidak | Deskripsi tiket. |
| `attachment_path` | string | Ya | Path penyimpanan lampiran. |
| `attachment_original_name` | string | Ya | Nama file asli lampiran. |
| `attachment_mime` | string | Ya | MIME type lampiran. |
| `attachment_size` | integer | Ya | Ukuran lampiran dalam byte. |
| `priority` | string enum | Tidak | `Low`, `Medium`, `High`, atau `Urgent`. |
| `status` | string enum | Tidak | `NEW`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, atau `CLOSED`. |
| `assigned_to` | string | Ya | Nama petugas yang ditugaskan. |
| `assigned_to_id` | integer | Ya | ID numerik petugas; null jika tiket belum ditugaskan atau user dihapus. |
| `resolved_at` | string tanggal-waktu ISO 8601 | Ya | Waktu penyelesaian. |
| `created_at` | string tanggal-waktu ISO 8601 | Tidak | Waktu tiket dibuat. |
| `updated_at` | string tanggal-waktu ISO 8601 | Tidak | Waktu tiket terakhir diperbarui. |
| `department` | string | Ya | Nama departemen terkait. |
| `category` | string | Ya | Nama kategori terkait. |
| `location` | string | Ya | Nama lokasi terkait. |
| `detail_url` | string URL | Tidak | URL halaman detail tiket pada aplikasi ini. |

Nilai kosong dikirim sebagai JSON `null`. Kolom nama relasi dipertahankan untuk kompatibilitas dan dapat bernilai null jika relasinya tidak tersedia. `resolved_at`, `created_at`, dan `updated_at` memakai timestamp ISO 8601 dengan offset zona waktu aplikasi. `attachment_path` adalah metadata path, bukan isi file.

Komentar internal dan feedback tidak disertakan. Keduanya disimpan pada tabel terpisah dari `tickets`.

Data kontak pelapor dan path lampiran dapat bersifat sensitif. Simpan token dan proses respons hanya di backend dengan kontrol akses yang sesuai; jangan mengeksposnya secara langsung ke browser atau log publik.
