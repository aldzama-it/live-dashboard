# Panduan Integrasi Live API Accurate Online — Accounts Payable (AP)

Dokumen ini menjelaskan secara menyeluruh bagaimana data Accounts Payable (AP) diambil langsung dari cloud server **Accurate Online**, format request yang digunakan, serta bagaimana data mentah tersebut diolah di backend hingga disajikan ke dashboard frontend.

---

## 1. Arsitektur Koneksi & Alur Data

```
+---------------------------+
|  Frontend (React / Vite)  |
|  AccountsPayableApi.jsx   |
+-------------+-------------+
              | 1. GET /api/finance-dashboard/ap-api?start_date=...&end_date=...
              v
+-----------------------------+
|   Backend (Laravel 11)      |
| FinanceDashboardController  |
+-------------+---------------+
              | 2. Generate HMAC SHA-256 Signature & Timestamp
              | 3. GET /accurate/api/purchase-invoice/list.do
              v
+-------------------------------+
| Accurate Online Public Cloud  |
| (https://zeus.accurate.id)    |
+-------------+-----------------+
              | 4. Return JSON (Raw Purchase Invoices & primeOwing)
              v
+-------------------------------+
|  Backend Pengolahan Data      |
|  - Total Outstanding AP       |
|  - Hitung Aging & Overdue     |
|  - Top 5 Vendor Terbesar      |
|  - Ringkasan per Mata Uang    |
|  - Filter Belum Jatuh Tempo   |
+-------------+-----------------+
              | 5. Return Clean JSON Dashboard Structure
              v
+-------------------------------+
| Visualisasi Dashboard Frontend|
| (KPI Card, Donut, Bar, Tabel) |
+-------------------------------+
```

---

## 2. Spesifikasi Endpoint Accurate Online yang Digunakan

### 2.1 URL Endpoint
* **Host Server:** `https://zeus.accurate.id` (Host data usaha cloud Accurate)
* **Path Endpoint:** `/accurate/api/purchase-invoice/list.do`
* **HTTP Method:** `GET`

### 2.2 Header Autentikasi
Setiap pemanggilan API ke Accurate Online wajib menyertakan 4 header berikut:

| Header Key | Tipe / Format | Keterangan |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <ACCURATE_API_TOKEN>` | Token sesi database OAuth2 dari Accurate Online. |
| `X-Api-Timestamp` | `dd/MM/yyyy HH:mm:ss` | Waktu lokal Jakarta (WIB), contoh: `08/09/2026 11:15:30`. |
| `X-Api-Signature` | `Base64(HMAC-SHA256)` | Hash HMAC SHA-256 dari `X-Api-Timestamp` menggunakan `ACCURATE_SIGNATURE_SECRET`. |
| `Accept` | `application/json` | Memastikan respon dalam format JSON. |
| `X-Language-Profile` | `ID` | Profil bahasa respon (Indonesia). |

> **Catatan Penting Autentikasi:**
> Token yang digunakan adalah **Database Session Token**. Server Accurate Online tidak memerlukan pemanggilan `/api/open-db.do` maupun header `X-Session-ID`, karena sesi database sudah tersemat secara permanen di dalam token.

### 2.3 Parameter Query yang Dikirim

```http
GET https://zeus.accurate.id/accurate/api/purchase-invoice/list.do
    ?fields=id,number,vendor,transDate,dueDate,status,currency,totalAmount,primeOwing
    &sp.pageSize=100
    &sp.sort=transDate|desc
    &filter.status.op=EQUAL
    &filter.status.val=OUTSTANDING
    &filter.transDate.op=BETWEEN
    &filter.transDate.val[0]=01/09/2026
    &filter.transDate.val[1]=30/09/2026
