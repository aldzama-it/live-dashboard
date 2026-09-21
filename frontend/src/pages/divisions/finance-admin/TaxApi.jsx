import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  Activity, 
  DollarSign, 
  RefreshCw, 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Info,
  AlertCircle
} from 'lucide-react';
import Chart from 'react-apexcharts';
import api from '../../../axios';
import DashboardLoader from '../../../components/ui/DashboardLoader';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import AsOfDateFilter from '../../../components/ui/AsOfDateFilter';

const formatSimpleMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const num = Number(amount);
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000_000) {
    const val = num / 1_000_000_000_000;
    const formatted = val % 1 === 0 ? val : val.toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted} T`;
  }
  if (absNum >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    const formatted = val % 1 === 0 ? val : val.toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted} M`;
  }
  if (absNum >= 1_000_000) {
    const val = num / 1_000_000;
    const formatted = val % 1 === 0 ? val : val.toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted} Jt`;
  }
  if (absNum >= 1_000) {
    const val = num / 1_000;
    const formatted = val % 1 === 0 ? val : val.toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted} Rb`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

export default function TaxApi({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Menyambungkan ke server Accurate...');
  const [asOfDate, setAsOfDate] = useState('');
  const [trendRange, setTrendRange] = useState(6);

  // Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [globalSearch, setGlobalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, Keluaran, Masukan
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Update Loading Message & Progress
  useEffect(() => {
    if (!isLoading) return;

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += (90 - progress) * 0.1;
      setLoadingProgress(Math.floor(progress));
    }, 200);

    const messages = [
      "Menyambungkan ke server Accurate...",
      "Mendownload faktur pajak penjualan (PPN Keluaran)...",
      "Mendownload faktur pajak pembelian (PPN Masukan)...",
      "Menghitung selisih Kurang/Lebih Bayar PPN..."
    ];
    let msgIndex = 0;
    const messageInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  const fetchDashboardData = async (isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);
    try {
      let url = '/api/tax-dashboard/api-summary?';
      if (asOfDate) url += `as_of_date=${asOfDate}&`;
      if (isRefresh) url += `refresh=true&`;

      const res = await api.get(url);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else if (res.data?.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Gagal memuat data Tax dari Accurate API');
      }
      setLoadingProgress(100);
    } catch (err) {
      console.error("Gagal mengambil data Live API Tax", err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyambungkan ke Accurate API');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [asOfDate]);

  // --- Filtering & Sorting Table (Hooks MUST be defined before early returns) ---
  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return [];
    return data.invoices.filter(inv => {
      const matchesSearch = 
        (inv.invoice_no || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
        (inv.entity || '').toLowerCase().includes(globalSearch.toLowerCase());
      
      let matchesType = true;
      if (typeFilter !== 'all') matchesType = inv.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [data?.invoices, globalSearch, typeFilter]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, sortConfig]);

  if (isLoading) {
    return (
      <DashboardLoader 
        title="Live API Tax Accurate"
        message={loadingMessage}
        progress={loadingProgress}
        icon={Activity}
      />
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full max-w-md bg-white p-6 rounded-xl border border-red-100 shadow-sm flex flex-col items-center gap-3 text-center">
          <AlertCircle className="text-rose-500" size={36} />
          <h3 className="text-base font-semibold text-gray-800">Gagal Memuat Data Live API</h3>
          <p className="text-xs text-gray-500">{error || 'Gagal terhubung ke server Accurate API'}</p>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded shadow-sm transition-colors cursor-pointer mt-2"
          >
            Coba Lagi (Retry Sync)
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };


  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = sortedInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading || !data) {
    return (
      <DashboardLoader 
        title="Live API Tax Accurate"
        message={loadingMessage}
        progress={loadingProgress}
        icon={Activity}
      />
    );
  }

  const summary = data.summary || { total_masukan: 0, total_keluaran: 0, net_ppn: 0, status: '-' };

  // --- Chart Data Preparation ---
  const slicedChartData = (data.chart_data || []).slice(-trendRange);
  const chartCategories = slicedChartData.map(c => c.name || c.month);
  const chartMasukan = slicedChartData.map(c => c.masukan || 0);
  const chartKeluaran = slicedChartData.map(c => c.keluaran || 0);

  return (
    <div className="flex flex-col gap-2 pb-2">
      {ReactDOM.createPortal(
        <div className="flex items-center gap-2">
          <Link
            to="/finance-admin/finance/accurate-guide"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded shadow-sm transition-colors"
          >
            <BookOpen size={14} />
            Panduan API
          </Link>
          <button
            onClick={() => fetchDashboardData(true)}
            title="Muat ulang data langsung dari Accurate API"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>,
        document.getElementById('page-header-actions') || document.body
      )}

      <AsOfDateFilter asOfDate={asOfDate} onChange={setAsOfDate} />

      {asOfDate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Info size={13} />
          <span>Menampilkan akumulasi PPN <strong>Per Tanggal {asOfDate}</strong>. <button className="underline font-semibold ml-1 cursor-pointer" onClick={() => setAsOfDate('')}>Hapus filter (Kembali ke Hari Ini)</button>.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        <KpiCard
          title="Total PPN Keluaran"
          value={formatSimpleMoney(summary.total_keluaran)}
          subtitle="VAT Out (Faktur Penjualan)"
          icon={TrendingUp}
          colorClass="text-[#10B981] bg-emerald-100"
        />

        <KpiCard
          title="Total PPN Masukan"
          value={formatSimpleMoney(summary.total_masukan)}
          subtitle="VAT In (Faktur Pembelian)"
          icon={FileText}
          colorClass="text-[#3C50E0] bg-blue-100"
        />

        <KpiCard
          title="Net PPN"
          value={formatSimpleMoney(Math.abs(summary.net_ppn))}
          subtitle="Selisih Masukan & Keluaran"
          icon={Activity}
          colorClass="text-[#F59E0B] bg-amber-100"
        />

        <KpiCard
          title="Status PPN"
          value={summary.status}
          subtitle="Kurang/Lebih Bayar Saat Ini"
          icon={DollarSign}
          colorClass={summary.net_ppn > 0 ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100"}
        />
      </div>

      {/* Monthly Chart & Tax Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        <ChartContainer 
          title={`Trend PPN Masukan vs Keluaran (${trendRange} Bulan Terakhir)`} 
          className="lg:col-span-2 h-[300px]"
          action={
            <select
              value={trendRange}
              onChange={(e) => setTrendRange(Number(e.target.value))}
              className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 outline-none focus:border-primary cursor-pointer font-medium"
            >
              <option value={1}>1 Bulan</option>
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={12}>12 Bulan</option>
            </select>
          }
        >
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { toolbar: { show: false } },
                colors: ['#3C50E0', '#10B981'],
                stroke: { curve: 'smooth', width: 2 },
                xaxis: { 
                  categories: chartCategories,
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '10px' },
                    formatter: (val) => `Rp ${(val / 1000000).toFixed(0)}M`
                  } 
                },
                legend: { position: 'top', fontSize: '11px' },
                dataLabels: { enabled: false },
                tooltip: {
                  y: { formatter: (val) => formatCurrency(val) }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={[
                { name: 'PPN Masukan (Pembelian)', data: chartMasukan },
                { name: 'PPN Keluaran (Penjualan)', data: chartKeluaran }
              ]}
              type="bar"
              height="100%"
            />
          </div>
        </ChartContainer>

        <Card title="Ringkasan Status Pajak" className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Status Kewajiban PPN:</p>
              <p className={`text-xl font-bold mt-1 ${summary.net_ppn > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {summary.status}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Dihitung dari PPN Keluaran ({formatCurrency(summary.total_keluaran)}) dikurangi PPN Masukan ({formatCurrency(summary.total_masukan)}).
              </p>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={14} className="text-blue-600" />
                <span>Informasi Integrasi API:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700">
                Data diambil langsung dari Sales & Purchase Invoices Accurate Online secara real-time.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax Invoices Data Table */}
      <Card title="Daftar Faktur Pajak Accurate (Penjualan & Pembelian)">
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cari no faktur, vendor, customer..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">Semua Tipe PPN</option>
              <option value="Keluaran">PPN Keluaran (Sales)</option>
              <option value="Masukan">PPN Masukan (Purchase)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase font-semibold border-y border-gray-100">
              <tr>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Tanggal <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('invoice_no')}>
                  <div className="flex items-center gap-1">No. Faktur <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1">Tipe PPN <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('entity')}>
                  <div className="flex items-center gap-1">Pelanggan / Pemasok <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subtotal')}>
                  <div className="flex items-center justify-end gap-1">DPP (Subtotal) <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('tax_amount')}>
                  <div className="flex items-center justify-end gap-1">Nilai PPN <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_amount')}>
                  <div className="flex items-center justify-end gap-1">Total Amounts <ArrowUpDown size={11} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">{inv.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-boxdark whitespace-nowrap">{inv.invoice_no}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.type === 'Keluaran' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 font-medium max-w-[200px] truncate">{inv.entity}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-700 whitespace-nowrap">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-boxdark whitespace-nowrap">{formatCurrency(inv.tax_amount)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(inv.total_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">Tidak ada faktur pajak yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Menampilkan {paginatedInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedInvoices.length)} dari {sortedInvoices.length} faktur</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-medium">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
