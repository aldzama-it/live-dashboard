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
  Check,
  TrendingUp,
  DollarSign,
  Percent,
  PieChart,
  BarChart2,
  BookOpen,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import { Link } from 'react-router-dom';

export default function AccurateApiGuide() {
  const [activeTab, setActiveTab] = useState('dashboard-steps');
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState('all');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleApEndpoint = `GET https://zeus.accurate.id/accurate/api/purchase-invoice/list.do
Header:
  Authorization: Bearer <ACCURATE_API_TOKEN>
  X-Api-Timestamp: 22/09/2026 09:00:00
  X-Api-Signature: <BASE64_HMAC_SHA256>
  Accept: application/json
  X-Language-Profile: ID

Query Parameters:
  fields: id,number,vendor,transDate,dueDate,status,currency,totalAmount,primeOwing
  sp.pageSize: 100
  sp.page: 1
  filter.status.op: EQUAL
  filter.status.val: OUTSTANDING`;

  const sampleArEndpoint = `GET https://zeus.accurate.id/accurate/api/sales-invoice/list.do
Header:
  Authorization: Bearer <ACCURATE_API_TOKEN>
  X-Api-Timestamp: 22/09/2026 09:00:00
  X-Api-Signature: <BASE64_HMAC_SHA256>
  Accept: application/json

Query Parameters:
  fields: id,number,customer,transDate,dueDate,status,currency,totalAmount,primeOwing,subTotal,tax1Amount
  sp.pageSize: 100
  sp.page: 1`;

  const sampleTaxEndpoint = `GET https://zeus.accurate.id/accurate/api/sales-invoice/list.do
Query Parameters:
  fields: id,number,transDate,subTotal,tax1Amount,tax1Rate,status,customer,taxNumber
  sp.pageSize: 100

GET https://zeus.accurate.id/accurate/api/purchase-invoice/list.do
Query Parameters:
  fields: id,number,transDate,subTotal,taxable,tax1Amount,vendor,taxNumber
  sp.pageSize: 100`;

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live API Documentation & Explainability
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Accurate Online OpenAPI v1.4467
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Panduan Integrasi & Logika Pengolahan Data Accurate API</h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-3xl">
              Dokumentasi teknis menyeluruh yang menjelaskan secara transparan (*explainable*) setiap langkah, endpoint API, pemetaan field, kalkulasi matematika, serta logika pengolahan data untuk menampilkan seluruh chart di Dashboard Finansial.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/finance-admin/finance/financial-statement"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow flex items-center gap-1.5"
            >
              <Activity size={15} />
              Financial Statement Dashboard
            </Link>
            <a
              href="https://app.swaggerhub.com/apis/cpssoft/accurate-online_public_api/1.4467.1872#//api"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              SwaggerHub API
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2 gap-2 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('dashboard-steps')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard-steps'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} />
          Step-by-Step Pengolahan Chart Dashboard
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} />
          Arsitektur & Flow Sistem
        </button>
        <button
          onClick={() => setActiveTab('endpoint')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'endpoint'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Server size={16} />
          Katalog Endpoint API
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mapping'
              ? 'border-primary text-primary font-bold'
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
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator size={16} />
          Formula & Matematika Complete
        </button>
      </div>

      {/* TAB 1: STEP-BY-STEP PENGOLAHAN DASHBOARD & CHART (MAIN USER REQUEST) */}
      {activeTab === 'dashboard-steps' && (
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="text-primary" size={22} />
                  Dokumentasi Transparan Alur Data & Perhitungan Setiap Grafik
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Setiap modul dashboard menarik data mentah dari Accurate Online API, lalu melakukan transformasi logic di controller Laravel sebelum disajikan ke komponen React ApexCharts.
                </p>
              </div>
            </div>

            {/* DASHBOARD 1: ACCOUNTS PAYABLE (AP LIVE API) */}
            <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <h3 className="font-bold text-sm tracking-wide">1. Dashboard Accounts Payable (AP Live API)</h3>
                </div>
                <span className="text-xs font-mono bg-slate-700 px-2.5 py-1 rounded text-amber-300">
                  GET /api/finance-dashboard/ap-api
                </span>
              </div>

              <div className="p-5 bg-white space-y-6">
                {/* AP Endpoint Info */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Server size={14} />
                    Accurate API Endpoint: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-800 font-mono">GET /accurate/api/purchase-invoice/list.do</code>
                  </div>
                  <div className="text-slate-700">
                    <strong>Fields Dipanggil:</strong> <code className="font-mono bg-white px-1 text-slate-800">id, number, vendor, transDate, dueDate, status, currency, totalAmount, primeOwing</code>
                  </div>
                  <div className="text-slate-700">
                    <strong>Filter Utama:</strong> <code className="font-mono bg-white px-1 text-slate-800">filter.status.val = OUTSTANDING</code> (Hanya mengambil faktur yang belum lunas).
                  </div>
                </div>

                {/* Step Chart AP */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* AP KPI Cards */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" />
                      KPI Cards Utang
                    </h4>
                    <ul className="text-[11px] text-slate-700 space-y-1.5 list-disc pl-4">
                      <li><strong>Total Outstanding AP:</strong> Akumulasi nilai <code className="font-mono text-emerald-700">sum(primeOwing)</code> dari seluruh faktur berstatus OUTSTANDING.</li>
                      <li><strong>Overdue AP:</strong> Sum dari <code className="font-mono text-rose-700">primeOwing</code> faktur yang <code className="font-mono">dueDate &lt; hari_ini</code>.</li>
                      <li><strong>Total Invoices:</strong> Jumlah total lembar faktur utang terbuka.</li>
                    </ul>
                  </div>

                  {/* AP Chart 1 — Tren Utang */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-blue-600" />
                      Tren Utang Usaha (AP Trend)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Logic Smoothing & Agregasi:</strong></p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><strong>Filter &gt; 1 Bulan:</strong> Data dikelompokkan bulanan (<code className="font-mono">Y-m</code>) berdasarkan <code className="font-mono">transDate</code> dengan kurva ApexCharts spline.</li>
                        <li><strong>Filter &lt;= 1 Bulan:</strong> Data dikelompokkan harian (<code className="font-mono">Y-m-d</code>) secara kronologis.</li>
                      </ul>
                    </div>
                  </div>

                  {/* AP Chart 2 — Donut Aging */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <PieChart size={14} className="text-purple-600" />
                      Distribusi Aging Utang Usaha
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Hitung Umur (Aging Days):</strong></p>
                      <p className="font-mono bg-white p-1 rounded border border-slate-200 text-[10px]">age_days = diffInDays(today, dueDate)</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><span className="text-emerald-700 font-bold">Belum Jatuh Tempo:</span> <code className="font-mono">age_days &lt;= 0</code></li>
                        <li><span className="text-amber-700 font-bold">1 - 30 Hari:</span> <code className="font-mono">1 &lt;= age_days &lt;= 30</code></li>
                        <li><span className="text-orange-700 font-bold">31 - 60 Hari:</span> <code className="font-mono">31 &lt;= age_days &lt;= 60</code></li>
                        <li><span className="text-rose-700 font-bold">&gt; 60 Hari:</span> <code className="font-mono">age_days &gt; 60</code></li>
                      </ul>
                    </div>
                  </div>

                  {/* AP Chart 3 — Top 5 Vendor */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-indigo-600" />
                      Top 5 Vendor Utang Terbesar
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Agregasi Vendor Terbesar:</strong></p>
                      <p className="font-mono bg-white p-1 rounded border border-slate-200 text-[10px]">groupBy(vendor.name) &rarr; sum(primeOwing) &rarr; sortDesc &rarr; take(5)</p>
                      <p>Grafik horizontal bar menampilkan 5 pemasok utama dengan nilai tagihan tertinggi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD 2: ACCOUNTS RECEIVABLE (AR LIVE API) */}
            <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <h3 className="font-bold text-sm tracking-wide">2. Dashboard Accounts Receivable (AR Live API)</h3>
                </div>
                <span className="text-xs font-mono bg-slate-700 px-2.5 py-1 rounded text-emerald-300">
                  GET /api/finance-dashboard/ar-api
                </span>
              </div>

              <div className="p-5 bg-white space-y-6">
                {/* AR Endpoint Info */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Server size={14} />
                    Accurate API Endpoint: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-800 font-mono">GET /accurate/api/sales-invoice/list.do</code>
                  </div>
                  <div className="text-slate-700">
                    <strong>Fields Dipanggil:</strong> <code className="font-mono bg-white px-1 text-slate-800">id, number, customer, transDate, dueDate, status, currency, totalAmount, primeOwing</code>
                  </div>
                  <div className="text-slate-700">
                    <strong>Filter Utama:</strong> <code className="font-mono bg-white px-1 text-slate-800">filter.status.val = OUTSTANDING</code> (Hanya piutang yang belum dilunasi pelanggan).
                  </div>
                </div>

                {/* Step Chart AR */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* AR KPI Cards */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" />
                      KPI Cards Piutang
                    </h4>
                    <ul className="text-[11px] text-slate-700 space-y-1.5 list-disc pl-4">
                      <li><strong>Total Piutang Usaha:</strong> Akumulasi nilai <code className="font-mono text-emerald-700">sum(primeOwing)</code> dari semua faktur penjualan terbuka.</li>
                      <li><strong>Piutang Lewat Tempo:</strong> Total saldo piutang yang tanggal jatuhnya <code className="font-mono">&lt; hari_ini</code>.</li>
                      <li><strong>Total Invoices:</strong> Lembar faktur piutang terbuka.</li>
                    </ul>
                  </div>

                  {/* AR Chart 1 — Tren Piutang */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-600" />
                      Tren Piutang Usaha (AR Trend)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Logic Smoothing:</strong></p>
                      <p>Data piutang dikelompokkan secara kontinu tanpa ada bulan/hari yang bolong. ApexCharts mengaplikasikan <code className="font-mono text-blue-700">stroke.curve = 'smooth'</code> untuk menyajikan visual grafik tren yang halus dan estetik.</p>
                    </div>
                  </div>

                  {/* AR Chart 2 — Donut Aging Piutang */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <PieChart size={14} className="text-purple-600" />
                      Distribusi Aging Piutang Usaha
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p>Pengelompokkan umur piutang sama seperti AP ke dalam 4 keranjang (<code className="font-mono">Belum Jatuh Tempo</code>, <code className="font-mono">1-30 Hari</code>, <code className="font-mono">31-60 Hari</code>, <code className="font-mono">&gt; 60 Hari</code>) berdasarkan tanggal penagihan.</p>
                    </div>
                  </div>

                  {/* AR Chart 3 — Top 5 Customer */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-indigo-600" />
                      Top 5 Pelanggan Piutang Terbesar
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Agregasi Pelanggan Terbesar:</strong></p>
                      <p className="font-mono bg-white p-1 rounded border border-slate-200 text-[10px]">groupBy(customer.name) &rarr; sum(primeOwing) &rarr; sortDesc &rarr; take(5)</p>
                      <p>Menampilkan 5 pelanggan dengan outstanding piutang tertinggi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD 3: TAX LIVE API (PAJAK PPN & PPH) */}
            <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                  <h3 className="font-bold text-sm tracking-wide">3. Dashboard Tax Live API (PPN Keluaran, Masukan & PPh)</h3>
                </div>
                <span className="text-xs font-mono bg-slate-700 px-2.5 py-1 rounded text-blue-300">
                  GET /api/finance-dashboard/tax-api
                </span>
              </div>

              <div className="p-5 bg-white space-y-6">
                {/* Tax Endpoint Info */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Server size={14} />
                    Accurate API Endpoints Digunakan:
                  </div>
                  <ul className="list-disc pl-5 text-slate-800 space-y-0.5 font-mono">
                    <li>GET /accurate/api/sales-invoice/list.do (Fields: id, number, transDate, subTotal, tax1Amount, tax1Rate, status, customer, taxNumber)</li>
                    <li>GET /accurate/api/purchase-invoice/list.do (Fields: id, number, transDate, subTotal, taxable, tax1Amount, vendor, taxNumber)</li>
                    <li>GET /accurate/api/withholding-tax/list.do (Data Bukti Potong PPh)</li>
                  </ul>
                </div>

                {/* Step Chart Tax */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tax KPI Cards */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Calculator size={14} className="text-blue-600" />
                      KPI Metrik Perpajakan
                    </h4>
                    <ul className="text-[11px] text-slate-700 space-y-1.5 list-disc pl-4">
                      <li><strong>PPN Keluaran (PK):</strong> Akumulasi nilai <code className="font-mono text-blue-700">tax1Amount</code> dari Sales Invoices.</li>
                      <li><strong>PPN Masukan (PM):</strong> Akumulasi <code className="font-mono text-emerald-700">tax1Amount</code> dari Purchase Invoices.</li>
                      <li><strong>Net PPN (Kurang/Lebih Bayar):</strong> <code className="font-mono font-bold text-purple-700">Net = PPN Keluaran - PPN Masukan</code>.</li>
                      <li><strong>PPh Pemotongan:</strong> Total PPh Pasal 23 / 4(2) yang dipotong dari transaksi jasa.</li>
                    </ul>
                  </div>

                  {/* Tax Chart 1 — Comparison Bar */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-indigo-600" />
                      Komparasi PPN Keluaran vs PPN Masukan
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Grouped Bar Chart Bulanan:</strong></p>
                      <p>Menampilkan dua batang berdampingan per bulan: Batang Biru (PPN Keluaran) vs Batang Hijau (PPN Masukan) untuk memantau saldo PPN Kurang Bayar bulanan.</p>
                    </div>
                  </div>

                  {/* Tax NSFP & Table */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-600" />
                      Integrasi Nomor Seri Faktur Pajak (NSFP)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p>Field <code className="font-mono font-bold text-slate-900">taxNumber</code> dari Accurate API diekstrak dan divalidasi ke format 16-digit standar DJP e-Faktur. Tabel menyediakan pencarian berbasis NSFP dan Export CSV.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD 4: FINANCIAL STATEMENT & FINANCIAL RATIO DASHBOARD */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                  <h3 className="font-bold text-sm tracking-wide">4. Dashboard Financial Statement & Financial Ratio</h3>
                </div>
                <span className="text-xs font-mono bg-slate-700 px-2.5 py-1 rounded text-purple-300">
                  GET /api/finance-dashboard/financial-statement
                </span>
              </div>

              <div className="p-5 bg-white space-y-6">
                {/* Financial Statement Controller Logic */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Layers size={14} />
                    Logika Penyusunan Laporan Keuangan di Backend (FinancialStatementController.php):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                    <div className="bg-white p-2.5 rounded border border-purple-200 space-y-1">
                      <span className="font-bold text-purple-900 block">A. Income Statement (Laba Rugi)</span>
                      <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                        <li><strong>Revenue (Pendapatan):</strong> <code className="font-mono">sum(subTotal Sales Invoices)</code></li>
                        <li><strong>COGS (HPP):</strong> <code className="font-mono">sum(subTotal Purchase Invoices)</code></li>
                        <li><strong>Gross Profit:</strong> <code className="font-mono">Revenue - COGS</code></li>
                        <li><strong>OPEX (Beban Operasional):</strong> Est. <code className="font-mono">Revenue * 12%</code></li>
                        <li><strong>Operating Profit (EBIT):</strong> <code className="font-mono">Gross Profit - OPEX</code></li>
                        <li><strong>Net Profit:</strong> <code className="font-mono">Operating Profit * 0.89</code> (setelah pajak 11%)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-purple-200 space-y-1">
                      <span className="font-bold text-purple-900 block">B. Balance Sheet (Neraca Position)</span>
                      <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                        <li><strong>Aset Lancar:</strong> Kas & Bank (45% AR) + AR Outstanding + Persediaan (18% COGS).</li>
                        <li><strong>Aset Tetap:</strong> Est. <code className="font-mono">Current Assets * 1.5</code></li>
                        <li><strong>Total Aset:</strong> <code className="font-mono">Current Assets + Fixed Assets</code></li>
                        <li><strong>Liabilitas:</strong> AP Outstanding + Liabilitas Jangka Panjang (50% AP).</li>
                        <li><strong>Ekuitas Modal:</strong> <code className="font-mono">Total Assets - Total Liabilities</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step Charts Financial Statement */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Chart A — Revenue vs COGS */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-emerald-600" />
                      Perbandingan Revenue vs HPP (COGS)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Grouped Bar Chart Bulanan:</strong></p>
                      <p>Perbandingan omset penjualan (<code className="font-mono text-emerald-700">sum subTotal Sales</code>) vs beban pokok pembelian (<code className="font-mono text-rose-700">sum subTotal Purchase</code>) per bulan.</p>
                    </div>
                  </div>

                  {/* Chart B — Margin Trends */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-blue-600" />
                      Tren Margin Profitabilitas
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Multi-Line Chart Pergerakan Margin:</strong></p>
                      <p>Menampilkan 3 garis persentase margin secara historis: GPM (Hijau), OPM (Biru), dan NPM (Ungu) untuk memantau performa profitabilitas.</p>
                    </div>
                  </div>

                  {/* Chart 1 — Dual Stacked Column */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-purple-600" />
                      Posisi Keuangan (Aset, Kewajiban & Ekuitas)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Persamaan Dasar Akuntansi:</strong></p>
                      <p className="font-mono bg-white p-1 rounded border border-slate-200 text-center font-bold text-emerald-800">ASET = LIABILITAS + EKUITAS</p>
                      <p>Keseimbangan 2 grup stacked bar berdampingan: Batang Kiri (<code className="font-mono">group: 'aset'</code>) dan Batang Kanan (<code className="font-mono">group: 'passiva'</code>).</p>
                    </div>
                  </div>

                  {/* Chart 2 — Combo Net Cash Flow */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Activity size={14} className="text-blue-600" />
                      Arus Kas & Saldo Kas (Cash Flow)
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Combo Chart (Bar + Line):</strong></p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><strong>Bar Column (Biru):</strong> Net Cash Flow bulanan (<code className="font-mono">Revenue - COGS - OPEX</code>).</li>
                        <li><strong>Line Chart (Hijau):</strong> Akumulasi saldo akhir Kas & Bank (<code className="font-mono font-bold">Ending Cash Balance</code>).</li>
                      </ul>
                    </div>
                  </div>

                  {/* Chart 3 — Financial Ratio Dashboard */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Percent size={14} className="text-amber-600" />
                      Financial Ratio Dashboard
                    </h4>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <p><strong>Desain Tema Global Aplikasi:</strong></p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><strong>Soft Theme Pill Header (#3C50E0/10):</strong> Title kategori <code className="font-mono">Liquidity</code>, <code className="font-mono">Solvability</code>, <code className="font-mono">Activity</code>, <code className="font-mono">Profitability</code>.</li>
                        <li><strong>Value Badge Slate Design System:</strong> Menampilkan angka rasio di dalam badge <code className="font-mono">bg-slate-50 border-slate-200</code>.</li>
                        <li><strong>Sparkline Bar Chart + Benchmark Line:</strong> Bar emerald (#10B981) dengan garis target orange (#F97316) dan tag indikator <code className="font-mono text-emerald-700 font-bold">▲ Good</code> / <code className="font-mono text-emerald-700 font-bold">▼ Good</code>.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </Card>
        </div>
      )}

      {/* TAB 2: OVERVIEW & SYSTEM FLOW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-boxdark mb-3 flex items-center gap-2">
              <Layers className="text-primary" size={20} />
              Diagram Alur Data End-to-End
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Dashboard ini mengambil data transaksi secara langsung (*real-time*) melalui koneksi server-ke-server yang aman antara backend Laravel dan server Accurate Online.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-3">1</div>
                  <h4 className="font-bold text-gray-900 text-sm">Frontend Request</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    User membuka dashboard atau memilih tanggal di React filter, lalu mengirim HTTP GET request ke backend Laravel via Axios.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200/60 text-[11px] font-mono text-blue-700">
                  GET /api/finance-dashboard/*
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-3">2</div>
                  <h4 className="font-bold text-gray-900 text-sm">Auth & HMAC Signature</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Backend Laravel membuat Signature HMAC SHA-256 menggunakan Timestamp WIB dan API Secret Key, lalu menyusun header HTTP.
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
                    Server Accurate (<code>zeus.accurate.id</code>) mengembalikan data mentah JSON faktur (Sales/Purchase/Tax).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/60 text-[11px] font-mono text-purple-700">
                  *.do Public Endpoint
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">4</div>
                  <h4 className="font-bold text-gray-900 text-sm">Pengolahan & Cache</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Backend menghitung agregasi KPI, rasio, kurva tren, menyimpannya di Cache (300 dtk), dan mengirim JSON ke React.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-700">
                  Clean Dashboard Payload
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
                    Token yang digunakan adalah <strong>Database Session Token</strong> bawaan Accurate, sehingga tidak perlu login ulang atau memanggil <code>open-db.do</code> secara manual.
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
                  <h4 className="font-bold text-boxdark text-sm">Performa Cepat (Cache Smart)</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Data di-cache secara cerdas di server backend selama 5 menit untuk memastikan load time instan tanpa membebani limit rate pemanggilan API Accurate Cloud.
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
                  <h4 className="font-bold text-boxdark text-sm">Filter As Of Date Dinamis</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Mendukung perbandingan historis <strong>Per Tanggal (As of Date)</strong> untuk mengevaluasi saldo posisi keuangan pada periode tertentu di masa lalu.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: ENDPOINT & REQUEST CATALOG */}
      {activeTab === 'endpoint' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-boxdark flex items-center gap-2">
                <Server className="text-primary" size={20} />
                Format HTTP Request ke Accurate Online Public Cloud API
              </h3>
              <button
                onClick={() => copyToClipboard(sampleApEndpoint)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Tersalin!' : 'Salin Request AP'}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs overflow-x-auto mb-4">
              <pre>{sampleApEndpoint}</pre>
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
                    <th className="px-4 py-3 font-semibold text-gray-700">Keterangan Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">Authorization</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">Bearer aat.NTA.eyJ...</td>
                    <td className="px-4 py-2.5 text-gray-600">Token OAuth2 berisikan lisensi dan hak akses database usaha.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">X-Api-Timestamp</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">22/09/2026 09:00:00</td>
                    <td className="px-4 py-2.5 text-gray-600">Format tanggal jam <code>dd/MM/yyyy HH:mm:ss</code> dalam zona Asia/Jakarta (WIB).</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">X-Api-Signature</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">q9tZ...=</td>
                    <td className="px-4 py-2.5 text-gray-600">Hash Keamanan: <code>base64_encode(hash_hmac('sha256', timestamp, secret, true))</code>.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-primary font-semibold">Accept</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600">application/json</td>
                    <td className="px-4 py-2.5 text-gray-600">Wajib agar server Accurate tidak merespon dalam bentuk HTML redirect.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: KAMUS DATA (FIELD MAPPING) */}
      {activeTab === 'mapping' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-boxdark mb-2 flex items-center gap-2">
            <Database className="text-primary" size={20} />
            Kamus Data Pemetaan Field: Accurate Online API vs Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tabel korespondensi lengkap antara nama kolom asli pada response JSON Accurate Online API dengan properti yang diproses di Dashboard.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Field Accurate API</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Tipe Data</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Field Dashboard</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Fungsi Utama di Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3 font-mono font-bold text-amber-900">primeOwing</td>
                  <td className="px-4 py-3 font-mono text-gray-600">Float</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">outstanding_amount</td>
                  <td className="px-4 py-3 text-gray-700">
                    <strong>Sisa saldo utang/piutang faktur</strong> dalam mata uang asli transaksi. Digunakan untuk menghitung Total Outstanding AP/AR, Aging, dan Top Vendor/Customer.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">subTotal</td>
                  <td className="px-4 py-3 font-mono text-gray-600">Float</td>
                  <td className="px-4 py-3 font-mono text-gray-700">dpp_amount / revenue / cogs</td>
                  <td className="px-4 py-3 text-gray-600">Nilai DPP (Dasar Pengenaan Pajak) sebelum pajak PPN. Digunakan dalam kalkulasi Revenue Laba Rugi dan DPP e-Faktur.</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="px-4 py-3 font-mono font-bold text-blue-900">tax1Amount</td>
                  <td className="px-4 py-3 font-mono text-gray-600">Float</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">ppn_amount</td>
                  <td className="px-4 py-3 text-gray-700">
                    <strong>Nominal PPN (11%)</strong> yang terutang pada faktur penjualan (PPN Keluaran) atau faktur pembelian (PPN Masukan).
                  </td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3 font-mono font-bold text-amber-900">transDate</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String (d/m/Y)</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">invoice_date</td>
                  <td className="px-4 py-3 text-gray-700">
                    <strong>Tanggal faktur diterbitkan</strong>. Diparsing dari format Accurate (misal <code>22/09/2026</code>) ke format ISO <code>2026-09-22</code> untuk agregasi tren bulanan/harian.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">dueDate</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String (d/m/Y)</td>
                  <td className="px-4 py-3 font-mono text-gray-700">due_date</td>
                  <td className="px-4 py-3 text-gray-600">Tanggal batas akhir pembayaran untuk menghitung selisih keterlambatan (<code className="font-mono">age_days</code>).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">taxNumber</td>
                  <td className="px-4 py-3 font-mono text-gray-600">String</td>
                  <td className="px-4 py-3 font-mono text-gray-700">nsfp_number</td>
                  <td className="px-4 py-3 text-gray-600">Nomor Seri Faktur Pajak 16-digit standar DJP untuk pelaporan Pajak.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: FORMULA & MATEMATIKA COMPLETE */}
      {activeTab === 'formula' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-boxdark mb-2 flex items-center gap-2">
              <Calculator className="text-primary" size={20} />
              Formula Matematika & Aturan Pengolahan Data Transparan
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Berikut adalah seluruh rincian rumus matematika dan logika yang dieksekusi oleh backend Laravel:
            </p>

            <div className="space-y-6">
              {/* Formula 1: Accounting Ratios */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">1. Formula Rasio Keuangan Dashboard</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Standar Akuntansi</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Current Ratio:</strong> Current Assets / Current Liabilities <span className="text-emerald-700 font-bold">(Target Benchmark: 2,00)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Quick Ratio:</strong> (Current Assets - Inventory) / Current Liabilities <span className="text-emerald-700 font-bold">(Target: 1,00)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Debt to Asset Ratio (DAR):</strong> Total Liabilities / Total Assets <span className="text-blue-700 font-bold">(Target: 0,50 - Lower Good)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Debt to Equity Ratio (DER):</strong> Total Liabilities / Total Equity <span className="text-blue-700 font-bold">(Target: 1,00 - Lower Good)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Gross Profit Margin (GPM):</strong> (Gross Profit / Sales) * 100% <span className="text-emerald-700 font-bold">(Target: 35%)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-gray-200 font-mono">
                    <strong>Net Profit Margin (NPM):</strong> (Net Profit / Sales) * 100% <span className="text-emerald-700 font-bold">(Target: 15%)</span>
                  </div>
                </div>
              </div>

              {/* Formula 2: Trend Curve Smoothing */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">2. Logika Chart Smoothing & Agregasi Periode</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">Visualisasi ApexCharts</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Untuk menghindari grafik patah-patah ketika rentang filter lebih dari 30 hari:
                </p>
                <div className="bg-white p-3 rounded border border-gray-200 font-mono text-xs space-y-1">
                  <div>1. Backend mengelompokkan data berdasarkan tahun-bulan (<code className="text-primary font-bold">Y-m</code>) secara kontinu.</div>
                  <div>2. Setiap bulan yang tidak memiliki transaksi diisi dengan angka 0 (tidak ada data bolong).</div>
                  <div>3. ApexCharts mengaplikasikan interpolasi kurva halus: <code className="text-blue-600 font-bold">stroke: &#123; curve: 'smooth' &#125;</code>.</div>
                </div>
              </div>

              {/* Formula 3: Criteria Good vs Warning Documentation Table */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-gray-900">3. Kriteria Penilaian "Good" vs "Warning" Pada Financial Ratio Dashboard</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Standar Evaluasi Finansial</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Setiap rasio keuangan dievaluasi secara otomatis berdasarkan nilai ambang (*target benchmark*) dan arah idealnya (*Higher is Better* vs *Lower is Better*):
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="px-3 py-2 font-bold text-slate-700">Nama Rasio</th>
                        <th className="px-3 py-2 font-bold text-slate-700">Target Benchmark</th>
                        <th className="px-3 py-2 font-bold text-slate-700">Kriteria Status 'Good'</th>
                        <th className="px-3 py-2 font-bold text-slate-700">Penjelasan & Alasan Akuntansi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Current Ratio</td>
                        <td className="px-3 py-2 font-mono text-slate-700">2.00 times</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 2.00</td>
                        <td className="px-3 py-2 text-slate-600">Aset lancar minimal 2x lipat dari liabilitas lancar (likuiditas sangat aman untuk melunasi utang jangka pendek).</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Quick Ratio</td>
                        <td className="px-3 py-2 font-mono text-slate-700">1.00 times</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 1.00</td>
                        <td className="px-3 py-2 text-slate-600">Aset sangat lancar (tanpa persediaan) mampu mencukupi 100% kewajiban lancar.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Debt to Asset Ratio (DAR)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">0.50 times (50%)</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≤ 0.50 (▼ Good)</td>
                        <td className="px-3 py-2 text-slate-600">Semakin rendah semakin baik. Menandakan total utang tidak melebihi 50% dari total aset perusahaan.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Debt to Equity Ratio (DER)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">1.00 times (100%)</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≤ 1.00 (▼ Good)</td>
                        <td className="px-3 py-2 text-slate-600">Semakin rendah semakin baik. Menandakan utang perusahaan tidak melebihi modal ekuitas milik sendiri.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Total Asset Turnover</td>
                        <td className="px-3 py-2 font-mono text-slate-700">1.00 times</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 1.00</td>
                        <td className="px-3 py-2 text-slate-600">Perusahaan efektif dalam menggunakan seluruh asetnya untuk menghasilkan pendapatan penjualan.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Fixed Asset Turnover</td>
                        <td className="px-3 py-2 font-mono text-slate-700">2.00 times</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 2.00</td>
                        <td className="px-3 py-2 text-slate-600">Aset tetap/peralatan memberikan kontribusi produktivitas tinggi terhadap omset penjualan.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Gross Profit Margin (GPM)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">35.00%</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 35%</td>
                        <td className="px-3 py-2 text-slate-600">Margin laba kotor di atas 35% menunjukkan efisiensi beban HPP (COGS) dan pricing power yang sehat.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Operating Profit Margin (OPM)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">20.00%</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 20%</td>
                        <td className="px-3 py-2 text-slate-600">Efisiensi operasional tinggi (OPEX terjaga baik dibanding omset pendapatan).</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Net Profit Margin (NPM)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">15.00%</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 15%</td>
                        <td className="px-3 py-2 text-slate-600">Profit bersih akhir yang dikembalikan ke pemegang saham di atas 15% dari total penjualan.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Return On Assets (ROA)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">10.00%</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 10%</td>
                        <td className="px-3 py-2 text-slate-600">Kemampuan manajemen dalam menghasilkan laba bersih dari total kekayaan/aset sangat tinggi.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Return On Equity (ROE)</td>
                        <td className="px-3 py-2 font-mono text-slate-700">20.00%</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700 bg-emerald-50">Nilai ≥ 20%</td>
                        <td className="px-3 py-2 text-slate-600">Tingkat pengembalian imbal hasil atas investasi ekuitas pemilik modal melebihi 20%.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
