import React, { useState } from 'react';
import { 
  Server, 
  Code, 
  Database, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Filter,
  Calculator,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import { Link } from 'react-router-dom';

export default function AccurateApiGuide() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleEndpoint = `GET https://zeus.accurate.id/accurate/api/purchase-invoice/list.do
Header:
  Authorization: Bearer <ACCURATE_API_TOKEN>
  X-Api-Timestamp: 08/09/2026 11:15:30
  X-Api-Signature: <BASE64_HMAC_SHA256>
  Accept: application/json
  X-Language-Profile: ID

Query Parameters:
  fields: id,number,vendor,transDate,dueDate,status,currency,totalAmount,primeOwing
  sp.pageSize: 100
  sp.sort: transDate|desc
  filter.status.op: EQUAL
  filter.status.val: OUTSTANDING
  filter.transDate.op: BETWEEN
  filter.transDate.val[0]: 01/09/2026
  filter.transDate.val[1]: 30/09/2026`;

  return (
    <div className="flex flex-col gap-4 pb-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live API Production
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Accurate Online v1.4467
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Panduan Integrasi & Pengolahan Data Accurate Online</h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-2xl">
              Dokumentasi teknis alur penarikan data Accounts Payable (AP) dari Accurate Online Public Cloud API, pemetaan field, dan formula kalkulasi metrik finansial di dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/finance-admin/finance/ap-api"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition shadow flex items-center gap-2"
            >
              <Activity size={16} />
              Buka Dashboard AP Live API
            </Link>
            <a
              href="https://app.swaggerhub.com/apis/cpssoft/accurate-online_public_api/1.4467.1872#//api"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"
            >
              SwaggerHub
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2 gap-2 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} />
          Arsitektur & Alur Data
        </button>
        <button
          onClick={() => setActiveTab('endpoint')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'endpoint'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Server size={16} />
          Endpoint & Request
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mapping'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={16} />
          Kamus Data (Field Mapping)
        </button>
        <button
          onClick={() => setActiveTab('formula')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'formula'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator size={16} />
          Formula & Logika Pengolahan
        </button>
      </div>

      {/* Tab 1: Overview & Arsitektur */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-boxdark mb-3 flex items-center gap-2">
              <Layers className="text-primary" size={20} />
              Diagram Alur Data End-to-End
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Dashboard ini mengambil data utang usaha (Accounts Payable) secara langsung (real-time) melalui koneksi server-ke-server yang aman antara backend Laravel dan server Accurate Online.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-3">1</div>
                  <h4 className="font-bold text-gray-900 text-sm">Frontend Request</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    User memilih rentang tanggal di dashboard React, lalu mengirim request ke backend Laravel melalui Axios.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200/60 text-[11px] font-mono text-blue-700">
                  GET /api/finance-dashboard/ap-api
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-3">2</div>
                  <h4 className="font-bold text-gray-900 text-sm">Auth & Signature</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Backend Laravel membuat Signature HMAC SHA-256 menggunakan Timestamp WIB dan Secret Key, lalu memanggil API Accurate.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[11px] font-mono text-indigo-700">
                  AccurateApiService.php
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-3">3</div>
                  <h4 className="font-bold text-gray-900 text-sm">Accurate Cloud API</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Server Accurate (<code>zeus.accurate.id</code>) mengembalikan data faktur berstatus <code>OUTSTANDING</code> lengkap dengan <code>primeOwing</code>.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/60 text-[11px] font-mono text-purple-700">
                  purchase-invoice/list.do
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">4</div>
                  <h4 className="font-bold text-gray-900 text-sm">Pengolahan & Cache</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Backend menghitung Total Outstanding, Aging Hari, Top Vendor, mengelompokkan bucket, dan menyimpannya di Cache (120 dtk).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-700">
                  Clean Dashboard JSON
                </div>
              </div>
            </div>
          </Card>

          {/* Key Advantages Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-boxdark text-sm">Sesi Database Otomatis</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Token yang digunakan adalah <strong>Database Session Token</strong> bawaan dari Accurate, sehingga tidak perlu login ulang atau memanggil <code>open-db.do</code>.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-boxdark text-sm">Performa Cepat (Cache 120 Detik)</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Data di-cache cerdas di server backend selama 2 menit untuk memastikan load time instan tanpa membebani limit pemanggilan API cloud Accurate.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-500">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Filter size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-boxdark text-sm">Dukungan Filter Tanggal Dinamis</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Mendukung filter tanggal transaksi (<code>transDate</code>) langsung ke server Accurate menggunakan operator <code>BETWEEN</code>.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Endpoint & Request */}
      {activeTab === 'endpoint' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-boxdark flex items-center gap-2">
                <Server className="text-primary" size={20} />
                Format Request GET ke Accurate Online
              </h3>
              <button
                onClick={() => copyToClipboard(sampleEndpoint)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Tersalin!' : 'Salin Request'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Berikut adalah spesifikasi request lengkap yang dikirimkan oleh backend Laravel ke cloud endpoint Accurate:
            </p>

            <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs overflow-x-auto">
              <pre>{sampleEndpoint}</pre>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-bold text-boxdark mb-3">Rincian Header Keamanan (Security Headers)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">Header Key</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Contoh Format</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">Authorization</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">Bearer aat.NTA.eyJ...</td>
                    <td className="px-4 py-2.5 text-gray-600">Token akses OAuth2 yang berisikan hak akses database usaha.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">X-Api-Timestamp</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">08/09/2026 11:15:30</td>
                    <td className="px-4 py-2.5 text-gray-600">Waktu saat ini dengan format <code>dd/MM/yyyy HH:mm:ss</code> dalam zona WIB (Asia/Jakarta).</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">X-Api-Signature</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">q9tZ...=</td>
                    <td className="px-4 py-2.5 text-gray-600">Hash <code>base64_encode(hash_hmac('sha256', timestamp, secret, true))</code>.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">Accept</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">application/json</td>
                    <td className="px-4 py-2.5 text-gray-600">Wajib agar server Accurate tidak merespon dalam bentuk HTML redirect.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">X-Language-Profile</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">ID</td>
                    <td className="px-4 py-2.5 text-gray-600">Profil bahasa respon dalam Bahasa Indonesia.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Data Mapping */}
      {activeTab === 'mapping' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-boxdark mb-2 flex items-center gap-2">
            <Database className="text-primary" size={20} />
            Pemetaan Field: Accurate Online vs Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tabel berikut menunjukkan korespondensi antara nama kolom asli pada response Accurate Online API dengan field yang digunakan di Dashboard.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Field Accurate API</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Tipe Data</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Field Dashboard</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Fungsi di Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3 font-mono font-bold text-amber-900">primeOwing</td>
                  <td className="px-4 py-3 font-mono text-gray-600">Float</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">outstanding_amount</td>
                  <td className="px-4 py-3 text-gray-700">
                    <strong>Sisa utang faktur</strong> dalam mata uang asli transaksi. Digunakan untuk menghitung Total Outstanding AP, Aging, dan Top Vendor.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">totalAmount</td>
                  <td className="px-4 py-3 font-mono text-gray-600">Float</td>
                  <td className="px-4 py-3 font-mono text-gray-700">total_amount</td>
                  <td className="px-4 py-3 text-gray-600">Total nilai kotor faktur pembelian sebelum pembayaran.</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3 font-mono font-bold text-amber-900">transDate</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String (d/m/Y)</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">invoice_date</td>
                  <td className="px-4 py-3 text-gray-700">
                    <strong>Tanggal faktur diterbitkan</strong>. Diparsing dari format Accurate (misal <code>08/09/2026</code>) ke format ISO <code>2026-09-08</code>.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">dueDate</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String (d/m/Y)</td>
                  <td className="px-4 py-3 font-mono text-gray-700">due_date</td>
                  <td className="px-4 py-3 text-gray-600">Tanggal batas akhir pembayaran utang.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">number</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String</td>
                  <td className="px-4 py-3 font-mono text-gray-700">invoice_no</td>
                  <td className="px-4 py-3 text-gray-600">Nomor referensi faktur pembelian (contoh: <code>PI.2026.09.02406</code>).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">vendor.name</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String</td>
                  <td className="px-4 py-3 font-mono text-gray-700">vendor</td>
                  <td className="px-4 py-3 text-gray-600">Nama pihak ketiga / pemasok yang mengeluarkan tagihan.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">currency.name</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String</td>
                  <td className="px-4 py-3 font-mono text-gray-700">currency</td>
                  <td className="px-4 py-3 text-gray-600">Simbol / nama mata uang (misal <code>IDR</code>, <code>USD</code>).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">status</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String</td>
                  <td className="px-4 py-3 font-mono text-gray-700">status</td>
                  <td className="px-4 py-3 text-gray-600">Status utang Accurate: <code>OUTSTANDING</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Catatan Penamaan Field:</strong> Pada dokumentasi SwaggerHub, field sisa utang sering ditulis secara umum sebagai <code>outstandingAmount</code>. Namun pada payload response aktual API Accurate Online, nilai sisa utang yang valid secara spesifik berada di dalam properti <code>primeOwing</code>.
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Formula & Processing */}
      {activeTab === 'formula' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-boxdark mb-2 flex items-center gap-2">
              <Calculator className="text-primary" size={20} />
              Formula Perhitungan & Transformasi Metrik Finansial
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Berikut adalah aturan dan rumus matematika yang diterapkan di backend untuk mengolah data faktur mentah:
            </p>

            <div className="space-y-6">
              {/* Formula 1 */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">1. Total Outstanding AP</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">KPI Utama</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Akumulasi total saldo utang yang masih terbuka dari seluruh faktur yang belum lunas:
                </p>
                <div className="bg-white p-2.5 rounded border border-gray-200 font-mono text-xs text-primary font-semibold">
                  Total Outstanding = ∑ primeOwing (untuk semua faktur dengan primeOwing &gt; 0)
                </div>
              </div>

              {/* Formula 2 */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">2. Perhitungan Umur Keterlambatan (Aging Days)</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">Standar Akuntansi</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Umur keterlambatan dihitung dari tanggal hari ini (WIB) terhadap tanggal jatuh tempo faktur:
                </p>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono">
                    Jika dueDate &lt; hari ini : age_days = (int) diffInDays(hari ini, dueDate) <span className="text-danger font-bold">(Overdue / Lewat Tempo)</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono">
                    Jika dueDate &gt;= hari ini : age_days = 0 <span className="text-emerald-600 font-bold">(Belum Jatuh Tempo / Belum Tempo)</span>
                  </div>
                </div>
              </div>

              {/* Formula 3 */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">3. Keranjang Aging Donut Chart (Aging Buckets)</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">Visualisasi Aging</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Faktur dialokasikan ke dalam 4 keranjang umur berdasarkan nilai <code>age_days</code>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-800 block">Belum Jatuh Tempo</span>
                    <code className="text-[11px] text-emerald-600">age_days == 0</code>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-800 block">1 - 30 Hari</span>
                    <code className="text-[11px] text-amber-600">1 &lt;= age_days &lt;= 30</code>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="font-bold text-orange-800 block">31 - 60 Hari</span>
                    <code className="text-[11px] text-orange-600">31 &lt;= age_days &lt;= 60</code>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="font-bold text-rose-800 block">&gt; 60 Hari</span>
                    <code className="text-[11px] text-rose-600">age_days &gt; 60</code>
                  </div>
                </div>
              </div>

              {/* Formula 4 */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">4. Top 5 Vendor Terbesar</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800">Agregasi Vendor</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Akumulasi utang dikelompokkan berdasarkan nama vendor, kemudian diurutkan dari nilai terbesar ke terkecil:
                </p>
                <div className="bg-white p-2.5 rounded border border-gray-200 font-mono text-xs text-gray-800">
                  vendorTotals[vendorName] += primeOwing &rarr; sort_descending &rarr; take(5)
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
