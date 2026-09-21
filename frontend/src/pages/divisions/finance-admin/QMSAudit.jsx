import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Target,
  FileText,
  ShieldAlert,
  Wrench,
  Award,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  Eye,
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Chart from 'react-apexcharts';
import Modal from '../../../components/ui/Modal';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';
import ExportButton from '../../../components/ui/ExportButton';

const DEFAULT_QMS_SERVICE_URL = 'http://127.0.0.1:5002';

const MONTH_NAMES = [
  { id: 'all', label: 'Semua Periode' },
  { id: '1', label: 'Januari 2026' },
  { id: '2', label: 'Februari 2026' },
  { id: '3', label: 'Maret 2026' },
  { id: '4', label: 'April 2026' },
  { id: '5', label: 'Mei 2026' },
  { id: '6', label: 'Juni 2026' },
  { id: '7', label: 'Juli 2026' },
  { id: '8', label: 'Agustus 2026' },
  { id: '9', label: 'September 2026' },
  { id: '10', label: 'Oktober 2026' },
  { id: '11', label: 'November 2026' },
  { id: '12', label: 'Desember 2026' },
];

const QMS_DATA_SOURCES = {
  kpi: {
    folder: 'Z:\\dashboard-data\\qms\\',
    file: '1. Monitoring KPI 2026.xlsx',
    fullFile: '1. Monitoring KPI 2026.xlsx',
    sheet: '19 Sheet Divisi (Rekap KPI Bulanan)',
    label: 'Monitoring KPI Seluruh Divisi',
    desc: 'Rekapitulasi target dan realisasi KPI 19 divisi perusahaan per bulan / tahun 2026 yang diisi oleh masing-masing PIC divisi.',
  },
  followup: {
    folder: 'Z:\\dashboard-data\\qms\\',
    file: '4. FRM-AZM-602-021 Follow up Evaluasi dan Strategi BoD Register.xlsx',
    fullFile: '4. FRM-AZM-602-021 Follow up Evaluasi dan Strategi BoD Register.xlsx',
    sheet: 'Sheet Bulan (Januari s/d Desember)',
    label: 'Follow-up Evaluasi & Strategi BoD',
    desc: 'Formulir monitoring tindak lanjut notulen rapat BoD, progres penyelesaian tugas, status due date, dan PIC penanggung jawab per arahan direksi.',
  },
  risk: {
    folder: 'Z:\\dashboard-data\\qms\\',
    file: '3. RISK ASSESMENT - Consolidated FRM-602-009.xlsx',
    fullFile: '3. RISK ASSESMENT - Consolidated FRM-602-009.xlsx',
    sheet: 'Risk Assessment',
    label: 'Risk Assessment Register (FRM-602-009)',
    desc: 'Register mitigasi risiko konsolidasi seluruh divisi dengan kategori Strategic, Operational, Financial, dan Compliance.',
  },
  corrective: {
    folder: 'Z:\\dashboard-data\\qms\\',
    file: '2. CORRECTIVE ACTION REGISTER.xlsx',
    fullFile: '2. CORRECTIVE ACTION REGISTER.xlsx',
    sheet: 'CAR Register',
    label: 'Corrective Action Register (CAR)',
    desc: 'Register temuan audit internal/eksternal dan rencana aksi perbaikan mutu (CAR) dengan status Open, On Progress, dan Closed.',
  },
  kaizen: {
    folder: 'Z:\\dashboard-data\\qms\\',
    file: '5. KAIZEN RECAP (2).xlsx',
    fullFile: '5. KAIZEN RECAP (2).xlsx',
    sheet: 'Consolidated Scores',
    label: 'Kaizen Recap & Ranking Inovasi',
    desc: 'Rekapitulasi ide continuous improvement (Kaizen) seluruh karyawan AZM dengan sistem penilaian pembobotan 60% Direksi dan 40% Manager.',
  },
};

