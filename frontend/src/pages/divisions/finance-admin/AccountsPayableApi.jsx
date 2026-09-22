import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { DollarSign, AlertCircle, FileText, RefreshCw, Calendar, Clock, CreditCard, Award, Info, CheckCircle2, BookOpen, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import AsOfDateFilter from '../../../components/ui/AsOfDateFilter';
import DashboardLoader from '../../../components/ui/DashboardLoader';
import api from '../../../axios';
import Chart from 'react-apexcharts';

const getCurrencyCode = (currency) => {
  if (!currency) return 'OTHER';
  const c = currency.toLowerCase();
  if (c.includes('idr') || c.includes('rupiah')) return 'IDR';
  if (c.includes('usd') || c.includes('dollar')) return 'USD';
  if (c.includes('cny') || c.includes('yuan') || c.includes('rmb') || c.includes('renminbi')) return 'CNY';
  if (c.includes('eur') || c.includes('euro')) return 'EUR';
  if (c.includes('jpy') || c.includes('yen')) return 'JPY';
  if (c.includes('sgd')) return 'SGD';
  if (c.includes('gbp') || c.includes('pound')) return 'GBP';
  return currency.toUpperCase();
};

const getCurrencyFlag = (currency) => {
  if (!currency) return <span className="text-base leading-none">🏳️</span>;
  const c = currency.toLowerCase();
  let code = '';
  if (c.includes('idr') || c.includes('rupiah')) code = 'id';
  else if (c.includes('usd') || c.includes('dollar')) code = 'us';
  else if (c.includes('cny') || c.includes('yuan') || c.includes('rmb') || c.includes('renminbi')) code = 'cn';
  else if (c.includes('eur') || c.includes('euro')) code = 'eu';
  else if (c.includes('jpy') || c.includes('yen')) code = 'jp';
  else if (c.includes('sgd')) code = 'sg';
  else if (c.includes('gbp') || c.includes('pound')) code = 'gb';
  
  if (!code) return <span className="text-base leading-none">🏳️</span>;
  
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={code} 
      className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-300 shadow-xs shrink-0 inline-block align-middle" 
    />
  );
};

