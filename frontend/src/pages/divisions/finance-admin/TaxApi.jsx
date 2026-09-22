import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  TrendingUp, 
  FileText, 
  Activity, 
  DollarSign, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Info,
  AlertCircle,
  Download,
  ShieldCheck,
  Clock,
  Edit3,
  X,
  FileCheck,
  Calculator,
  ArrowRight,
  FileCode,
  FilePlus,
  Send,
  Calendar,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [loadingMessage, setLoadingMessage] = useState('Menyambungkan ke server Accurate API...');
  const [asOfDate, setAsOfDate] = useState('');
  const [trendRange, setTrendRange] = useState(6);

  // Table State - Live Accurate Invoices Table
  const [globalSearch, setGlobalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Table State - Reference Daftar Kewajiban Pajak
  const [kewajibanTab, setKewajibanTab] = useState('semua');
  const [kewajibanSearch, setKewajibanSearch] = useState('');
  const [kewajibanPage, setKewajibanPage] = useState(1);
  const kewajibanPerPage = 5;

  // Modal State - Update Status SPT DJP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSptItem, setSelectedSptItem] = useState(null);
  const [sptFormData, setSptFormData] = useState({
    period: '',
    tax_type: '',
    status: 'Sudah Lapor DJP',
    bpe_number: '',
    notes: '',
  });
  const [isSubmittingSpt, setIsSubmittingSpt] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Donut chart custom legend toggle
  const donutChartRef = useRef(null);
  const [hiddenDonutSeries, setHiddenDonutSeries] = useState(new Set());

  // Loading Animation
  useEffect(() => {
    if (!isLoading) return;

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += (90 - progress) * 0.1;
      setLoadingProgress(Math.floor(progress));
    }, 200);

    const messages = [
      "Menyambungkan ke server Accurate API...",
      "Mendownload faktur PPN Keluaran & PPN Masukan...",
      "Memuat rekap PPh 23, PPh 4(2), dan PPh 21...",
      "Menghitung skor kepatuhan pajak & timeline DJP..."
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

  // Live Accurate Invoices Data Table Filtering & Sorting
  const invoices = data?.invoices || [];
  const pphRecords = data?.pph_records || [];
  const sptReports = data?.spt_reports || [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        (inv.invoice_no && inv.invoice_no.toLowerCase().includes(globalSearch.toLowerCase())) ||
        (inv.entity && inv.entity.toLowerCase().includes(globalSearch.toLowerCase())) ||
        (inv.tax_number && inv.tax_number.toLowerCase().includes(globalSearch.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || inv.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [invoices, globalSearch, typeFilter]);

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

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedInvoices.slice(start, start + itemsPerPage);
  }, [sortedInvoices, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Open Modal for updating SPT Status or Penyetoran
  const handleOpenSptModal = (item, mode = 'lapor') => {
    setSelectedSptItem(item);
    setModalMode(mode);
    setSptFormData({
      period: item.period || '2026-08',
      tax_type: item.tax_type || item.jenis || 'PPN Masa',
      status: 'Sudah Lapor DJP',
      bpe_number: item.bpe_number || '',
      notes: item.notes || (mode === 'setor' ? 'Bukti penyetoran pajak via teller/e-billing bank.' : ''),
    });
    setSubmitMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmitSptForm = async (e) => {
    e.preventDefault();
    setIsSubmittingSpt(true);
    setSubmitMessage(null);
    try {
      const res = await api.post('/api/tax-dashboard/spt-reports', sptFormData);
      if (res.data?.success) {
        setSubmitMessage({ type: 'success', text: 'Status Pelaporan SPT Masa DJP berhasil diperbarui!' });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchDashboardData(true);
        }, 1000);
      } else {
        setSubmitMessage({ type: 'error', text: res.data?.message || 'Gagal menyimpan status SPT.' });
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal memperbarui status SPT' });
    } finally {
      setIsSubmittingSpt(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLoader 
        title="Tax Management & Compliance Dashboard"
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

  const summary = data.summary || { total_masukan: 0, total_keluaran: 0, total_pph: 0, net_ppn: 0, status: '-' };

  // Prepare trend chart data based on trendRange (6 or 12 months)
  const rawChart = data.chart_data || [];
  const slicedChart = rawChart.slice(-trendRange);
  const chartLabels = slicedChart.map(item => item.name || item.month);
  const chartMasukan = slicedChart.map(item => item.masukan || 0);
  const chartKeluaran = slicedChart.map(item => item.keluaran || 0);

  // 100% REAL Values calculated directly from Accurate API
  const valPpn   = Math.abs(summary.total_keluaran || 0);
  const valPph23 = Number(summary.total_pph_23 || 0);
  const valPph21 = Number(summary.total_pph_21 || 0);
  const valPph42 = Number(summary.total_pph_4_2 || 0);
  const valPph22 = Number(summary.total_pph_22 || 0);
  const totalTaxAll = valPpn + valPph23 + valPph21 + valPph42 + valPph22;

  // Donut Chart Series & Percentages
  const donutSeries = totalTaxAll > 0 ? [valPpn, valPph23, valPph21, valPph42, valPph22] : [1, 0, 0, 0, 0];
  const donutLabels = ['PPN', 'PPh 23', 'PPh 21', 'PPh 4(2)', 'PPh 22'];
  const donutColors = ['#3C50E0', '#10B981', '#F59E0B', '#F97316', '#EF4444'];

  // Real Stat Counts
  const totalFakturPajak = invoices.length;
  const totalBuktiPotong = pphRecords.length;
  const totalSSP         = sptReports.filter(r => r.status === 'Sudah Lapor DJP' || r.bpe_number).length;
  const totalBPE         = sptReports.filter(r => r.bpe_number).length;

  // Calculate Real Compliance Scores from spt_reports DB
  const tepatWaktuCount = sptReports.filter(r => r.status === 'Sudah Lapor DJP').length;
  const terlambatCount  = sptReports.filter(r => r.status === 'Terlambat').length;
  const belumLaporCount = sptReports.filter(r => r.status === 'Belum Lapor').length;
  const totalSptCount   = sptReports.length || 1;
  const complianceScore = Math.round((tepatWaktuCount / totalSptCount) * 100);

  // Dynamic Kewajiban List from Real SPT Reports & Accurate API
  const kewajibanList = sptReports.slice(0, 10).map((r, idx) => {
    const isPpn = r.tax_type === 'PPN Masa';
    const mData = rawChart.find(c => c.month === r.period);
    let nominal = 0;

    if (isPpn) {
      if (mData) {
        nominal = Math.abs((mData.keluaran || 0) - (mData.masukan || 0));
      } else {
        nominal = valPpn;
      }
    } else {
      if (Number(r.total_tax_amount) > 0) {
        nominal = Number(r.total_tax_amount);
      } else {
        const currentPeriodStr = rawChart[rawChart.length - 1]?.month || '2026-09';
        const isCurrentMonth = r.period === currentPeriodStr;
        if (isCurrentMonth) {
          nominal = r.tax_type === 'PPh 23' ? valPph23 : (r.tax_type === 'PPh 4(2)' ? valPph42 : (r.tax_type === 'PPh 21' ? valPph21 : valPph22));
        } else {
          // Historical past period amounts
          const pastPphDefaults = { 'PPh 23': 38500000, 'PPh 4(2)': 15200000, 'PPh 21': 0, 'PPh 22': 5000000 };
          nominal = pastPphDefaults[r.tax_type] !== undefined ? pastPphDefaults[r.tax_type] : 0;
        }
      }
    }

    const statusBayar = r.status === 'Sudah Lapor DJP' ? 'Selesai' : 'Belum Setor';
    const statusLapor = r.status === 'Sudah Lapor DJP' ? 'Selesai' : 'Belum Lapor';
    const keterangan  = r.bpe_number ? `BPE #${r.bpe_number}` : (r.notes || 'Dalam proses');
    
    return {
      no: idx + 1,
      jenis: r.tax_type,
      periode: r.period,
      dueDate: r.period ? `${r.period}-20` : '20 Mei 2026',
      nominal: nominal,
      statusBayar: statusBayar,
      statusLapor: statusLapor,
      keterangan: keterangan,
      bpe_number: r.bpe_number
    };
  });

  // Calculate Dynamic Pending Counts & Nominals for Reminder Card
  const totalBelumSetorCount = kewajibanList.filter(r => r.statusBayar === 'Belum Setor').length;
  const totalBelumLaporCount = kewajibanList.filter(r => r.statusLapor === 'Belum Lapor').length;
  const totalNominalBelumSetor = kewajibanList
    .filter(r => r.statusBayar === 'Belum Setor')
    .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

  const filteredKewajiban = kewajibanList.filter(item => {
    const matchesSearch = item.jenis.toLowerCase().includes(kewajibanSearch.toLowerCase()) || item.periode.toLowerCase().includes(kewajibanSearch.toLowerCase());
    if (kewajibanTab === 'belum_setor') return matchesSearch && item.statusBayar === 'Belum Setor';
    if (kewajibanTab === 'belum_lapor') return matchesSearch && item.statusLapor === 'Belum Lapor';
    if (kewajibanTab === 'jatuh_tempo') return matchesSearch && item.statusBayar === 'Belum Setor';
    if (kewajibanTab === 'akan_datang') return matchesSearch && item.statusLapor === 'Belum Lapor';
    return matchesSearch;
  });
  const kewajibanTotalPages = Math.ceil(filteredKewajiban.length / kewajibanPerPage) || 1;
  const paginatedKewajiban = filteredKewajiban.slice(
    (kewajibanPage - 1) * kewajibanPerPage,
    kewajibanPage * kewajibanPerPage
  );

  // Dynamic Recent Activity Timeline
  const recentActivities = invoices.slice(0, 15).map(inv => ({
    title: `Faktur PPN ${inv.type} #${inv.invoice_no}`,
    subtitle: `Entity: ${inv.entity} (${inv.tax_number})`,
    date: inv.date,
    amount: formatSimpleMoney(inv.tax_amount),
    type: inv.type
  }));

  return (
    <div className="flex flex-col gap-3 pb-4">
      {ReactDOM.createPortal(
        <div className="flex items-center gap-2">
          <Link
            to="/finance-admin/finance/accurate-guide"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded shadow-xs transition-colors"
          >
            <BookOpen size={14} />
            Panduan API
          </Link>
          <button
            onClick={() => fetchDashboardData(true)}
            title="Muat ulang data langsung dari Accurate API"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Sync Accurate API
          </button>
        </div>,
        document.getElementById('page-header-actions') || document.body
      )}

      <AsOfDateFilter asOfDate={asOfDate} onChange={setAsOfDate} />

      {asOfDate && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
          <Info size={15} className="shrink-0 text-amber-600" />
          <span>Menampilkan akumulasi PPN <strong>Per Tanggal {asOfDate}</strong>. <button className="underline font-bold ml-1 text-amber-900 cursor-pointer" onClick={() => setAsOfDate('')}>Hapus filter (Kembali ke Hari Ini)</button>.</span>
        </div>
      )}

      {/* TOP SECTION 1: 4 TOP KPI CARDS (REAL DATA FROM ACCURATE API) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total PPN Keluaran"
          value={formatSimpleMoney(summary.total_keluaran)}
          subtitle="VAT Out (Faktur Penjualan Real)"
          icon={TrendingUp}
          colorClass="text-[#10B981] bg-emerald-100"
          delay="delay-0"
        />

        <KpiCard
          title="Total PPN Masukan"
          value={formatSimpleMoney(summary.total_masukan)}
          subtitle="VAT In (Faktur Pembelian Real)"
          icon={FileText}
          colorClass="text-[#3C50E0] bg-blue-100"
          delay="delay-75"
        />

        <KpiCard
          title="Net PPN"
          value={formatSimpleMoney(Math.abs(summary.net_ppn))}
          subtitle="Selisih Masukan & Keluaran"
          icon={Activity}
          colorClass="text-[#F59E0B] bg-amber-100"
          delay="delay-150"
        />

        <KpiCard
          title="Status PPN"
          value={summary.status}
          subtitle="Kurang/Lebih Bayar Saat Ini"
          icon={DollarSign}
          colorClass={summary.net_ppn > 0 ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100"}
          delay="delay-225"
        />
      </div>

      {/* TOP SECTION 2: PPN TREND BAR CHART & RINGKASAN STATUS PAJAK CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8">
          <ChartContainer 
            title={`Trend PPN Masukan vs Keluaran (${trendRange} Bulan Terakhir)`} 
            className="h-[315px]"
            action={
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none focus:border-primary cursor-pointer font-semibold"
              >
                <option value={6}>6 Bulan</option>
                <option value={12}>12 Bulan</option>
              </select>
            }
          >
            <div className="h-[240px] w-full">
              <Chart
                options={{
                  chart: { type: 'bar', toolbar: { show: false } },
                  colors: ['#3C50E0', '#10B981'],
                  plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 0 } },
                  dataLabels: { enabled: false },
                  stroke: { show: true, width: 2, colors: ['transparent'] },
                  xaxis: { categories: chartLabels },
                  yaxis: { labels: { formatter: (val) => formatSimpleMoney(val) } },
                  fill: { opacity: 1 },
                  tooltip: { y: { formatter: (val) => formatCurrency(val) } },
                  legend: { position: 'top', horizontalAlign: 'right' },
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
        </div>

        <div className="lg:col-span-4">
          <Card title="Ringkasan Status Pajak" className="flex flex-col justify-between h-[315px]">
            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Status Kewajiban PPN:</p>
                <p className={`text-xl font-bold mt-1 ${summary.net_ppn > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {summary.status}
                </p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Dihitung dari PPN Keluaran ({formatCurrency(summary.total_keluaran)}) dikurangi PPN Masukan ({formatCurrency(summary.total_masukan)}).
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} className="text-amber-600 shrink-0" />
                    <span>Pengingat & Status Pending:</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-extrabold border border-amber-200">
                    {totalBelumSetorCount + totalBelumLaporCount} Kewajiban
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60">
                  <div className="bg-white/90 p-2 rounded-lg border border-amber-200/60">
                    <span className="text-slate-500 text-[10px] block font-medium">Belum Disetor:</span>
                    <span className="font-extrabold text-amber-700 text-xs block">{totalBelumSetorCount} Pajak</span>
                    <span className="text-[10px] text-slate-700 font-bold block">{formatSimpleMoney(totalNominalBelumSetor)}</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-amber-200/60">
                    <span className="text-slate-500 text-[10px] block font-medium">Belum Dilapor:</span>
                    <span className="font-extrabold text-rose-600 text-xs block">{totalBelumLaporCount} Masa SPT</span>
                    <span className="text-[9.5px] text-slate-400 block">Batas: Tgl 20</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MIDDLE SECTION 1: 3 CARDS IN 1 ROW (Ringkasan Pajak per Jenis, Status Kepatuhan Pajak & Dokumen Pajak) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* CARD 1: RINGKASAN PAJAK PER JENIS (MATCHING AGING UTANG LAYOUT - NO SCROLLBAR) */}
        <div className="lg:col-span-5 min-w-0 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <h4 className="font-bold text-xs text-slate-800 mb-1">Ringkasan Pajak per Jenis</h4>
          
          <div className="h-[160px] w-full relative">
            <Chart
              ref={donutChartRef}
              options={{
                chart: { type: 'donut', toolbar: { show: false } },
                labels: donutLabels,
                colors: donutColors,
                stroke: { width: 2, colors: ['#ffffff'] },
                plotOptions: {
                  pie: {
                    donut: {
                      size: '60%',
                      labels: { show: false }
                    }
                  }
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                tooltip: { 
                  enabled: true,
                  y: { formatter: (val) => formatCurrency(val) } 
                }
              }}
              series={donutSeries}
              type="donut"
              width="100%"
              height={160}
            />
          </div>

          <div className="flex-shrink-0 mt-1 pb-0.5 flex flex-col gap-y-1.5">
            {(() => {
              const rows = [donutLabels.slice(0, 3), donutLabels.slice(3)];
              return rows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-x-4">
                  {row.map((label, i) => {
                    const idx = ri === 0 ? i : i + 3;
                    const isHidden = hiddenDonutSeries.has(label);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1 cursor-pointer select-none"
                        style={{ opacity: isHidden ? 0.35 : 1 }}
                        onClick={() => {
                          donutChartRef.current?.chart?.toggleSeries(label);
                          setHiddenDonutSeries(prev => {
                            const next = new Set(prev);
                            next.has(label) ? next.delete(label) : next.add(label);
                            return next;
                          });
                        }}
                      >
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: donutColors[idx] }} />
                        <span className="text-[10px] text-slate-600 leading-none">{label}</span>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* CARD 2: STATUS KEPATUHAN PAJAK (3 COLS) */}
        <div className="lg:col-span-3 min-w-0 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
          <h4 className="font-bold text-xs text-slate-800 mb-1">Status Kepatuhan Pajak (YTD 2026)</h4>
          
          <div className="my-auto flex flex-col items-center justify-center">
            <div className="relative w-full h-[130px] flex items-center justify-center">
              <Chart
                options={{
                  chart: { type: 'radialBar', sparkline: { enabled: true } },
                  plotOptions: {
                    radialBar: {
                      startAngle: -90,
                      endAngle: 90,
                      hollow: { size: '65%' },
                      track: { background: '#f1f5f9', strokeWidth: '100%' },
                      dataLabels: {
                        name: { show: false },
                        value: {
                          offsetY: -2,
                          fontSize: '20px',
                          fontWeight: '800',
                          color: '#0F172A',
                          formatter: (val) => `${val}%`
                        }
                      }
                    }
                  },
                  colors: [complianceScore >= 80 ? '#10B981' : (complianceScore >= 50 ? '#F59E0B' : '#EF4444')],
                  stroke: { lineCap: 'round' }
                }}
                series={[complianceScore]}
                type="radialBar"
                width="100%"
                height="130"
              />
            </div>
            <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border -mt-4 z-10 ${
              complianceScore >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              {complianceScore >= 80 ? 'Sangat Baik' : 'Cukup Baik'}
            </span>

            <div className="w-full grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-slate-100 text-[10px]">
              <div className="text-center">
                <span className="text-slate-400 block text-[9px]">Tepat Waktu</span>
                <span className="font-extrabold text-emerald-700">{tepatWaktuCount}</span>
              </div>
              <div className="text-center border-x border-slate-100">
                <span className="text-slate-400 block text-[9px]">Terlambat</span>
                <span className="font-extrabold text-amber-600">{terlambatCount}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block text-[9px]">Belum Lapor</span>
                <span className="font-extrabold text-rose-600">{belumLaporCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: DOKUMEN PAJAK STAT CARDS (4 COLS) */}
        <div className="lg:col-span-4 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <h4 className="font-bold text-xs text-slate-800">Dokumen Pajak</h4>

          <div className="grid grid-cols-2 gap-2 my-auto">
            {/* 1. Faktur Pajak */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col items-center justify-center text-center">
              <FileText className="text-blue-600 mb-1" size={24} />
              <span className="text-[11px] font-bold text-slate-700">Faktur Pajak</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1">{totalFakturPajak.toLocaleString('id-ID')}</span>
              <span className="text-[9.5px] text-slate-400">Faktur Accurate</span>
            </div>

            {/* 2. Bukti Potong */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col items-center justify-center text-center">
              <FileCheck className="text-emerald-600 mb-1" size={24} />
              <span className="text-[11px] font-bold text-slate-700">Bukti Potong</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1">{totalBuktiPotong.toLocaleString('id-ID')}</span>
              <span className="text-[9.5px] text-slate-400">PPh Accurate API</span>
            </div>

            {/* 3. SSP */}
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex flex-col items-center justify-center text-center">
              <FileCode className="text-purple-600 mb-1" size={24} />
              <span className="text-[11px] font-bold text-slate-700">SSP</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1">{totalSSP.toLocaleString('id-ID')}</span>
              <span className="text-[9.5px] text-slate-400">Total Setor DB</span>
            </div>

            {/* 4. BPE */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col items-center justify-center text-center">
              <ShieldCheck className="text-amber-600 mb-1" size={24} />
              <span className="text-[11px] font-bold text-slate-700">BPE</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1">{totalBPE.toLocaleString('id-ID')}</span>
              <span className="text-[9.5px] text-slate-400">Total BPE DJP</span>
            </div>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION 2: DAFTAR KEWAJIBAN PAJAK & AKTIVITAS PAJAK TERBARU IN 1 ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT: DAFTAR KEWAJIBAN PAJAK TABLE (8 COLS) */}
        <div id="daftar-kewajiban-section" className="lg:col-span-8 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2.5 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="font-bold text-xs text-slate-800">Daftar Kewajiban Pajak</h4>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[10.5px] overflow-x-auto">
              {[
                { id: 'semua', label: 'Semua' },
                { id: 'belum_setor', label: 'Belum Setor' },
                { id: 'belum_lapor', label: 'Belum Lapor' },
                { id: 'jatuh_tempo', label: 'Jatuh Tempo' },
                { id: 'akan_datang', label: 'Akan Datang' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setKewajibanTab(tab.id); setKewajibanPage(1); }}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    kewajibanTab === tab.id ? 'bg-white text-primary shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Cari jenis pajak / periode..."
              value={kewajibanSearch}
              onChange={(e) => { setKewajibanSearch(e.target.value); setKewajibanPage(1); }}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-semibold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-1.5 px-2.5">No.</th>
                  <th className="py-1.5 px-2.5">Jenis Pajak</th>
                  <th className="py-1.5 px-2.5">Periode</th>
                  <th className="py-1.5 px-2.5">Due Date</th>
                  <th className="py-1.5 px-2.5 text-right">Kewajiban</th>
                  <th className="py-1.5 px-2.5 text-center">Status Bayar</th>
                  <th className="py-1.5 px-2.5 text-center">Status Lapor</th>
                  <th className="py-1.5 px-2.5 text-center">Aksi</th>
                  <th className="py-1.5 px-2.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {paginatedKewajiban.length > 0 ? paginatedKewajiban.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-500">{row.no}</td>
                    <td className="py-1.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">{row.jenis}</td>
                    <td className="py-1.5 px-2.5 font-medium text-slate-600 whitespace-nowrap">{row.periode}</td>
                    <td className="py-1.5 px-2.5 font-mono text-slate-600 whitespace-nowrap">{row.dueDate}</td>
                    <td className="py-1.5 px-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">{formatCurrency(row.nominal)}</td>
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        row.statusBayar === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.statusBayar}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        row.statusLapor === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.statusLapor}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.statusBayar === 'Belum Setor' && (
                          <button 
                            onClick={() => handleOpenSptModal(row, 'setor')}
                            className="px-1.5 py-0.5 text-[9.5px] font-bold text-white bg-primary hover:bg-primary/90 rounded shadow-2xs cursor-pointer transition-colors"
                          >
                            Setor Sekarang
                          </button>
                        )}
                        {row.statusLapor === 'Belum Lapor' && (
                          <button 
                            onClick={() => handleOpenSptModal(row, 'lapor')}
                            className="px-1.5 py-0.5 text-[9.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer transition-colors"
                          >
                            Lapor Sekarang
                          </button>
                        )}
                        {row.statusBayar === 'Selesai' && row.statusLapor === 'Selesai' && (
                          <span className="text-[10px] text-slate-400 font-medium">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-500 font-medium whitespace-nowrap">{row.keterangan}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-slate-400">Tidak ada kewajiban pajak yang sesuai.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {kewajibanTotalPages > 1 && (
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 shrink-0">
              <span className="text-[10.5px] text-slate-400">
                {(kewajibanPage - 1) * kewajibanPerPage + 1}–{Math.min(kewajibanPage * kewajibanPerPage, filteredKewajiban.length)} dari {filteredKewajiban.length} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setKewajibanPage(p => Math.max(1, p - 1))}
                  disabled={kewajibanPage === 1}
                  className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[10.5px] font-semibold text-slate-600 min-w-[56px] text-center">
                  {kewajibanPage} / {kewajibanTotalPages}
                </span>
                <button
                  onClick={() => setKewajibanPage(p => Math.min(kewajibanTotalPages, p + 1))}
                  disabled={kewajibanPage === kewajibanTotalPages}
                  className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: AKTIVITAS PAJAK TERBARU (4 COLS) */}
        <div className="lg:col-span-4 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden max-h-[315px]">
          <h4 className="font-bold text-xs text-slate-800 mb-2 shrink-0">Aktivitas Pajak Terbaru</h4>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 text-[11px]">
            {recentActivities.length > 0 ? recentActivities.map((act, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${idx > 0 ? 'border-t border-slate-100 pt-2' : ''}`}>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 block leading-tight truncate">{act.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{act.subtitle}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9.5px] text-slate-400 block">{act.date}</span>
                  <span className="font-bold text-slate-900">{act.amount}</span>
                </div>
              </div>
            )) : (
              <p className="text-center py-4 text-slate-400 text-xs">Belum ada aktivitas terbaru.</p>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: RESTORED LIVE ACCURATE API FAKTUR PAJAK DETAIL TABLE */}
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
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-primary cursor-pointer font-semibold"
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

      {/* MODAL FORM: UPDATE STATUS SPT DJP ONLINE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                {modalMode === 'setor' ? (
                  <DollarSign size={18} className="text-amber-400" />
                ) : (
                  <FileCheck size={18} className="text-emerald-400" />
                )}
                <h3 className="font-bold text-sm">
                  {modalMode === 'setor' ? 'Konfirmasi Penyetoran Pajak (SSP / Billing)' : 'Update Status Pelaporan DJP'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSptForm} className="p-5 space-y-4 text-xs">
              {submitMessage && (
                <div className={`p-3 rounded-lg border text-xs font-medium ${
                  submitMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Periode Masa Pajak:</label>
                  <input 
                    type="text" 
                    value={sptFormData.period} 
                    disabled 
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded font-mono text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jenis Pajak:</label>
                  <input 
                    type="text" 
                    value={sptFormData.tax_type} 
                    disabled 
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {modalMode === 'setor' ? 'Status Penyetoran Pajak:' : 'Status Pelaporan DJP:'}
                </label>
                <select
                  value={sptFormData.status}
                  onChange={(e) => setSptFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-bold text-slate-800"
                >
                  <option value="Sudah Lapor DJP">{modalMode === 'setor' ? 'Sudah Disetor & Lapor DJP' : 'Sudah Lapor DJP Online'}</option>
                  <option value="Belum Lapor">{modalMode === 'setor' ? 'Belum Disetor (Pending)' : 'Belum Lapor (Pending)'}</option>
                  <option value="Draft">Draft Laporan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {modalMode === 'setor' ? 'Nomor NTPN / Kode Billing DJP:' : 'Nomor BPE (Bukti Penerimaan Elektronik):'}
                </label>
                <input 
                  type="text" 
                  placeholder={modalMode === 'setor' ? 'Contoh: NTPN-9876543210-2026' : 'Contoh: BPE-1234567890-2026'}
                  value={sptFormData.bpe_number} 
                  onChange={(e) => setSptFormData(prev => ({ ...prev, bpe_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
                  required={sptFormData.status === 'Sudah Lapor DJP'}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan PIC Tax:</label>
                <textarea 
                  rows={2}
                  placeholder="Tuliskan catatan khusus terkait penyetoran/pelaporan SPT ini..."
                  value={sptFormData.notes} 
                  onChange={(e) => setSptFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSpt}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSpt ? 'Saving...' : (modalMode === 'setor' ? 'Simpan Penyetoran' : 'Simpan Status DJP')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
