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
  BookOpen,
  RotateCcw,
  CreditCard,
  CheckSquare,
  Square,
  Layers,
  ListChecks,
  Copy
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

const getTaxBadge = (type) => {
  if (type === 'PPN Masa') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">PPN Masa</span>;
  }
  if (type === 'PPh 23') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">PPh 23</span>;
  }
  if (type === 'PPh 4(2)') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">PPh 4(2)</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">{type}</span>;
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

  // Modal State - Update Status SPT DJP / Penyetoran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('lapor'); // 'setor' or 'lapor'
  const [selectedSptItem, setSelectedSptItem] = useState(null);
  const [sptFormData, setSptFormData] = useState({
    period: '',
    tax_type: '',
    action_type: 'setor',
    payment_status: 'Sudah Setor',
    status: 'Sudah Lapor DJP',
    ntpn_number: '',
    bpe_number: '',
    nominal: 0,
    notes: '',
  });
  const [isSubmittingSpt, setIsSubmittingSpt] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Bulk Action States
  const [selectedKewajibanKeys, setSelectedKewajibanKeys] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkModalMode, setBulkModalMode] = useState('setor'); // 'setor' or 'lapor'
  const [activeBulkTab, setActiveBulkTab] = useState('');
  const [bulkItemsData, setBulkItemsData] = useState({});
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkSubmitMessage, setBulkSubmitMessage] = useState(null);

  // Bulk Batal / Revert States
  const [isBulkBatalModalOpen, setIsBulkBatalModalOpen] = useState(false);
  const [bulkBatalTarget, setBulkBatalTarget] = useState('both'); // 'setor', 'lapor', 'both'
  const [isSubmittingBulkBatal, setIsSubmittingBulkBatal] = useState(false);
  const [bulkBatalMessage, setBulkBatalMessage] = useState(null);

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
      period: item.periode || item.period || '2026-09',
      tax_type: item.jenis || item.tax_type || 'PPN Masa',
      action_type: mode,
      payment_status: item.statusBayar === 'Selesai' ? 'Sudah Setor' : (mode === 'setor' ? 'Sudah Setor' : 'Belum Setor'),
      status: item.statusLapor === 'Selesai' ? 'Sudah Lapor DJP' : (mode === 'lapor' ? 'Sudah Lapor DJP' : 'Belum Lapor'),
      ntpn_number: item.ntpn_number || '',
      bpe_number: item.bpe_number || '',
      nominal: item.nominal || 0,
      notes: item.notes || (mode === 'setor' ? 'Bukti penyetoran pajak via teller/e-billing bank.' : 'Pelaporan SPT Masa via DJP Online.'),
    });
    setSubmitMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmitSptForm = async (e) => {
    e.preventDefault();
    setIsSubmittingSpt(true);
    setSubmitMessage(null);
    try {
      const isCancellingSetor = modalMode === 'setor' && sptFormData.payment_status === 'Belum Setor';
      const isCancellingLapor = modalMode === 'lapor' && sptFormData.status === 'Belum Lapor';

      // Isolate payload strictly to current mode so 'setor' never changes 'status' and vice versa
      const payload = {
        period: sptFormData.period,
        tax_type: sptFormData.tax_type,
        action_type: modalMode,
        nominal: sptFormData.nominal,
        notes: (isCancellingSetor || isCancellingLapor) ? '' : sptFormData.notes,
        clear_notes: (isCancellingSetor || isCancellingLapor) ? true : undefined,
      };

      if (modalMode === 'setor') {
        payload.payment_status = sptFormData.payment_status;
        payload.ntpn_number = sptFormData.ntpn_number;
      } else {
        payload.status = sptFormData.status;
        payload.bpe_number = sptFormData.bpe_number;
      }

      const res = await api.post('/api/tax-dashboard/spt-reports', payload);
      if (res.data?.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: modalMode === 'setor' 
            ? 'Bukti penyetoran pajak (NTPN) berhasil disimpan!' 
            : 'Status Pelaporan SPT Masa DJP berhasil disimpan!' 
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchDashboardData(true);
        }, 1000);
      } else {
        setSubmitMessage({ type: 'error', text: res.data?.message || 'Gagal menyimpan status kewajiban pajak.' });
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal memperbarui status kewajiban pajak' });
    } finally {
      setIsSubmittingSpt(false);
    }
  };

  // Revert / Cancel status if accidentally marked as paid or reported
  const handleResetStatus = async (mode) => {
    const isSetor = mode === 'setor';
    const confirmMsg = `Batalkan status ${isSetor ? 'penyetoran' : 'pelaporan'} untuk ${sptFormData.tax_type} periode ${sptFormData.period}?\n\nStatus akan dikembalikan ke "Belum ${isSetor ? 'Setor' : 'Lapor'}", catatan dibersihkan, dan nomor ${isSetor ? 'NTPN' : 'BPE'} akan dihapus.`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingSpt(true);
    setSubmitMessage(null);
    try {
      const payload = {
        period: sptFormData.period,
        tax_type: sptFormData.tax_type,
        action_type: mode,
        nominal: sptFormData.nominal,
        notes: '',
        clear_notes: true,
      };

      if (isSetor) {
        payload.payment_status = 'Belum Setor';
        payload.ntpn_number = '';
      } else {
        payload.status = 'Belum Lapor';
        payload.bpe_number = '';
      }

      const res = await api.post('/api/tax-dashboard/spt-reports', payload);
      if (res.data?.success) {
        setSubmitMessage({
          type: 'success',
          text: `Status berhasil dibatalkan dan dikembalikan ke Belum ${isSetor ? 'Setor' : 'Lapor'}!`
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchDashboardData(true);
        }, 1000);
      } else {
        setSubmitMessage({ type: 'error', text: res.data?.message || 'Gagal membatalkan status.' });
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal membatalkan status' });
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

  const displayDonutSeries = donutSeries.map((val, idx) => {
    const label = donutLabels[idx];
    return hiddenDonutSeries.has(label) ? 0 : val;
  });

  const donutChartOptions = {
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
  };

  // Real Stat Counts
  const totalFakturPajak = invoices.length;
  const totalBuktiPotong = pphRecords.length;
  const totalSSP         = sptReports.filter(r => r.payment_status === 'Sudah Setor' || r.ntpn_number).length;
  const totalBPE         = sptReports.filter(r => r.bpe_number && r.status === 'Sudah Lapor DJP').length;

  // Calculate Real Compliance Scores from spt_reports DB
  const tepatWaktuCount = sptReports.filter(r => r.status === 'Sudah Lapor DJP').length;
  const terlambatCount  = sptReports.filter(r => r.status === 'Terlambat').length;
  const belumLaporCount = sptReports.filter(r => r.status === 'Belum Lapor').length;
  const totalSptCount   = sptReports.length || 1;
  const complianceScore = Math.round((tepatWaktuCount / totalSptCount) * 100);

  // Dynamic Kewajiban List from 100% Real Accurate API & SPT Reports
  const kewajibanList = sptReports.slice(0, 10).map((r, idx) => {
    const isPpn = r.tax_type === 'PPN Masa';
    const mData = rawChart.find(c => c.month === r.period);
    let nominal = 0;

    if (isPpn) {
      if (mData) {
        nominal = Math.max(0, (mData.keluaran || 0) - (mData.masukan || 0));
      } else {
        nominal = Number(r.total_tax_amount || 0);
      }
    } else {
      nominal = Number(r.total_tax_amount || 0);
    }

    const statusBayar = (r.payment_status === 'Sudah Setor' || r.ntpn_number) ? 'Selesai' : 'Belum Setor';
    const statusLapor = (r.status === 'Sudah Lapor DJP' || r.bpe_number) ? 'Selesai' : 'Belum Lapor';

    let keterangan = '-';
    if (statusLapor === 'Selesai' && r.bpe_number) {
      keterangan = `BPE #${r.bpe_number}`;
    } else if (statusBayar === 'Selesai' && r.ntpn_number) {
      keterangan = `NTPN #${r.ntpn_number}`;
    } else if ((statusBayar === 'Selesai' || statusLapor === 'Selesai') && r.notes) {
      keterangan = r.notes;
    }
    
    return {
      no: idx + 1,
      jenis: r.tax_type,
      periode: r.period,
      period: r.period,
      tax_type: r.tax_type,
      dueDate: r.period ? `${r.period}-20` : '-',
      nominal: nominal,
      statusBayar: statusBayar,
      statusLapor: statusLapor,
      keterangan: keterangan,
      bpe_number: r.bpe_number || '',
      ntpn_number: r.ntpn_number || '',
      notes: r.notes || '',
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

  // Bulk Selection Helpers & Calculations (Plain JS variables, no hooks after early return)
  const visibleKewajibanKeys = paginatedKewajiban.map(item => `${item.period}_${item.tax_type}`);

  const isAllVisibleSelected = visibleKewajibanKeys.length > 0 && visibleKewajibanKeys.every(k => selectedKewajibanKeys.includes(k));

  const toggleSelectRow = (key) => {
    setSelectedKewajibanKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedKewajibanKeys(prev => prev.filter(k => !visibleKewajibanKeys.includes(k)));
    } else {
      setSelectedKewajibanKeys(prev => Array.from(new Set([...prev, ...visibleKewajibanKeys])));
    }
  };

  const handleClearSelection = () => {
    setSelectedKewajibanKeys([]);
  };

  const selectedKewajibanItems = kewajibanList.filter(item => selectedKewajibanKeys.includes(`${item.period}_${item.tax_type}`));

  const selectedTotalNominal = selectedKewajibanItems.reduce((acc, curr) => acc + (curr.nominal || 0), 0);

  const handleOpenBulkModal = (mode = 'setor') => {
    setBulkModalMode(mode);
    const initialData = {};
    selectedKewajibanItems.forEach(item => {
      const key = `${item.period}_${item.tax_type}`;
      initialData[key] = {
        ntpn_number: item.ntpn_number || '',
        bpe_number: item.bpe_number || '',
        notes: item.notes || '',
      };
    });
    setBulkItemsData(initialData);
    if (selectedKewajibanItems.length > 0) {
      setActiveBulkTab(`${selectedKewajibanItems[0].period}_${selectedKewajibanItems[0].tax_type}`);
    }
    setBulkSubmitMessage(null);
    setIsBulkModalOpen(true);
  };

  const handleApplyToAllTabs = () => {
    if (!activeBulkTab) return;
    const currentData = bulkItemsData[activeBulkTab] || {};
    const updated = {};
    selectedKewajibanItems.forEach(item => {
      const key = `${item.period}_${item.tax_type}`;
      updated[key] = {
        ntpn_number: currentData.ntpn_number || '',
        bpe_number: currentData.bpe_number || '',
        notes: currentData.notes || '',
      };
    });
    setBulkItemsData(updated);
    setBulkSubmitMessage({
      type: 'success',
      text: `Nomor & catatan dari tab ini berhasil disalin ke semua ${selectedKewajibanItems.length} tab pajak!`,
    });
    setTimeout(() => setBulkSubmitMessage(null), 2500);
  };

  const handleSubmitBulk = async (e) => {
    e.preventDefault();
    if (selectedKewajibanItems.length === 0) return;

    // Check how many items have their code filled
    const filledItems = selectedKewajibanItems.filter(item => {
      const key = `${item.period}_${item.tax_type}`;
      const d = bulkItemsData[key] || {};
      return bulkModalMode === 'setor' ? Boolean(d.ntpn_number?.trim()) : Boolean(d.bpe_number?.trim());
    });

    if (filledItems.length === 0) {
      alert(`Harap isi minimal satu nomor ${bulkModalMode === 'setor' ? 'NTPN' : 'BPE'} pada salah satu tab pajak.`);
      return;
    }

    if (filledItems.length < selectedKewajibanItems.length) {
      const emptyItems = selectedKewajibanItems.filter(item => {
        const key = `${item.period}_${item.tax_type}`;
        const d = bulkItemsData[key] || {};
        return bulkModalMode === 'setor' ? !d.ntpn_number?.trim() : !d.bpe_number?.trim();
      });
      const emptyNames = emptyItems.map(m => `${m.tax_type} (${m.period})`).join(', ');
      const proceed = window.confirm(
        `Terdapat ${emptyItems.length} pajak yang nomor ${bulkModalMode === 'setor' ? 'NTPN' : 'BPE'}-nya masih kosong:\n\n${emptyNames}\n\nPajak yang kosong tidak akan diubah ke status Selesai. Tetap simpan perubahan?`
      );
      if (!proceed) return;
    }

    setIsSubmittingBulk(true);
    setBulkSubmitMessage(null);

    try {
      const payload = {
        action_type: bulkModalMode,
        items: selectedKewajibanItems.map(item => {
          const key = `${item.period}_${item.tax_type}`;
          const itemData = bulkItemsData[key] || {};
          return {
            period: item.period,
            tax_type: item.tax_type,
            nominal: item.nominal,
            ntpn_number: itemData.ntpn_number || undefined,
            bpe_number: itemData.bpe_number || undefined,
            notes: itemData.notes || undefined,
          };
        }),
      };

      const res = await api.post('/api/tax-dashboard/spt-reports/bulk', payload);
      if (res.data?.success) {
        setBulkSubmitMessage({
          type: 'success',
          text: res.data.message || `Berhasil memproses bulk ${bulkModalMode}!`,
        });
        setTimeout(() => {
          setIsBulkModalOpen(false);
          setSelectedKewajibanKeys([]);
          fetchDashboardData(true);
        }, 1200);
      } else {
        setBulkSubmitMessage({
          type: 'error',
          text: res.data?.message || 'Gagal memproses bulk action.',
        });
      }
    } catch (err) {
      setBulkSubmitMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses bulk action.',
      });
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleSubmitBulkBatal = async (e) => {
    e.preventDefault();
    if (selectedKewajibanItems.length === 0) return;

    let actionType = 'batal_semua';
    if (bulkBatalTarget === 'setor') actionType = 'batal_setor';
    if (bulkBatalTarget === 'lapor') actionType = 'batal_lapor';

    setIsSubmittingBulkBatal(true);
    setBulkBatalMessage(null);

    try {
      const payload = {
        action_type: actionType,
        items: selectedKewajibanItems.map(item => ({
          period: item.period,
          tax_type: item.tax_type,
          nominal: item.nominal,
        })),
      };

      const res = await api.post('/api/tax-dashboard/spt-reports/bulk', payload);
      if (res.data?.success) {
        setBulkBatalMessage({
          type: 'success',
          text: res.data.message || 'Status berhasil dibatalkan!',
        });
        setTimeout(() => {
          setIsBulkBatalModalOpen(false);
          setSelectedKewajibanKeys([]);
          fetchDashboardData(true);
        }, 1200);
      } else {
        setBulkBatalMessage({
          type: 'error',
          text: res.data?.message || 'Gagal membatalkan status.',
        });
      }
    } catch (err) {
      setBulkBatalMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan sistem saat membatalkan status.',
      });
    } finally {
      setIsSubmittingBulkBatal(false);
    }
  };

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
              chartRef={donutChartRef}
              options={donutChartOptions}
              series={displayDonutSeries}
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

          {/* BULK ACTION TOOLBAR (Appears when >= 1 item is selected) */}
          {selectedKewajibanKeys.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50/50 border border-blue-200/90 rounded-xl shadow-xs transition-all animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[11px] font-extrabold shadow-2xs">
                  {selectedKewajibanKeys.length}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedKewajibanKeys.length} Kewajiban Pajak Dipilih
                  </span>
                  <span className="text-[11px] text-slate-500 ml-2">
                    (Total: <strong className="text-slate-900 font-mono">{formatCurrency(selectedTotalNominal)}</strong>)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBulkModal('setor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
                >
                  <CreditCard size={13} />
                  Bulk Setor Sekarang
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBulkModal('lapor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
                >
                  <Send size={13} />
                  Bulk Lapor DJP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBulkBatalTarget('both');
                    setBulkBatalMessage(null);
                    setIsBulkBatalModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
                >
                  <RotateCcw size={13} />
                  Bulk Batalkan Status
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  Batal Pilihan
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                      title="Pilih semua di halaman ini"
                    />
                  </th>
                  <th className="py-2.5 px-3">No.</th>
                  <th className="py-2.5 px-3">Jenis Pajak</th>
                  <th className="py-2.5 px-3">Periode & Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Nominal Kewajiban</th>
                  <th className="py-2.5 px-3 text-center">Penyetoran (Bank / NTPN)</th>
                  <th className="py-2.5 px-3 text-center">Pelaporan (DJP Online / BPE)</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {paginatedKewajiban.length > 0 ? paginatedKewajiban.map((row, idx) => {
                  const rowKey = `${row.period}_${row.tax_type}`;
                  const isSelected = selectedKewajibanKeys.includes(rowKey);

                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowKey)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-400">{row.no}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getTaxBadge(row.jenis)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[11.5px]">{row.periode}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>Due: {row.dueDate}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={`font-extrabold text-[12px] font-mono ${row.nominal > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {formatCurrency(row.nominal)}
                        </span>
                      </td>

                      {/* KOLOM 1: PENYETORAN PAJAK (SETOR & NTPN) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {row.statusBayar === 'Selesai' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              Sudah Disetor
                            </span>
                            {row.ntpn_number && (
                              <span className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                                NTPN: {row.ntpn_number}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenSptModal(row, 'setor')}
                              className="text-[9.5px] text-slate-400 hover:text-primary transition-colors cursor-pointer mt-0.5 underline flex items-center gap-0.5"
                            >
                              <RotateCcw size={9} /> Ubah / Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSptModal(row, 'setor')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                          >
                            <CreditCard size={12} />
                            Setor Sekarang
                          </button>
                        )}
                      </td>

                      {/* KOLOM 2: PELAPORAN PAJAK (LAPOR DJP & BPE) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {row.statusLapor === 'Selesai' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              Sudah Lapor DJP
                            </span>
                            {row.bpe_number && (
                              <span className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                                BPE: {row.bpe_number}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenSptModal(row, 'lapor')}
                              className="text-[9.5px] text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer mt-0.5 underline flex items-center gap-0.5"
                            >
                              <RotateCcw size={9} /> Ubah / Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSptModal(row, 'lapor')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                          >
                            <Send size={12} />
                            Lapor DJP
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 text-[10.5px]">
                        {row.keterangan || '-'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-slate-400">Tidak ada kewajiban pajak yang sesuai dengan filter.</td>
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
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className={`px-6 py-4.5 text-white flex justify-between items-center ${
              modalMode === 'setor' ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-emerald-900 to-teal-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {modalMode === 'setor' ? (
                  <div className="p-2 rounded-lg bg-white/10 text-amber-300">
                    <CreditCard size={20} />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-white/10 text-emerald-300">
                    <Send size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">
                    {modalMode === 'setor' ? 'Penyetoran Pajak (Bank / Kas Negara)' : 'Pelaporan SPT Masa DJP Online'}
                  </h3>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    {modalMode === 'setor' ? 'Catat bukti NTPN dari teller, ATM, atau internet banking' : 'Input nomor BPE resmi dari DJP Online e-Faktur/e-Bupot'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSptForm} className="p-6 space-y-4 text-xs">
              {submitMessage && (
                <div className={`p-3 rounded-lg border text-xs font-semibold ${
                  submitMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              {/* Summary Card Pajak */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getTaxBadge(sptFormData.tax_type)}
                    <span className="font-extrabold text-slate-800 text-xs font-mono">{sptFormData.period}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Nilai Kewajiban Periode Ini</span>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900 font-mono">
                    {formatCurrency(sptFormData.nominal)}
                  </div>
                </div>
              </div>

              {modalMode === 'setor' ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Status Penyetoran:</label>
                    <select
                      value={sptFormData.payment_status}
                      onChange={(e) => setSptFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-bold text-slate-800 text-xs bg-white"
                    >
                      <option value="Sudah Setor">Sudah Disetor (Lunas via Bank / Kas Negara)</option>
                      <option value="Belum Setor">Belum Disetor (Batalkan / Pending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Nomor NTPN / Bukti Bayar Bank:
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 16 karakter NTPN atau Kode Billing Bank"
                      value={sptFormData.ntpn_number} 
                      onChange={(e) => setSptFormData(prev => ({ ...prev, ntpn_number: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-xs font-bold text-slate-800"
                      required={sptFormData.payment_status === 'Sudah Setor'}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">NTPN (Nomor Transaksi Penerimaan Negara) tertera pada struk/bukti bayar bank.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Status Pelaporan DJP:</label>
                    <select
                      value={sptFormData.status}
                      onChange={(e) => setSptFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold text-slate-800 text-xs bg-white"
                    >
                      <option value="Sudah Lapor DJP">Sudah Lapor DJP Online (Resmi)</option>
                      <option value="Belum Lapor">Belum Lapor (Batalkan / Pending)</option>
                      <option value="Draft">Draft Laporan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Nomor BPE (Bukti Penerimaan Elektronik DJP):
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: BPE-1234567890 (dari DJP Online)"
                      value={sptFormData.bpe_number} 
                      onChange={(e) => setSptFormData(prev => ({ ...prev, bpe_number: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-mono text-xs font-bold text-slate-800"
                      required={sptFormData.status === 'Sudah Lapor DJP'}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Nomor bukti BPE yang diterbitkan saat lapor SPT Masa di web DJP Online.</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Catatan Khusus PIC Tax (Opsional):</label>
                <textarea 
                  rows={2}
                  placeholder="Tuliskan catatan khusus terkait penyetoran/pelaporan SPT ini..."
                  value={sptFormData.notes} 
                  onChange={(e) => setSptFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                <div>
                  {((modalMode === 'setor' && selectedSptItem?.statusBayar === 'Selesai') ||
                    (modalMode === 'lapor' && selectedSptItem?.statusLapor === 'Selesai')) && (
                    <button
                      type="button"
                      onClick={() => handleResetStatus(modalMode)}
                      disabled={isSubmittingSpt}
                      className="px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-300"
                    >
                      <RotateCcw size={13} />
                      {modalMode === 'setor' ? 'Batalkan Setoran' : 'Batalkan Laporan'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                      modalMode === 'setor' ? 'bg-primary hover:bg-primary/90' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isSubmittingSpt ? 'Saving...' : (modalMode === 'setor' ? 'Simpan Penyetoran (NTPN)' : 'Simpan Pelaporan (BPE)')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BULK ACTION MODAL WITH TABS FOR EACH SELECTED TAX */}
      {isBulkModalOpen && (() => {
        const activeItem = selectedKewajibanItems.find(it => `${it.period}_${it.tax_type}` === activeBulkTab) || selectedKewajibanItems[0] || {};
        const activeKey = `${activeItem.period}_${activeItem.tax_type}`;
        const activeData = bulkItemsData[activeKey] || { ntpn_number: '', bpe_number: '', notes: '' };
        const activeIndex = selectedKewajibanItems.findIndex(it => `${it.period}_${it.tax_type}` === activeKey);
        const filledCount = selectedKewajibanItems.filter(item => {
          const k = `${item.period}_${item.tax_type}`;
          const d = bulkItemsData[k] || {};
          return bulkModalMode === 'setor' ? Boolean(d.ntpn_number?.trim()) : Boolean(d.bpe_number?.trim());
        }).length;

        return (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsBulkModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className={`p-4 text-white flex items-center justify-between shrink-0 ${
                bulkModalMode === 'setor'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
                  : 'bg-gradient-to-r from-emerald-700 to-teal-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    {bulkModalMode === 'setor' ? <CreditCard size={20} className="text-blue-200" /> : <Send size={20} className="text-emerald-200" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {bulkModalMode === 'setor'
                        ? `Bulk Penyetoran Pajak (${selectedKewajibanItems.length} Pajak)`
                        : `Bulk Pelaporan DJP (${selectedKewajibanItems.length} Pajak)`}
                    </h3>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      {bulkModalMode === 'setor'
                        ? 'Setiap jenis pajak memiliki kode NTPN bank masing-masing. Input melalui tab di bawah.'
                        : 'Setiap jenis pajak memiliki nomor BPE resmi masing-masing. Input melalui tab di bawah.'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitBulk} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  {bulkSubmitMessage && (
                    <div className={`p-3 rounded-lg border text-xs font-semibold ${
                      bulkSubmitMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {bulkSubmitMessage.text}
                    </div>
                  )}

                  {/* Top Progress & Quick Overview */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Progress Input:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        filledCount === selectedKewajibanItems.length 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {filledCount} dari {selectedKewajibanItems.length} Pajak Terisi
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] mr-1.5">Total Nominal:</span>
                      <span className="font-extrabold text-slate-900 font-mono">{formatCurrency(selectedTotalNominal)}</span>
                    </div>
                  </div>

                  {/* Horizontal Tabs Header for Each Tax */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pilih Tab Pajak untuk Mengisi Kode:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                      {selectedKewajibanItems.map((item) => {
                        const key = `${item.period}_${item.tax_type}`;
                        const itemData = bulkItemsData[key] || {};
                        const isFilled = bulkModalMode === 'setor' ? Boolean(itemData.ntpn_number?.trim()) : Boolean(itemData.bpe_number?.trim());
                        const isActive = activeBulkTab === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActiveBulkTab(key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                              isActive
                                ? (bulkModalMode === 'setor' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-xs ring-1 ring-blue-300' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs ring-1 ring-emerald-300')
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {getTaxBadge(item.tax_type)}
                            <span className="font-mono text-[11.5px]">{item.period}</span>
                            {isFilled ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-400" title="Belum diisi" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Tab Form Body */}
                  {activeItem.tax_type && (
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3.5 animate-in fade-in duration-150">
                      {/* Active Tab Tax Meta */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          {getTaxBadge(activeItem.tax_type)}
                          <span className="font-mono font-bold text-slate-800 text-xs">{activeItem.period}</span>
                          <span className="text-slate-400 text-xs">|</span>
                          <span className="font-mono font-extrabold text-slate-900 text-xs">{formatCurrency(activeItem.nominal)}</span>
                        </div>

                        {/* Quick Action: Apply to all tabs */}
                        <button
                          type="button"
                          onClick={handleApplyToAllTabs}
                          title="Salin kode dan catatan dari tab ini ke semua tab pajak lainnya"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Copy size={11} />
                          Salin ke Semua Tab
                        </button>
                      </div>

                      {bulkModalMode === 'setor' ? (
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Nomor NTPN / Bukti Bayar Bank ({activeItem.tax_type} - {activeItem.period}):
                          </label>
                          <input 
                            type="text" 
                            placeholder={`Contoh: NTPN-16-DIGIT untuk ${activeItem.tax_type}`}
                            value={activeData.ntpn_number || ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkItemsData(prev => ({
                                ...prev,
                                [activeKey]: { ...(prev[activeKey] || {}), ntpn_number: val }
                              }));
                            }}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-xs font-bold text-slate-800 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Kode NTPN (Nomor Transaksi Penerimaan Negara) tertera pada struk/bukti bayar bank khusus untuk {activeItem.tax_type}.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Nomor BPE DJP Online ({activeItem.tax_type} - {activeItem.period}):
                          </label>
                          <input 
                            type="text" 
                            placeholder={`Contoh: BPE-1234567890 untuk ${activeItem.tax_type}`}
                            value={activeData.bpe_number || ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkItemsData(prev => ({
                                ...prev,
                                [activeKey]: { ...(prev[activeKey] || {}), bpe_number: val }
                              }));
                            }}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-mono text-xs font-bold text-slate-800 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Nomor Bukti Penerimaan Elektronik resmi dari DJP Online e-Faktur/e-Bupot untuk {activeItem.tax_type}.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Catatan PIC Tax ({activeItem.tax_type} - Opsional):
                        </label>
                        <textarea 
                          rows={2}
                          placeholder={`Catatan khusus terkait penyetoran/pelaporan ${activeItem.tax_type}...`}
                          value={activeData.notes || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkItemsData(prev => ({
                              ...prev,
                              [activeKey]: { ...(prev[activeKey] || {}), notes: val }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-xs bg-white"
                        />
                      </div>

                      {/* Tab Navigation buttons */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          type="button"
                          disabled={activeIndex <= 0}
                          onClick={() => {
                            const prevItem = selectedKewajibanItems[activeIndex - 1];
                            if (prevItem) setActiveBulkTab(`${prevItem.period}_${prevItem.tax_type}`);
                          }}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold flex items-center gap-1"
                        >
                          <ChevronLeft size={12} /> Tab Sebelumnya
                        </button>
                        <span className="text-slate-400 font-medium">
                          Tab {activeIndex + 1} dari {selectedKewajibanItems.length}
                        </span>
                        <button
                          type="button"
                          disabled={activeIndex >= selectedKewajibanItems.length - 1}
                          onClick={() => {
                            const nextItem = selectedKewajibanItems[activeIndex + 1];
                            if (nextItem) setActiveBulkTab(`${nextItem.period}_${nextItem.tax_type}`);
                          }}
                          className="px-2.5 py-1 text-primary hover:text-primary/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold flex items-center gap-1"
                        >
                          Tab Berikutnya <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBulk}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                      bulkModalMode === 'setor' ? 'bg-primary hover:bg-primary/90' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isSubmittingBulk
                      ? 'Memproses...'
                      : (bulkModalMode === 'setor'
                          ? `Simpan Semua Penyetoran (${selectedKewajibanItems.length} Pajak)`
                          : `Simpan Semua Pelaporan (${selectedKewajibanItems.length} Pajak)`)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      {/* BULK BATAL / REVERT MODAL */}
      {isBulkBatalModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkBatalModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 text-white flex items-center justify-between bg-gradient-to-r from-rose-700 to-red-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <RotateCcw size={20} className="text-rose-200" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Bulk Batalkan Status ({selectedKewajibanItems.length} Pajak)
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Kembalikan status kewajiban pajak terpilih ke Belum Selesai
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBulkBatalModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBulkBatal} className="p-5 space-y-4 text-xs">
              {bulkBatalMessage && (
                <div className={`p-3 rounded-lg border text-xs font-semibold ${
                  bulkBatalMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {bulkBatalMessage.text}
                </div>
              )}

              {/* Selected Taxes Summary */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Pajak yang Akan Dibatalkan ({selectedKewajibanItems.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {selectedKewajibanItems.map((item, i) => (
                    <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10.5px]">
                      {getTaxBadge(item.tax_type)}
                      <span className="font-mono font-bold text-slate-700">{item.period}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Choice of what to cancel */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">
                  Pilih Bagian yang Ingin Dibatalkan:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="batalTarget" 
                      value="setor"
                      checked={bulkBatalTarget === 'setor'}
                      onChange={() => setBulkBatalTarget('setor')}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Batalkan Penyetoran Saja</span>
                      <span className="text-[11px] text-slate-500">Status setor kembali ke "Belum Setor" dan nomor NTPN dihapus. Status pelaporan DJP tetap aman.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="batalTarget" 
                      value="lapor"
                      checked={bulkBatalTarget === 'lapor'}
                      onChange={() => setBulkBatalTarget('lapor')}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Batalkan Pelaporan Saja</span>
                      <span className="text-[11px] text-slate-500">Status lapor kembali ke "Belum Lapor" dan nomor BPE dihapus. Status penyetoran bank tetap aman.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="batalTarget" 
                      value="both"
                      checked={bulkBatalTarget === 'both'}
                      onChange={() => setBulkBatalTarget('both')}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div>
                      <span className="font-bold text-rose-700 block">Batalkan Keduanya (Reset Total)</span>
                      <span className="text-[11px] text-slate-500">Reset status Penyetoran & Pelaporan ke "Belum Selesai", hapus seluruh NTPN, BPE, dan catatan.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkBatalModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulkBatal}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBulkBatal ? 'Membatalkan...' : `Konfirmasi Batalkan (${selectedKewajibanItems.length} Pajak)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