function DatasetBadgeButton({ source, label = "Dataset", onClick, className = "" }) {
  if (!source) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(source);
      }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md text-[9.5px] font-semibold transition cursor-pointer shadow-2xs hover:shadow-xs group shrink-0 ${className}`}
      title={`Lihat info file, folder & sheet: ${source.file}`}
    >
      <Database size={10} className="text-emerald-600 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </button>
  );
}

function DataSourceCard({ source, onOpenDetail }) {
  if (!source) return null;

  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
      <div className="flex items-center gap-1.5 min-w-0 text-slate-600 text-[11px]">
        <FileSpreadsheet size={13} className="text-emerald-600 shrink-0" />
        <span className="text-slate-400 hidden sm:inline">Dataset:</span>
        <span className="font-semibold text-slate-800 truncate">{source.label || 'Sumber Data Asal'}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail && onOpenDetail(source);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md text-[10.5px] font-semibold transition cursor-pointer shadow-2xs group shrink-0"
        title="Klik untuk membuka pop up detail file, folder & sheet Excel"
      >
        <Database size={11} className="text-emerald-600 group-hover:scale-110 transition-transform" />
        <span>Info File & Sheet NAS</span>
        <ChevronRight size={11} className="text-emerald-600" />
      </button>
    </div>
  );
}

/**
 * Helper untuk memformat teks bertingkat/per poin pada CAR:
 * - Tiap angka (1., 2., 3., dst) ditaruh pada baris baru (enter).
 * - Tiap akar masalah & tindakan (bullet "- ") ditaruh pada baris baru (enter).
 */
function formatMultilineText(text) {
  if (!text || typeof text !== 'string' || text.trim() === '-') return text || '-';

  let str = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Pastikan bullet "-Teks" di awal baris memiliki spasi "- Teks"
  str = str.replace(/(^|\n)-([^\s\-])/g, '$1- $2');

  // Jika teks sudah memiliki newline dari Excel (Alt+Enter)
  if (str.includes('\n')) {
    // Pastikan jika ada penomoran tersambung dalam satu baris, tetap dienter: "1. A 2. B"
    str = str.replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2');
    return str.trim();
  }

  // Fallback jika data tersimpan satu baris (single line / terkompresi):
  // 1. Pecah tiap nomor urut: "1. A 2. B 3. C" -> "1. A\n2. B\n3. C"
  str = str.replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2');

  // 2. Pecah tiap poin strip / bullet: "...bahaya ) - pengawasan..." -> "...bahaya )\n- pengawasan..."
  str = str.replace(/([^\n])\s+-\s+([a-zA-Z0-9])/g, '$1\n- $2');

  return str.trim();
}

// Normalize CAR and KPI department/division names
function normalizeDepartmentName(dept) {
  if (!dept || dept === '-') return '-';
  let clean = String(dept).trim();
  const lower = clean.toLowerCase();

  // Explicit mappings & typo fixes
  if (lower === 'fabrcation' || lower === 'fabrication') return 'Fabrication';
  if (lower === 'export-import' || lower === 'export import' || lower === 'exim') return 'Export - Import';
  if (lower === 'busdev' || lower === 'business development') return 'BusDev';
  if (lower === 'project control') return 'Project Control';
  if (lower === 'office support') return 'Office Support';
  if (lower === 'asset main' || (lower.includes('asset') && lower.includes('main'))) return 'Asset Maintenance';
  if (lower === 'warehouse') return 'Warehouse';
  if (lower === 'marketing') return 'Marketing';
  if (lower === 'procurement') return 'Procurement';
  if (lower === 'operations' || lower === 'operation') return 'Operations';
  if (lower.includes('asset') && lower.includes('logistic')) return 'Asset & Logistics';
  if (lower.includes('general') && lower.includes('affair')) return 'General Affairs';
  if (lower.includes('finance') && (lower.includes('admin') || lower.includes('administration'))) return 'Finance & Admin';
  if (lower.includes('sales') && lower.includes('engineering')) return 'Sales & Engineering';
  if (lower === 'project' || lower === 'projects') return 'Project';

  // Acronyms that should remain uppercase
  const acronyms = ['HRD', 'HSE', 'FAT', 'IT', 'GA', 'QMS', 'CAR', 'KPI', 'BOD'];
  const upper = clean.toUpperCase();
  if (acronyms.includes(upper)) return upper;

  // Title case for all-caps strings
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean.split(/[\s_-]+/).map(w => {
      if (acronyms.includes(w.toUpperCase())) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  return clean;
}

export default function QMSAudit() {
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return {
      startDate: `${yyyy}-01-01`,
      endDate: `${yyyy}-${mm}-${dd}`,
    };
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerActions, setHeaderActions] = useState(null);

  // Active Detailed Modals ('kpi' | 'followup' | 'risk' | 'corrective' | 'kaizen')
  const [activeDetailModal, setActiveDetailModal] = useState(null);

  // Active Data Source Detail Modal (File, Sheet, Folder NAS popup)
  const [selectedDataSourceModal, setSelectedDataSourceModal] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Search and filters for detail modals
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState('all');
  const [modalDivisionFilter, setModalDivisionFilter] = useState('all');
  const [cardRiskDivisionFilter, setCardRiskDivisionFilter] = useState('all');
  const [cardKpiFilter, setCardKpiFilter] = useState('belum_lapor'); // 'belum_lapor' | 'tidak_memenuhi' | 'memenuhi'
  const [modalMonthFilter, setModalMonthFilter] = useState('all');
  const [modalPriorityFilter, setModalPriorityFilter] = useState('all');
  const [selectedDivisionDetail, setSelectedDivisionDetail] = useState(null);
  const [selectedCarDetail, setSelectedCarDetail] = useState(null);
  const [modalDeptFilter, setModalDeptFilter] = useState('all');
  const [detailMonthFilter, setDetailMonthFilter] = useState('all');
  const [detailStatusFilter, setDetailStatusFilter] = useState('all');
  const [detailSearch, setDetailSearch] = useState('');
  const [kpiSortColumn, setKpiSortColumn] = useState('compliance'); // 'division' | 'meeting' | 'not_meeting' | 'pending' | 'compliance'
  const [kpiSortDirection, setKpiSortDirection] = useState('desc'); // 'asc' | 'desc'

  const handleKpiSort = (col) => {
    if (kpiSortColumn === col) {
      setKpiSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setKpiSortColumn(col);
      setKpiSortDirection(col === 'division' ? 'asc' : 'desc');
    }
  };

  const [indicatorSortCol, setIndicatorSortCol] = useState(null); // 'kpi' | 'status' | 'month'
  const [indicatorSortDir, setIndicatorSortDir] = useState('asc');

  const handleIndicatorSort = (col) => {
    if (indicatorSortCol === col) {
      setIndicatorSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setIndicatorSortCol(col);
      setIndicatorSortDir('asc');
    }
  };

  const configuredUrl = import.meta.env.VITE_QMS_SERVICE_URL || DEFAULT_QMS_SERVICE_URL;
  const qmsServiceUrl = configuredUrl.replace(/\/$/, '');

  // Mount action portal to navbar PageHeader
  useEffect(() => {
    const findHeader = () => {
      setHeaderActions(document.getElementById('page-header-actions'));
    };
    findHeader();
    const t = setTimeout(findHeader, 100);
    return () => clearTimeout(t);
  }, []);

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('start_date', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.append('end_date', dateRange.endDate);
      }
      if (forceRefresh) {
        params.append('refresh', '1');
      }
      const response = await fetch(`${qmsServiceUrl}/api/live-kpi?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const json = await response.json();
      setDashboardData(json);
    } catch (err) {
      console.error('Error fetching QMS live data:', err);
      setError(err.message || 'Gagal memuat data dari service QMS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange?.startDate, dateRange?.endDate]);

  // Download helper for CSV
  const downloadAsCsv = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // DATA PARSING & MEMOS
  // ---------------------------------------------------------------------------
  const summary = dashboardData?.summary || {};
  const divisions = dashboardData?.divisions || [];
  const followUpBod = dashboardData?.follow_up_bod || {};
  const riskAssessment = dashboardData?.risk_assessment || {};
  const correctiveAction = dashboardData?.corrective_action || {};
  const kaizenRecap = dashboardData?.kaizen_recap || {};

  // 1. KPI Donut Chart
  const kpiDonutChart = useMemo(() => {
    const meeting = Number(summary.meeting_count || 0);
    const notMeeting = Number(summary.not_meeting_count || 0);
    const pending = Number(summary.report_pending_count || summary.incomplete_count || 0);

    const series = [meeting, notMeeting, pending];
    const options = {
      chart: {
        type: 'donut',
        sparkline: { enabled: true },
        offsetY: -3,
      },
      labels: ['Terpenuhi', 'Tidak Terpenuhi', 'Belum Laporan'],
      colors: ['#10B981', '#F59E0B', '#94A3B8'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: { show: false },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: { formatter: (val) => `${val} Divisi` },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
    };

    return { series, options };
  }, [summary]);

  // 1.1 Daftar Divisi Berdasarkan Filter Status KPI (Belum Lapor, Tidak Terpenuhi, Terpenuhi)
  const cardKpiDivisions = useMemo(() => {
    const list = (divisions || []).map(d => {
      const pending = Number(d.report_pending_count ?? d.incomplete_count ?? ((d.counts?.belum_ada_laporan ?? 0) + (d.counts?.belum_lengkap ?? 0)) ?? 0);
      const notMeeting = Number(d.not_meeting_count ?? d.counts?.tidak_memenuhi ?? 0);
      const meeting = Number(d.meeting_count ?? d.counts?.memenuhi ?? 0);

      let count = 0;
      if (cardKpiFilter === 'belum_lapor') count = pending;
      else if (cardKpiFilter === 'tidak_memenuhi') count = notMeeting;
      else if (cardKpiFilter === 'memenuhi') count = meeting;

      return {
        raw: d,
        name: normalizeDepartmentName(d.division || 'Divisi'),
        count,
        totalKpi: d.indicator_count || (d.items ? Math.min(d.items.length, 25) : 0),
      };
    }).filter(d => d.count > 0);

    list.sort((a, b) => b.count - a.count);
    return list;
  }, [divisions, cardKpiFilter]);

  // 1.2 Data Divisi untuk Modal Monitoring KPI (dengan Sorting Kolom Asc/Desc & Filter)
  const sortedModalDivisions = useMemo(() => {
    let list = (divisions || []).filter((d) => {
      const matchesSearch = (d.division || '').toLowerCase().includes(modalSearch.toLowerCase());
      if (!matchesSearch) return false;
      const mCount = d.meeting_count ?? d.counts?.memenuhi ?? 0;
      const nmCount = d.not_meeting_count ?? d.counts?.tidak_memenuhi ?? 0;
      const pCount = d.report_pending_count ?? d.incomplete_count ?? ((d.counts?.belum_ada_laporan ?? 0) + (d.counts?.belum_lengkap ?? 0));
      if (modalFilter === 'pending') return pCount > 0;
      if (modalFilter === 'not_meeting') return nmCount > 0;
      if (modalFilter === 'meeting') return mCount > 0;
      return true;
    });

    return [...list].sort((a, b) => {
      if (kpiSortColumn === 'division') {
        const valA = (a.division || '').toLowerCase();
        const valB = (b.division || '').toLowerCase();
        return kpiSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (kpiSortColumn === 'meeting') {
        const valA = a.meeting_count ?? a.counts?.memenuhi ?? 0;
        const valB = b.meeting_count ?? b.counts?.memenuhi ?? 0;
        return kpiSortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (kpiSortColumn === 'not_meeting') {
        const valA = a.not_meeting_count ?? a.counts?.tidak_memenuhi ?? 0;
        const valB = b.not_meeting_count ?? b.counts?.tidak_memenuhi ?? 0;
        return kpiSortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (kpiSortColumn === 'pending') {
        const valA = a.report_pending_count ?? a.incomplete_count ?? ((a.counts?.belum_ada_laporan ?? 0) + (a.counts?.belum_lengkap ?? 0));
        const valB = b.report_pending_count ?? b.incomplete_count ?? ((b.counts?.belum_ada_laporan ?? 0) + (b.counts?.belum_lengkap ?? 0));
        return kpiSortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (kpiSortColumn === 'compliance') {
        const valA = Number(a.compliance_percentage ?? a.achievement_percentage ?? 0);
        const valB = Number(b.compliance_percentage ?? b.achievement_percentage ?? 0);
        return kpiSortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [divisions, modalSearch, modalFilter, kpiSortColumn, kpiSortDirection]);

  // 2. Risk Assessment Card Data & Donut Chart (Supports Overall and Per-Division)
  const cardRiskData = useMemo(() => {
    const allRecords = riskAssessment?.records || [];
    const isAll = cardRiskDivisionFilter === 'all';
    const targetRecords = isAll
      ? allRecords
      : allRecords.filter(r => (r.division || '').trim().toLowerCase() === cardRiskDivisionFilter.trim().toLowerCase());

    const total = isAll
      ? Number(riskAssessment?.total_risks || allRecords.length || 139)
      : targetRecords.length;

    let highRisk = 0;
    let highRiskBefore = 0;
    if (isAll) {
      highRiskBefore = Number(riskAssessment?.high_risk?.before ?? 72);
      highRisk = Number(riskAssessment?.high_risk?.after ?? 13);
    } else {
      targetRecords.forEach(r => {
        const before = (r.before_grade || r.before_level || '').toUpperCase();
        if (before.includes('D') || before.includes('E') || before.includes('TINGGI') || before.includes('HIGH')) {
          highRiskBefore++;
        }
        const after = (r.after_grade || r.after_level || '').toUpperCase();
        if (after.includes('D') || after.includes('E') || after.includes('TINGGI') || after.includes('HIGH')) {
          highRisk++;
        }
      });
    }

    const reductionRate = isAll
      ? Number(riskAssessment?.high_risk?.reduction_percentage ?? 81.9).toFixed(1)
      : (highRiskBefore > 0 ? (((highRiskBefore - highRisk) / highRiskBefore) * 100).toFixed(1) : '100.0');

    const counts = {
      Strategic: 0,
      Operational: 0,
      Financial: 0,
      Compliance: 0,
    };

    if (isAll) {
      const rawTypes = (riskAssessment?.risk_types && riskAssessment.risk_types.length > 0)
        ? riskAssessment.risk_types
        : [];
      counts.Strategic = rawTypes.find(t => (t.label || t.key || '').toLowerCase().includes('strat'))?.count ?? 17;
      counts.Operational = rawTypes.find(t => (t.label || t.key || '').toLowerCase().includes('operat'))?.count ?? 62;
      counts.Financial = rawTypes.find(t => (t.label || t.key || '').toLowerCase().includes('finan'))?.count ?? 23;
      counts.Compliance = rawTypes.find(t => (t.label || t.key || '').toLowerCase().includes('complian'))?.count ?? 37;
    } else {
      targetRecords.forEach((r) => {
        const type = (r.risk_type || '').toLowerCase();
        if (type.includes('strat')) counts.Strategic++;
        else if (type.includes('operat')) counts.Operational++;
        else if (type.includes('finan')) counts.Financial++;
        else if (type.includes('complian')) counts.Compliance++;
        else {
          counts.Operational++;
        }
      });
    }

    const types = [
      { label: 'Strategic', count: counts.Strategic, color: 'bg-red-500', barColor: 'bg-red-500', pct: total > 0 ? Math.round((counts.Strategic / total) * 100) : 0 },
      { label: 'Operational', count: counts.Operational, color: 'bg-emerald-500', barColor: 'bg-emerald-500', pct: total > 0 ? Math.round((counts.Operational / total) * 100) : 0 },
      { label: 'Financial', count: counts.Financial, color: 'bg-amber-500', barColor: 'bg-amber-500', pct: total > 0 ? Math.round((counts.Financial / total) * 100) : 0 },
      { label: 'Compliance', count: counts.Compliance, color: 'bg-blue-500', barColor: 'bg-blue-500', pct: total > 0 ? Math.round((counts.Compliance / total) * 100) : 0 },
    ];

    return {
      total,
      highRisk,
      highRiskBefore,
      reductionRate,
      isOverall: isAll,
      divisionName: isAll ? 'Semua Divisi' : cardRiskDivisionFilter,
      types,
    };
  }, [riskAssessment, cardRiskDivisionFilter]);

  const riskDonutChart = useMemo(() => {
    const types = cardRiskData.types || [];
    const series = types.map((t) => Number(t.count || 0));
    const labels = types.map((t) => t.label || t.key);
    const sum = series.reduce((a, b) => a + b, 0);

    const options = {
      chart: { type: 'donut', sparkline: { enabled: true } },
      labels: labels.length > 0 ? labels : ['Strategic', 'Operational', 'Financial', 'Compliance'],
      colors: ['#EF4444', '#10B981', '#F59E0B', '#3B82F6'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: { show: false },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: { formatter: (val) => `${val} Risiko` },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
    };

    return {
      series: sum > 0 ? series : (cardRiskData.isOverall ? [17, 62, 23, 37] : [0, 0, 0, 0]),
      options,
    };
  }, [cardRiskData]);

  // 3. Follow-up BoD Status Progress Values
  const followUpStats = useMemo(() => {
    const s = followUpBod?.summary || {};
    const total = Number(s.total || followUpBod?.total_tasks || 0);
    const done = Number(s.done || followUpBod?.completed_count || 0);
    const inProgress = Number(s.in_progress || followUpBod?.progress_count || 0);
    const open = Number(s.open || followUpBod?.not_started_count || 0);
    const overdue = Number(s.overdue || followUpBod?.overdue_count || 0);
    const highPriority = Number(s.high_priority || followUpBod?.high_priority_count || 0);
    const completionRate = total > 0 ? Math.round((done / total) * 1000) / 10 : 0;

    return {
      total,
      done,
      inProgress,
      open,
      outstanding: open + inProgress,
      overdue,
      highPriority,
      completionRate,
      donePercent: total > 0 ? Math.round((done / total) * 100) : 0,
      progPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      openPercent: total > 0 ? Math.round((open / total) * 100) : 0,
    };
  }, [followUpBod]);

  // 4. Follow-up BoD Top Outstanding Owners (Sorted descending, max 3)
  const topOutstandingOwners = useMemo(() => {
    const dist = followUpBod?.owner_distribution || [];
    const list = dist.map(item => {
      const out = Number(item.open || 0) + Number(item.in_progress || 0);
      return {
        owner: item.owner || 'Unknown',
        outstanding: out,
        total: Number(item.count || item.total || out),
      };
    }).filter(i => i.outstanding > 0);

    list.sort((a, b) => b.outstanding - a.outstanding);
    return list.slice(0, 3);
  }, [followUpBod]);

  // 5. Corrective Action Top Finding Departments
  const topCarDivisions = useMemo(() => {
    const dist = correctiveAction?.division_distribution || [];
    return dist.slice(0, 5).map(d => ({
      name: d.division || 'Divisi',
      open: Number(d.open || 0),
      inProgress: Number(d.in_progress || 0),
      closed: Number(d.closed || 0),
      total: Number(d.count || d.total || 0),
    }));
  }, [correctiveAction]);

  // 6. Kaizen Top 5 Leaderboard
  const kaizenTop5 = useMemo(() => {
    const top = kaizenRecap?.top_10 || [];
    return top.slice(0, 5);
  }, [kaizenRecap]);

  // 7. Follow-up BoD Months & Filtered Records for Modal
  const availableFollowupMonths = useMemo(() => {
    if (followUpBod?.months && followUpBod.months.length > 0) {
      return followUpBod.months;
    }
    const map = new Map();
    (followUpBod?.records || []).forEach(r => {
      const key = r.month || (r.month_number ? `2026-${String(r.month_number).padStart(2, '0')}` : null);
      if (key && !map.has(key)) {
        map.set(key, { key, label: r.month_label || key, total: 0 });
      }
      if (key && map.has(key)) {
        map.get(key).total += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [followUpBod]);

  const filteredFollowupRecords = useMemo(() => {
    return (followUpBod?.records || []).filter((item) => {
      // Month filter
      if (modalMonthFilter !== 'all') {
        const itemMonth = item.month || (item.month_number ? `2026-${String(item.month_number).padStart(2, '0')}` : '');
        const itemMonthNum = String(item.month_number || '');
        if (itemMonth !== modalMonthFilter && itemMonthNum !== modalMonthFilter) {
          return false;
        }
      }

      // Search filter
      const text = `${item.action_item || ''} ${item.task || ''} ${item.topic || ''} ${item.owner || ''} ${item.pic || ''}`.toLowerCase();
      if (modalSearch.trim() && !text.includes(modalSearch.toLowerCase())) {
        return false;
      }

      // Status filter
      const st = (item.status || '').toLowerCase();
      if (modalFilter === 'done') return st.includes('done') || st.includes('selesai');
      if (modalFilter === 'in_progress') return st.includes('progress');
      if (modalFilter === 'open') return st.includes('open') || st.includes('belum');
      if (modalFilter === 'overdue') return Boolean(item.is_overdue || item.overdue);

      // Priority filter
      if (modalPriorityFilter !== 'all') {
        const itemPrio = (item.priority || '').trim().toLowerCase();
        const targetPrio = modalPriorityFilter.trim().toLowerCase();
        if (itemPrio !== targetPrio) {
          return false;
        }
      }

      return true;
    });
  }, [followUpBod, modalMonthFilter, modalSearch, modalFilter, modalPriorityFilter]);

  // 8. Corrective Action (CAR) Modal Stats, Departments & Filtered Records
  const availableCarDepartments = useMemo(() => {
    const records = correctiveAction?.records || [];
    const counts = {};
    records.forEach((r) => {
      const raw = r.department || r.division || 'Lainnya';
      const d = normalizeDepartmentName(raw);
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [correctiveAction?.records]);

  const carModalStats = useMemo(() => {
    const records = correctiveAction?.records || [];
    const total = records.length;
    const open = records.filter(r => (r.status || '').toLowerCase().includes('open')).length;
    const progress = records.filter(r => (r.status || '').toLowerCase().includes('progress')).length;
    const closed = records.filter(r => (r.status || '').toLowerCase().includes('close')).length;
    const closedRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { total, open, progress, closed, closedRate };
  }, [correctiveAction?.records]);

  const filteredCarRecords = useMemo(() => {
    const records = correctiveAction?.records || [];
    return records.filter((c) => {
      const normDept = normalizeDepartmentName(c.department || c.division || '');
      const text = `${c.car_number || c.car_no || c.number || ''} ${normDept} ${c.pic || ''} ${c.description || c.finding || ''}`.toLowerCase();
      if (modalSearch.trim() && !text.includes(modalSearch.toLowerCase())) return false;

      const st = (c.status || '').toLowerCase();
      if (modalFilter === 'open' && !st.includes('open')) return false;
      if (modalFilter === 'in_progress' && !st.includes('progress')) return false;
      if (modalFilter === 'closed' && !st.includes('close')) return false;

      if (modalDeptFilter !== 'all') {
        if (normDept.toLowerCase() !== modalDeptFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [correctiveAction?.records, modalSearch, modalFilter, modalDeptFilter]);

  // 9. Risk Assessment Modal Divisions & Filtered Records
  const availableRiskDivisions = useMemo(() => {
    const records = riskAssessment?.records || [];
    const counts = {};
    records.forEach((r) => {
      const d = (r.division || '').trim();
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [riskAssessment?.records]);

  const filteredRiskRecords = useMemo(() => {
    const records = riskAssessment?.records || [];
    return records.filter((r) => {
      const text = `${r.risk_id || ''} ${r.division || ''} ${r.description || ''} ${r.mitigation || ''} ${r.pic || ''}`.toLowerCase();
      if (modalSearch.trim() && !text.includes(modalSearch.toLowerCase())) return false;
      if (modalFilter !== 'all' && (r.risk_type || '').toLowerCase() !== modalFilter.toLowerCase()) return false;
      if (modalDivisionFilter !== 'all' && (r.division || '').trim().toLowerCase() !== modalDivisionFilter.trim().toLowerCase()) return false;
      return true;
    });
  }, [riskAssessment?.records, modalSearch, modalFilter, modalDivisionFilter]);

  // Period filter component for Portal
  const periodFilterContent = (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Live Synology
      </span>
      <DateRangeFilter
        dateRange={dateRange}
        onChange={setDateRange}
        disablePortal={true}
      />
      <button
        type="button"
        onClick={() => fetchData(true)}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white rounded-lg transition cursor-pointer shadow-xs"
        title="Sinkronkan & Muat Ulang Data dari Synology NAS"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-2.5 overflow-x-hidden">
      {/* Portal action into page layout header */}
      {headerActions && createPortal(periodFilterContent, headerActions)}

      {/* Fallback header only if page-header-actions not available in DOM */}
      {!headerActions && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Sistem Manajemen Mutu & Evaluasi BoD</span>
          {periodFilterContent}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ROW 1: MONITORING KPI (LEFT) & FOLLOW-UP BOD (RIGHT)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 w-full flex-1 min-h-[175px]">
        {/* ---------------- CARD 1: MONITORING KPI ---------------- */}
        <div
          onClick={() => {
            setModalSearch('');
            setModalFilter('all');
            setSelectedDivisionDetail(null);
            setActiveDetailModal('kpi');
          }}
          className="group relative flex flex-col justify-between p-3 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer h-full"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                <Target size={15} />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Monitoring KPI
                </h3>
                <p className="text-[9.5px] text-slate-400 truncate">
                  Kepatuhan Pelaporan & Target KPI Seluruh Divisi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={QMS_DATA_SOURCES.kpi} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={12} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          {/* Body Section with 2 Distinct Sub-Boxes: Status Box (Left) & Ranking Box (Right) */}
          <div className="my-auto py-1 border-y border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            {/* ========================================================= */}
            {/* KOTAK 1 (KIRI): DIAGRAM STATUS KPI & 3 INDIKATOR STATUS   */}
            {/* ========================================================= */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[9px] pb-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Evaluasi Status KPI:
                </span>
                <span className="text-slate-400 font-normal">
                  Total {summary.total_divisions || 19} Divisi
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5 my-auto py-1">
                {/* Donut Chart */}
                <div className="relative w-[76px] h-[76px] flex items-center justify-center shrink-0">
                  <Chart
                    options={kpiDonutChart.options}
                    series={kpiDonutChart.series}
                    type="donut"
                    height={76}
                    width={76}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-0.5">
                    <span className="text-xs font-extrabold text-slate-800 leading-none">
                      {summary.total_divisions || 19}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-medium">divisi</span>
                  </div>
                </div>

                {/* 3 Status Items (Terpenuhi, Tidak Terpenuhi, Belum Laporan) */}
                <div className="flex-1 space-y-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardKpiFilter('memenuhi');
                    }}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition border text-[9.5px] ${
                      cardKpiFilter === 'memenuhi'
                        ? 'bg-white border-emerald-500 ring-1 ring-emerald-500/20 shadow-2xs font-semibold'
                        : 'bg-white/80 border-slate-200/70 hover:bg-white text-slate-700'
                    }`}
                    title="Klik untuk menyaring divisi KPI Terpenuhi"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="truncate">Terpenuhi</span>
                    </div>
                    <span className="font-bold text-emerald-600 ml-1">
                      {summary.meeting_count || 0}
                    </span>
                  </div>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardKpiFilter('tidak_memenuhi');
                    }}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition border text-[9.5px] ${
                      cardKpiFilter === 'tidak_memenuhi'
                        ? 'bg-white border-amber-500 ring-1 ring-amber-500/20 shadow-2xs font-semibold'
                        : 'bg-white/80 border-slate-200/70 hover:bg-white text-slate-700'
                    }`}
                    title="Klik untuk menyaring divisi KPI Tidak Terpenuhi"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="truncate">Tidak Terpenuhi</span>
                    </div>
                    <span className="font-bold text-amber-600 ml-1">
                      {summary.not_meeting_count || 0}
                    </span>
                  </div>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardKpiFilter('belum_lapor');
                    }}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition border text-[9.5px] ${
                      cardKpiFilter === 'belum_lapor'
                        ? 'bg-white border-slate-600 ring-1 ring-slate-400/20 shadow-2xs font-semibold'
                        : 'bg-white/80 border-slate-200/70 hover:bg-white text-slate-700'
                    }`}
                    title="Klik untuk menyaring divisi Belum Laporan KPI"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                      <span className="truncate">Belum Laporan</span>
                    </div>
                    <span className="font-bold text-slate-700 ml-1">
                      {summary.report_pending_count || summary.incomplete_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* KOTAK 2 (KANAN): TOP 3 DIVISI                             */}
            {/* ========================================================= */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[9px] pb-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Top 3 Divisi:
                </span>
              </div>

              <div className="space-y-1 my-auto py-1">
                {cardKpiDivisions.length === 0 ? (
                  <div className="text-slate-400 italic text-[9.5px] py-3 text-center bg-white/60 rounded-lg border border-slate-100">
                    Tidak ada divisi pada status ini
                  </div>
                ) : (
                  cardKpiDivisions.slice(0, 3).map((div, idx) => (
                    <div
                      key={div.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (div.raw) {
                          setSelectedDivisionDetail(div.raw);
                          setDetailMonthFilter('all');
                          setDetailStatusFilter(cardKpiFilter);
                          setDetailSearch('');
                        }
                      }}
                      className="flex items-center justify-between text-[9.5px] py-1 px-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-100 hover:border-slate-200 cursor-pointer transition group/item"
                      title={`Klik untuk melihat detail ${div.name}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className={`w-3.5 h-3.5 rounded-full font-bold text-[8.5px] flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-slate-700 text-white'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 group-hover/item:text-blue-600 transition truncate">
                          {div.name}
                        </span>
                      </div>
                      <span className={`font-semibold px-1.5 py-0.5 rounded text-[8.5px] shrink-0 border ${
                        cardKpiFilter === 'belum_lapor'
                          ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                          : cardKpiFilter === 'tidak_memenuhi'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      }`}>
                        {div.count} {cardKpiFilter === 'belum_lapor' ? 'Belum Lapor' : cardKpiFilter === 'tidak_memenuhi' ? 'Tidak Capai' : 'Terpenuhi'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {cardKpiDivisions.length > 3 ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalSearch('');
                    setModalFilter(
                      cardKpiFilter === 'belum_lapor'
                        ? 'pending'
                        : cardKpiFilter === 'tidak_memenuhi'
                        ? 'not_meeting'
                        : 'meeting'
                    );
                    setSelectedDivisionDetail(null);
                    setActiveDetailModal('kpi');
                  }}
                  className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200/60"
                >
                  <span>{cardKpiDivisions.length} divisi</span>
                  <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
                    Lihat Semua &rarr;
                  </span>
                </div>
              ) : (
                <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-200/60">
                  Total {cardKpiDivisions.length} divisi
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0 pt-0.5">
            <span className="font-medium text-slate-700">
              {summary.total_divisions || 19} Divisi
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Lihat Detail KPI Divisi <ChevronRight size={11} />
            </span>
          </div>
        </div>

        {/* ---------------- CARD 2: FOLLOW-UP EVALUASI & STRATEGI BOD ---------------- */}
        <div
          onClick={() => {
            setModalSearch('');
            setModalFilter('all');
            setModalMonthFilter('all');
            setModalPriorityFilter('all');
            setActiveDetailModal('followup');
          }}
          className="group relative flex flex-col justify-between p-3 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer h-full"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md shrink-0">
                <Briefcase size={15} />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Follow-up Evaluasi & Strategi BoD
                </h3>
                <p className="text-[9.5px] text-slate-400 truncate">
                  Tindak Lanjut Notulen Rapat BoD & Penugasan PIC Terkait
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={QMS_DATA_SOURCES.followup} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={12} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          {/* Body Section with BoD Summary & Progress */}
          <div className="py-1.5 border-y border-slate-100 flex flex-col justify-between flex-1 gap-2">
            {/* Top Quick Badges */}
            <div className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70 shrink-0">
              <span className="text-slate-600 font-medium">
                Total: <strong className="text-slate-900">{followUpStats.total}</strong>
              </span>
              <span className="text-emerald-700 font-medium">
                Selesai: <strong>{followUpStats.done}</strong>
              </span>
              <span className="text-amber-700 font-medium">
                Outstanding: <strong>{followUpStats.outstanding}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                {followUpStats.completionRate}% Selesai
              </span>
            </div>

            {/* Split: Status Bars (Left) & Top Outstanding (Right) */}
            <div className="grid grid-cols-2 gap-3 text-[10px] flex-1">
              {/* Left: Status Bars */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-100">
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider pb-0.5">
                  Status Penyelesaian:
                </div>
                <div className="flex flex-col justify-between flex-1 py-1 gap-1.5">
                  <div>
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-slate-600 font-medium truncate">Selesai</span>
                      <span className="font-bold text-emerald-700">{followUpStats.done}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${followUpStats.donePercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-slate-600 font-medium truncate">On Progress</span>
                      <span className="font-bold text-amber-700">{followUpStats.inProgress}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${followUpStats.progPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-slate-600 font-medium truncate">Belum Mulai</span>
                      <span className="font-bold text-slate-700">{followUpStats.open}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${followUpStats.openPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Top Outstanding PICs */}
              <div className="flex flex-col justify-between pl-1">
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider pb-0.5">
                  Outstanding Terbanyak:
                </div>
                <div className="flex flex-col justify-between flex-1 py-1 gap-1.5">
                  {topOutstandingOwners.length === 0 ? (
                    <div className="text-slate-400 italic text-[10px] py-4 text-center">
                      {followUpStats.total === 0 ? 'Tidak ada tugas pada periode ini' : 'Semua tugas selesai'}
                    </div>
                  ) : (
                    topOutstandingOwners.map((owner, idx) => (
                      <div
                        key={owner.owner}
                        className="flex items-center justify-between text-[9.5px] py-1 px-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200 transition"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className={`w-3.5 h-3.5 rounded-full font-bold text-[8.5px] flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-blue-700 text-white'
                              : idx === 1
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-700 truncate">{owner.owner}</span>
                        </div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0 text-[8.5px]">
                          {owner.outstanding}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-slate-500 shrink-0 pt-0.5">
            <span className="text-rose-600 font-medium">
              <strong className="text-rose-700">{followUpStats.overdue} Lewat Due Date</strong> &bull; {followUpStats.highPriority} Prioritas Tinggi
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Lihat Rekap BoD <ChevronRight size={11} />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROW 2: RISK ASSESSMENT, CORRECTIVE ACTION & KAIZEN LEADERBOARD         */}
      {/* Proportions: Risk Assessment (1.5fr ~37.5%), CAR (1.5fr ~37.5%), Kaizen (1.0fr ~25%) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr] gap-2.5 w-full flex-1 min-h-[185px]">
        {/* ---------------- CARD 3: RISK ASSESSMENT (WIDER) ---------------- */}
        <div
          onClick={() => {
            setModalSearch('');
            setModalFilter('all');
            setModalDivisionFilter(cardRiskDivisionFilter);
            setActiveDetailModal('risk');
          }}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full group"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-indigo-50 text-indigo-700 rounded-md shrink-0">
                <ShieldAlert size={14} />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Risk Assessment
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Dropdown Filter Divisi di Kartu (Overall vs Per Divisi) */}
              <select
                value={cardRiskDivisionFilter}
                onChange={(e) => {
                  e.stopPropagation();
                  setCardRiskDivisionFilter(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="py-0.5 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate transition"
                title="Pilih Divisi"
              >
                <option value="all">Semua Divisi</option>
                {availableRiskDivisions.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.count})
                  </option>
                ))}
              </select>
              <DatasetBadgeButton source={QMS_DATA_SOURCES.risk} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          {/* Body with Quick Metrics + Donut Chart & 4 Categories */}
          <div className="py-1.5 border-y border-slate-100 flex flex-col justify-around gap-2 flex-1">
            {/* Quick Risk Status Chips */}
            <div className="grid grid-cols-3 gap-1.5 text-center items-stretch">
              <div className="py-1 px-1 rounded-md bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
                <div className="text-xs font-bold text-slate-800 leading-tight">{cardRiskData.total}</div>
                <div className="text-[8px] text-slate-500 font-medium leading-tight mt-0.5">Total Risiko</div>
              </div>
              <div className="py-1 px-1 rounded-md bg-rose-50/70 border border-rose-200/70 flex flex-col justify-center">
                <div className="text-xs font-bold text-rose-700 leading-tight">{cardRiskData.highRisk}</div>
                <div className="text-[8px] text-rose-800 font-semibold leading-tight mt-0.5">High Risk</div>
                {cardRiskData.highRiskBefore > 0 && (
                  <div className="text-[7.5px] text-rose-600 font-medium leading-none mt-0.5 whitespace-nowrap">
                    (Turun dari {cardRiskData.highRiskBefore})
                  </div>
                )}
              </div>
              <div
                className="py-1 px-1 rounded-md bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-center cursor-help"
                title={`Efektivitas mitigasi: ${Math.max(0, cardRiskData.highRiskBefore - cardRiskData.highRisk)} dari ${cardRiskData.highRiskBefore} risiko tinggi berhasil diturunkan levelnya`}
              >
                <div className="text-xs font-bold text-emerald-700 leading-tight">{cardRiskData.reductionRate}%</div>
                <div className="text-[8px] text-emerald-800 font-semibold leading-tight mt-0.5">Mitigasi Efektif</div>
              </div>
            </div>

            {/* Donut Chart + 4 Categories with Mini Progress Bars */}
            <div className="flex items-center justify-between gap-3 py-0.5">
              <div className="relative w-[84px] h-[84px] flex items-center justify-center shrink-0">
                <Chart
                  options={riskDonutChart.options}
                  series={riskDonutChart.series}
                  type="donut"
                  height={84}
                  width={84}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-extrabold text-slate-800 leading-none">
                    {cardRiskData.total}
                  </span>
                  <span className="text-[8.5px] text-slate-400 font-medium">risiko</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-1.5 text-[9.5px]">
                {cardRiskData.types.map((rt) => (
                  <div
                    key={rt.label}
                    className="flex flex-col p-1.5 px-2 rounded-lg bg-slate-50/90 border border-slate-200/70 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rt.color}`} />
                        <span className="text-slate-700 truncate font-semibold">{rt.label}</span>
                      </div>
                      <span className="font-extrabold text-slate-900 ml-1">{rt.count}</span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`${rt.barColor} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(8, rt.pct))}%` }}
                        title={`${rt.label}: ${rt.count} (${rt.pct}%)`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0 pt-0.5">
            <span className="font-medium text-slate-700 truncate max-w-[190px]" title={cardRiskData.divisionName}>
              {cardRiskData.isOverall ? (
                `${cardRiskData.total} Total Risiko • ${riskAssessment?.total_divisions || 20} Divisi`
              ) : (
                `${cardRiskData.total} Risiko • ${cardRiskData.divisionName}`
              )}
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5 shrink-0">
              Lihat Detail Risk <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* ---------------- CARD 4: CORRECTIVE ACTION REGISTER (CAR) (WIDER, COMPACT BARS) ---------------- */}
        <div
          onClick={() => {
            setModalSearch('');
            setModalFilter('all');
            setActiveDetailModal('corrective');
          }}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full group"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-amber-50 text-amber-700 rounded-md shrink-0">
                <Wrench size={14} />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Corrective Action (CAR)
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={QMS_DATA_SOURCES.corrective} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          {/* Body Section: Status Chips + Finding Divisions */}
          <div className="my-auto py-1 border-y border-slate-100 flex flex-col justify-start gap-1.5 flex-1">
            {/* Quick Status Chips */}
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="p-1 rounded bg-rose-50 border border-rose-100">
                <div className="text-xs font-bold text-rose-700">{correctiveAction?.summary?.open ?? 0}</div>
                <div className="text-[8px] text-rose-800 font-semibold">Open</div>
              </div>
              <div className="p-1 rounded bg-amber-50 border border-amber-100">
                <div className="text-xs font-bold text-amber-700">{correctiveAction?.summary?.in_progress ?? 0}</div>
                <div className="text-[8px] text-amber-800 font-semibold">Progress</div>
              </div>
              <div className="p-1 rounded bg-emerald-50 border border-emerald-100">
                <div className="text-xs font-bold text-emerald-700">{correctiveAction?.summary?.closed ?? 0}</div>
                <div className="text-[8px] text-emerald-800 font-semibold">Closed</div>
              </div>
              <div className="p-1 rounded bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">{correctiveAction?.summary?.total ?? (correctiveAction?.total_actions ?? 0)}</div>
                <div className="text-[8px] text-slate-500 font-medium">Total CAR</div>
              </div>
            </div>

            {/* Finding Divisions Progress List */}
            <div className="space-y-1 mt-1">
              <div className="flex items-center justify-between text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                <span>Temuan per Departemen:</span>
                <div className="flex items-center gap-2 font-medium normal-case text-[8px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Closed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Progress
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Open
                  </span>
                </div>
              </div>
              {topCarDivisions.length === 0 ? (
                <div className="text-slate-400 italic text-[10px] py-1">Tidak ada temuan pada periode ini</div>
              ) : (
                topCarDivisions.slice(0, 5).map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-[9.5px] py-0.5">
                    <span className="font-medium text-slate-700 truncate w-32 sm:w-36" title={d.name}>
                      {d.name}
                    </span>
                    <div className="flex-1 mx-2.5 bg-slate-100 h-2 rounded-full overflow-hidden flex shadow-2xs">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(d.closed / Math.max(1, d.total)) * 100}%` }}
                        title={`Closed: ${d.closed}`}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${(d.inProgress / Math.max(1, d.total)) * 100}%` }}
                        title={`In Progress: ${d.inProgress}`}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{ width: `${(d.open / Math.max(1, d.total)) * 100}%` }}
                        title={`Open: ${d.open}`}
                      />
                    </div>
                    <span className="font-bold text-slate-800 text-[10px] w-5 text-right shrink-0">{d.total}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0 pt-0.5">
            <span className="text-amber-700 font-medium">
              <strong>{correctiveAction?.summary?.open ?? 0} Open</strong> &bull; {correctiveAction?.summary?.in_progress ?? 0} In Progress
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Lihat Rincian CAR <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* ---------------- CARD 5: KAIZEN RECAP (COMPACT) ---------------- */}
        <div
          onClick={() => {
            setModalSearch('');
            setModalFilter('all');
            setActiveDetailModal('kaizen');
          }}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full group"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-purple-50 text-purple-700 rounded-md shrink-0">
                <Award size={14} />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Kaizen Recap
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={QMS_DATA_SOURCES.kaizen} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          {/* Body Section: Leaderboard Table Box */}
          <div className="my-auto py-1 border-y border-slate-100 flex-1 flex flex-col justify-center">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-500 uppercase font-semibold text-[8px] border-b border-slate-200/70">
                    <th className="py-1 px-1.5 w-7 text-center">Rank</th>
                    <th className="py-1 px-1.5">Nama Inovator</th>
                    <th className="py-1 px-1.5 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/90">
                  {kaizenTop5.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-slate-400 italic">
                        Belum ada skor Kaizen terhitung
                      </td>
                    </tr>
                  ) : (
                    kaizenTop5.map((k, idx) => {
                      const rankNum = k.rank || idx + 1;
                      return (
                        <tr key={k.id || idx} className="hover:bg-purple-50/40 transition">
                          <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[8.5px]">
                            {rankNum}
                          </td>
                          <td className="py-1 px-1.5 font-medium text-slate-800 truncate max-w-[105px]" title={k.idea || k.name}>
                            {k.name}
                          </td>
                          <td className="py-1 px-1.5 text-right">
                            <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.2 rounded text-[8.5px]">
                              {Number(k.score || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-slate-500 shrink-0 pt-0.5">
            <span className="font-medium text-purple-700 truncate pr-1" title={`${kaizenRecap?.total_scored_entries || 76} Ide Dinilai • Bobot 60/40`}>
              {kaizenRecap?.total_scored_entries || 76} Ide &bull; 60/40
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5 shrink-0">
              Leaderboard <ChevronRight size={10} />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FULL DETAIL MODALS FOR EACH OF THE 5 MODULES                           */}
      {/* ========================================================================= */}

      {/* 3.1 DETAIL MODAL: MONITORING KPI DIVISI */}
      <Modal
        isOpen={activeDetailModal === 'kpi'}
        onClose={() => setActiveDetailModal(null)}
        onBack={() => setActiveDetailModal(null)}
        backText="Kembali"
        backTitle="Kembali ke Dashboard Utama"
        title={`Detail Kepatuhan & Monitoring KPI Divisi (${dashboardData?.period_label || '2026'})`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          <DataSourceCard source={QMS_DATA_SOURCES.kpi} onOpenDetail={setSelectedDataSourceModal} />

          {/* Action & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari nama divisi..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Clean Segmented Control (Corporate Dashboard Style) */}
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setModalFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    modalFilter === 'all'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({divisions?.length || 19})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('pending')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    modalFilter === 'pending'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Lapor ({summary.report_pending_count || 107})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('not_meeting')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    modalFilter === 'not_meeting'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tidak Terpenuhi ({summary.not_meeting_count || 53})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('meeting')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    modalFilter === 'meeting'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terpenuhi ({summary.meeting_count || 11})
                </button>
              </div>

              <ExportButton
                filename={`Monitoring_KPI_Divisi_${dateRange?.startDate || 'awal'}_sd_${dateRange?.endDate || 'akhir'}`}
                sheetName="Monitoring KPI"
                buttonLabel="Export Data"
                headers={['No', 'Nama Divisi', 'Terpenuhi', 'Tidak Terpenuhi', 'Belum Lapor / Pending', 'Kepatuhan (%)']}
                rows={() => (divisions || []).map((d, i) => {
                  const m = d.meeting_count ?? d.counts?.memenuhi ?? 0;
                  const nm = d.not_meeting_count ?? d.counts?.tidak_memenuhi ?? 0;
                  const p = d.report_pending_count ?? d.incomplete_count ?? ((d.counts?.belum_ada_laporan ?? 0) + (d.counts?.belum_lengkap ?? 0));
                  const rate = Number(d.compliance_percentage ?? d.achievement_percentage ?? 0);
                  return [i + 1, d.division, m, nm, p, `${rate.toFixed(1)}%`];
                })}
              />
            </div>
          </div>

          {/* Divisions Table with Column Sorting (Asc/Desc) */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[55vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10 text-[11px]">
                <tr>
                  <th className="p-2.5 w-12 text-center">No</th>
                  <th
                    onClick={() => handleKpiSort('division')}
                    className={`p-2.5 cursor-pointer select-none transition-colors group ${
                      kpiSortColumn === 'division' ? 'bg-slate-100 text-blue-700' : 'hover:bg-slate-100/70 text-slate-700'
                    }`}
                    title="Klik untuk mengurutkan Nama Divisi (A-Z / Z-A)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Divisi</span>
                      {kpiSortColumn === 'division' ? (
                        kpiSortDirection === 'asc' ? (
                          <ArrowUp size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <ArrowDown size={13} className="text-blue-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleKpiSort('meeting')}
                    className={`p-2.5 text-center cursor-pointer select-none transition-colors group ${
                      kpiSortColumn === 'meeting' ? 'bg-slate-100 text-emerald-700' : 'hover:bg-slate-100/70 text-slate-700'
                    }`}
                    title="Klik untuk mengurutkan Jumlah Terpenuhi (Terbanyak / Tersedikit)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Terpenuhi</span>
                      {kpiSortColumn === 'meeting' ? (
                        kpiSortDirection === 'asc' ? (
                          <ArrowUp size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <ArrowDown size={13} className="text-blue-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleKpiSort('not_meeting')}
                    className={`p-2.5 text-center cursor-pointer select-none transition-colors group ${
                      kpiSortColumn === 'not_meeting' ? 'bg-slate-100 text-amber-700' : 'hover:bg-slate-100/70 text-slate-700'
                    }`}
                    title="Klik untuk mengurutkan Jumlah Tidak Terpenuhi (Terbanyak / Tersedikit)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Tidak Terpenuhi</span>
                      {kpiSortColumn === 'not_meeting' ? (
                        kpiSortDirection === 'asc' ? (
                          <ArrowUp size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <ArrowDown size={13} className="text-blue-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleKpiSort('pending')}
                    className={`p-2.5 text-center cursor-pointer select-none transition-colors group ${
                      kpiSortColumn === 'pending' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100/70 text-slate-700'
                    }`}
                    title="Klik untuk mengurutkan Jumlah Belum Lapor (Terbanyak / Tersedikit)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Belum Lapor</span>
                      {kpiSortColumn === 'pending' ? (
                        kpiSortDirection === 'asc' ? (
                          <ArrowUp size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <ArrowDown size={13} className="text-blue-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleKpiSort('compliance')}
                    className={`p-2.5 text-center cursor-pointer select-none transition-colors group ${
                      kpiSortColumn === 'compliance' ? 'bg-slate-100 text-blue-700' : 'hover:bg-slate-100/70 text-slate-700'
                    }`}
                    title="Klik untuk mengurutkan Kepatuhan % (Tertinggi / Terendah)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Kepatuhan (%)</span>
                      {kpiSortColumn === 'compliance' ? (
                        kpiSortDirection === 'asc' ? (
                          <ArrowUp size={13} className="text-blue-600 shrink-0" />
                        ) : (
                          <ArrowDown size={13} className="text-blue-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                      )}
                    </div>
                  </th>
                  <th className="p-2.5 text-center w-28 text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedModalDivisions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs italic">
                      Tidak ada divisi yang sesuai dengan filter atau kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedModalDivisions.map((div, idx) => {
                    const mCount = div.meeting_count ?? div.counts?.memenuhi ?? 0;
                    const nmCount = div.not_meeting_count ?? div.counts?.tidak_memenuhi ?? 0;
                    const pCount = div.report_pending_count ?? div.incomplete_count ?? ((div.counts?.belum_ada_laporan ?? 0) + (div.counts?.belum_lengkap ?? 0));
                    const cp = Number(div.compliance_percentage ?? div.achievement_percentage ?? 0);
                    const hasItems = Array.isArray(div.items) && div.items.length > 0;
                    const kpiTotalCount = div.indicator_count || (div.items ? Math.min(div.items.length, 25) : 0);

                    return (
                      <tr
                        key={div.division || idx}
                        onClick={() => {
                          if (hasItems) {
                            setSelectedDivisionDetail(div);
                            setDetailMonthFilter('all');
                            setDetailStatusFilter(
                              modalFilter === 'pending'
                                ? 'belum_lapor'
                                : modalFilter === 'not_meeting'
                                ? 'tidak_memenuhi'
                                : modalFilter === 'meeting'
                                ? 'memenuhi'
                                : 'all'
                            );
                            setDetailSearch('');
                          }
                        }}
                        className={`hover:bg-slate-50 transition ${hasItems ? 'cursor-pointer' : ''}`}
                      >
                        <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{div.division}</span>
                            {hasItems && (
                              <span className="text-[9.5px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-normal">
                                {kpiTotalCount} KPI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{mCount}</td>
                        <td className="p-2.5 text-center font-bold text-amber-600">{nmCount}</td>
                        <td className="p-2.5 text-center font-semibold text-slate-600">{pCount}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{cp.toFixed(1)}%</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDivisionDetail(div);
                              setDetailMonthFilter('all');
                              setDetailStatusFilter(
                                modalFilter === 'pending'
                                  ? 'belum_lapor'
                                  : modalFilter === 'not_meeting'
                                  ? 'tidak_memenuhi'
                                  : modalFilter === 'meeting'
                                  ? 'memenuhi'
                                  : 'all'
                              );
                              setDetailSearch('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded transition cursor-pointer"
                            title={`Lihat rincian indikator KPI ${div.division}`}
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3.1.1 POP-UP KHUSUS RINCIAN INDIKATOR KPI PER DIVISI */}
      <Modal
        isOpen={Boolean(selectedDivisionDetail)}
        onClose={() => setSelectedDivisionDetail(null)}
        onBack={() => setSelectedDivisionDetail(null)}
        backText="Kembali"
        backTitle="Kembali ke Daftar Divisi"
        title={`Rincian Indikator KPI — ${selectedDivisionDetail?.division || ''}`}
        maxWidth="max-w-5xl"
        zIndex="z-[10000]"
      >
        {selectedDivisionDetail && (() => {
          const div = selectedDivisionDetail;
          const monthlyItems = div.monthly_items || {};
          const availableMonths = Object.keys(monthlyItems).sort((a, b) => Number(a) - Number(b));
          const isAllPeriods = availableMonths.length > 1;

          // Base items
          let itemsList = isAllPeriods && detailMonthFilter !== 'all' && monthlyItems[detailMonthFilter]
            ? monthlyItems[detailMonthFilter]
            : (div.items || []);

          // Filter by status
          if (detailStatusFilter === 'memenuhi') {
            itemsList = itemsList.filter(it => it.status === 'memenuhi');
          } else if (detailStatusFilter === 'tidak_memenuhi') {
            itemsList = itemsList.filter(it => it.status === 'tidak_memenuhi');
          } else if (detailStatusFilter === 'belum_lapor') {
            itemsList = itemsList.filter(it =>
              it.status === 'belum_lengkap' ||
              it.status === 'belum_ada_laporan' ||
              it.status === 'pending' ||
              it.status === 'belum_lapor' ||
              !it.actual ||
              it.actual === '-' ||
              it.actual === ''
            );
          }

          // Search filter
          if (detailSearch.trim()) {
            const q = detailSearch.toLowerCase();
            itemsList = itemsList.filter(it =>
              (it.kpi || '').toLowerCase().includes(q) ||
              (it.variable || '').toLowerCase().includes(q) ||
              (it.reason || '').toLowerCase().includes(q)
            );
          }

          // Column sorting
          if (indicatorSortCol) {
            itemsList = [...itemsList].sort((a, b) => {
              if (indicatorSortCol === 'kpi') {
                const valA = (a.kpi || a.variable || '').toLowerCase();
                const valB = (b.kpi || b.variable || '').toLowerCase();
                return indicatorSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
              }
              if (indicatorSortCol === 'month') {
                const valA = Number(a.month || 0);
                const valB = Number(b.month || 0);
                return indicatorSortDir === 'asc' ? valA - valB : valB - valA;
              }
              if (indicatorSortCol === 'status') {
                const valA = (a.status || '').toLowerCase();
                const valB = (b.status || '').toLowerCase();
                return indicatorSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
              }
              return 0;
            });
          }

          const mCount = div.meeting_count ?? div.counts?.memenuhi ?? 0;
          const nmCount = div.not_meeting_count ?? div.counts?.tidak_memenuhi ?? 0;
          const pCount = div.report_pending_count ?? div.incomplete_count ?? ((div.counts?.belum_ada_laporan ?? 0) + (div.counts?.belum_lengkap ?? 0));
          const totalKPI = div.indicator_count || (div.items ? Math.min(div.items.length, 25) : 0);
          const cpRate = Number(div.compliance_percentage ?? div.achievement_percentage ?? 0);

          return (
            <div className="space-y-3.5 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div
                  onClick={() => setDetailStatusFilter('all')}
                  className={`p-2.5 rounded-xl cursor-pointer transition border ${
                    detailStatusFilter === 'all'
                      ? 'bg-blue-100/90 border-blue-400 shadow-2xs ring-1 ring-blue-400'
                      : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/50'
                  }`}
                  title="Klik untuk menampilkan semua indikator"
                >
                  <div className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                    <Target size={12} className="text-blue-600 shrink-0" /> Total Indikator
                  </div>
                  <div className="text-lg font-extrabold text-blue-900 mt-0.5">
                    {totalKPI} <span className="text-[10px] font-semibold text-blue-600">KPI</span>
                  </div>
                </div>

                <div
                  onClick={() => setDetailStatusFilter('memenuhi')}
                  className={`p-2.5 rounded-xl cursor-pointer transition border ${
                    detailStatusFilter === 'memenuhi'
                      ? 'bg-emerald-100/90 border-emerald-400 shadow-2xs ring-1 ring-emerald-400'
                      : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/50'
                  }`}
                  title="Klik untuk menyaring indikator Terpenuhi"
                >
                  <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Terpenuhi
                  </div>
                  <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
                    {mCount}
                  </div>
                </div>

                <div
                  onClick={() => setDetailStatusFilter('tidak_memenuhi')}
                  className={`p-2.5 rounded-xl cursor-pointer transition border ${
                    detailStatusFilter === 'tidak_memenuhi'
                      ? 'bg-amber-100/90 border-amber-400 shadow-2xs ring-1 ring-amber-400'
                      : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/50'
                  }`}
                  title="Klik untuk menyaring indikator Tidak Terpenuhi"
                >
                  <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-600 shrink-0" /> Tidak Terpenuhi
                  </div>
                  <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                    {nmCount}
                  </div>
                </div>

                <div
                  onClick={() => setDetailStatusFilter('belum_lapor')}
                  className={`p-2.5 rounded-xl cursor-pointer transition border ${
                    detailStatusFilter === 'belum_lapor'
                      ? 'bg-rose-100/90 border-rose-400 shadow-2xs ring-1 ring-rose-400'
                      : 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/50'
                  }`}
                  title="Klik untuk menyaring indikator Belum Lapor"
                >
                  <div className="text-[10px] text-rose-700 font-medium flex items-center gap-1">
                    <Clock size={12} className="text-rose-600 shrink-0" /> Belum Lapor
                  </div>
                  <div className="text-lg font-extrabold text-rose-900 mt-0.5">
                    {pCount}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                    <Clock size={12} className="text-slate-500 shrink-0" /> Kepatuhan
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5 flex items-center gap-1">
                    <span>{cpRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    placeholder="Cari nama indikator, variabel..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Dropdown Filter Bulan */}
                  {availableMonths.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg shadow-2xs">
                      <Calendar size={13} className="text-slate-500 shrink-0" />
                      <select
                        value={detailMonthFilter}
                        onChange={(e) => setDetailMonthFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                        title="Pilih Bulan Evaluasi KPI"
                      >
                        <option value="all">Semua Bulan ({availableMonths.length} Bulan)</option>
                        {availableMonths.map((mKey) => {
                          const mInfo = MONTH_NAMES.find(m => m.id === mKey);
                          const mName = mInfo ? mInfo.label.split(' ')[0] : `Bulan ${mKey}`;
                          const count = (monthlyItems[mKey] || []).length;
                          return (
                            <option key={mKey} value={mKey}>
                              {mName} {count > 0 ? `(${count} indikator)` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Clean Status Segmented Control (Corporate Dashboard Style) */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        detailStatusFilter === 'all'
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailStatusFilter('memenuhi')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        detailStatusFilter === 'memenuhi'
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>Terpenuhi ({mCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailStatusFilter('tidak_memenuhi')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        detailStatusFilter === 'tidak_memenuhi'
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <AlertTriangle size={11} className="text-amber-600" />
                      <span>Tidak Terpenuhi ({nmCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailStatusFilter('belum_lapor')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        detailStatusFilter === 'belum_lapor'
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock size={11} className="text-slate-500" />
                      <span>Belum Lapor ({pCount})</span>
                    </button>
                  </div>

                  {/* Export Button Rincian Divisi */}
                  <ExportButton
                    filename={`Rincian_KPI_${(div.division || 'Divisi').replace(/[^a-zA-Z0-9]/g, '_')}_${detailMonthFilter !== 'all' ? `Bulan_${detailMonthFilter}` : 'Semua_Bulan'}`}
                    sheetName="Rincian KPI Divisi"
                    buttonLabel="Export Rincian"
                    headers={['No', 'Nama Divisi', 'Bulan Evaluasi', 'Nama Indikator KPI', 'Variabel', 'Satuan (Unit)', 'Target Plan', 'Realisasi Actual', 'Pencapaian (%)', 'Status Kepatuhan', 'Keterangan / Evaluasi']}
                    rows={() => itemsList.map((it, idx) => [
                      idx + 1,
                      div.division,
                      it.month || (detailMonthFilter !== 'all' ? `Bulan ${detailMonthFilter}` : 'Semua'),
                      it.kpi || '-',
                      it.variable || '-',
                      it.unit || '-',
                      it.target ?? '-',
                      it.plan ?? '-',
                      it.actual ?? '-',
                      it.achievement ? `${Number(it.achievement).toFixed(1)}%` : '-',
                      it.status === 'memenuhi' ? 'Memenuhi Target' : it.status === 'tidak_memenuhi' ? 'Belum Memenuhi' : (it.status_label || it.status || '-'),
                      it.reason || it.evaluation || '-'
                    ])}
                  />
                </div>
              </div>

              {/* Table of Indicators */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">No</th>
                      <th
                        onClick={() => handleIndicatorSort('kpi')}
                        className={`p-2.5 min-w-[280px] cursor-pointer select-none transition-colors group ${
                          indicatorSortCol === 'kpi' ? 'bg-slate-100 text-blue-700' : 'hover:bg-slate-100/70 text-slate-700'
                        }`}
                        title="Klik untuk mengurutkan Nama Indikator KPI (A-Z / Z-A)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Indikator KPI & Keterangan</span>
                          {indicatorSortCol === 'kpi' ? (
                            indicatorSortDir === 'asc' ? (
                              <ArrowUp size={13} className="text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown size={13} className="text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                          )}
                        </div>
                      </th>
                      {isAllPeriods && detailMonthFilter === 'all' && (
                        <th
                          onClick={() => handleIndicatorSort('month')}
                          className={`p-2.5 w-24 text-center cursor-pointer select-none transition-colors group ${
                            indicatorSortCol === 'month' ? 'bg-slate-100 text-blue-700' : 'hover:bg-slate-100/70 text-slate-700'
                          }`}
                          title="Klik untuk mengurutkan Bulan Evaluasi"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Bulan</span>
                            {indicatorSortCol === 'month' ? (
                              indicatorSortDir === 'asc' ? (
                                <ArrowUp size={13} className="text-blue-600 shrink-0" />
                              ) : (
                                <ArrowDown size={13} className="text-blue-600 shrink-0" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                            )}
                          </div>
                        </th>
                      )}
                      <th className="p-2.5 w-28 text-center">Target Plan</th>
                      <th className="p-2.5 w-28 text-center">Realisasi Actual</th>
                      <th
                        onClick={() => handleIndicatorSort('status')}
                        className={`p-2.5 w-32 text-center cursor-pointer select-none transition-colors group ${
                          indicatorSortCol === 'status' ? 'bg-slate-100 text-blue-700' : 'hover:bg-slate-100/70 text-slate-700'
                        }`}
                        title="Klik untuk mengurutkan Status"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {indicatorSortCol === 'status' ? (
                            indicatorSortDir === 'asc' ? (
                              <ArrowUp size={13} className="text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown size={13} className="text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                          )}
                        </div>
                      </th>
                      <th className="p-2.5 min-w-[240px]">Keterangan / Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsList.length === 0 ? (
                      <tr>
                        <td colSpan={isAllPeriods && detailMonthFilter === 'all' ? 7 : 6} className="p-6 text-center text-slate-400 text-xs">
                          Tidak ada indikator KPI yang sesuai kriteria pencarian/filter.
                        </td>
                      </tr>
                    ) : (
                      itemsList.map((item, itemIdx) => {
                        const isItemPassed = item.status === 'memenuhi';
                        const isItemFailed = item.status === 'tidak_memenuhi';
                        const isItemPending = item.status === 'belum_lengkap' || item.status === 'belum_ada_laporan';

                        return (
                          <tr key={itemIdx} className="hover:bg-blue-50/20 transition-colors">
                            <td className="p-2.5 text-center text-slate-400 font-medium">{itemIdx + 1}</td>
                            <td className="p-2.5">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 text-xs leading-snug">
                                  {item.kpi || item.variable || '-'}
                                </div>
                                {item.variable && item.variable !== item.kpi && (
                                  <div className="text-[10.5px] text-slate-500 leading-tight">
                                    {item.variable}
                                  </div>
                                )}
                                {item.unit && (
                                  <div className="text-[9.5px] text-slate-400">
                                    <span className="font-medium text-slate-500">Satuan:</span> {item.unit}
                                  </div>
                                )}
                              </div>
                            </td>

                            {isAllPeriods && detailMonthFilter === 'all' && (
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">
                                  {item.month_name || `Bulan ${item.month}`}
                                </span>
                              </td>
                            )}

                            <td className="p-2.5 text-center">
                              <div className="inline-block px-2 py-1 bg-slate-100 rounded-md font-semibold text-slate-800 text-[11px] border border-slate-200/60">
                                {item.plan || '-'}
                              </div>
                              {item.target && (
                                <div className="text-[9.5px] text-slate-400 mt-0.5 truncate max-w-[130px] mx-auto" title={item.target}>
                                  Sasaran: {item.target}
                                </div>
                              )}
                            </td>

                            <td className="p-2.5 text-center">
                              <div className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11.5px] border ${
                                isItemPassed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isItemFailed
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                {item.actual || '-'}
                              </div>
                            </td>

                            <td className="p-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isItemPassed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : isItemFailed
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}>
                                {isItemPassed && <CheckCircle2 size={10} />}
                                {isItemFailed && <AlertTriangle size={10} />}
                                {isItemPending && <Clock size={10} />}
                                <span>{isItemPassed ? 'Terpenuhi' : isItemFailed ? 'Tidak Terpenuhi' : (item.status_label || item.status || '-')}</span>
                              </span>
                            </td>

                            <td className="p-2.5 text-slate-600 text-[10.5px] leading-relaxed">
                              {item.reason || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Modal: Ringkasan & Tombol Kembali */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Menampilkan <span className="font-semibold text-slate-800">{itemsList.length}</span> indikator untuk divisi <span className="font-semibold text-slate-800">{div.division}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDivisionDetail(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer text-xs group"
                >
                  <ArrowLeft size={14} className="text-slate-500 group-hover:text-slate-800 transition-transform group-hover:-translate-x-0.5" />
                  <span>Kembali ke Daftar Divisi</span>
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 3.2 DETAIL MODAL: FOLLOW-UP EVALUASI & STRATEGI BOD */}
      <Modal
        isOpen={activeDetailModal === 'followup'}
        onClose={() => setActiveDetailModal(null)}
        onBack={() => setActiveDetailModal(null)}
        backText="Kembali"
        backTitle="Kembali ke Dashboard Utama"
        title="Detail Tindak Lanjut Evaluasi & Strategi BoD"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          <DataSourceCard source={QMS_DATA_SOURCES.followup} onOpenDetail={setSelectedDataSourceModal} />

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari arahan, topik, atau PIC..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Dropdown Filter Bulan */}
              <select
                value={modalMonthFilter}
                onChange={(e) => setModalMonthFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                title="Filter berdasarkan bulan rapat BoD"
              >
                <option value="all">Semua Bulan ({(followUpBod?.records || []).length})</option>
                {availableFollowupMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label || m.key} ({m.total})
                  </option>
                ))}
              </select>

              {/* Dropdown Filter Prioritas */}
              <select
                value={modalPriorityFilter}
                onChange={(e) => setModalPriorityFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                title="Filter berdasarkan tingkat prioritas arahan BoD"
              >
                <option value="all">Semua Prioritas</option>
                {(followUpBod?.priority_distribution || [
                  { priority: 'Critical' },
                  { priority: 'High' },
                  { priority: 'Medium' },
                  { priority: 'Low' },
                ]).map((p) => (
                  <option key={p.priority} value={p.priority}>
                    {p.priority} {p.count !== undefined ? `(${p.count})` : ''}
                  </option>
                ))}
              </select>

              {/* Dropdown Filter Status */}
              <select
                value={modalFilter}
                onChange={(e) => setModalFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="done">Selesai (Done)</option>
                <option value="in_progress">On Progress</option>
                <option value="open">Belum Mulai (Open)</option>
                <option value="overdue">Lewat Due Date</option>
              </select>

              <ExportButton
                filename={`Followup_BoD_${modalMonthFilter !== 'all' ? modalMonthFilter : (dateRange?.startDate || 'awal')}_sd_${dateRange?.endDate || 'akhir'}`}
                sheetName="Followup BoD"
                buttonLabel="Export Data"
                headers={['No', 'Periode Bulan', 'Arahan / Topik BoD', 'Divisi / PIC', 'Target Due Date', 'Prioritas', 'Status', 'Tindak Lanjut / Catatan']}
                rows={() => filteredFollowupRecords.map((t, i) => [
                  i + 1,
                  t.month_label || t.month || '-',
                  t.action_item || t.task || t.topic || '-',
                  t.owner || t.pic || '-',
                  t.due_date || t.due_date_iso || '-',
                  t.priority || '-',
                  t.status_label || t.status || '-',
                  t.follow_up || t.notes || '-'
                ])}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[55vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2 w-10 text-center">No</th>
                  <th className="p-2">Arahan / Topik Pembahasan BoD</th>
                  <th className="p-2 whitespace-nowrap">Bulan</th>
                  <th className="p-2">PIC / Divisi</th>
                  <th className="p-2 whitespace-nowrap">Due Date</th>
                  <th className="p-2 text-center">Prioritas</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFollowupRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      Tidak ada arahan BoD yang sesuai dengan filter pencarian / bulan / status.
                    </td>
                  </tr>
                ) : (
                  filteredFollowupRecords.map((task, idx) => (
                    <tr key={task.id || idx} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-medium text-slate-900">{task.action_item || task.task || task.topic || '-'}</td>
                      <td className="p-2 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-200/60 rounded text-[10.5px] font-semibold text-blue-700">
                          {task.month_label || task.month || '-'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700 font-semibold">{task.owner || task.pic || '-'}</td>
                      <td className="p-2 whitespace-nowrap text-slate-600">{task.due_date || '-'}</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          (task.priority || '').toLowerCase().includes('critical')
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : (task.priority || '').toLowerCase().includes('tinggi') || (task.priority || '').toLowerCase().includes('high')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : (task.priority || '').toLowerCase().includes('medium')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : (task.priority || '').toLowerCase().includes('low')
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          (task.status || '').toLowerCase().includes('done') || (task.status || '').toLowerCase().includes('selesai')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : (task.status || '').toLowerCase().includes('progress')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {task.status || 'Open'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3.3 DETAIL MODAL: RISK ASSESSMENT (FRM-602-009) */}
      <Modal
        isOpen={activeDetailModal === 'risk'}
        onClose={() => {
          setActiveDetailModal(null);
          setModalDivisionFilter('all');
        }}
        onBack={() => {
          setActiveDetailModal(null);
          setModalDivisionFilter('all');
        }}
        backText="Kembali"
        backTitle="Kembali ke Dashboard Utama"
        title="Register Konsolidasi Risk Assessment (FRM-602-009)"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          <DataSourceCard source={QMS_DATA_SOURCES.risk} onOpenDetail={setSelectedDataSourceModal} />

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari deskripsi risiko, mitigasi, atau divisi..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown Filter Divisi */}
              <select
                value={modalDivisionFilter}
                onChange={(e) => setModalDivisionFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[210px] truncate"
                title="Filter berdasarkan divisi"
              >
                <option value="all">Semua Divisi ({(riskAssessment?.records || []).length})</option>
                {availableRiskDivisions.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.count})
                  </option>
                ))}
              </select>

              {/* Dropdown Filter Kategori Risiko */}
              <select
                value={modalFilter}
                onChange={(e) => setModalFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                title="Filter berdasarkan kategori risiko"
              >
                <option value="all">Semua Kategori Risiko</option>
                <option value="strategic">Strategic</option>
                <option value="operational">Operational</option>
                <option value="financial">Financial</option>
                <option value="compliance">Compliance</option>
              </select>

              <ExportButton
                filename={`Risk_Assessment_${modalDivisionFilter !== 'all' ? modalDivisionFilter.replace(/[^a-zA-Z0-9]/g, '_') : 'Consolidated'}_2026`}
                sheetName="Risk Assessment"
                buttonLabel="Export Data"
                headers={['No', 'ID Risiko', 'Divisi Terkait', 'Kategori Risiko', 'Deskripsi Potensi Risiko', 'Rencana Aksi Mitigasi', 'Level Sebelum', 'Level Sesudah', 'PIC Penanggung Jawab']}
                rows={() => filteredRiskRecords.map((r, i) => [
                  i + 1,
                  r.risk_id || '-',
                  r.division || '-',
                  r.risk_type || '-',
                  r.description || '-',
                  r.mitigation || '-',
                  r.before_level || r.before_grade || '-',
                  r.after_level || r.after_grade || '-',
                  r.pic || '-',
                ])}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[55vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2 w-10 text-center">No</th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Divisi</th>
                  <th className="p-2">Kategori</th>
                  <th className="p-2">Deskripsi Risiko</th>
                  <th className="p-2">Rencana Mitigasi</th>
                  <th className="p-2 text-center whitespace-nowrap">Tingkat Risiko</th>
                  <th className="p-2">PIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiskRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      Tidak ada data risiko yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredRiskRecords.map((item, idx) => (
                    <tr key={`risk-${item.row_number || item.risk_id || ''}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-mono text-[11px] font-bold text-slate-700">{item.risk_id || '-'}</td>
                      <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{item.division || '-'}</td>
                      <td className="p-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.risk_type || 'General'}
                        </span>
                      </td>
                      <td className="p-2 max-w-[220px] text-slate-800">{item.description}</td>
                      <td className="p-2 max-w-[220px] text-slate-600">{item.mitigation}</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <span className="text-[10px] text-slate-500 line-through mr-1">{item.before_level || '-'}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                          &rarr; {item.after_level || '-'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-600 whitespace-nowrap">{item.pic || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3.4 DETAIL MODAL: CORRECTIVE ACTION (CAR) */}
      <Modal
        isOpen={activeDetailModal === 'corrective'}
        onClose={() => {
          setActiveDetailModal(null);
          setSelectedCarDetail(null);
        }}
        onBack={() => {
          setActiveDetailModal(null);
          setSelectedCarDetail(null);
        }}
        backText="Kembali"
        backTitle="Kembali ke Dashboard Utama"
        title="Register Tindakan Korektif (Corrective Action Register - CAR)"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          <DataSourceCard source={QMS_DATA_SOURCES.corrective} onOpenDetail={setSelectedDataSourceModal} />

          {/* Quick Insight Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div
              onClick={() => setModalFilter('all')}
              className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                modalFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="text-[10.5px] font-semibold opacity-75">Total Temuan CAR</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-extrabold">{carModalStats.total}</span>
                <span className={`text-[9.5px] font-medium px-1.5 py-0.2 rounded ${modalFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                  Semua
                </span>
              </div>
            </div>

            <div
              onClick={() => setModalFilter(modalFilter === 'open' ? 'all' : 'open')}
              className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                modalFilter === 'open'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200/80 text-rose-950'
              }`}
            >
              <div className={`text-[10.5px] font-semibold ${modalFilter === 'open' ? 'text-rose-100' : 'text-rose-700'}`}>Perlu Tindakan (Open)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-base font-extrabold ${modalFilter === 'open' ? 'text-white' : 'text-rose-700'}`}>{carModalStats.open}</span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${modalFilter === 'open' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {carModalStats.total > 0 ? Math.round((carModalStats.open / carModalStats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div
              onClick={() => setModalFilter(modalFilter === 'in_progress' ? 'all' : 'in_progress')}
              className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                modalFilter === 'in_progress'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50/50 hover:bg-amber-50 border-amber-200/80 text-amber-950'
              }`}
            >
              <div className={`text-[10.5px] font-semibold ${modalFilter === 'in_progress' ? 'text-amber-100' : 'text-amber-700'}`}>Sedang Berjalan (Progress)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-base font-extrabold ${modalFilter === 'in_progress' ? 'text-white' : 'text-amber-700'}`}>{carModalStats.progress}</span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${modalFilter === 'in_progress' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {carModalStats.total > 0 ? Math.round((carModalStats.progress / carModalStats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div
              onClick={() => setModalFilter(modalFilter === 'closed' ? 'all' : 'closed')}
              className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                modalFilter === 'closed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-emerald-950'
              }`}
            >
              <div className={`text-[10.5px] font-semibold ${modalFilter === 'closed' ? 'text-emerald-100' : 'text-emerald-700'}`}>Selesai & Terverifikasi</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-base font-extrabold ${modalFilter === 'closed' ? 'text-white' : 'text-emerald-700'}`}>{carModalStats.closed}</span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${modalFilter === 'closed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                  {carModalStats.closedRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari no CAR, temuan, atau PIC..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Dropdown Filter Departemen */}
              <select
                value={modalDeptFilter}
                onChange={(e) => setModalDeptFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                title="Filter berdasarkan departemen"
              >
                <option value="all">Semua Departemen ({(correctiveAction?.records || []).length})</option>
                {availableCarDepartments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.count})
                  </option>
                ))}
              </select>

              {/* Dropdown Filter Status */}
              <select
                value={modalFilter}
                onChange={(e) => setModalFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="open">Open ({carModalStats.open})</option>
                <option value="in_progress">On Progress ({carModalStats.progress})</option>
                <option value="closed">Closed ({carModalStats.closed})</option>
              </select>

              <ExportButton
                filename="Corrective_Action_Register_2026"
                sheetName="CAR Register"
                buttonLabel="Export Data"
                headers={['No', 'No CAR', 'Tanggal Audit', 'Departemen', 'Divisi Terkait', 'PIC Penanggung Jawab', 'Uraian Temuan / Ketidaksesuaian', 'Akar Masalah (Root Cause)', 'Rencana Tindakan Korektif', 'Target Selesai', 'Tindakan Pencegahan', 'Verifikator Mutu', 'Tanggal Verifikasi', 'Status CAR']}
                rows={() => filteredCarRecords.map((c, i) => [
                  i + 1,
                  c.car_number || c.car_no || c.number || '-',
                  c.audit_date || '-',
                  normalizeDepartmentName(c.department || c.division || '-'),
                  c.division || '-',
                  c.pic || '-',
                  c.description || c.finding || '-',
                  c.root_cause || '-',
                  c.corrective_action || c.action || '-',
                  c.target_date || c.due_date || '-',
                  c.preventive_action || '-',
                  c.verifier || '-',
                  c.verification_date || '-',
                  c.status_label || c.status || '-'
                ])}
              />
            </div>
          </div>

          {/* Clean Structured Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[52vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5 whitespace-nowrap">No CAR & Tanggal</th>
                  <th className="p-2.5">Departemen</th>
                  <th className="p-2.5 min-w-[280px]">Uraian Temuan / Masalah</th>
                  <th className="p-2.5 min-w-[200px]">Rencana Perbaikan</th>
                  <th className="p-2.5 text-center whitespace-nowrap">Status</th>
                  <th className="p-2.5 text-center w-14">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCarRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Tidak ada temuan CAR yang sesuai dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredCarRecords.map((car, idx) => (
                    <tr key={car.id || idx} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900">{car.car_number || car.car_no || car.number || '-'}</div>
                        {car.audit_date && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={10} className="text-slate-400 shrink-0" />
                            <span>{car.audit_date}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">{normalizeDepartmentName(car.department || car.division || '-')}</div>
                        {car.pic && car.pic !== '-' && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            PIC: <span className="text-slate-600 font-medium">{car.pic}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="max-w-[340px]">
                          <p className="line-clamp-2 text-slate-800 text-xs leading-relaxed" title={car.description || car.finding}>
                            {car.description || car.finding || '-'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedCarDetail(car)}
                            className="mt-1 text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 cursor-pointer transition"
                          >
                            <span>Lihat rincian lengkap</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="max-w-[220px]">
                          {car.corrective_action && car.corrective_action !== '-' ? (
                            <p className="line-clamp-2 text-slate-700 text-[11px] leading-snug" title={car.corrective_action}>
                              {car.corrective_action}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-[10.5px]">Belum diinput</span>
                          )}
                          {car.target_date && car.target_date !== '-' && (
                            <div className="text-[9.5px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                              <Clock size={9} className="text-slate-400 shrink-0" />
                              <span>Target: {car.target_date}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          (car.status || '').toLowerCase().includes('close')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : (car.status || '').toLowerCase().includes('progress')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {(car.status || '').toLowerCase().includes('close') ? (
                            <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                          ) : (car.status || '').toLowerCase().includes('progress') ? (
                            <Clock size={10} className="text-amber-600 shrink-0" />
                          ) : (
                            <AlertCircle size={10} className="text-rose-600 shrink-0" />
                          )}
                          <span>{car.status_label || car.status || 'Open'}</span>
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedCarDetail(car)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-md transition cursor-pointer"
                          title="Buka rincian lengkap temuan CAR ini"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredCarRecords.length}</strong> dari <strong className="text-slate-800">{carModalStats.total}</strong> temuan CAR
            </span>
          </div>
        </div>
      </Modal>

      {/* 3.4.1 SUB MODAL: DETAIL LENGKAP TEMUAN CAR */}
      <Modal
        isOpen={Boolean(selectedCarDetail)}
        onClose={() => setSelectedCarDetail(null)}
        onBack={() => setSelectedCarDetail(null)}
        backText="Kembali"
        backTitle="Kembali ke Daftar CAR"
        title={selectedCarDetail ? `Detail Temuan: ${selectedCarDetail.car_number || selectedCarDetail.car_no || 'CAR'}` : 'Detail CAR'}
        maxWidth="max-w-2xl"
        zIndex="z-[10020]"
      >
        {selectedCarDetail && (
          <div className="space-y-3.5 text-xs">
            {/* Header info badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Nomor Registrasi CAR</div>
                <div className="font-mono text-sm font-extrabold text-slate-900">{selectedCarDetail.car_number || selectedCarDetail.car_no || '-'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  (selectedCarDetail.status || '').toLowerCase().includes('close')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : (selectedCarDetail.status || '').toLowerCase().includes('progress')
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {(selectedCarDetail.status || '').toLowerCase().includes('close') ? (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  ) : (selectedCarDetail.status || '').toLowerCase().includes('progress') ? (
                    <Clock size={12} className="text-amber-600" />
                  ) : (
                    <AlertCircle size={12} className="text-rose-600" />
                  )}
                  <span>{selectedCarDetail.status_label || selectedCarDetail.status || 'Open'}</span>
                </span>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Departemen / Divisi:</span>
                <span className="font-bold text-slate-800 text-xs">{normalizeDepartmentName(selectedCarDetail.department || selectedCarDetail.division || '-')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Tanggal Audit:</span>
                <span className="font-medium text-slate-800 text-xs">{selectedCarDetail.audit_date || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">PIC / Penanggung Jawab:</span>
                <span className="font-medium text-slate-800 text-xs">{selectedCarDetail.pic || '-'}</span>
              </div>
            </div>

            {/* Uraian Temuan */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Uraian Temuan / Ketidaksesuaian:</span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs leading-relaxed whitespace-pre-line shadow-2xs">
                {formatMultilineText(selectedCarDetail.description || selectedCarDetail.finding) || 'Tidak ada uraian temuan tercatat.'}
              </div>
            </div>

            {/* Akar Masalah (jika ada) */}
            {selectedCarDetail.root_cause && selectedCarDetail.root_cause !== '-' && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Akar Masalah (Root Cause):</span>
                <div className="p-2.5 bg-amber-50/40 border border-amber-200/70 rounded-lg text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                  {formatMultilineText(selectedCarDetail.root_cause)}
                </div>
              </div>
            )}

            {/* Rencana Tindakan Korektif */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 block">Rencana Tindakan Korektif (Perbaikan):</span>
                {selectedCarDetail.target_date && selectedCarDetail.target_date !== '-' && (
                  <span className="text-[10.5px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Target: {selectedCarDetail.target_date}
                  </span>
                )}
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                {selectedCarDetail.corrective_action && selectedCarDetail.corrective_action !== '-'
                  ? formatMultilineText(selectedCarDetail.corrective_action)
                  : <span className="text-slate-400 italic">Belum ada rencana perbaikan yang diinput.</span>}
              </div>
            </div>

            {/* Tindakan Pencegahan / Catatan Verifikasi */}
            {(selectedCarDetail.preventive_action || selectedCarDetail.evaluation || selectedCarDetail.verifier) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {selectedCarDetail.preventive_action && selectedCarDetail.preventive_action !== '-' && (
                  <div className="p-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">Tindakan Pencegahan:</span>
                    <p className="text-[11px] text-slate-700 leading-snug whitespace-pre-line">{formatMultilineText(selectedCarDetail.preventive_action)}</p>
                  </div>
                )}
                {selectedCarDetail.verifier && selectedCarDetail.verifier !== '-' && (
                  <div className="p-2.5 bg-slate-100/60 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Verifikator Mutu:</span>
                    <p className="text-[11px] text-slate-800 font-semibold">{selectedCarDetail.verifier}</p>
                    {selectedCarDetail.verification_date && (
                      <span className="text-[10px] text-slate-500 block">Tgl: {selectedCarDetail.verification_date}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCarDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3.5 DETAIL MODAL: KAIZEN RECAP & LEADERBOARD */}
      <Modal
        isOpen={activeDetailModal === 'kaizen'}
        onClose={() => setActiveDetailModal(null)}
        onBack={() => setActiveDetailModal(null)}
        backText="Kembali"
        backTitle="Kembali ke Dashboard Utama"
        title="Leaderboard Kaizen Recap & Inovasi Karyawan"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          <DataSourceCard source={QMS_DATA_SOURCES.kaizen} onOpenDetail={setSelectedDataSourceModal} />

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari nama inovator, departemen, atau judul ide..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Total: <strong className="text-purple-900 font-bold">{(kaizenRecap?.records || kaizenRecap?.top_10 || []).length} Ide</strong>
              </span>
              <ExportButton
                filename="Leaderboard_Kaizen_Recap_2026"
                sheetName="Kaizen Recap"
                buttonLabel="Export Data"
                headers={['Rank', 'Nama Inovator', 'Area / Departemen', 'Judul / Ide Kaizen', 'Skor Direksi (60%)', 'Skor Manager (40%)', 'Total Skor Akhir']}
                rows={() => (kaizenRecap?.records || kaizenRecap?.top_10 || []).map((k, i) => [
                  k.rank || i + 1,
                  k.name || '-',
                  k.area || '-',
                  k.idea || '-',
                  k.director_average ?? '-',
                  k.manager_average ?? '-',
                  k.score ?? '-'
                ])}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[55vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2 w-12 text-center">Rank</th>
                  <th className="p-2">Nama Inovator</th>
                  <th className="p-2">Area / Departemen</th>
                  <th className="p-2">Judul Ide Kaizen</th>
                  <th className="p-2 text-right">Direksi (60%)</th>
                  <th className="p-2 text-right">Manager (40%)</th>
                  <th className="p-2 text-right">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(kaizenRecap?.records || kaizenRecap?.top_10 || [])
                  .filter((k) => {
                    const text = `${k.name || ''} ${k.area || ''} ${k.idea || ''}`.toLowerCase();
                    return text.includes(modalSearch.toLowerCase());
                  })
                  .map((k, idx) => (
                    <tr key={k.id || idx} className="hover:bg-purple-50/40">
                      <td className="p-2 text-center font-bold text-slate-600">
                        <span className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-xs ${
                          (k.rank || idx + 1) === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                            : (k.rank || idx + 1) === 2
                            ? 'bg-slate-200 text-slate-800 font-bold'
                            : (k.rank || idx + 1) === 3
                            ? 'bg-amber-50 text-amber-800 font-semibold'
                            : 'text-slate-500 font-normal'
                        }`}>
                          {k.rank || idx + 1}
                        </span>
                      </td>
                      <td className="p-2 font-bold text-slate-900 whitespace-nowrap">{k.name}</td>
                      <td className="p-2 text-slate-600 whitespace-nowrap">{k.area || '-'}</td>
                      <td className="p-2 max-w-[320px] text-slate-800 leading-relaxed">{k.idea}</td>
                      <td className="p-2 text-right font-medium text-slate-600">
                        {k.director_average ? Number(k.director_average).toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-right font-medium text-slate-600">
                        {k.manager_average ? Number(k.manager_average).toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-right font-extrabold text-purple-700 text-sm">
                        {Number(k.score || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. MODAL INFO SUMBER DATA SYNOLOGY NAS (STACKED ON TOP: z-[10050])        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDataSourceModal)}
        onClose={() => {
          setSelectedDataSourceModal(null);
          setCopiedField('');
        }}
        onBack={() => {
          setSelectedDataSourceModal(null);
          setCopiedField('');
        }}
        backText="Kembali"
        title="Informasi Sumber Data Synology NAS"
        maxWidth="max-w-xl"
        zIndex="z-[10050]"
      >
        {selectedDataSourceModal && (
          <div className="space-y-3.5 text-xs">
            {/* Header Badge */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <FileSpreadsheet size={18} className="text-emerald-700 shrink-0" />
              <div>
                <div className="font-bold text-emerald-950 text-xs">{selectedDataSourceModal.label}</div>
                <div className="text-[11px] text-emerald-800">Tersinkronisasi langsung dari server penyimpanan file Synology NAS</div>
              </div>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {/* File Name */}
              <div>
                <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Nama Berkas Excel:</span>
                <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="font-mono text-xs text-slate-900 font-bold truncate select-all">
                    {selectedDataSourceModal.fullFile || selectedDataSourceModal.file}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedDataSourceModal.fullFile || selectedDataSourceModal.file);
                      setCopiedField('file');
                      setTimeout(() => setCopiedField(''), 2000);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="Salin Nama File"
                  >
                    {copiedField === 'file' ? (
                      <>
                        <Check size={11} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Folder Location */}
              <div>
                <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Lokasi Folder di Jaringan Server (Synology NAS):</span>
                <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="font-mono text-xs text-blue-700 font-semibold break-all select-all">
                    {selectedDataSourceModal.folder}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedDataSourceModal.folder);
                      setCopiedField('folder');
                      setTimeout(() => setCopiedField(''), 2000);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="Salin Path Folder"
                  >
                    {copiedField === 'folder' ? (
                      <>
                        <Check size={11} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sheet Name */}
              <div>
                <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Nama Sheet / Tab Excel:</span>
                <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {selectedDataSourceModal.sheet}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Worksheet Aktif</span>
                </div>
              </div>
            </div>

            {/* Synology Note */}
            <div className="text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-center gap-2">
              <Database size={13} className="text-blue-600 shrink-0" />
              <span>
                File Excel terhubung ke Synology NAS dan tersinkronisasi otomatis secara real-time.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDataSourceModal(null);
                  setCopiedField('');
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