```

| Parameter | Contoh Nilai | Fungsi |
| :--- | :--- | :--- |
| `fields` | `id,number,vendor,transDate,dueDate,status,currency,totalAmount,primeOwing` | Menentukan kolom yang dikembalikan agar response ringan dan cepat. |
| `sp.pageSize` | `100` | Jumlah data per halaman (maksimum 100). |
| `sp.sort` | `transDate\|desc` | Mengurutkan faktur mulai dari transaksi terbaru. |
| `filter.status.op` | `EQUAL` | Operator filter status. |
| `filter.status.val` | `OUTSTANDING` | Hanya mengambil faktur yang **belum lunas**. |
| `filter.transDate.op` | `BETWEEN` | Operator rentang tanggal transaksi faktur. |
| `filter.transDate.val[0]` | `01/09/2026` | Batas awal tanggal transaksi (`d/m/Y`). |
| `filter.transDate.val[1]` | `30/09/2026` | Batas akhir tanggal transaksi (`d/m/Y`). |

---

## 3. Kamus Data & Pemetaan Field (Accurate Online vs Dashboard)

| Field Asli Accurate | Tipe Data | Field di Dashboard | Keterangan & Aturan |
| :--- | :--- | :--- | :--- |
| `primeOwing` | `Float` | `outstanding_amount` | **Sisa Utang Belum Dibayar** dalam mata uang transaksi asli. *(Field ini yang wajib digunakan, bukan outstandingAmount)* |
| `totalAmount` | `Float` | `total_amount` | Total nilai kotor faktur pembelian. |
| `transDate` | `String (d/m/Y)` | `invoice_date` | Tanggal penerbitan faktur. Dikonversi ke format `Y-m-d`. |
| `dueDate` | `String (d/m/Y)` | `due_date` | Tanggal batas akhir pembayaran. Dikonversi ke format `Y-m-d`. |
| `number` | `String` | `invoice_no` | Nomor faktur pembelian, misal `PI.2026.09.02406`. |
| `vendor.name` | `String` | `vendor` | Nama vendor pemasok, misal `CV. Andro Teknologi`. |
| `currency.name` | `String` | `currency` | Nama mata uang, misal `IDR`, `USD`. |
| `status` | `String` | `status` | Status faktur Accurate (`OUTSTANDING`). |

---

## 4. Logika & Formula Pengolahan Data di Backend

Logika pengolahan dijalankan pada method `getApDashboardApi()` di file `app/Http/Controllers/Api/FinanceDashboardController.php`:

### 4.1 Filter Faktur Aktif
Hanya faktur dengan nilai sisa utang positif yang diproses:
```php
$outstanding = (float)($inv['primeOwing'] ?? $inv['totalAmount'] ?? 0);
if ($outstanding <= 0) continue;
```

### 4.2 Perhitungan Total Outstanding
Menjumlahkan seluruh sisa utang dari seluruh faktur yang lolos filter:
$$\text{Total Outstanding} = \sum \text{primeOwing}$$

### 4.3 Perhitungan Umur Keterlambatan (Aging Days)
Umur keterlambatan dihitung terhadap hari ini (`today` waktu WIB):
```php
$today = \Carbon\Carbon::now('Asia/Jakarta')->startOfDay();
$dueDate = \Carbon\Carbon::createFromFormat('d/m/Y', $inv['dueDate'])->startOfDay();

if ($dueDate->lt($today)) {
    // Faktur sudah lewat jatuh tempo (Overdue)
    $ageDays = (int) $today->diffInDays($dueDate);
    $totalOverdue += $outstanding;
} else {
    // Faktur belum jatuh tempo (Not Due)
    $ageDays = 0;
}
```

### 4.4 Pengelompokan Aging Donut Chart (Buckets)
Faktur dikelompokkan ke dalam 4 keranjang umur:
1. **Belum Jatuh Tempo:** Faktur yang jatuh temponya hari ini atau di masa mendatang (`$ageDays == 0`).
2. **1 - 30 Hari:** Faktur yang terlambat antara 1 sampai 30 hari (`$ageDays >= 1 && $ageDays <= 30`).
3. **31 - 60 Hari:** Faktur yang terlambat antara 31 sampai 60 hari (`$ageDays >= 31 && $ageDays <= 60`).
4. **> 60 Hari:** Faktur kritis yang terlambat lebih dari 60 hari (`$ageDays > 60`).

### 4.5 Top 5 Vendor Terbesar
Setiap sisa utang diakumulasikan berdasarkan nama vendor:
```php
$vendorTotals[$vendorName] += $outstanding;
arsort($vendorTotals); // Urutkan dari utang terbesar
$topVendors = array_slice($vendorTotals, 0, 5);
```

### 4.6 Ringkasan Mata Uang
Menghitung proporsi utang untuk masing-masing mata uang terhadap total outstanding:
$$\text{Persentase} = \left( \frac{\text{Total Utang Mata Uang X}}{\text{Total Outstanding}} \right) \times 100\%$$

---

## 5. Caching & Optimasi Kecepatan

Untuk menjaga kecepatan dashboard di bawah 300ms dan mencegah terkena limit rate API Accurate:
* Backend menggunakan **Laravel Cache** dengan key dinamis berbasis tanggal:
  ```php
  $cacheKey = 'ap_dashboard_live_api_' . md5($startDate . '_' . $endDate);
  $responseData = Cache::remember($cacheKey, 120, function () { ... });
  ```
* Cache disimpan selama **120 detik (2 menit)**.
* Jika pengguna mengganti filter tanggal, cache key baru otomatis dibuat sehingga data langsung ter-refresh.
