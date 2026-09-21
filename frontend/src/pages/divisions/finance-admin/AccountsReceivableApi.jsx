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

const formatFullMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const num = Number(amount);
  return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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

export default function AccountsReceivableApi({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: firstDay, endDate: lastDay });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [globalSearch, setGlobalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });

  const uniqueCustomers = useMemo(() => {
    if (!data?.invoices) return [];
    return [...new Set(data.invoices.map(inv => inv.customer).filter(Boolean))].sort();
  }, [data?.invoices]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/finance-dashboard/ar-api?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch AR Live API data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  if (isLoading || !data) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Menghubungkan & Memuat Data AR Live API Accurate...</p>
      </div>
    );
  }

  // --- Charts Data Preparation ---
  const agingSeries = data.aging_chart?.map(item => item.value) || [];
  const agingLabels = data.aging_chart?.map(item => item.name) || [];

  const topCustomersSeries = [{
    name: 'Sisa Piutang',
    data: data.top_customers?.map(item => item.total) || []
  }];
  const topCustomersLabels = data.top_customers?.map(item => item.name) || [];

  const paymentTrendSeries = [{
    name: 'Total Penerimaan',
    data: data.payment_trend?.map(item => item.total) || []
  }];
  const paymentTrendLabels = data.payment_trend?.map(item => item.label) || [];
  const paymentTrendTitle = data.payment_trend_title || "Trend Penerimaan (6 Bulan Terakhir)";

  // Projection labels & data
  const projectionLabels = [];
  const projectionSeriesData = [0, 0, 0, 0, 0, 0];
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    projectionLabels.push(`${monthsIndo[d.getMonth()]} ${d.getFullYear()}`);
  }

  if (data.invoices) {
    data.invoices.forEach(inv => {
      if (!inv.due_date) return;
      const dueDate = new Date(inv.due_date);
      for (let i = 0; i < 6; i++) {
        const targetMonth = (today.getMonth() + i) % 12;
        const targetYear = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
        if (dueDate.getMonth() === targetMonth && dueDate.getFullYear() === targetYear) {
          projectionSeriesData[i] += parseFloat(inv.outstanding_amount || 0);
          break;
        }
      }
    });
  }

  const projectionSeries = [{
    name: 'Proyeksi Jatuh Tempo',
    data: projectionSeriesData
  }];

  // --- Filtering & Sorting Table ---
  const filteredInvoices = (data.invoices || []).filter(inv => {
    const matchesSearch = 
      (inv.invoice_no && inv.invoice_no.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (inv.customer && inv.customer.toLowerCase().includes(globalSearch.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'overdue') matchesStatus = inv.age_days > 0;
    else if (statusFilter === 'current') matchesStatus = inv.age_days <= 0;

    let matchesCustomer = true;
    if (customerFilter !== 'all') matchesCustomer = inv.customer === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = sortedInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-stroke shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-boxdark">Accounts Receivable Dashboard (AR)</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Accurate Live API
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Monitoring piutang usaha, penerimaan pembayaran, dan aging piutang real-time via Accurate Online.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
          />
          <Link
            to="/finance-admin/finance/accurate-guide"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
          >
            <BookOpen size={14} />
            Panduan API
          </Link>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1 - KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <KpiCard
          title="Total Outstanding Piutang"
          value={formatSimpleMoney(data.kpis?.total_outstanding || 0)}
          icon={DollarSign}
          colorClass="text-emerald-600 bg-emerald-100"
          subtitle="Total Piutang Belum Lunas"
        />
        <KpiCard
          title="Overdue (Jatuh Tempo)"
          value={formatSimpleMoney(data.kpis?.total_overdue || 0)}
          icon={AlertCircle}
          colorClass="text-rose-600 bg-rose-100"
          subtitle="Melewati Tanggal Tempo"
        />
        <KpiCard
          title="Piutang > 30 Hari"
          value={formatSimpleMoney(data.kpis?.total_utang_30_hari || 0)}
          icon={Clock}
          colorClass="text-amber-600 bg-amber-100"
          subtitle="Manajemen Penagihan"
        />
        <KpiCard
          title="Penerimaan Bulan Ini"
          value={formatSimpleMoney(data.kpis?.pembayaran_bulan_ini || 0)}
          icon={CreditCard}
          colorClass="text-blue-600 bg-blue-100"
          subtitle="Kas Masuk Pelanggan"
        />
        <KpiCard
          title="Pelanggan Terbesar"
          value={formatSimpleMoney(data.kpis?.customer_terbesar?.total || 0)}
          icon={Award}
          colorClass="text-purple-600 bg-purple-100"
          subtitle={data.kpis?.customer_terbesar?.name || '-'}
        />
      </div>

      {/* Row 1 Charts & Summary (Aging, Trend, Peringatan & Ringkasan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {/* Aging Donut Chart */}
        <ChartContainer title="Aging Piutang" className="h-[290px]">
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
        <ChartContainer title={paymentTrendTitle} className="h-[290px]">
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { toolbar: { show: false } },
                colors: ['#10B981'],
                stroke: { curve: 'smooth', width: 2 },
                xaxis: { 
                  categories: paymentTrendLabels,
                  labels: { style: { fontSize: '9px' } }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => formatSimpleMoney(val)
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

        {/* Peringatan & Ringkasan Mata Uang */}
        <div className="flex flex-col gap-2 h-[290px]">
          {/* Peringatan */}
          <Card title="Peringatan" className="shrink-0">
            <div className="flex flex-col gap-2 p-2">
              {data.peringatan?.length > 0 ? data.peringatan.map((p, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded border ${p.type === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">{p.message}</span>
                    {p.sub_message && <span className="text-[10px] mt-0.5 font-medium opacity-80">{p.sub_message}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-500 text-center py-2">Tidak ada peringatan.</p>
              )}
            </div>
          </Card>

          {/* Ringkasan AR per Mata Uang */}
          <Card title="Ringkasan AR per Mata Uang" className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="px-2 py-1">
              <table className="w-full text-left text-xs text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 font-medium">Mata Uang</th>
                    <th className="px-2 py-1 font-medium text-right">Total Outstanding</th>
                    <th className="px-2 py-1 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ringkasan_mata_uang?.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-1 font-medium text-boxdark whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getCurrencyFlag(row.currency)}
                          <span>{getCurrencyCode(row.currency)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right whitespace-nowrap">Rp {parseFloat(row.total).toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1 text-right whitespace-nowrap">{row.percentage}%</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-bold text-boxdark">
                    <td className="px-2 py-1 whitespace-nowrap">Total</td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">Rp {parseFloat(data.kpis?.total_outstanding || 0).toLocaleString('id-ID')}</td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2 Charts & Activities (Top 5 Customers, Proyeksi Jatuh Tempo & Aktivitas AR) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {/* Top Customers Bar Chart */}
        <ChartContainer title="Top 5 Pelanggan (Sisa Piutang)" className="h-[290px]">
          <div className="h-full w-full">
             <Chart
                options={{
                  chart: { toolbar: { show: false } },
                  colors: ['#10B981'],
                  plotOptions: {
                    bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } }
                  },
                  dataLabels: { 
                    enabled: true,
                    formatter: (val) => formatSimpleMoney(val),
                    offsetX: 30,
                    style: { fontSize: '9px', colors: ['#64748B'] }
                  },
                  xaxis: { categories: topCustomersLabels, labels: { show: false } },
                  yaxis: { labels: { style: { cssClass: 'text-[10px] font-medium truncate max-w-[120px]' } } },
                  grid: { show: false },
                  tooltip: {
                    y: { formatter: (val) => formatSimpleMoney(val) }
                  }
                }}
                series={topCustomersSeries}
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

        {/* Aktivitas AR Terbaru */}
        <Card title="Aktivitas AR Terbaru" className="h-[290px] flex flex-col">
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

      {/* Row 3 - Table */}
      <Card 
        title="Daftar Faktur Piutang Belum Lunas (Accurate API)" 
        className="mb-2"
        action={
          <div className="flex gap-2 items-center">
            <select 
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 outline-none focus:border-primary bg-white cursor-pointer text-gray-600 max-w-[150px] truncate"
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Semua Pelanggan</option>
              {uniqueCustomers.map((cust, idx) => (
                <option key={idx} value={cust}>{cust}</option>
              ))}
            </select>
            <select 
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 outline-none focus:border-primary bg-white cursor-pointer text-gray-600"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Semua Status</option>
              <option value="overdue">Overdue (Jatuh Tempo)</option>
              <option value="current">Belum Tempo</option>
            </select>
            <input
              type="text"
              placeholder="Cari faktur / pelanggan..."
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 outline-none focus:border-primary w-36 sm:w-48"
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-stroke">
              <tr>
                <th className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('invoice_no')}>
                  No. Faktur {sortConfig.key === 'invoice_no' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('customer')}>
                  Pelanggan {sortConfig.key === 'customer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('invoice_date')}>
                  Tgl. Faktur {sortConfig.key === 'invoice_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('due_date')}>
                  Jatuh Tempo {sortConfig.key === 'due_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_amount')}>
                  Total Faktur {sortConfig.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('outstanding_amount')}>
                  Sisa Piutang {sortConfig.key === 'outstanding_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('age_days')}>
                  Umur (Hari) {sortConfig.key === 'age_days' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, i) => (
                  <tr key={i} className="border-b border-stroke hover:bg-gray-50 text-xs">
                    <td className="px-3 py-2 font-semibold text-boxdark">{inv.invoice_no}</td>
                    <td className="px-3 py-2 font-medium text-boxdark max-w-[200px] truncate" title={inv.customer}>{inv.customer}</td>
                    <td className="px-3 py-2">{inv.invoice_date || '-'}</td>
                    <td className="px-3 py-2">{inv.due_date || '-'}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatFullMoney(inv.total_amount)}</td>
                    <td className="px-3 py-2 text-right font-bold text-boxdark">{formatFullMoney(inv.outstanding_amount)}</td>
                    <td className="px-3 py-2 text-center font-medium">
                      {inv.age_days > 0 ? (
                        <span className="text-rose-600 font-semibold">{inv.age_days} hari</span>
                      ) : (
                        <span className="text-emerald-600">0 hari</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.age_days > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {inv.age_days > 0 ? 'OVERDUE' : 'CURRENT'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500 text-xs">
                    Tidak ada data faktur piutang yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 pt-3 border-t border-stroke text-xs text-gray-500 gap-2">
          <span>
            Menampilkan {paginatedInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} hingga {Math.min(currentPage * itemsPerPage, sortedInvoices.length)} dari {sortedInvoices.length} faktur
          </span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-medium text-boxdark">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
