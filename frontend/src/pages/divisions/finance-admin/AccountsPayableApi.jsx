import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { DollarSign, AlertCircle, FileText, RefreshCw, Calendar, Clock, CreditCard, Award, Info, CheckCircle2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';
import api from '../../../axios';
import Chart from 'react-apexcharts';

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
  
  return <img src={`https://flagcdn.com/w20/${code}.png`} width="20" alt={code} className="rounded-sm" />;
};

const formatSimpleMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const num = Number(amount);
  if (Math.abs(num) >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} Miliar`;
  }
  if (Math.abs(num) >= 1_000_000) {
    const val = num / 1_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} Juta`;
  }
  if (Math.abs(num) >= 1_000) {
    const val = num / 1_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} Ribu`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function AccountsPayableApi({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Menyambungkan ke server Accurate...");
  
  // Default: tidak ada filter tanggal, tampilkan SEMUA invoice OUTSTANDING
  // Jika user set filter tanggal, maka akan filter by transDate (tgl faktur)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  
  // Pagination, Filtering & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [globalSearch, setGlobalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });

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
    let messageIndex = 0;
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Jika ada filter tanggal, kirim sebagai query param (filter by transDate / tgl faktur)
      // Jika tidak ada, backend akan ambil SEMUA invoice OUTSTANDING (termasuk saldo lama)
      let url = '/api/finance-dashboard/ap-api';
      if (dateRange.startDate && dateRange.endDate) {
        url += `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
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
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        
        <div className="flex flex-col items-center gap-2 w-full max-w-md mt-4">
          <p className="text-gray-600 font-medium animate-pulse">{loadingMessage}</p>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 text-right w-full">{loadingProgress}%</p>
        </div>
      </div>
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
    data: data.payment_trend?.map(p => p.total) || []
  }];
  
  // Gunakan label format dari backend (bulanan/harian otomatis)
  const paymentTrendLabels = data.payment_trend?.map(p => p.label || p.period) || [];
  const paymentTrendTitle = data.payment_trend_title || 'Trend Pembayaran (6 Bulan Terakhir)';

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
      if (statusFilter === 'due_1_15' && (age < 1 || age > 15)) return false;
      if (statusFilter === 'due_16_30' && (age < 16 || age > 30)) return false;
      if (statusFilter === 'due_31_45' && (age < 31 || age > 45)) return false;
      if (statusFilter === 'due_46_60' && (age < 46 || age > 60)) return false;
      if (statusFilter === 'due_60_plus' && age <= 60) return false;
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
            onClick={fetchDashboardData}
            title="Muat ulang data langsung dari Accurate API"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded shadow-sm transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>,
        document.getElementById('page-header-actions') || document.body
      )}
      <DateRangeFilter 
        dateRange={dateRange} 
        onChange={(range) => { setDateRange(range); setCurrentPage(1); }} 
      />
      {dateRange.startDate && dateRange.endDate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Info size={13} />
          <span>Filter tanggal diterapkan pada <strong>Tgl Faktur</strong>. Invoice lama (Saldo Utang dari periode sebelumnya) tidak ditampilkan. <button className="underline font-semibold ml-1" onClick={() => setDateRange({ startDate: '', endDate: '' })}>Hapus filter</button> untuk melihat semua outstanding.</span>
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

      {/* Charts Section - Combined Row 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        
        {/* Left Columns */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          
          {/* Top Half (Aging & Trend) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Aging Donut Chart */}
            <ChartContainer title="Aging Utang" className="h-[300px]">
              <div className="h-full w-full flex items-center justify-center">
                {agingSeries.reduce((a,b)=>a+b, 0) > 0 ? (
                  <Chart
                    options={{
                      labels: agingLabels,
                      colors: ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444', '#991B1B'],
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
                          return `${formatSimpleMoney(val)} (${pct}%)`;
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
            <ChartContainer title={paymentTrendTitle} className="h-[300px]">
              <div className="h-full w-full">
                <Chart
                  options={{
                    chart: { toolbar: { show: false } },
                    colors: ['#3C50E0'],
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: { 
                      categories: paymentTrendLabels,
                      labels: { style: { fontSize: '9px' } }
                    },
                    yaxis: { 
                      labels: { 
                        style: { fontSize: '9px' },
                        formatter: (val) => 'Rp ' + (val/1_000_000).toFixed(0) + 'M' 
                      } 
                    },
                    dataLabels: { enabled: false },
                    tooltip: {
                      y: { formatter: (val) => formatSimpleMoney(val) }
                    },
                    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
                  }}
                  series={paymentTrendSeries}
                  type="area"
                  height="100%"
                />
              </div>
            </ChartContainer>
          </div>
          {/* Top Vendors Bar Chart */}
          <ChartContainer title="Top 5 Vendor (Sisa Utang)" className="h-[280px]">
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
          <ChartContainer title="Proyeksi Jatuh Tempo (6 Bln)" className="h-[280px]">
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
        </div>

        {/* Right Column (Alerts & Activities) */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          
          {/* Peringatan */}
          <Card title="Peringatan" className="shrink-0">
            <div className="flex flex-col gap-2 p-4">
              {data.peringatan?.length > 0 ? data.peringatan.map((p, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded border ${p.type === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">{p.message}</span>
                    {p.sub_message && <span className="text-[10px] mt-0.5 font-medium opacity-80">{p.sub_message}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">Tidak ada peringatan.</p>
              )}
            </div>
          </Card>

          {/* Ringkasan AP per Mata Uang */}
          <Card title="Ringkasan AP per Mata Uang" className="shrink-0">
            <div className="px-4 py-2">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-2 font-medium">Mata Uang</th>
                    <th className="px-2 py-2 font-medium text-right">Total Outstanding</th>
                    <th className="px-2 py-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ringkasan_mata_uang?.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-2 font-medium text-boxdark flex items-center gap-2">
                        <span className="text-base leading-none">{getCurrencyFlag(row.currency)}</span>
                        <span>{row.currency}</span>
                      </td>
                      <td className="px-2 py-2 text-right">Rp {parseFloat(row.total).toLocaleString('id-ID')}</td>
                      <td className="px-2 py-2 text-right">{row.percentage}%</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-bold text-boxdark">
                    <td className="px-2 py-2">Total</td>
                    <td className="px-2 py-2 text-right">Rp {parseFloat(data.kpis?.total_outstanding || 0).toLocaleString('id-ID')}</td>
                    <td className="px-2 py-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Aktivitas AP Terbaru */}
          <Card title="Aktivitas AP Terbaru" className="flex flex-col shrink-0">
            <div className="flex flex-col px-4 py-2 overflow-y-auto max-h-[350px]">
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
              <option value="due_1_15">Jatuh Tempo (1-15 Hari)</option>
              <option value="due_16_30">Jatuh Tempo (16-30 Hari)</option>
              <option value="due_31_45">Jatuh Tempo (31-45 Hari)</option>
              <option value="due_46_60">Jatuh Tempo (46-60 Hari)</option>
              <option value="due_60_plus">Jatuh Tempo (&gt;60 Hari)</option>
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