const formatCurrencyAmount = (amount, currency) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const num = Number(amount);
  const code = (currency || '').toUpperCase();
  if (code.includes('USD') || code.includes('DOLLAR')) return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (code.includes('CNY') || code.includes('YUAN') || code.includes('RMB')) return `¥ ${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (code.includes('EUR') || code.includes('EURO')) return `€ ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (code.includes('JPY') || code.includes('YEN')) return `¥ ${num.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (code.includes('SGD')) return `S$ ${num.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (code.includes('GBP')) return `£ ${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatFullMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const num = Number(amount);
  return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

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

export default function AccountsPayableApi({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Menyambungkan ke server Accurate...");
  
  const [asOfDate, setAsOfDate] = useState('');
  
  // Pagination, Filtering & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [globalSearch, setGlobalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });
  const [trendRange, setTrendRange] = useState(6);

  const uniqueVendors = useMemo(() => {
    if (!data?.invoices) return [];
    return [...new Set(data.invoices.map(inv => inv.vendor).filter(Boolean))].sort();
  }, [data?.invoices]);

  // Update Loading Message and Progress
  useEffect(() => {
    if (!isLoading) return;

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += (90 - progress) * 0.1; 
      setLoadingProgress(Math.floor(progress));
    }, 200);

    const messages = [
      "Menyambungkan ke server Accurate...",
      "Mendownload faktur terbaru...",
      "Memproses perhitungan umur utang...",
      "Menyiapkan grafik dan tabel..."
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
    setLoadingProgress(10);
    setLoadingMessage("Menyambungkan ke server Accurate...");
    try {
      let url = '/api/finance-dashboard/ap-api';
      if (asOfDate) {
        url += `?as_of_date=${asOfDate}`;
      }
      if (isRefresh) {
        url += (url.includes('?') ? '&' : '?') + 'refresh=true';
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(100);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [asOfDate]);

  const trendFilteredData = useMemo(() => {
    const raw = data?.payment_trend || [];
    if (!raw.length) return [];

    let maxDate = new Date();
    raw.forEach(item => {
      const dStr = item.date || item.period;
      if (dStr) {
        const d = new Date(dStr);
        if (!isNaN(d.getTime()) && d > maxDate) {
          maxDate = d;
        }
      }
    });

    const cutoff = new Date(maxDate);
    cutoff.setMonth(cutoff.getMonth() - Number(trendRange));
    const cutoffStr = cutoff.toISOString().substring(0, 10);

    const filtered = raw.filter(item => {
      const dStr = item.date || item.period;
      return dStr && dStr >= cutoffStr;
    });

    return filtered.length > 0 ? filtered : raw;
  }, [data?.payment_trend, trendRange]);

  if (isLoading) {
    return (
      <DashboardLoader 
        title="Live API Accounts Payable"
        message={loadingMessage}
        progress={loadingProgress}
        icon={Activity}
      />
    );
  }

  if (!data) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h3>
        <p className="text-gray-600 mb-4">Terjadi kesalahan saat menyambung ke API Accurate atau data kosong.</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // --- Calculations for Table ---
  const agingSeries = data.aging_chart?.map(item => item.value) || [];
  const agingLabels = data.aging_chart?.map(item => item.name) || [];

  const topVendorsSeries = [{
    name: 'Outstanding',
    data: data.top_vendors?.map(v => v.total) || []
  }];
  const topVendorsLabels = data.top_vendors?.map(v => v.vendor) || [];

  const paymentTrendSeries = [{
    name: 'Total Pembayaran',
    data: trendFilteredData.map(p => ({
      x: new Date(p.date || p.period).getTime(),
      y: Number(p.total ?? p.actual ?? 0)
    }))
  }];
  
  const paymentTrendTitle = trendRange === 1 ? 'Trend Pembayaran (1 Bulan Terakhir)' : `Trend Pembayaran (${trendRange} Bulan Terakhir)`;

  // Proyeksi Jatuh Tempo (6 Bulan Kedepan)
  const projectionMap = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    projectionMap[key] = { label, total: 0 };
  }

  (data.invoices || []).forEach(inv => {
    if (!inv.due_date) return;
    const key = inv.due_date.substring(0, 7); // YYYY-MM
    if (projectionMap[key]) {
      projectionMap[key].total += parseFloat(inv.outstanding_amount || 0);
    }
  });

  const projectionLabels = Object.values(projectionMap).map(p => p.label);
  const projectionSeries = [{
    name: 'Proyeksi Jatuh Tempo',
    data: Object.values(projectionMap).map(p => p.total)
  }];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Logic for Filtering and Sorting
  const filteredInvoices = (data.invoices || []).filter(inv => {
    if (statusFilter !== 'all') {
      const age = parseInt(inv.age_days || 0);
      if (statusFilter === 'not_due' && age > 0) return false;
      if (statusFilter === 'due_1_30' && (age < 1 || age > 30)) return false;
      if (statusFilter === 'due_31_60' && (age < 31 || age > 60)) return false;
      if (statusFilter === 'due_61_90' && (age < 61 || age > 90)) return false;
      if (statusFilter === 'due_90_plus' && age <= 90) return false;
    }

    if (vendorFilter !== 'all' && inv.vendor !== vendorFilter) {
      return false;
    }

    if (!globalSearch) return true;
    const term = globalSearch.toLowerCase();
    return (
      (inv.vendor || '').toLowerCase().includes(term) ||
      (inv.invoice_no || '').toLowerCase().includes(term) ||
      (inv.invoice_date || '').includes(term) ||
      (inv.due_date || '').includes(term)
    );
  }).sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded shadow-sm transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>,
        document.getElementById('page-header-actions') || document.body
      )}
      <AsOfDateFilter 
        asOfDate={asOfDate} 
        onChange={(date) => { setAsOfDate(date); setCurrentPage(1); }} 
      />
      {asOfDate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Info size={13} />
          <span>Menampilkan posisi akumulasi sisa utang <strong>Per Tanggal {asOfDate}</strong>. <button className="underline font-semibold ml-1 cursor-pointer" onClick={() => setAsOfDate('')}>Hapus filter (Kembali ke Hari Ini)</button>.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
        <KpiCard
          title="Total Outstanding AP"
          value={formatSimpleMoney(data.kpis?.total_outstanding)}
          icon={FileText}
          colorClass="text-primary bg-primary/10"
          subtitle="Total sisa utang saat ini"
        />
        <KpiCard
          title="Utang Jatuh Tempo"
          value={formatSimpleMoney(data.kpis?.total_overdue)}
          icon={Calendar}
          colorClass="text-danger bg-danger/10"
          subtitle="Tagihan melewati tempo"
        />
        <KpiCard
          title="Utang > 30 Hari"
          value={formatSimpleMoney(data.kpis?.total_utang_30_hari)}
          icon={Clock}
          colorClass="text-warning bg-warning/10"
          subtitle="Tagihan kritis >30 hari"
        />
        <KpiCard
          title="Pembayaran Bulan Ini"
          value={formatSimpleMoney(data.kpis?.pembayaran_bulan_ini)}
          icon={CreditCard}
          colorClass="text-success bg-success/10"
          subtitle="Total bayar bulan ini"
        />
        <KpiCard
          title="Vendor Terbesar"
          value={data.kpis?.vendor_terbesar ? formatSimpleMoney(data.kpis?.vendor_terbesar.total) : 'Rp 0'}
          icon={Award}
          colorClass="text-purple-600 bg-purple-100"
          subtitle={data.kpis?.vendor_terbesar?.name || '-'}
        />
      </div>

      {/* Row 1 - Aging, Payment Trend & Alerts/Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {/* Aging Donut Chart */}
        <ChartContainer title="Aging Utang" className="h-[315px]">
          <div className="h-full w-full flex items-center justify-center">
            {agingSeries.reduce((a,b)=>a+b, 0) > 0 ? (
              <Chart
                options={{
                  labels: agingLabels,
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                  plotOptions: {
                    pie: { donut: { size: '65%' } }
                  },
                  dataLabels: { enabled: false },
                  legend: {
                    position: 'bottom',
                    fontSize: '10px',
                    markers: { radius: 12 }
                  },
                  tooltip: {
                    y: { formatter: (val) => {
                      const total = agingSeries.reduce((a,b)=>a+b, 0);
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                      return `${formatFullMoney(val)} (${pct}%)`;
                    } }
                  }
                }}
                series={agingSeries}
                type="donut"
                height="100%"
              />
            ) : (
              <p className="text-gray-400 text-sm">Tidak ada data aging.</p>
            )}
          </div>
        </ChartContainer>

        {/* Payment Trend Line Chart */}
        <ChartContainer 
          title={paymentTrendTitle} 
          className="h-[315px]"
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
                chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
                colors: ['#3C50E0'],
                stroke: { curve: 'smooth', width: 2 },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.35,
                    opacityTo: 0.05,
                    stops: [0, 90, 100]
                  }
                },
                markers: {
                  size: 4,
                  hover: { size: 6 }
                },
                xaxis: { 
                  type: 'datetime',
                  labels: { 
                    style: { fontSize: '9px' },
                    datetimeUTC: false,
                    format: trendRange === 1 ? 'dd MMM' : 'MMM yyyy'
                  }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => formatSimpleMoney(val)
                  } 
                },
                dataLabels: { enabled: false },
                tooltip: {
                  x: { format: 'dd MMMM yyyy' },
                  y: { formatter: (val) => formatFullMoney(val) }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={paymentTrendSeries}
              type="area"
              height="100%"
            />
          </div>
        </ChartContainer>

        {/* Right Column Top - Peringatan & Ringkasan AP per Mata Uang */}
        <div className="flex flex-col gap-2 h-[315px]">
          {/* Peringatan */}
          <Card title="Peringatan" className="shrink-0">
            <div className="flex flex-col gap-1 p-0.5">
              {data.peringatan?.length > 0 ? data.peringatan.map((p, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${p.type === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                  <AlertCircle size={14} className="shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs leading-tight">{p.message}</span>
                    {p.sub_message && <span className="text-[10px] font-medium opacity-80 leading-tight">{p.sub_message}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 text-center py-1">Tidak ada peringatan.</p>
              )}
            </div>
          </Card>

          {/* Ringkasan AP per Mata Uang */}
          <Card title="Ringkasan AP per Mata Uang" className="flex-1 flex flex-col min-h-0">
            <div className="px-1 py-0.5">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-2.5 py-1.5 font-semibold">Mata Uang</th>
                    <th className="px-2.5 py-1.5 font-semibold text-right">Total Outstanding</th>
                    <th className="px-2.5 py-1.5 font-semibold text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.ringkasan_mata_uang?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="px-2.5 py-1.5 font-medium text-boxdark whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getCurrencyFlag(row.currency)}
                          <span>{getCurrencyCode(row.currency)}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium whitespace-nowrap">{formatCurrencyAmount(row.total, row.currency)}</td>
                      <td className="px-2.5 py-1.5 text-right font-medium whitespace-nowrap">{row.percentage}%</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-bold text-boxdark border-t border-gray-200">
                    <td className="px-2.5 py-1.5 whitespace-nowrap">Total Equivalent</td>
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap">Rp {parseFloat(data.kpis?.total_outstanding || 0).toLocaleString('id-ID')}</td>
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2 - Top Vendors, Proyeksi Jatuh Tempo & Aktivitas AP Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {/* Top Vendors Bar Chart */}
        <ChartContainer title="Top 5 Vendor (Sisa Utang)" className="h-[290px]">
          <div className="h-full w-full">
             <Chart
                options={{
                  chart: { toolbar: { show: false } },
                  colors: ['#3B82F6'], // Standard blue like PDF
                  plotOptions: {
                    bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } }
                  },
                  dataLabels: { 
                    enabled: true,
                    formatter: (val) => formatSimpleMoney(val),
                    offsetX: 30,
                    style: { fontSize: '9px', colors: ['#64748B'] }
                  },
                  xaxis: { categories: topVendorsLabels, labels: { show: false } },
                  yaxis: { labels: { style: { cssClass: 'text-[10px] font-medium truncate max-w-[120px]' } } },
                  grid: { show: false },
                  tooltip: {
                    y: { formatter: (val) => formatSimpleMoney(val) }
                  }
                }}
                series={topVendorsSeries}
                type="bar"
                height="100%"
              />
          </div>
        </ChartContainer>

        {/* Proyeksi Jatuh Tempo Chart */}
        <ChartContainer title="Proyeksi Jatuh Tempo (6 Bln)" className="h-[290px]">
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { toolbar: { show: false } },
                colors: ['#F59E0B'], // Amber
                plotOptions: {
                  bar: { borderRadius: 4, dataLabels: { position: 'top' } }
                },
                dataLabels: { 
                  enabled: true,
                  formatter: (val) => {
                    if(val === 0) return '';
                    if(val >= 1_000_000_000) return (val/1_000_000_000).toFixed(1) + 'M';
                    return (val/1_000_000).toFixed(0) + 'jt';
                  },
                  offsetY: -20,
                  style: { fontSize: '9px', colors: ['#64748B'] }
                },
                xaxis: { 
                  categories: projectionLabels,
                  labels: { style: { fontSize: '9px' } }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => {
                      if(val >= 1_000_000_000) return (val/1_000_000_000).toFixed(0) + 'M';
                      return (val/1_000_000).toFixed(0) + 'jt';
                    }
                  } 
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
                tooltip: {
                  y: { formatter: (val) => formatSimpleMoney(val) }
                }
              }}
              series={projectionSeries}
              type="bar"
              height="100%"
            />
          </div>
        </ChartContainer>

        {/* Aktivitas AP Terbaru */}
        <Card title="Aktivitas AP Terbaru" className="h-[290px] flex flex-col">
          <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto min-h-0">
            {data.aktivitas_terbaru?.length > 0 ? data.aktivitas_terbaru.map((act, i) => (
              <div key={i} className="flex flex-col border-b border-stroke py-3 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-gray-400 font-medium">{act.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-${act.color} bg-${act.color}/10`}>
                    {act.type}
                  </span>
                </div>
                <div className="flex justify-between items-end gap-2">
                  <span className="text-xs font-medium text-boxdark leading-tight line-clamp-2">{act.description}</span>
                  <span className="text-xs font-bold text-boxdark shrink-0">Rp {parseFloat(act.amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">Tidak ada aktivitas.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 4 - Table */}
      <Card 
        title="Daftar Faktur Belum Lunas" 
        className="mb-2"
        action={
          <div className="flex gap-2 items-center">
            <select 
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 outline-none focus:border-primary bg-white cursor-pointer text-gray-600 max-w-[150px] truncate"
              value={vendorFilter}
              onChange={e => {setVendorFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="all">Semua Vendor</option>
              {uniqueVendors.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select 
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 outline-none focus:border-primary bg-white cursor-pointer text-gray-600"
              value={statusFilter}
              onChange={e => {setStatusFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="all">Semua Status</option>
              <option value="not_due">Belum Jatuh Tempo</option>
              <option value="due_1_30">Jatuh Tempo (1-30 Hari)</option>
              <option value="due_31_60">Jatuh Tempo (31-60 Hari)</option>
              <option value="due_61_90">Jatuh Tempo (61-90 Hari)</option>
              <option value="due_90_plus">Jatuh Tempo (&gt;90 Hari)</option>
            </select>
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Cari vendor / invoice..." 
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:border-primary" 
                value={globalSearch} 
                onChange={e => {setGlobalSearch(e.target.value); setCurrentPage(1);}} 
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('vendor')}>
                  Vendor {sortConfig.key === 'vendor' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('invoice_no')}>
                  No. Faktur {sortConfig.key === 'invoice_no' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('invoice_date')}>
                  Tgl Faktur {sortConfig.key === 'invoice_date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('due_date')}>
                  Jatuh Tempo {sortConfig.key === 'due_date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('age_days')}>
                  Umur (Hari) {sortConfig.key === 'age_days' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('outstanding_amount')}>
                  Total Outstanding {sortConfig.key === 'outstanding_amount' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-boxdark">{inv.vendor}</td>
                    <td className="px-4 py-2">{inv.invoice_no}</td>
                    <td className="px-4 py-2">{inv.invoice_date}</td>
                    <td className="px-4 py-2">{inv.due_date}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        parseInt(inv.age_days || 0) > 0 
                          ? 'bg-danger/10 text-danger' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {parseInt(inv.age_days || 0) > 0 ? `${parseInt(inv.age_days)} hari` : 'Belum Tempo'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-primary">
                      Rp {parseFloat(inv.outstanding_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    Tidak ada data faktur yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-auto">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> hingga <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</span> dari <span className="font-medium">{filteredInvoices.length}</span> hasil
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="text-xs">Prev</span>
                    </button>
                    <span className="relative inline-flex items-center px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="text-xs">Next</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Card>


    </div>
  );
}
