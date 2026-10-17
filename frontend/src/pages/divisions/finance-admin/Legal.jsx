import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Mail,
  Send,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Truck,
  Wrench,
  Search,
  Filter,
  Check,
  X,
  FileCheck,
  Building2,
  Briefcase,
  Layers,
  Download,
  Users,
  DollarSign,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  FolderLock,
  Maximize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  Database,
  FileSpreadsheet,
  Copy,
  Scale,
  BookOpen
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import Modal from '../../../components/ui/Modal';
import ChartContainer from '../../../components/ui/ChartContainer';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';
import api from '../../../axios';
import Chart from 'react-apexcharts';

const MONTH_NAMES = [
  { id: 'all', label: 'Semua Periode (YTD 2026)' },
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

const DATA_SOURCE_MAPPING = {
  silo: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING SILO\\',
    file: 'Monitoring SILO - Legal.xlsx',
    fullFile: 'Monitoring SILO - Legal.xlsx',
    sheet: 'Alat Berat & Equipment',
    label: 'Monitoring SILO (Alat Berat & Equipment)',
    desc: 'Surat Izin Layak Operasi (SILO) Alat Berat & Equipment Operasional'
  },
  permit: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KONTRAK - PERMIT\\',
    file: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    sheet: 'Permit',
    label: 'Monitoring Perizinan',
    desc: 'Izin Operasional, OSS, SBU, IUJK & Legalitas Usaha'
  },
  agreement: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KONTRAK - PERMIT\\',
    file: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    sheet: 'Agreement',
    label: 'Monitoring Perjanjian Kerjasama (PKS)',
    desc: 'Perjanjian Kerjasama Vendor, Supplier & Rekanan'
  },
  project_contract: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KONTRAK - PERMIT\\',
    file: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
    sheet: 'Kontrak Project',
    label: 'Monitoring Kontrak Project',
    desc: 'Kontrak Induk Proyek (PTFI, Antam, IMIP, BAI)'
  },
  vehicle: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KENDARAAN\\',
    file: 'FRM-AZM-603-016 (Monitoring Izin Kendaraan).xlsx',
    fullFile: 'FRM-AZM-603-016 (Monitoring Izin Kendaraan).xlsx',
    sheet: 'Monitoring Kendaraan',
    label: 'Monitoring Izin Kendaraan',
    desc: 'Pajak Tahunan, STNK 5 Tahun, Uji KIR & Legalitas Kendaraan/Alat'
  },
  manpower: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Data MP_baseline.xlsx',
    sheet: 'Master Baseline Karyawan',
    label: 'Kontrak Karyawan (PKWT)',
    desc: 'Rekapitulasi Kontrak Tenaga Kerja PKWT (HR & PJO)'
  },
  kpi: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\14. KPI, RISK REGISTER, RNR, WLA, DAN BUDGETING\\KPI\\',
    file: 'Data KPI Divisi Legal 2026 .xlsx',
    sheet: '5 Sheet: Legal Review, Legal Advisory, Legal Drafting, Litigasi, Pelanggaran',
    label: 'KPI Kinerja Divisi Legal',
    desc: 'SLA Drafting, Review Kontrak, Advisory, Litigasi & Pelanggaran 2026'
  },
  budget: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\10. DANA OPERASIONAL\\2026\\',
    file: 'Dana Operasional Divisi Legal - [Bulan] 2026.xlsx',
    fullFile: 'Dana Operasional Divisi Legal - [Bulan] 2026.xlsx (Folder 01. Januari s/d 09. September 2026)',
    sheet: "'form pengajuan' (Budget) & 'form pertanggung jawaban' (Realisasi LPJ)",
    label: 'Form Pengajuan & LPJ Dana Operasional Legal',
    desc: 'Formulir pengajuan anggaran kas bulanan beserta form pertanggungjawaban (LPJ pengeluaran riil) per bulan tahun 2026.'
  },
  downloads_permits: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Folder IZIN USAHA, SBU, PKP, BPJS',
    sheet: 'Scan Berkas PDF',
    label: 'Arsip Dokumen Legalitas',
    desc: 'Dokumen Legalitas & Perizinan Scan Terverifikasi'
  },
  downloads_templates: {
    folder: 'Z:\\dashboard-data\\legal\\Draft Kontrak Project\\',
    file: 'Master Template Perjanjian & Kontrak',
    sheet: 'Template Master DOCX',
    label: 'Template Perjanjian & PKWT',
    desc: 'Format Baku Kontrak Kerja, MoU & NDA Legal'
  },
  regulations: {
    folder: 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MATRIKS PER-UU\\',
    file: 'FRM-AZM-603-012 (Matriks Peraturan Perundang-Undangan).xlsx',
    fullFile: 'FRM-AZM-603-012 (Matriks Peraturan Perundang-Undangan).xlsx',
    sheet: 'Sheet1',
    label: 'Matriks Peraturan Perundang-Undangan',
    desc: 'Evaluasi Kepatuhan Hukum, Relevansi, dan Tindak Lanjut Regulasi Perusahaan (PT AZM)'
  }
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

function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Semua Site / Branch',
  searchPlaceholder = 'Cari site / branch...',
  prefix = 'Site: ',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter((opt) => String(opt).toLowerCase().includes(lower));
  }, [options, search]);

  const displayLabel = value === 'all' || !value ? placeholder : `${prefix}${value}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-stroke rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-primary cursor-pointer flex items-center justify-between gap-1.5 min-w-[150px] max-w-[200px] transition"
        title={displayLabel}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={12} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="relative mb-1.5">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-7 pr-6 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
            {/* Default 'Semua' Option */}
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${
                value === 'all'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              <span>{placeholder}</span>
              {value === 'all' && <Check size={12} className="text-primary" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-2.5 py-3 text-center text-gray-400 italic text-[11px]">
                Tidak ada site yang cocok
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${
                    value === opt
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{prefix}{opt}</span>
                  {value === opt && <Check size={12} className="text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Legal({ user }) {
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
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [headerActions, setHeaderActions] = useState(null);

  // Mount action portal to navbar PageHeader
  useEffect(() => {
    const findHeader = () => {
      setHeaderActions(document.getElementById('page-header-actions'));
    };
    findHeader();
    const interval = setInterval(findHeader, 200);
    const timeout = setTimeout(() => clearInterval(interval), 2000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Active Detailed Modals (Pop-ups for 1-Page non-scroll layout)
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  // 'documents' | 'manpower' | 'kpi' | 'budget' | 'downloads_permits' | 'downloads_templates'

  // Active Data Source Detail Modal (File, Sheet, Folder NAS popup)
  const [selectedDataSourceModal, setSelectedDataSourceModal] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Module 1 (Documents & SILO) Tab & Data
  const [docCategoryTab, setDocCategoryTab] = useState('silo');
  const [documentsList, setDocumentsList] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [docUrgencyFilter, setDocUrgencyFilter] = useState('all');
  const [docSiloTypeFilter, setDocSiloTypeFilter] = useState('all'); // 'all' | 'Alat Berat' | 'Equipment'
  const [selectedDocForDetail, setSelectedDocForDetail] = useState(null);
  const [selectedDocForPic, setSelectedDocForPic] = useState(null);
  const [picFormData, setPicFormData] = useState({
    extension_submission_date: '',
    extension_progress: '',
    status: '',
    new_expired_date: '',
    notes: '',
    pic_name: '',
  });

  // Module 2 (Manpower Contracts) Data & Filters
  const [mpList, setMpList] = useState([]);
  const [mpSearch, setMpSearch] = useState('');
  const [mpFilter, setMpFilter] = useState('all'); // 'all' | 'expiring_soon'
  const [mpStatusFilter, setMpStatusFilter] = useState('all');
  const [mpBranchFilter, setMpBranchFilter] = useState('all');
  const [mpSortOrder, setMpSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);

  // Module 3 (KPI Performance) Data
  const [kpiDetail, setKpiDetail] = useState(null);
  const [kpiViewMode, setKpiViewMode] = useState('ytd'); // 'ytd' | 'monthly'
  const [kpiSelectedMonth, setKpiSelectedMonth] = useState('all');
  const [kpiCategoryTab, setKpiCategoryTab] = useState('all'); // 'all' | 'review' | 'drafting' | 'advisory'
  const [kpiSearchQuery, setKpiSearchQuery] = useState('');
  const [selectedKpiProject, setSelectedKpiProject] = useState(null);

  // Module 4 (Budget & Dana Operasional) Data
  const [budgetDetail, setBudgetDetail] = useState(null);
  const [budgetViewMode, setBudgetViewMode] = useState('filtered'); // 'filtered' | 'ytd'
  const [budgetSelectedMonth, setBudgetSelectedMonth] = useState('9');

  // Module 5 & 6 (Downloads) Data
  const [downloadsList, setDownloadsList] = useState([]);
  const [downloadSearch, setDownloadSearch] = useState('');
  const [downloadPermissionModal, setDownloadPermissionModal] = useState(null);
  const [downloadApplicantName, setDownloadApplicantName] = useState('');
  const [downloadApplicantDivision, setDownloadApplicantDivision] = useState('');
  const [downloadReason, setDownloadReason] = useState('');

  // Module Regulations (Matriks Per-UU - FRM-AZM-603-012) Data
  const [regulationsList, setRegulationsList] = useState([]);
  const [regStatusFilter, setRegStatusFilter] = useState('all'); // 'all' | 'Comply' | 'Non-Comply'
  const [regNatureFilter, setRegNatureFilter] = useState('all'); // 'all' | 'Wajib' | 'Conditional' | 'Opsional'
  const [regPartyFilter, setRegPartyFilter] = useState('all');
  const [regSearch, setRegSearch] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [selectedRegDetail, setSelectedRegDetail] = useState(null);

  // Helper: Format text with numbered points (1), 2), 3)...) or newlines into separate lines (enter)
  const renderMultiLinePoints = (text, className = 'text-[11px]') => {
    if (!text) return '-';
    // Normalize: ensure points like "1)", "2)", "3)" are on separate lines even if separated by commas or spaces
    let normalized = String(text)
      .replace(/,\s*(?=\d+\))/g, '\n')
      .replace(/([^\n])\s+(?=\d+\))/g, '$1\n');

    const lines = normalized
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      return <div className={`leading-relaxed whitespace-pre-line break-words ${className}`}>{text}</div>;
    }

    return (
      <div className={`space-y-1.5 py-0.5 break-words ${className}`}>
        {lines.map((line, idx) => (
          <div key={idx} className="leading-snug">
            {line}
          </div>
        ))}
      </div>
    );
  };

  const fetchRegulationsList = async () => {
    setRegLoading(true);
    try {
      const params = new URLSearchParams();
      if (regStatusFilter !== 'all') params.append('compliance_status', regStatusFilter);
      if (regNatureFilter !== 'all') params.append('nature', regNatureFilter);
      if (regPartyFilter !== 'all') params.append('party', regPartyFilter);
      if (regSearch) params.append('search', regSearch);

      const res = await api.get(`/api/legal-dashboard/regulations?${params.toString()}`);
      if (res.data?.status === 'success') {
        setRegulationsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching regulations list:', err);
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'regulations') {
      fetchRegulationsList();
    }
  }, [activeDetailModal, regStatusFilter, regNatureFilter, regPartyFilter, regSearch]);

  // Helper: Download Array to CSV / Excel File
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

  // Fetch Executive Summary
  const fetchExecutiveSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange?.endDate) params.append('end_date', dateRange.endDate);
      params.append('month', selectedMonth);

      const res = await api.get(`/api/legal-dashboard/summary?${params.toString()}`);
      if (res.data?.status === 'success') {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching legal executive summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      try {
        const startM = new Date(dateRange.startDate).getMonth() + 1;
        const endM = new Date(dateRange.endDate).getMonth() + 1;
        if (startM === endM) {
          setSelectedMonth(String(startM));
        } else {
          setSelectedMonth('all');
        }
      } catch (e) {}
    }
  }, [dateRange]);

  useEffect(() => {
    fetchExecutiveSummary();
  }, [dateRange, selectedMonth]);

  // Fetch Documents List for Modal 1
  const fetchDocumentsList = async () => {
    try {
      const params = new URLSearchParams();
      params.append('category', docCategoryTab);
      if (docSearch) params.append('search', docSearch);
      if (docUrgencyFilter !== 'all') params.append('urgency', docUrgencyFilter);
      if (docCategoryTab === 'silo' && docSiloTypeFilter !== 'all') {
        params.append('location', docSiloTypeFilter);
      }

      const res = await api.get(`/api/legal-documents?${params.toString()}`);
      if (res.data?.status === 'success') {
        setDocumentsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching documents list:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'documents') {
      fetchDocumentsList();
    }
  }, [activeDetailModal, docCategoryTab, docUrgencyFilter, docSearch, docSiloTypeFilter]);


  // Fetch MP Baseline for Modal 2
  const fetchMpList = async () => {
    try {
      const params = new URLSearchParams();
      params.append('filter', mpFilter);
      if (mpSearch) params.append('search', mpSearch);
      if (mpStatusFilter !== 'all') params.append('status', mpStatusFilter);
      if (mpBranchFilter !== 'all') params.append('branch', mpBranchFilter);
      params.append('sort_order', mpSortOrder);

      const res = await api.get(`/api/legal-dashboard/mp-contracts?${params.toString()}`);
      if (res.data?.status === 'success') {
        setMpList(res.data.data || []);
        if (res.data.available_branches) {
          setAvailableBranches(res.data.available_branches);
        }
        if (res.data.available_statuses) {
          setAvailableStatuses(res.data.available_statuses);
        }
      }
    } catch (err) {
      console.error('Error fetching MP list:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'manpower') {
      fetchMpList();
    }
  }, [activeDetailModal, mpFilter, mpStatusFilter, mpBranchFilter, mpSortOrder]);


  // Fetch KPI detail for Modal 3
  const fetchKpiDetail = async (month = 'all') => {
    try {
      const res = await api.get(`/api/legal-dashboard/kpi-performance?month=${month}`);
      if (res.data?.status === 'success') {
        setKpiDetail(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching KPI detail:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'kpi') {
      const targetMonth = kpiViewMode === 'monthly'
        ? (kpiSelectedMonth !== 'all' ? kpiSelectedMonth : (selectedMonth !== 'all' ? selectedMonth : '3'))
        : 'all';
      fetchKpiDetail(targetMonth);
    }
  }, [activeDetailModal, kpiViewMode, kpiSelectedMonth, selectedMonth]);

  // Fetch Budget detail for Modal 4
  const fetchBudgetDetail = async (targetMonth = budgetSelectedMonth) => {
    try {
      const res = await api.get(`/api/legal-dashboard/operational-budget?month=${targetMonth}`);
      if (res.data?.status === 'success') {
        setBudgetDetail(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching Budget detail:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'budget') {
      const targetMonth = budgetViewMode === 'filtered'
        ? (budgetSelectedMonth !== 'all' ? budgetSelectedMonth : (selectedMonth !== 'all' ? selectedMonth : '9'))
        : 'all';
      fetchBudgetDetail(targetMonth);
    }
  }, [activeDetailModal, budgetViewMode, budgetSelectedMonth, selectedMonth]);

  // Fetch Downloads for Modal 5 & 6
  const fetchDownloadsList = async (type = 'all') => {
    try {
      const res = await api.get('/api/legal-dashboard/downloads', {
        params: {
          type,
          search: downloadSearch,
        }
      });
      if (res.data?.status === 'success') {
        setDownloadsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching Downloads:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'downloads_permits') {
      fetchDownloadsList('permits');
    } else if (activeDetailModal === 'downloads_templates') {
      fetchDownloadsList('templates');
    }
  }, [activeDetailModal, downloadSearch]);

  // Helper: Rumus Status Otomatis Excel Kolom I dari Kolom G (Expired Date)
  // Formula Excel: =IF(G<TODAY(); "Expired"; IF(G-TODAY()<=30; "Segera Update"; "Masih Berlaku"))
  const calculateSiloStatus = (expiredDateStr) => {
    if (!expiredDateStr) return 'Masih Berlaku';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expiredDateStr);
      if (isNaN(exp.getTime())) return 'Masih Berlaku';
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Expired';
      if (diffDays <= 30) return 'Segera Update';
      return 'Masih Berlaku';
    } catch (e) {
      return 'Masih Berlaku';
    }
  };

  const openPicModal = (doc) => {
    setSelectedDocForPic(doc);
    const effectiveExp = doc.expired_date ? doc.expired_date.substring(0, 10) : '';
    const autoStatus = calculateSiloStatus(effectiveExp);

    setPicFormData({
      extension_submission_date: doc.extension_submission_date ? doc.extension_submission_date.substring(0, 10) : '',
      extension_progress: '', // KOSONG: sebagai panduan di placeholder (tidak langsung tertulis)
      status: autoStatus,     // Otomatis sesuai rumus Excel Kolom G
      new_expired_date: '',
      notes: '',              // KOSONG: sebagai panduan di placeholder (tidak langsung tertulis)
      pic_name: '',           // KOSONG: sebagai panduan di placeholder (tidak langsung tertulis)
      pic_email: doc.pic_email || '',
    });
  };

  // Handle Save PIC Progress
  const handleSavePicProgress = async (e) => {
    e.preventDefault();
    if (!selectedDocForPic) return;
    try {
      await api.put(`/api/legal-documents/${selectedDocForPic.id}/progress`, picFormData);
      setSelectedDocForPic(null);
      fetchDocumentsList();
      fetchExecutiveSummary();
      setActionSuccessMsg('Progress dokumen berhasil diperbarui oleh PIC!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating PIC progress:', err);
      alert('Gagal memperbarui progress.');
    }
  };


  // Handle Download Authorization Request
  const handleRequestDownloadPermission = async (e) => {
    e.preventDefault();
    if (!downloadPermissionModal) return;
    try {
      const res = await api.post('/api/legal-dashboard/request-download-permission', {
        filename: downloadPermissionModal.filename,
        applicant_name: downloadApplicantName || user?.name || 'User',
        division: downloadApplicantDivision || user?.division || 'Divisi Pemohon',
        reason: downloadReason,
      });
      alert(res.data.message || 'Permohonan unduh dokumen berhasil diproses.');
      setDownloadPermissionModal(null);
      setDownloadReason('');
    } catch (err) {
      console.error('Error requesting download permission:', err);
      alert('Gagal memproses permohonan unduh.');
    }
  };

  // Helpers
  const formatCurrency = (val) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  const getUrgencyBadge = (urgencyStatus, daysRemaining, category) => {
    if (urgencyStatus === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
          <AlertTriangle size={11} className="text-red-600" />
          Expired ({daysRemaining !== null ? `${Math.abs(daysRemaining)} hr lalu` : 'Expired'})
        </span>
      );
    }
    if (urgencyStatus === 'critical') {
      const threshold = category === 'silo' ? 'H-60' : 'H-30';
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          <Clock size={11} className="text-orange-700" />
          Kritis ({daysRemaining} hr - {threshold})
        </span>
      );
    }
    if (urgencyStatus === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock size={11} className="text-amber-700" />
          Mendekati Expired ({daysRemaining} hr)
        </span>
      );
    }
    if (urgencyStatus === 'pending' || (category === 'silo' && urgencyStatus === 'no_expiry')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <Clock size={11} className="text-slate-500" />
          Pending Update
        </span>
      );
    }
    if (urgencyStatus === 'no_expiry') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <CheckCircle2 size={11} className="text-sky-500" />
          Permanen / No Expiry
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} className="text-emerald-600" />
        Masih Berlaku {daysRemaining !== null ? `(${daysRemaining} hr)` : ''}
      </span>
    );
  };

  const docs = summaryData?.documents || {};
  const mp = summaryData?.manpower || {};
  const kpi = summaryData?.kpi || {};
  const budget = summaryData?.budget || {};
  const downloadsCount = summaryData?.downloads_count || {};
  const regulationsSummary = summaryData?.regulations || {
    total: 65,
    comply: 59,
    non_comply: 6,
    compliance_rate: 91,
    by_nature: { Wajib: 56, Conditional: 8, Opsional: 1 },
    by_party: { HSE: 25, Legal: 15, Finance: 8, HR: 7, Transport: 4, Operation: 3, Exim: 2, IT: 1 }
  };

  // =========================================================================
  // APEXCHARTS CONFIGURATIONS FOR 1-PAGE EXECUTIVE VIEW
  // =========================================================================
  // APEXCHARTS & VISUAL CONFIGURATIONS (ROBUST & IMMUNE TO ZOOM 80%-120%)
  // =========================================================================
  // 1. Chart Donat / Pie Distribusi 5 Kategori Dokumen Legalitas (SILO, Perizinan, PKS, Proyek, Kendaraan)
  const docCategoryDonutChart = useMemo(() => {
    const silo = Number(docs.total_silo || 157);
    const permit = Number(docs.total_permit || 69);
    const agreement = Number(docs.total_agreement || 59);
    const project = Number(docs.total_project_contract || 53);
    const vehicle = Number(docs.total_vehicle || 83);
    const total = Number(docs.total_documents || (silo + permit + agreement + project + vehicle));

    const series = [silo, permit, agreement, project, vehicle];
    const labels = ['SILO', 'Perizinan', 'PKS', 'Kontrak Project', 'Izin Kendaraan'];
    const colors = ['#F59E0B', '#2563EB', '#06B6D4', '#8B5CF6', '#10B981'];
    const tabs = ['silo', 'permit', 'agreement', 'project_contract', 'vehicle'];

    const options = {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        events: {
          dataPointSelection: (event, chartContext, config) => {
            const targetTab = tabs[config.dataPointIndex];
            if (targetTab) {
              setDocCategoryTab(targetTab);
              setActiveDetailModal('documents');
            }
          },
        },
      },
      colors: colors,
      labels: labels,
      stroke: { width: 2, colors: ['#ffffff'] },
      plotOptions: {
        pie: {
          donut: {
            size: '64%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '8.5px',
                fontWeight: 700,
                color: '#94a3b8',
                offsetY: -3,
              },
              value: {
                show: true,
                fontSize: '14px',
                fontWeight: 800,
                color: '#0f172a',
                offsetY: 2,
                formatter: (val) => `${val}`,
              },
              total: {
                show: true,
                label: 'TOTAL',
                fontSize: '8px',
                fontWeight: 700,
                color: '#94a3b8',
                formatter: () => `${total}`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val) => `${val} Dokumen / Unit`,
        },
      },
    };

    const categories = labels.map((label, i) => ({
      id: tabs[i],
      label: label,
      count: series[i],
      color: colors[i],
      percentage: total > 0 ? ((series[i] / total) * 100).toFixed(1) : 0,
    }));

    return { series, options, categories, total };
  }, [docs.total_silo, docs.total_permit, docs.total_agreement, docs.total_project_contract, docs.total_vehicle, docs.total_documents]);

  const docStatusChart = useMemo(() => {
    const safe = Number(docs.total_safe ?? 141);
    const permanent = Number(docs.total_no_expiry ?? 84);
    const critical = Number(docs.total_critical ?? 25);
    const expired = Number(docs.total_expired ?? 91);

    const series = [safe, permanent, critical, expired];
    const options = {
      chart: { type: 'donut', sparkline: { enabled: true } },
      labels: ['Aman / Valid', 'Permanen', 'Kritis H-30/60', 'Expired'],
      colors: ['#10B981', '#06B6D4', '#F59E0B', '#EF4444'],
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
        y: { formatter: (val) => `${val} Dokumen` },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
    };

    return { series, options };
  }, [docs.total_safe, docs.total_no_expiry, docs.total_critical, docs.total_expired]);

  // 2. Gauge Chart Capaian KPI Legal (Circular Ring Gauge)
  const kpiGaugeChart = useMemo(() => {
    const rate = Math.min(100, Math.round(Number(kpi.achievement_rate ?? 100)));
    const series = [rate];
    const options = {
      chart: { type: 'radialBar', sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          hollow: { size: '64%' },
          track: { background: '#ECFDF5', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: 4,
              fontSize: '14px',
              fontWeight: 800,
              color: '#047857',
              formatter: (val) => `${val}%`,
            },
          },
        },
      },
      colors: ['#10B981'],
      stroke: { lineCap: 'round' },
    };

    return { series, options };
  }, [kpi.achievement_rate]);

  // 4. Budget Utilization Radial Gauge Chart (Circular Ring Gauge)
  const budgetGaugeChart = useMemo(() => {
    const isFiltered = selectedMonth !== 'all';
    const rate = isFiltered
      ? Math.min(100, Math.round(Number(budget.current_month_utilization ?? 92.7)))
      : Math.min(100, Math.round(Number(budget.ytd_utilization_rate ?? 60.2)));
    const series = [rate];
    const options = {
      chart: { type: 'radialBar', sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          hollow: { size: '64%' },
          track: { background: '#FAF5FF', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: 6,
              fontSize: '20px',
              fontWeight: 800,
              color: '#7E22CE',
              formatter: (val) => `${val}%`,
            },
          },
        },
      },
      colors: ['#8B5CF6'],
      stroke: { lineCap: 'round' },
    };

    return { series, options };
  }, [budget.ytd_utilization_rate, budget.current_month_utilization, selectedMonth]);

  // 5. Regulations Compliance Radial Gauge Chart (Circular Ring Gauge)
  const regulationsGaugeChart = useMemo(() => {
    const rate = Math.min(100, Math.round(Number(regulationsSummary.compliance_rate ?? 91)));
    const series = [rate];
    const options = {
      chart: { type: 'radialBar', sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          hollow: { size: '64%' },
          track: { background: '#ECFDF5', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: 6,
              fontSize: '20px',
              fontWeight: 800,
              color: '#059669',
              formatter: (val) => `${val}%`,
            },
          },
        },
      },
      colors: ['#10B981'],
      stroke: { lineCap: 'round' },
    };

    return { series, options };
  }, [regulationsSummary.compliance_rate]);


  // Legal Monthly Workload Trend (Legal Review, Legal Drafting, Legal Advisory)
  const workloadTrendChart = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData = kpi.monthly_trend || {};
    const reviewData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      // Bulan belum berjalan / belum ada data (Agustus ke atas dengan 0 berkas) dibuat null agar garis terputus
      if (!m || m.review === null || (i >= 7 && (!m.total || Number(m.total) === 0))) {
        return null;
      }
      return Number(m.review);
    });
    const draftingData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      if (!m || m.drafting === null || (i >= 7 && (!m.total || Number(m.total) === 0))) {
        return null;
      }
      return Number(m.drafting);
    });
    const advisoryData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      if (!m || m.advisory === null || (i >= 7 && (!m.total || Number(m.total) === 0))) {
        return null;
      }
      return Number(m.advisory);
    });

    const series = [
      {
        name: 'Legal Review',
        data: reviewData.some((v) => v !== null && v > 0)
          ? reviewData
          : [6, 3, 7, 5, 3, 11, 5, null, null, null, null, null],
      },
      {
        name: 'Legal Drafting',
        data: draftingData.some((v) => v !== null && v > 0)
          ? draftingData
          : [2, 4, 4, 10, 9, 11, 9, null, null, null, null, null],
      },
      {
        name: 'Legal Advisory',
        data: advisoryData.some((v) => v !== null && v > 0)
          ? advisoryData
          : [2, 1, 1, 2, 2, 2, 2, null, null, null, null, null],
      },
    ];

    const options = {
      chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        events: {
          dataPointSelection: () => {
            setActiveDetailModal('kpi');
          },
        },
      },
      colors: ['#3b82f6', '#f59e0b', '#8b5cf6'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      stroke: { curve: 'smooth', width: 2 },
      markers: {
        size: 0,
        showNullDataPoints: false,
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: months,
        labels: {
          style: { fontSize: '9px', colors: '#64748b' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { fontSize: '9px', colors: '#64748b' },
        },
        min: 0,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '9px',
        markers: { radius: 2, width: 7, height: 7 },
        itemMargin: { horizontal: 3, vertical: 0 },
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '9.5px',
          fontFamily: 'Inter, sans-serif',
        },
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const month = months[dataPointIndex] || '';
          const review = series[0]?.[dataPointIndex];
          const drafting = series[1]?.[dataPointIndex];
          const advisory = series[2]?.[dataPointIndex];
          const hasData = (review !== null && review !== undefined) ||
            (drafting !== null && drafting !== undefined) ||
            (advisory !== null && advisory !== undefined);

          if (!hasData) {
            return `
              <div style="padding: 5px 8px; font-size: 9.5px; font-family: Inter, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); line-height: 1.25; color: #1e293b;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; font-size: 9.5px;">${month} 2026</div>
                <div style="color: #94a3b8; font-style: italic;">Belum Ada Data</div>
              </div>
            `;
          }

          return `
            <div style="padding: 4px 7px; font-size: 9.5px; font-family: Inter, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); line-height: 1.25; color: #1e293b; min-width: 125px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; font-size: 9.5px;">
                ${month} 2026
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 1px 0;">
                <span style="display: flex; align-items: center; gap: 3px; color: #64748b;">
                  <span style="width: 5px; height: 5px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>
                  Review:
                </span>
                <strong style="color: #1e293b;">${review ?? 0} Berkas</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 1px 0;">
                <span style="display: flex; align-items: center; gap: 3px; color: #64748b;">
                  <span style="width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>
                  Drafting:
                </span>
                <strong style="color: #1e293b;">${drafting ?? 0} Berkas</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 1px 0;">
                <span style="display: flex; align-items: center; gap: 3px; color: #64748b;">
                  <span style="width: 5px; height: 5px; border-radius: 50%; background: #8b5cf6; display: inline-block;"></span>
                  Advisory:
                </span>
                <strong style="color: #1e293b;">${advisory ?? 0} Berkas</strong>
              </div>
            </div>
          `;
        },
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
        padding: { top: -14, bottom: -6, left: 10, right: 10 },
      },
    };

    return { series, options };
  }, [kpi.monthly_trend]);

  // Action buttons and period filter component for PageHeader Portal
  const periodFilterContent = (
    <div className="flex items-center gap-1.5">
      <span className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Monitoring Legalitas 2026
      </span>
      <DateRangeFilter
        dateRange={dateRange}
        onChange={setDateRange}
        disablePortal={true}
      />
      <button
        type="button"
        onClick={fetchExecutiveSummary}
        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white rounded-lg transition cursor-pointer shadow-xs"
        title="Sinkronkan & Muat Ulang Data"
      >
        <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-x-hidden min-h-0 text-xs pb-1">
      {/* Portal action into page layout header */}
      {headerActions && createPortal(periodFilterContent, headerActions)}

      {/* Fallback header only if page-header-actions not available in DOM */}
      {!headerActions && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0 mb-1">
          <span className="text-xs text-slate-600 font-semibold">Monitoring Legalitas, Kontrak Kerja & Anggaran 2026</span>
          {periodFilterContent}
        </div>
      )}

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="flex shrink-0 items-center justify-between px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shadow-xs text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 2x2 GRID: DOKUMEN & PERIZINAN, KPI, BUDGET, REGULASI (EQUAL SIZING)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-2 w-full flex-1 min-h-0">

        {/* CARD 1: DOKUMEN & PERIZINAN (POIN 1) */}
        <div
          onClick={() => setActiveDetailModal('documents')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full min-h-0 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-amber-50 text-amber-700 rounded-md shrink-0">
                <Wrench size={13} />
              </div>
              <div className="flex items-center gap-1 truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Dokumen & Perizinan
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <DatasetBadgeButton source={DATA_SOURCE_MAPPING.silo} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition" />
            </div>
          </div>

          {/* Main Body: 3-Section Executive Layout */}
          <div className="flex items-center justify-between gap-3 my-auto py-1.5 border-y border-slate-100/90 flex-1 px-1 min-h-0">
            {/* 1. KIRI: Donut Chart Proporsional */}
            <div className="w-[115px] sm:w-[122px] flex items-center justify-center shrink-0">
              <Chart
                options={docCategoryDonutChart.options}
                series={docCategoryDonutChart.series}
                type="donut"
                height={122}
                width={122}
              />
            </div>

            {/* 2. TENGAH: Distribusi Kategori Dokumen */}
            <div className="flex-1 min-w-[145px] max-w-[210px] bg-slate-50/70 rounded-xl p-2 border border-slate-200/70 flex flex-col justify-between h-[128px]">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/50">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Kategori Dokumen
                </span>
                <span className="text-[9px] font-semibold text-slate-400">
                  5 Jenis
                </span>
              </div>
              <div className="space-y-0.5">
                {docCategoryDonutChart.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocCategoryTab(cat.id);
                      setActiveDetailModal('documents');
                    }}
                    className="w-full flex items-center justify-between py-0.5 pl-2 pr-1.5 rounded-md hover:bg-white hover:shadow-2xs transition text-[10px] group cursor-pointer text-left"
                    title={`Klik untuk melihat data ${cat.label} (${cat.count} unit)`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="text-slate-600 font-medium truncate group-hover:text-slate-900">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <span className="text-[9px] text-slate-400 font-mono">
                        {cat.percentage}%
                      </span>
                      <span className="font-bold text-slate-800 font-mono text-[10.5px]">
                        {cat.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. KANAN: Kartu Status Validitas (5 Status: Berlaku, Permanen, Kritis, Expired, Pending) */}
            <div className="w-[180px] sm:w-[205px] bg-slate-50/70 rounded-xl p-2 border border-slate-200/70 flex flex-col justify-between h-[128px] shrink-0">
              <div className="flex items-center justify-between px-0.5 pb-1 border-b border-slate-200/50">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Validitas
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocUrgencyFilter('all');
                    setActiveDetailModal('documents');
                  }}
                  className="text-[9px] font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
                  title="Lihat semua dokumen tanpa filter status"
                >
                  Total: <strong className="text-slate-800 font-mono">{docs.total_documents ?? 421}</strong>
                </button>
              </div>

              {/* Row 1: Dokumen Aktif / Valid (2 Kolom: Berlaku & Permanen) */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. Berlaku */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocUrgencyFilter('safe');
                    setActiveDetailModal('documents');
                  }}
                  className="p-1 sm:p-1.5 rounded-lg border border-emerald-200/80 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                  title="Dokumen Berjangka yang Masih Berlaku Aman (>30/60 hari)"
                >
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[9px] font-bold text-emerald-800 truncate">Berlaku</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono">
                      {docs.total_safe ?? 141}
                    </span>
                  </div>
                </div>

                {/* 2. Permanen */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (docCategoryTab === 'silo') setDocCategoryTab('permit');
                    setDocUrgencyFilter('no_expiry');
                    setActiveDetailModal('documents');
                  }}
                  className="p-1 sm:p-1.5 rounded-lg border border-sky-200/80 bg-white hover:bg-sky-50 hover:border-sky-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                  title="Dokumen Berlaku Tetap / Tanpa Batas Waktu (Non-Expiry)"
                >
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                    <span className="text-[9px] font-bold text-sky-800 truncate">Permanen</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-sky-700 font-mono">
                      {docs.total_no_expiry ?? 84}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Status Perlu Tindak Lanjut (3 Kolom: Kritis, Expired, Pending Update) */}
              <div className="grid grid-cols-3 gap-1">
                {/* 3. Kritis */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocUrgencyFilter('critical');
                    setActiveDetailModal('documents');
                  }}
                  className="p-1 rounded-lg border border-amber-200/80 bg-white hover:bg-amber-50 hover:border-amber-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                  title="Dokumen Mendekati Jatuh Tempo (H-30, SILO H-60)"
                >
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
                    <span className="text-[8px] sm:text-[8.5px] font-bold text-amber-800 truncate">Kritis</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-amber-700 font-mono">
                      {docs.total_critical ?? 25}
                    </span>
                  </div>
                </div>

                {/* 4. Expired */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocUrgencyFilter('expired');
                    setActiveDetailModal('documents');
                  }}
                  className="p-1 rounded-lg border border-rose-200/80 bg-white hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                  title="Dokumen Sudah Melewati Masa Berlaku"
                >
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="text-[8px] sm:text-[8.5px] font-bold text-rose-800 truncate">Expired</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-rose-600 font-mono">
                      {docs.total_expired ?? 91}
                    </span>
                  </div>
                </div>

                {/* 5. Pending Update */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocCategoryTab('silo');
                    setDocUrgencyFilter('pending');
                    setActiveDetailModal('documents');
                  }}
                  className="p-1 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between shadow-2xs"
                  title="Dokumen / Unit Menunggu Pengisian Tanggal atau Jadwal Update (80 Unit SILO)"
                >
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span className="text-[8px] sm:text-[8.5px] font-bold text-slate-700 truncate" title="Pending Update">Pending</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-700 font-mono">
                      {docs.total_pending ?? 80}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Sederhana, Bersih & Elegan */}
          <div className="pt-2 pb-0.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
            <span className="text-slate-600">
              <strong className="text-amber-700">{docs.total_critical ?? 25} Kritis</strong> &bull; Total {docs.total_documents ?? 421} Dokumen
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Lihat Detail & Tabel <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* CARD 2: KINERJA & TREN BEBAN KERJA LEGAL (POIN 5) */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-full min-h-0">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-emerald-50 text-emerald-700 rounded-md">
                <TrendingUp size={13} />
              </div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-900 text-xs">
                  Kinerja & Beban Kerja (KPI)
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <DatasetBadgeButton source={DATA_SOURCE_MAPPING.kpi} label="Dataset" onClick={setSelectedDataSourceModal} />
              <button
                type="button"
                onClick={() => {
                  setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                  setKpiSelectedMonth(selectedMonth);
                  setActiveDetailModal('kpi');
                }}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition"
              >
                <span>Detail KPI</span>
                <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* KPI Mini Scorecard Summary */}
          <div className="grid grid-cols-4 gap-1 pt-1 text-center">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setKpiCategoryTab('all');
                setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                setKpiSelectedMonth(selectedMonth);
                setActiveDetailModal('kpi');
              }}
              className="p-1 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 hover:shadow-2xs cursor-pointer transition group/box"
              title="Klik untuk melihat semua daftar beban kerja KPI"
            >
              <div className="text-xs font-bold text-emerald-700 group-hover/box:scale-105 transition-transform">100%</div>
              <div className="text-[8px] text-emerald-800 font-semibold">Targeted</div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setKpiCategoryTab('review');
                setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                setKpiSelectedMonth(selectedMonth);
                setActiveDetailModal('kpi');
              }}
              className="p-1 rounded bg-blue-50 border border-blue-100 hover:bg-blue-100/80 hover:shadow-2xs cursor-pointer transition group/box"
              title="Klik untuk melihat rincian dokumen Legal Review"
            >
              <div className="text-xs font-bold text-blue-700 group-hover/box:scale-105 transition-transform">{kpi.review_count ?? (kpi.total_review_ytd ?? 40)}</div>
              <div className="text-[8px] text-blue-800 font-semibold">Review</div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setKpiCategoryTab('drafting');
                setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                setKpiSelectedMonth(selectedMonth);
                setActiveDetailModal('kpi');
              }}
              className="p-1 rounded bg-amber-50 border border-amber-100 hover:bg-amber-100/80 hover:shadow-2xs cursor-pointer transition group/box"
              title="Klik untuk melihat rincian dokumen Legal Drafting"
            >
              <div className="text-xs font-bold text-amber-700 group-hover/box:scale-105 transition-transform">{kpi.drafting_count ?? (kpi.total_drafting_ytd ?? 49)}</div>
              <div className="text-[8px] text-amber-800 font-semibold">Drafting</div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setKpiCategoryTab('advisory');
                setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                setKpiSelectedMonth(selectedMonth);
                setActiveDetailModal('kpi');
              }}
              className="p-1 rounded bg-purple-50 border border-purple-100 hover:bg-purple-100/80 hover:shadow-2xs cursor-pointer transition group/box"
              title="Klik untuk melihat rincian konsultasi Legal Advisory"
            >
              <div className="text-xs font-bold text-purple-700 group-hover/box:scale-105 transition-transform">{kpi.advisory_count ?? (kpi.total_advisory_ytd ?? 12)}</div>
              <div className="text-[8px] text-purple-800 font-semibold">Advisory</div>
            </div>
          </div>

          {/* Area Chart: Monthly Trend */}
          <div className="w-full flex-1 min-h-[80px] my-auto py-0.5 relative flex items-center justify-center">
            <div className="w-full h-full min-h-[80px]">
              <Chart
                options={workloadTrendChart.options}
                series={workloadTrendChart.series}
                type="area"
                height="100%"
                width="100%"
              />
            </div>
          </div>

          <div className="pt-2 pb-0.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
            <span>Rata-rata Durasi: <strong className="text-slate-700">{kpi.avg_duration_days ?? 2.3} Hari</strong></span>
            {(() => {
              const litCount = Number(kpi.litigasi ?? (kpi.total_litigasi ?? 0));
              const pelCount = Number(kpi.pelanggaran ?? (kpi.total_pelanggaran ?? 0));
              const hasCases = litCount > 0 || pelCount > 0;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setKpiCategoryTab(litCount > 0 ? 'litigasi' : (pelCount > 0 ? 'pelanggaran' : 'litigasi'));
                    setKpiViewMode(selectedMonth !== 'all' ? 'monthly' : 'ytd');
                    setKpiSelectedMonth(selectedMonth);
                    setActiveDetailModal('kpi');
                  }}
                  className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border transition cursor-pointer shadow-2xs ${
                    hasCases
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title="Klik untuk membuka pop-up Detail Litigasi & Sengketa"
                >
                  {hasCases ? (
                    <AlertTriangle size={10} className="text-rose-600 animate-pulse shrink-0" />
                  ) : (
                    <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                  )}
                  <span className="font-mono">{pelCount}</span> Sengketa &bull; <span className="font-mono">{litCount}</span> Litigasi
                </button>
              );
            })()}
          </div>
        </div>

        {/* CARD 3: BUDGET OPERASIONAL (POIN 6) */}
        <div
          onClick={() => {
            setActiveDetailModal('budget');
            if (selectedMonth !== 'all') {
              setBudgetSelectedMonth(selectedMonth);
              setBudgetViewMode('filtered');
            }
          }}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full min-h-0 group"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-purple-50 text-purple-700 rounded-md shrink-0">
                <DollarSign size={13} />
              </div>
              <div className="flex items-center gap-1 truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  Budget Operasional
                </h3>
                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  {selectedMonth !== 'all' ? (MONTH_NAMES.find(m => m.id === selectedMonth)?.label?.split(' ')[0] || `Bulan ${selectedMonth}`) : 'YTD'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={DATA_SOURCE_MAPPING.budget} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-around gap-3 sm:gap-6 my-auto py-1 border-y border-slate-100 flex-1 px-1">
            <div className="w-[112px] h-[112px] flex items-center justify-center shrink-0">
              <Chart
                options={budgetGaugeChart.options}
                series={budgetGaugeChart.series}
                type="radialBar"
                height={112}
                width={112}
              />
            </div>
            <div className="flex-1 max-w-[280px] sm:max-w-[310px] space-y-1.5 min-w-0">
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Anggaran:</span>
                <span className="text-[11.5px] font-bold text-slate-900 truncate">
                  {formatCurrency(
                    selectedMonth !== 'all'
                      ? (budget.current_month_budget ?? 0)
                      : (budget.ytd_budget ?? 49000000)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200">
                <span className="text-[10px] text-purple-800 font-medium">Realisasi:</span>
                <span className="text-[11.5px] font-bold text-purple-700 truncate">
                  {formatCurrency(
                    selectedMonth !== 'all'
                      ? (budget.current_month_actual ?? 0)
                      : (budget.ytd_actual ?? 30615407)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-medium">Sisa:</span>
                <span className="text-[11.5px] font-bold text-emerald-700 truncate">
                  {formatCurrency(
                    selectedMonth !== 'all'
                      ? ((budget.current_month_budget ?? 0) - (budget.current_month_actual ?? 0))
                      : ((budget.ytd_budget ?? 49000000) - (budget.ytd_actual ?? 30615407))
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-slate-500 shrink-0 pt-2 pb-0.5 border-t border-slate-100">
            <span className="text-purple-700 font-semibold">
              {selectedMonth !== 'all'
                ? (Number(budget.current_month_budget) > 0 ? `Utilisasi: ${budget.current_month_utilization ?? 0}%` : 'Belum Ada Anggaran')
                : `Utilisasi YTD: ${budget.ytd_utilization_rate ?? 62.5}%`}
            </span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Rincian LPJ <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* CARD 4: MATRIKS PERATURAN PERUNDANG-UNDANGAN (STATUS KEPATUHAN) */}
        <div
          onClick={() => setActiveDetailModal('regulations')}
          className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-full min-h-0 group"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <div className="p-1 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                <Scale size={13} />
              </div>
              <div className="flex items-center gap-1 truncate">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition truncate">
                  Kepatuhan Regulasi & UU
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DatasetBadgeButton source={DATA_SOURCE_MAPPING.regulations} onClick={setSelectedDataSourceModal} />
              <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition ml-0.5" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-around gap-3 sm:gap-6 my-auto py-1 border-y border-slate-100 flex-1 px-1">
            <div className="w-[112px] h-[112px] flex items-center justify-center shrink-0">
              <Chart
                options={regulationsGaugeChart.options}
                series={regulationsGaugeChart.series}
                type="radialBar"
                height={112}
                width={112}
              />
            </div>
            <div className="flex-1 max-w-[280px] sm:max-w-[310px] space-y-1.5 min-w-0">
              <div className="flex items-center justify-between bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-medium">Terpenuhi:</span>
                <span className="text-[11.5px] font-bold text-emerald-700 truncate">
                  {regulationsSummary.comply ?? 59} Regulasi
                </span>
              </div>
              <div className="flex items-center justify-between bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-800 font-medium">Belum Terpenuhi:</span>
                <span className="text-[11.5px] font-bold text-rose-700 truncate">
                  {regulationsSummary.non_comply ?? 6} Regulasi
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Total Klausul:</span>
                <span className="text-[11.5px] font-bold text-slate-700 truncate">
                  {regulationsSummary.total ?? 65} Regulasi
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-slate-500 shrink-0 pt-2 pb-0.5 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Tingkat Kepatuhan: {regulationsSummary.compliance_rate ?? 91}%
            </span>
            <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
              Lihat Detail <ChevronRight size={10} />
            </span>
          </div>
        </div>

      </div>
      <Modal
        isOpen={activeDetailModal === 'documents'}
        onClose={() => setActiveDetailModal(null)}
        title="Monitoring Dokumen & Legalitas"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          {/* Tabs inside modal */}
          <div className="flex border-b border-stroke overflow-x-auto gap-1 bg-gray-50/80 p-1 rounded-lg">
            {[
              { id: 'silo', label: 'SILO', icon: Wrench },
              { id: 'permit', label: 'Perizinan', icon: FileCheck },
              { id: 'agreement', label: 'Perjanjian (PKS)', icon: Building2 },
              { id: 'project_contract', label: 'Kontrak Project', icon: Briefcase },
              { id: 'vehicle', label: 'Izin Kendaraan', icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = docCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDocCategoryTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${isActive ? 'bg-white text-primary shadow-xs border border-stroke' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Asal Sumber Data File (Clean & Structured) */}
          <DataSourceCard source={DATA_SOURCE_MAPPING[docCategoryTab]} onOpenDetail={setSelectedDataSourceModal} />

          {/* Search & Filter */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchDocumentsList();
                }}
                placeholder="Cari nama kendaraan, nomor polisi, alat, PIC..."
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-stroke rounded-lg focus:outline-none focus:border-primary text-xs"
              />
              {docSearch && (
                <button
                  onClick={() => setDocSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-danger"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {docCategoryTab === 'silo' && (
                <select
                  value={docSiloTypeFilter}
                  onChange={(e) => setDocSiloTypeFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-gray-50 border border-stroke rounded-lg text-xs font-medium text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Kategori SILO</option>
                  <option value="Alat Berat">🚜 Alat Berat Saja</option>
                  <option value="Equipment">⚙️ Equipment Saja</option>
                </select>
              )}

              <select
                value={docUrgencyFilter}
                onChange={(e) => setDocUrgencyFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-gray-50 border border-stroke rounded-lg text-xs font-medium text-gray-700 cursor-pointer"
              >
                <option value="all">Semua Status Expiry</option>
                <option value="safe">🟢 Masih Berlaku</option>
                <option value="critical">🟠 Kritis (H-30 / H-60)</option>
                <option value="expired">🔴 Expired</option>
                <option value="pending">⚪ Pending Update</option>
                {docCategoryTab !== 'silo' && (
                  <option value="no_expiry">🔵 Permanen / Non-Expiry</option>
                )}
              </select>
            </div>
          </div>


          {/* Table */}
          <div className="border border-stroke rounded-lg overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                {docCategoryTab === 'vehicle' ? (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2">No. Polisi / Plat</th>
                    <th className="p-2">Nama Kendaraan & Unit</th>
                    <th className="p-2">Project / Lokasi Site</th>
                    <th className="p-2">Jatuh Tempo Pajak</th>
                    <th className="p-2">Jatuh Tempo STNK (5 Th)</th>
                    <th className="p-2">Jatuh Tempo KIR</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                ) : docCategoryTab === 'permit' ? (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2">Topic</th>
                    <th className="p-2">Deskripsi Dokumen</th>
                    <th className="p-2">Pihak Terkait</th>
                    <th className="p-2">Tanggal Mulai</th>
                    <th className="p-2">Tanggal Selesai</th>
                    <th className="p-2">Keterangan</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2 text-center">Hard File</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                ) : docCategoryTab === 'agreement' ? (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2">Topic</th>
                    <th className="p-2">Deskripsi Dokumen</th>
                    <th className="p-2">Pihak / Rekanan</th>
                    <th className="p-2">Tanggal Mulai</th>
                    <th className="p-2">Tanggal Selesai</th>
                    <th className="p-2">Keterangan</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2 text-center">Hard File</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                ) : docCategoryTab === 'project_contract' ? (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2">Topic</th>
                    <th className="p-2">No. Regist Project</th>
                    <th className="p-2">Deskripsi Dokumen / Project</th>
                    <th className="p-2">Pihak Pemberi Kerja</th>
                    <th className="p-2">Mulai Kontrak</th>
                    <th className="p-2">Akhir Kontrak</th>
                    <th className="p-2">Keterangan</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2 text-center">Hard File</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                ) : docCategoryTab === 'silo' ? (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2 whitespace-nowrap">ID Asset</th>
                    <th className="p-2 whitespace-nowrap">Kategori SILO</th>
                    <th className="p-2 whitespace-nowrap">Jenis Equipment</th>
                    <th className="p-2 min-w-[160px]">Nama Asset</th>
                    <th className="p-2 whitespace-nowrap">Serial Number</th>
                    <th className="p-2 whitespace-nowrap text-center">Tahun Produksi</th>
                    <th className="p-2 whitespace-nowrap">Expired Date</th>
                    <th className="p-2 whitespace-nowrap">Status & Countdown</th>
                    <th className="p-2 min-w-[160px]">Keterangan</th>
                    <th className="p-2 text-center whitespace-nowrap">Hard File</th>
                    <th className="p-2 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2">Identitas Dokumen</th>
                    <th className="p-2">Nama Dokumen</th>
                    <th className="p-2">Pihak Terkait / Lokasi</th>
                    <th className="p-2">Expired Date</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-stroke">
                {documentsList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        docCategoryTab === 'silo' ? 12 :
                        docCategoryTab === 'project_contract' ? 11 :
                        (docCategoryTab === 'permit' || docCategoryTab === 'agreement') ? 10 :
                        docCategoryTab === 'vehicle' ? 9 : 7
                      }
                      className="p-8 text-center text-gray-400"
                    >
                      Tidak ada data dokumen atau kendaraan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  documentsList.map((doc, idx) => {
                    let vDetail = { tax_due_date: '-', stnk_due_date: '-', kir_due_date: '-' };
                    if (docCategoryTab === 'vehicle' && doc.notes) {
                      try {
                        const parsed = JSON.parse(doc.notes);
                        vDetail = {
                          tax_due_date: parsed.tax_due_date || '-',
                          stnk_due_date: parsed.stnk_due_date || '-',
                          kir_due_date: parsed.kir_due_date || '-'
                        };
                      } catch (e) { }
                    }

                    if (docCategoryTab === 'vehicle') {
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-boxdark whitespace-nowrap">{doc.identifier || '-'}</td>
                          <td
                            className="p-2 font-semibold text-boxdark hover:text-primary cursor-pointer transition"
                            onClick={() => setSelectedDocForDetail(doc)}
                            title="Klik untuk melihat rincian & asal sumber file dokumen ini"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{doc.document_name}</span>
                              <Eye size={11} className="text-gray-400 opacity-60 flex-shrink-0" />
                            </div>
                          </td>
                          <td className="p-2 text-gray-600">{doc.location || '-'}</td>
                          <td className="p-2 whitespace-nowrap font-medium text-boxdark">{vDetail.tax_due_date}</td>
                          <td className="p-2 whitespace-nowrap text-gray-600">{vDetail.stnk_due_date}</td>
                          <td className="p-2 whitespace-nowrap text-gray-600">
                            {vDetail.kir_due_date !== '-' ? (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-medium">
                                {vDetail.kir_due_date}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2 whitespace-nowrap">{getUrgencyBadge(doc.urgency_status, doc.days_remaining, 'vehicle')}</td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                              title="Lihat Detail & Asal File Excel"
                            >
                              <Eye size={11} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    if (docCategoryTab === 'permit' || docCategoryTab === 'agreement') {
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px] border border-slate-200">
                              {doc.topic || '-'}
                            </span>
                          </td>
                          <td className="p-2">
                            <div
                              className="font-semibold text-boxdark hover:text-primary cursor-pointer transition flex items-center gap-1.5"
                              onClick={() => setSelectedDocForDetail(doc)}
                              title="Klik untuk melihat rincian & asal sumber file dokumen ini"
                            >
                              <span>{doc.document_name}</span>
                              <Eye size={11} className="text-gray-400 opacity-60 flex-shrink-0" />
                            </div>
                          </td>
                          <td className="p-2 text-gray-600">{doc.related_party || doc.location || '-'}</td>
                          <td className="p-2 whitespace-nowrap text-gray-700 font-medium">
                            {doc.start_date ? doc.start_date.substring(0, 10) : '-'}
                          </td>
                          <td className="p-2 whitespace-nowrap font-medium text-boxdark">
                            {doc.expired_date ? doc.expired_date.substring(0, 10) : (doc.status?.toLowerCase().includes('permanent') ? 'Permanent' : '-')}
                          </td>
                          <td className="p-2 min-w-[140px] max-w-[260px] text-[11px] text-gray-700">
                            <span className="block whitespace-normal break-words leading-relaxed" title={doc.status || '-'}>{doc.status || '-'}</span>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {doc.has_hard_file ? (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                                Ada
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-200 rounded text-[10px]">
                                Tidak
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                              title="Lihat Detail & Asal File Excel"
                            >
                              <Eye size={11} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    if (docCategoryTab === 'project_contract') {
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded text-[11px] border border-indigo-200">
                              {doc.topic || '-'}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-bold text-boxdark whitespace-nowrap">
                            {doc.identifier || '-'}
                          </td>
                          <td className="p-2">
                            <div
                              className="font-semibold text-boxdark hover:text-primary cursor-pointer transition flex items-center gap-1.5"
                              onClick={() => setSelectedDocForDetail(doc)}
                              title="Klik untuk melihat rincian & asal sumber file dokumen ini"
                            >
                              <span>{doc.document_name}</span>
                              <Eye size={11} className="text-gray-400 opacity-60 flex-shrink-0" />
                            </div>
                          </td>
                          <td className="p-2 text-gray-700 font-medium">{doc.related_party || '-'}</td>
                          <td className="p-2 whitespace-nowrap text-gray-700 font-medium">
                            {doc.start_date ? doc.start_date.substring(0, 10) : '-'}
                          </td>
                          <td className="p-2 whitespace-nowrap font-medium text-boxdark">
                            {doc.expired_date ? doc.expired_date.substring(0, 10) : '-'}
                          </td>
                          <td className="p-2 min-w-[140px] max-w-[260px] text-[11px] text-gray-700">
                            <span className="block whitespace-normal break-words leading-relaxed" title={doc.status || '-'}>{doc.status || '-'}</span>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {doc.has_hard_file ? (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                                Ada
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-200 rounded text-[10px]">
                                Tidak
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                              title="Lihat Detail & Asal File Excel"
                            >
                              <Eye size={11} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    // Tab SILO (Alat Berat & Equipment)
                    if (docCategoryTab === 'silo') {
                      const tahunProd = doc.notes?.match(/Tahun Produksi:\s*([^\s|]+)/i)?.[1] || '-';
                      const cleanNotes = doc.notes
                        ? doc.notes.replace(/\s*\|\s*Tahun Produksi:\s*[^\s|]+/gi, '').replace(/Tahun Produksi:\s*[^\s|]+(\s*\|\s*)?/gi, '').trim()
                        : '';

                      return (
                        <tr key={doc.id} className="hover:bg-gray-50 transition">
                          <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                            {doc.identifier || '-'}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {doc.location === 'Alat Berat' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Alat Berat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Equipment
                              </span>
                            )}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {doc.topic || '-'}
                            </span>
                          </td>
                          <td className="p-2 min-w-[160px]">
                            <div
                              className="font-semibold text-boxdark hover:text-primary cursor-pointer transition flex items-center gap-1.5"
                              onClick={() => setSelectedDocForDetail(doc)}
                              title="Klik untuk melihat rincian & asal sumber file dokumen ini"
                            >
                              <span className="whitespace-normal break-words">{doc.document_name}</span>
                              <Eye size={11} className="text-gray-400 opacity-60 flex-shrink-0" />
                            </div>
                          </td>
                          <td className="p-2 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                            {doc.related_party || '-'}
                          </td>
                          <td className="p-2 text-center font-mono text-gray-700 whitespace-nowrap text-[11px]">
                            {tahunProd}
                          </td>
                          <td className="p-2 whitespace-nowrap font-mono text-slate-700 font-medium">
                            {doc.expired_date ? doc.expired_date.substring(0, 10) : <span className="text-gray-400 italic">-</span>}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}
                          </td>
                          <td className="p-2 min-w-[160px] max-w-[280px] text-[11px] text-gray-700 whitespace-normal break-words leading-relaxed">
                            {cleanNotes ? (
                              <span className="block">{cleanNotes}</span>
                            ) : (
                              <span className="text-gray-300 italic">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {doc.has_hard_file ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-[10px] font-semibold" title="Map Fisik SILO Tersedia">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>Ada</span>
                              </span>
                            ) : (
                              <span className="text-gray-300 text-[10px] font-medium">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                              title="Lihat Detail & Asal File Excel"
                            >
                              <Eye size={11} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    // Fallback jika ada kategori umum lainnya
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-medium">{doc.identifier || '-'}</td>
                        <td className="p-2">
                          <div
                            className="font-semibold text-boxdark hover:text-primary cursor-pointer transition flex items-center gap-1.5"
                            onClick={() => setSelectedDocForDetail(doc)}
                            title="Klik untuk melihat rincian & asal sumber file dokumen ini"
                          >
                            <span>{doc.document_name}</span>
                            <Eye size={11} className="text-gray-400 opacity-60 flex-shrink-0" />
                          </div>
                          <div className="text-[10px] text-gray-400">{doc.topic}</div>
                        </td>
                        <td className="p-2 text-gray-600">{doc.location || doc.related_party || '-'}</td>
                        <td className="p-2 whitespace-nowrap font-medium text-boxdark">{doc.expired_date ? doc.expired_date.substring(0, 10) : '-'}</td>
                        <td className="p-2 whitespace-nowrap">{getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDocForDetail(doc)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                            title="Lihat Detail & Asal File Excel"
                          >
                            <Eye size={11} />
                            <span>Detail</span>
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


      {/* ========================================================================= */}
      {/* FULL MODAL 2: Detail Kontrak Karyawan (MP Baseline)                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'manpower'}
        onClose={() => setActiveDetailModal(null)}
        title="Kontrak Karyawan (PKWT)"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="text-xs text-slate-600 font-medium">
              Total: <strong className="text-slate-800 font-bold">{mpList.length} Karyawan</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Nama Karyawan', 'Status', 'Project / Branch Site', 'Tanggal Berakhir Kontrak'];
                  const rows = mpList.map((emp, i) => [
                    i + 1,
                    emp.nama,
                    emp.status || 'Contract',
                    emp.branch,
                    emp.end_date || '-'
                  ]);
                  downloadAsCsv(`Kontrak_Karyawan_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download size={13} className="text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Asal Sumber Data File (Clean & Structured) */}
          <DataSourceCard source={DATA_SOURCE_MAPPING.manpower} onOpenDetail={setSelectedDataSourceModal} />

          {/* Filter Toolbar: Name, Status, Branch/Site & Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 border border-stroke rounded-lg">
            {/* Search by Name */}
            <div className="relative min-w-[180px] flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchMpList();
                }}
                placeholder="Cari nama karyawan..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-stroke rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* Dropdown Filter Status */}
            <div className="flex items-center gap-1">
              <select
                value={mpStatusFilter}
                onChange={(e) => setMpStatusFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-stroke rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">Semua Status</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Filter Project / Branch Site (Searchable) */}
            <SearchableSelect
              value={mpBranchFilter}
              onChange={setMpBranchFilter}
              options={availableBranches}
              placeholder="Semua Site / Branch"
              searchPlaceholder="Cari site / branch..."
              prefix="Site: "
            />

            {/* Dropdown Mode: All vs Expiring Soon */}
            <div className="flex items-center gap-1">
              <select
                value={mpFilter}
                onChange={(e) => setMpFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-stroke rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">Semua Karyawan (802 Total)</option>
                <option value="expiring_soon">Habis Durasi (Mendekati Expiry)</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={() => {
                setMpSearch('');
                setMpStatusFilter('all');
                setMpBranchFilter('all');
                setMpFilter('all');
                setMpSortOrder('asc');
              }}
              className="p-1.5 text-gray-500 hover:text-danger hover:bg-red-50 rounded-lg transition"
              title="Reset Semua Filter"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Quick Counter & Sort Indicator */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>
              Menampilkan <b className="text-boxdark">{mpList.length}</b> data karyawan
              {mpBranchFilter !== 'all' && ` pada site ${mpBranchFilter}`}
              {mpStatusFilter !== 'all' && ` status ${mpStatusFilter}`}
            </span>
            <div className="flex items-center gap-1 text-gray-500">
              <span>Urutan Expired:</span>
              <button
                onClick={() => setMpSortOrder(mpSortOrder === 'asc' ? 'desc' : 'asc')}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded font-semibold transition"
              >
                {mpSortOrder === 'asc' ? (
                  <>
                    <ArrowUp size={12} />
                    <span>Terdekat (Ascending)</span>
                  </>
                ) : (
                  <>
                    <ArrowDown size={12} />
                    <span>Terjauh (Descending)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-stroke rounded-lg overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                <tr>
                  <th className="p-2 w-10 text-center">No</th>
                  <th className="p-2">Nama Karyawan</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Project / Branch Site</th>
                  <th
                    onClick={() => setMpSortOrder(mpSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 cursor-pointer hover:text-primary transition select-none"
                    title="Klik untuk ubah urutan Ascending / Descending"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tanggal Berakhir Kontrak</span>
                      {mpSortOrder === 'asc' ? (
                        <ArrowUp size={13} className="text-primary font-bold" />
                      ) : (
                        <ArrowDown size={13} className="text-primary font-bold" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {mpList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      Tidak ada data karyawan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  mpList.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                      <td className="p-2 font-semibold text-boxdark">{emp.nama}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            emp.status === 'Permanent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.status === 'Permanent Project'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {emp.status || 'Contract'}
                        </span>
                      </td>
                      <td className="p-2 text-gray-600 font-medium">{emp.branch}</td>
                      <td className="p-2 text-danger font-semibold whitespace-nowrap">{emp.end_date || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL MODAL 3: Detail KPI Kinerja Divisi Legal                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'kpi'}
        onClose={() => setActiveDetailModal(null)}
        title="KPI Divisi Legal 2026"
        maxWidth="max-w-6xl"
      >
        {(() => {
          const ytdData = kpiDetail?.ytd_totals || {
            total_review: 40,
            total_drafting: 49,
            total_review_and_draft: 89,
            total_advisory: 12,
            total_work: 101,
            total_litigasi: 0,
            total_pelanggaran: 0,
            achievement_rate: 100.0,
            actual_avg_days: 2.3,
          };

          const monthlyTrend = kpiDetail?.monthly_trend || {};
          const isMonthly = kpiViewMode === 'monthly';
          const activeMonthKey = (kpiSelectedMonth !== 'all') ? kpiSelectedMonth : (selectedMonth !== 'all' ? selectedMonth : '3');
          const currentMonthData = monthlyTrend[activeMonthKey] || {
            month_name: MONTH_NAMES.find(m => m.id === activeMonthKey)?.label || `Bulan ${activeMonthKey} 2026`,
            review: 7,
            drafting: 4,
            advisory: 1,
            litigasi: 0,
            pelanggaran: 0,
            total: 12,
            avg_days: 2.2,
          };

          const activeReview = isMonthly ? currentMonthData.review : ytdData.total_review;
          const activeDrafting = isMonthly ? currentMonthData.drafting : ytdData.total_drafting;
          const activeAdvisory = isMonthly ? currentMonthData.advisory : ytdData.total_advisory;
          const activeLitigasi = isMonthly ? (currentMonthData.litigasi ?? 0) : (ytdData.total_litigasi ?? 0);
          const activePelanggaran = isMonthly ? (currentMonthData.pelanggaran ?? 0) : (ytdData.total_pelanggaran ?? 0);
          const activeTotal = isMonthly ? currentMonthData.total : ytdData.total_work;
          const activeAvgDays = isMonthly ? currentMonthData.avg_days : ytdData.actual_avg_days;
          const activePeriodTitle = isMonthly
            ? (currentMonthData.month_name || `Bulan ${activeMonthKey} 2026`)
            : 'Akumulatif YTD 2026';

          // Project Items
          const allKpiItems = kpiDetail?.all_items || kpiDetail?.items || [];
          const periodItems = isMonthly
            ? allKpiItems.filter(it => Number(it.month_num) === Number(activeMonthKey))
            : allKpiItems;

          const categoryCounts = {
            all: periodItems.length,
            review: periodItems.filter(it => it.category === 'review').length,
            drafting: periodItems.filter(it => it.category === 'drafting').length,
            advisory: periodItems.filter(it => it.category === 'advisory').length,
            litigasi: periodItems.filter(it => it.category === 'litigasi').length,
            pelanggaran: periodItems.filter(it => it.category === 'pelanggaran').length,
          };

          const displayedItems = periodItems.filter(item => {
            if (kpiCategoryTab !== 'all' && item.category !== kpiCategoryTab) {
              return false;
            }
            if (kpiSearchQuery.trim()) {
              const q = kpiSearchQuery.toLowerCase();
              const mName = (item.project_name || '').toLowerCase().includes(q);
              const mParty = (item.party || '').toLowerCase().includes(q);
              const mTopic = (item.topic || '').toLowerCase().includes(q);
              const mReg = (item.register_no || '').toLowerCase().includes(q);
              if (!mName && !mParty && !mTopic && !mReg) return false;
            }
            return true;
          });

          return (
            <div className="space-y-4 text-slate-800 p-1">
              {/* Header Toolbar: Toggle Periode & Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setKpiViewMode('ytd')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${!isMonthly
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Akumulatif (YTD)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKpiViewMode('monthly');
                        if (kpiSelectedMonth === 'all') setKpiSelectedMonth('3');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${isMonthly
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Bulanan
                    </button>
                  </div>

                  {isMonthly && (
                    <select
                      value={activeMonthKey}
                      onChange={(e) => {
                        setKpiSelectedMonth(e.target.value);
                        setKpiViewMode('monthly');
                      }}
                      className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {MONTH_NAMES.filter(m => m.id !== 'all').map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['No', 'Kategori', 'Topik', 'Nama Project / Dokumen', 'Pihak Terkait', 'No. Registrasi', 'Bulan', 'Tgl Masuk', 'Tgl Selesai', 'Durasi (Hari)', 'Target SLA', 'Status'];
                      const rows = displayedItems.map((item, idx) => [
                        idx + 1,
                        item.category_label,
                        item.topic,
                        item.project_name,
                        item.party,
                        item.register_no,
                        item.month_name,
                        item.date_in || '-',
                        item.date_out || '-',
                        item.duration_days !== null ? item.duration_days : '-',
                        item.sla_target,
                        item.sla_compliance
                      ]);
                      downloadAsCsv(`KPI_Legal_${activePeriodTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, headers, rows);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} className="text-slate-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Asal Sumber Data File (Clean & Structured) */}
              <DataSourceCard source={DATA_SOURCE_MAPPING.kpi} onOpenDetail={setSelectedDataSourceModal} />

              {/* 7 Ringkasan Angka Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xl font-bold text-emerald-600">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Targeted (Capaian)</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab(kpiCategoryTab === 'review' ? 'all' : 'review')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'review'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-blue-50/50'
                    }`}
                >
                  <div className="text-xl font-bold text-blue-600">{activeReview}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Legal Review</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab(kpiCategoryTab === 'drafting' ? 'all' : 'drafting')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'drafting'
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/50'
                    }`}
                >
                  <div className="text-xl font-bold text-indigo-600">{activeDrafting}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Legal Drafting</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab(kpiCategoryTab === 'advisory' ? 'all' : 'advisory')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'advisory'
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-purple-50/50'
                    }`}
                >
                  <div className="text-xl font-bold text-purple-600">{activeAdvisory}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Legal Advisory</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab(kpiCategoryTab === 'litigasi' ? 'all' : 'litigasi')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'litigasi'
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-rose-50/50'
                    }`}
                >
                  <div className="text-xl font-bold text-rose-600">{activeLitigasi}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Litigasi</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab(kpiCategoryTab === 'pelanggaran' ? 'all' : 'pelanggaran')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'pelanggaran'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-amber-50/50'
                    }`}
                >
                  <div className="text-xl font-bold text-amber-600">{activePelanggaran}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Pelanggaran</div>
                </div>

                <div
                  onClick={() => setKpiCategoryTab('all')}
                  className={`p-2.5 border rounded-xl cursor-pointer transition ${kpiCategoryTab === 'all'
                    ? 'bg-slate-100 border-slate-800 ring-2 ring-slate-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="text-xl font-bold text-slate-900">{activeTotal}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Total</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span>Rata-rata Durasi: <strong className="text-slate-800">{activeAvgDays} Hari Kerja</strong></span>
                <span>Litigasi & Pelanggaran: <strong className="text-emerald-700 font-semibold">0 Kasus</strong></span>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Semua</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.all})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('review')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'review'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Review</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.review})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('drafting')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'drafting'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Drafting</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.drafting})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('advisory')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'advisory'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Advisory</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.advisory})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('litigasi')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'litigasi'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Litigasi</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.litigasi})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKpiCategoryTab('pelanggaran')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${kpiCategoryTab === 'pelanggaran'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>Pelanggaran</span>
                    <span className="text-[11px] opacity-80">({categoryCounts.pelanggaran})</span>
                  </button>
                </div>

                <div className="relative min-w-[200px] sm:w-64">
                  <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Cari project / pihak..."
                    value={kpiSearchQuery}
                    onChange={(e) => setKpiSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary transition"
                  />
                  {kpiSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setKpiSearchQuery('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Data Project */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-9">No</th>
                      <th className="py-2 px-2.5 w-24">Kategori</th>
                      <th className="py-2 px-2.5 min-w-[220px]">Nama Project / Dokumen</th>
                      <th className="py-2 px-2.5 min-w-[140px]">Pihak Terkait</th>
                      <th className="py-2 px-2.5 min-w-[110px]">No. Registrasi</th>
                      {!isMonthly && <th className="py-2 px-2.5 w-24">Bulan</th>}
                      <th className="py-2 px-2.5 w-24">Tgl Selesai</th>
                      <th className="py-2 px-2 text-center w-20">Durasi</th>
                      <th className="py-2 px-2 text-center w-24">Status</th>
                      <th className="py-2 px-1.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedItems.length === 0 ? (
                      <tr>
                        <td colSpan={isMonthly ? 9 : 10} className="py-8 text-center text-slate-400">
                          {kpiCategoryTab === 'litigasi'
                            ? 'Tidak ada perkara litigasi pada periode ini (0 kasus).'
                            : kpiCategoryTab === 'pelanggaran'
                              ? 'Tidak ada data pelanggaran pada periode ini (0 kasus).'
                              : 'Tidak ada data yang sesuai.'}
                        </td>
                      </tr>
                    ) : (
                      displayedItems.map((item, idx) => {
                        const catLabel =
                          item.category === 'review'
                            ? 'Review'
                            : item.category === 'drafting'
                              ? 'Drafting'
                              : item.category === 'advisory'
                                ? 'Advisory'
                                : item.category === 'litigasi'
                                  ? 'Litigasi'
                                  : item.category === 'pelanggaran'
                                    ? 'Pelanggaran'
                                    : item.category;

                        const catBadge =
                          item.category === 'review'
                            ? 'bg-blue-50 text-blue-700'
                            : item.category === 'drafting'
                              ? 'bg-indigo-50 text-indigo-700'
                              : item.category === 'advisory'
                                ? 'bg-purple-50 text-purple-700'
                                : item.category === 'litigasi'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700';

                        return (
                          <tr
                            key={item.id || idx}
                            onClick={() => setSelectedKpiProject(item)}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
                            <td className="py-2 px-2.5 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${catBadge}`}>
                                {catLabel}
                              </span>
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-semibold text-slate-800 line-clamp-1" title={item.project_name}>
                                {item.project_name}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-slate-700">
                              <span className="truncate block max-w-[150px]" title={item.party}>
                                {item.party}
                              </span>
                            </td>
                            <td className="py-2 px-2.5">
                              {item.register_no && item.register_no !== '-' ? (
                                <span className="font-mono text-[11px] text-slate-600 truncate block max-w-[110px]" title={item.register_no}>
                                  {item.register_no}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            {!isMonthly && (
                              <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap text-[11px]">
                                {item.month_name?.split(' ')[0]}
                              </td>
                            )}
                            <td className="py-2 px-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              {item.date_out || '-'}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-800 font-medium">
                              {item.duration_days !== null ? `${item.duration_days} hr` : '-'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Selesai
                              </span>
                            </td>
                            <td className="py-2 px-1.5 text-center" onClick={(e) => { e.stopPropagation(); setSelectedKpiProject(item); }}>
                              <button
                                type="button"
                                className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 transition flex items-center justify-center mx-auto cursor-pointer"
                                title="Detail"
                              >
                                <Eye size={13} />
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
          );
        })()}
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP MODAL: Detail Rincian Project / Dokumen Legal Spesifik               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedKpiProject}
        onClose={() => setSelectedKpiProject(null)}
        title="Rincian Project & Dokumen Legal"
        maxWidth="max-w-lg"
      >
        {selectedKpiProject && (
          <div className="space-y-4 text-xs text-slate-800">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${selectedKpiProject.category === 'review'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : selectedKpiProject.category === 'drafting'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                  {selectedKpiProject.category_label}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Check size={11} /> 100% Memenuhi SLA
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedKpiProject.project_name}
              </h3>
              {selectedKpiProject.topic && selectedKpiProject.topic !== '-' && (
                <div className="text-[11px] text-slate-500 font-medium">
                  Topik: <strong className="text-slate-800">{selectedKpiProject.topic}</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Pihak Terkait / Mitra</div>
                <div className="font-bold text-slate-800 mt-0.5 text-xs">{selectedKpiProject.party || '-'}</div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Nomor Registrasi</div>
                <code className="font-mono font-bold text-slate-800 mt-0.5 text-xs block truncate" title={selectedKpiProject.register_no}>
                  {selectedKpiProject.register_no || '-'}
                </code>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Periode Pengerjaan</div>
                <div className="font-bold text-slate-800 mt-0.5 text-xs">{selectedKpiProject.month_name}</div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Durasi Pengerjaan</div>
                <div className="font-bold text-emerald-700 mt-0.5 text-xs">
                  {selectedKpiProject.duration_days !== null ? `${selectedKpiProject.duration_days} Hari Kerja` : '-'}
                </div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Masuk (In)</div>
                <div className="font-mono text-slate-700 mt-0.5 text-xs">{selectedKpiProject.date_in || '-'}</div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Selesai (Out)</div>
                <div className="font-mono text-slate-700 mt-0.5 text-xs">{selectedKpiProject.date_out || '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-600">Target SLA: <strong className="text-slate-800">{selectedKpiProject.sla_target}</strong></span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Sesuai SLA</span>
            </div>

            {selectedKpiProject.notes && selectedKpiProject.notes !== 'Done' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Catatan Tambahan</div>
                <div className="text-xs text-slate-700 whitespace-pre-line">{selectedKpiProject.notes}</div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedKpiProject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* FULL MODAL 4: Detail Budget & Dana Operasional                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'budget'}
        onClose={() => setActiveDetailModal(null)}
        title="Detail Budget & Pertanggungjawaban Dana Operasional Legal"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Asal Sumber Data File (Clean & Structured) */}
          <DataSourceCard source={DATA_SOURCE_MAPPING.budget} onOpenDetail={setSelectedDataSourceModal} />

          {/* Toggle View: Filter Bulan vs Akumulasi YTD & Dropdown Tiap Bulan */}
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBudgetViewMode('filtered')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${budgetViewMode === 'filtered'
                    ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetViewMode('ytd')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${budgetViewMode === 'ytd'
                    ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Akumulasi YTD 2026
                </button>
              </div>

              {budgetViewMode === 'filtered' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs">
                  <Calendar size={13} className="text-purple-600" />
                  <select
                    value={budgetSelectedMonth}
                    onChange={(e) => {
                      setBudgetSelectedMonth(e.target.value);
                      setBudgetViewMode('filtered');
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.filter(m => m.id !== 'all').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              {budgetViewMode === 'filtered'
                ? `Periode ${MONTH_NAMES.find(m => m.id === budgetSelectedMonth)?.label || `Bulan ${budgetSelectedMonth}`}`
                : 'Periode Akumulatif YTD (Januari - Juli 2026)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-50 border border-stroke rounded-lg">
              <div className="text-lg font-bold text-boxdark">
                {formatCurrency(
                  budgetViewMode === 'filtered'
                    ? (budgetDetail?.summary?.current_month_budget ?? 0)
                    : (budgetDetail?.summary?.ytd_budget ?? 49000000)
                )}
              </div>
              <div className="text-gray-400 text-[10px]">
                {budgetViewMode === 'filtered'
                  ? `Pengajuan Anggaran ${MONTH_NAMES.find(m => m.id === budgetSelectedMonth)?.label?.split(' ')[0] || ''}`
                  : 'Total Anggaran Pengajuan YTD'}
              </div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(
                  budgetViewMode === 'filtered'
                    ? (budgetDetail?.summary?.current_month_actual ?? 0)
                    : (budgetDetail?.summary?.ytd_actual ?? 30615407)
                )}
              </div>
              <div className="text-purple-600 text-[10px] font-medium">
                {budgetViewMode === 'filtered'
                  ? `Realisasi LPJ ${MONTH_NAMES.find(m => m.id === budgetSelectedMonth)?.label?.split(' ')[0] || ''}`
                  : 'Realisasi LPJ YTD'}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-lg font-bold text-emerald-700">
                {formatCurrency(
                  budgetViewMode === 'filtered'
                    ? ((budgetDetail?.summary?.current_month_budget ?? 0) - (budgetDetail?.summary?.current_month_actual ?? 0))
                    : ((budgetDetail?.summary?.ytd_budget ?? 49000000) - (budgetDetail?.summary?.ytd_actual ?? 30615407))
                )}
              </div>
              <div className="text-emerald-600 text-[10px] font-medium">
                {budgetViewMode === 'filtered'
                  ? `Sisa / Efisiensi ${MONTH_NAMES.find(m => m.id === budgetSelectedMonth)?.label?.split(' ')[0] || ''}`
                  : 'Sisa / Efisiensi Anggaran YTD'}
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 border-b border-stroke text-gray-500 font-semibold">
                <tr>
                  <th className="p-2.5">Bulan</th>
                  <th className="p-2.5 text-right">Pengajuan Anggaran</th>
                  <th className="p-2.5 text-right">Realisasi LPJ</th>
                  <th className="p-2.5 text-right">Utilisasi</th>
                  <th className="p-2.5">Komponen Biaya Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {Object.entries(budgetDetail?.monthly_trend || {}).map(([mId, item]) => {
                  const isSelected = budgetViewMode === 'filtered' && String(mId) === String(budgetSelectedMonth);
                  return (
                    <tr
                      key={mId}
                      onClick={() => {
                        setBudgetSelectedMonth(String(mId));
                        setBudgetViewMode('filtered');
                      }}
                      className={`transition cursor-pointer ${isSelected ? 'bg-purple-50/80 font-bold border-l-4 border-l-purple-600' : 'hover:bg-gray-50'}`}
                    >
                      <td className="p-2.5 text-boxdark flex items-center gap-1.5">
                        <span>{item.month_name}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded text-[9px] font-bold">
                            Bulan Terpilih
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">{formatCurrency(item.budget)}</td>
                      <td className="p-2.5 text-right text-purple-700">{formatCurrency(item.actual)}</td>
                      <td className="p-2.5 text-right font-medium text-gray-600">
                        {roundTo1((item.actual / Math.max(1, item.budget)) * 100)}%
                      </td>
                      <td className="p-2.5 text-gray-500 font-normal">
                        {Object.keys(item.categories || {}).join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL MODAL: Matriks Peraturan Perundang-Undangan (FRM-AZM-603-012)        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'regulations'}
        onClose={() => setActiveDetailModal(null)}
        title="Matriks Peraturan Perundang-Undangan (FRM-AZM-603-012)"
        maxWidth="max-w-6xl"
      >
        <div className="space-y-3.5 text-xs">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10.5px] font-medium">Total Klausul</span>
                <Scale size={14} className="text-slate-400" />
              </div>
              <div className="text-xl font-bold text-slate-900">{regulationsSummary.total ?? 65}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10.5px] font-bold">Terpenuhi (Comply)</span>
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700">{regulationsSummary.comply ?? 59}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[10.5px] font-bold">Belum Terpenuhi (Non-Comply)</span>
                <AlertTriangle size={14} className="text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-700">{regulationsSummary.non_comply ?? 6}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-[10.5px] font-bold">Tingkat Kepatuhan</span>
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-700">{regulationsSummary.compliance_rate ?? 91}%</div>
            </div>
          </div>

          {/* Asal Sumber Data File (Clean & Structured) */}
          <DataSourceCard
            source={DATA_SOURCE_MAPPING.regulations}
            onOpenDetail={setSelectedDataSourceModal}
          />

          {/* Filter Toolbar & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto bg-white p-1 rounded-lg border border-slate-200 shrink-0">
              {[
                { id: 'all', label: `Semua (${regulationsSummary.total ?? 65})` },
                { id: 'Comply', label: `Terpenuhi (${regulationsSummary.comply ?? 59})`, color: 'text-emerald-700' },
                { id: 'Non-Comply', label: `Belum Terpenuhi (${regulationsSummary.non_comply ?? 6})`, color: 'text-rose-700' },
              ].map((tab) => {
                const isActive = regStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRegStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Dropdowns & Search */}
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
              {/* Filter Sifat Penerapan */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-[10.5px] text-slate-400 font-medium">Sifat:</span>
                <select
                  value={regNatureFilter}
                  onChange={(e) => setRegNatureFilter(e.target.value)}
                  className="text-xs bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Sifat</option>
                  <option value="Wajib">Wajib</option>
                  <option value="Conditional">Conditional</option>
                  <option value="Opsional">Opsional</option>
                </select>
              </div>

              {/* Filter Pihak Terkait */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-[10.5px] text-slate-400 font-medium">Pihak:</span>
                <select
                  value={regPartyFilter}
                  onChange={(e) => setRegPartyFilter(e.target.value)}
                  className="text-xs bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Pihak</option>
                  <option value="Legal">Legal</option>
                  <option value="HSE">HSE</option>
                  <option value="HR">HR</option>
                  <option value="Transport">Transport</option>
                  <option value="Operation">Operation</option>
                  <option value="Finance">Finance</option>
                  <option value="Exim">Exim</option>
                  <option value="IT">IT</option>
                  <option value="GA">GA</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Cari nomor UU, relevansi, tindak lanjut..."
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={() => {
                  const headers = [
                    'No',
                    'Peraturan Perundang-Undangan',
                    'Status Keberlakuan',
                    'Relevansi',
                    'Tindak Lanjut',
                    'Sifat Penerapan',
                    'Pihak Terkait',
                    'Status Kepatuhan'
                  ];
                  const rows = (regulationsList || []).map((r) => [
                    r.no,
                    r.regulation_name,
                    r.validity_status,
                    r.relevance,
                    r.follow_up,
                    r.nature_of_compliance,
                    r.related_party,
                    r.compliance_status
                  ]);
                  downloadAsCsv(`FRM-AZM-603-012_Matriks_Peraturan_Perundang_Undangan_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Unduh data tabel dalam format CSV"
              >
                <Download size={13} className="text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Regulations Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="max-h-[52vh] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5 min-w-[220px]">Peraturan Perundang-Undangan</th>
                    <th className="p-2.5 min-w-[130px]">Status Keberlakuan</th>
                    <th className="p-2.5 min-w-[260px]">Relevansi & Ketentuan</th>
                    <th className="p-2.5 min-w-[240px]">Tindak Lanjut Perusahaan</th>
                    <th className="p-2.5 min-w-[80px] text-center">Sifat</th>
                    <th className="p-2.5 min-w-[90px] text-center">Pihak Terkait</th>
                    <th className="p-2.5 min-w-[110px] text-center">Status Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {regLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <RefreshCw size={24} className="mx-auto mb-2 text-slate-400 animate-spin" />
                        <p className="font-semibold text-slate-600">Memuat Data Matriks Regulasi...</p>
                      </td>
                    </tr>
                  ) : regulationsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Scale size={28} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-slate-600">Tidak ada regulasi yang sesuai filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter di atas.</p>
                      </td>
                    </tr>
                  ) : (
                    regulationsList.map((item) => {
                      const isComply = item.compliance_status === 'Comply';
                      return (
                        <tr
                          key={item.id || item.no}
                          onClick={() => setSelectedRegDetail(item)}
                          className="hover:bg-blue-50/40 transition cursor-pointer group"
                        >
                          <td className="p-2.5 text-center font-bold text-slate-400 group-hover:text-slate-700 align-top">
                            {item.no}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800 leading-snug align-top whitespace-normal break-words">
                            {item.regulation_name}
                          </td>
                          <td className="p-2.5 align-top whitespace-normal break-words">
                            <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {item.validity_status || 'Berlaku'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700 align-top">
                            {renderMultiLinePoints(item.relevance, 'text-[11px]')}
                          </td>
                          <td className="p-2.5 text-slate-700 align-top">
                            {renderMultiLinePoints(item.follow_up, 'text-[11px]')}
                          </td>
                          <td className="p-2.5 text-center align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                item.nature_of_compliance === 'Wajib'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : item.nature_of_compliance === 'Conditional'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {item.nature_of_compliance || 'Wajib'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center align-top">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.related_party || 'Legal'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center align-top">
                            {isComply ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                Comply
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                                <AlertTriangle size={11} className="text-rose-600" />
                                Non-Comply
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Table Footer */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
              <span>Menampilkan {regulationsList.length} dari {regulationsSummary.total ?? 65} regulasi (Klik baris tabel untuk melihat rincian penuh)</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Terpenuhi: {regulationsSummary.comply ?? 59}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Belum Terpenuhi: {regulationsSummary.non_comply ?? 6}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => setActiveDetailModal(null)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-2xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB MODAL: Detail Rincian Regulasi & Tindak Lanjut                        */}
      {/* ========================================================================= */}
      {selectedRegDetail && (
        <Modal
          isOpen={Boolean(selectedRegDetail)}
          onClose={() => setSelectedRegDetail(null)}
          title={`Detail Klausul No. ${selectedRegDetail.no}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Peraturan Perundang-Undangan</div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedRegDetail.regulation_name}</h4>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[10px]">
                  {selectedRegDetail.validity_status || 'Berlaku'}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                  Sifat: {selectedRegDetail.nature_of_compliance || 'Wajib'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                  Pihak: {selectedRegDetail.related_party || 'Legal'}
                </span>
                {selectedRegDetail.compliance_status === 'Comply' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600" /> Terpenuhi (Comply)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                    <AlertTriangle size={11} className="text-rose-600" /> Belum Terpenuhi (Non-Comply)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                <BookOpen size={13} className="text-blue-600" />
                <span>Relevansi & Ketentuan Regulasi</span>
              </div>
              <div className="text-slate-700">
                {renderMultiLinePoints(selectedRegDetail.relevance || 'Tidak ada catatan relevansi khusus.', 'text-xs')}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Tindak Lanjut & Pemenuhan Perusahaan (PT AZM)</span>
              </div>
              <div className="text-slate-700">
                {renderMultiLinePoints(selectedRegDetail.follow_up || 'Tidak ada catatan tindak lanjut khusus.', 'text-xs')}
              </div>
            </div>

            {selectedRegDetail.notes && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <span className="font-bold">Catatan Tambahan:</span> {selectedRegDetail.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRegDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SUB MODAL: Izin Unduh Approval Form                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(downloadPermissionModal)}
        onClose={() => setDownloadPermissionModal(null)}
        title="Form Unduh Dokumen"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestDownloadPermission} className="space-y-3.5 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] text-slate-500 mb-0.5">Dokumen:</div>
            <div className="font-semibold text-slate-800 text-xs break-all">{downloadPermissionModal?.filename}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{downloadPermissionModal?.category}</div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Pemohon</label>
            <input
              type="text"
              required
              value={downloadApplicantName}
              onChange={(e) => setDownloadApplicantName(e.target.value)}
              placeholder="Masukkan nama pemohon"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Divisi Pemohon</label>
            <input
              type="text"
              required
              value={downloadApplicantDivision}
              onChange={(e) => setDownloadApplicantDivision(e.target.value)}
              placeholder="Masukkan divisi pemohon"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Keperluan Pengunduhan</label>
            <textarea
              rows={2}
              required
              value={downloadReason}
              onChange={(e) => setDownloadReason(e.target.value)}
              placeholder="Contoh: Kebutuhan tender proyek / audit..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDownloadPermissionModal(null)}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
            >
              Unduh Dokumen
            </button>
          </div>
        </form>
      </Modal>



      {/* ========================================================================= */}
      {/* SUB MODAL: Detail Dokumen & Verifikasi Sumber Data Asal (Pop-up Detail)   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDocForDetail)}
        onClose={() => setSelectedDocForDetail(null)}
        title={`Detail Informasi Dokumen: ${selectedDocForDetail?.document_name || ''}`}
        maxWidth="max-w-xl"
      >
        {selectedDocForDetail && (
          <div className="space-y-3.5 text-xs">
            {/* Box Sumber Data Asal Dokumen (Clean & Structured) */}
            <DataSourceCard source={DATA_SOURCE_MAPPING[selectedDocForDetail.category || docCategoryTab]} onOpenDetail={setSelectedDataSourceModal} />

            {/* Informasi Detail Dokumen */}
            <div className="p-3 bg-gray-50 border border-stroke rounded-xl space-y-2.5">
              <div className="font-bold text-boxdark text-xs border-b border-stroke pb-1.5 flex items-center justify-between">
                <span>Rincian Metadata Dokumen</span>
                <span className="font-mono text-gray-500 text-[10px]">Database ID #{selectedDocForDetail.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <div className="text-gray-400">
                    {selectedDocForDetail.category === 'silo' ? 'ID Asset:' : 'Identitas / No. Registrasi:'}
                  </div>
                  <div className="font-mono font-bold text-boxdark mt-0.5">{selectedDocForDetail.identifier || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">
                    {selectedDocForDetail.category === 'silo' ? 'Jenis Equipment:' : 'Kategori / Modul:'}
                  </div>
                  <div className="font-semibold text-primary mt-0.5">
                    {selectedDocForDetail.category === 'silo'
                      ? (selectedDocForDetail.topic || 'Alat Berat')
                      : DATA_SOURCE_MAPPING[selectedDocForDetail.category || docCategoryTab]?.label}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">
                    {selectedDocForDetail.category === 'silo' ? 'Serial Number Unit:' : 'Pihak Terkait / Rekanan:'}
                  </div>
                  <div className="font-medium text-boxdark mt-0.5 font-mono">
                    {selectedDocForDetail.related_party || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">
                    {selectedDocForDetail.category === 'silo' ? 'Lembar Sheet Excel:' : 'Lokasi / Project Site:'}
                  </div>
                  <div className="font-medium text-boxdark mt-0.5">
                    {selectedDocForDetail.category === 'silo' 
                      ? (selectedDocForDetail.location || 'Alat Berat') 
                      : (selectedDocForDetail.location || '-')}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">Tanggal Mulai / Terbit:</div>
                  <div className="font-mono text-gray-700 mt-0.5">
                    {selectedDocForDetail.start_date ? selectedDocForDetail.start_date.substring(0, 10) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Tanggal Jatuh Tempo (Expired):</div>
                  <div className="font-mono font-bold text-danger mt-0.5">
                    {selectedDocForDetail.expired_date ? selectedDocForDetail.expired_date.substring(0, 10) : '-'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">Status Expiry:</div>
                  <div className="mt-0.5">
                    {getUrgencyBadge(selectedDocForDetail.urgency_status, selectedDocForDetail.days_remaining, selectedDocForDetail.category)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Arsip Fisik (Hardcopy):</div>
                  <div className="font-medium mt-0.5">
                    {selectedDocForDetail.has_hard_file ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Tersedia di Filing Cabinet
                      </span>
                    ) : (
                      <span className="text-gray-400">Tidak ada arsip fisik</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedDocForDetail.notes && (
                <div className="pt-2 border-t border-stroke text-[11px]">
                  <div className="text-gray-400 font-medium">Catatan / Detail Tambahan:</div>
                  <div className="p-2 bg-white rounded-lg border border-stroke mt-1 text-gray-700 font-mono text-[10px] break-words">
                    {selectedDocForDetail.notes}
                  </div>
                </div>
              )}

            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedDocForDetail(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL POPUP: DETAIL SUMBER DATASET EXCEL (FILE, FOLDER NAS, SHEET)        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDataSourceModal)}
        onClose={() => {
          setSelectedDataSourceModal(null);
          setCopiedField('');
        }}
        title="Informasi Sumber Data & Dataset Excel"
        maxWidth="max-w-xl"
        zIndex="z-[100000]"
      >
        {selectedDataSourceModal && (
          <div className="space-y-3.5 text-xs text-slate-700">
            {/* Header Banner */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedDataSourceModal.label}</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Terhubung ke Synology NAS Internal Legal</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/70 border border-emerald-300 text-emerald-800 rounded-md text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>

            {/* Detail Fields */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {/* Nama File */}
              <div>
                <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Nama File Excel:</span>
                <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="font-mono text-xs font-bold text-slate-900 break-all select-all">
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

              {/* Lokasi Folder NAS */}
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

              {/* Nama Sheet / Tab Excel */}
              <div>
                <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Nama Sheet / Tab Excel:</span>
                <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {selectedDataSourceModal.sheet}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Worksheet Aktif</span>
                </div>
              </div>

              {/* Deskripsi & Keterangan */}
              {selectedDataSourceModal.desc && (
                <div>
                  <span className="text-[10.5px] font-semibold text-slate-500 block mb-1">Keterangan / Penggunaan Data:</span>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs leading-relaxed">
                    {selectedDataSourceModal.desc}
                  </div>
                </div>
              )}
            </div>

            {/* Information Tip */}
            <div className="text-[11px] text-slate-500 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
              <Database size={13} className="text-blue-600 shrink-0 mt-0.5" />
              <span>File Excel ini diimpor secara berkala dari Synology NAS ke Live Dashboard. Perubahan data di berkas Excel akan otomatis disinkronkan ke grafik dan tabel dashboard.</span>
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

function roundTo1(num) {
  return Math.round((num || 0) * 10) / 10;
}

// =========================================================================
// EMAIL AUTOCOMPLETE & HISTORY STORAGE HELPERS
// =========================================================================

function loadSavedEmails() {
  try {
    localStorage.removeItem('legal_dashboard_email_history');
  } catch (e) { }
  return ['shafira2784@gmail.com'];
}

function saveEmailToHistory() {
  try {
    localStorage.removeItem('legal_dashboard_email_history');
  } catch (e) { }
  return ['shafira2784@gmail.com'];
}

/**
 * Reusable Autocomplete Input for Multi-Email addresses
 */
function EmailAutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
  knownEmails = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Ambil token email yang sedang diketik setelah tanda koma terakhir
  const lastCommaIndex = value.lastIndexOf(',');
  const currentToken = (lastCommaIndex === -1 ? value : value.slice(lastCommaIndex + 1)).trim();

  // Daftar email yang sudah ada di input
  const selectedEmails = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Daftar saran yang cocok dengan apa yang diketik
  const suggestions = useMemo(() => {
    if (!currentToken) return [];
    return knownEmails.filter((email) => {
      const lower = email.toLowerCase();
      return lower.includes(currentToken.toLowerCase()) && !selectedEmails.includes(lower);
    });
  }, [currentToken, knownEmails, value]);

  // Reset highlight saat suggestions berubah
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (email) => {
    const prefix = lastCommaIndex === -1 ? '' : value.slice(0, lastCommaIndex + 1).trim() + ' ';
    const newValue = `${prefix}${email}, `;
    onChange(newValue);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[highlightedIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (currentToken.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider flex items-center justify-between">
            <span>Saran Kontak Tersimpan ({suggestions.length}):</span>
            <span className="text-[9px] text-slate-400">Tekan Enter atau Klik</span>
          </div>
          {suggestions.map((email, idx) => (
            <button
              key={email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Mencegah onBlur input
                selectSuggestion(email);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer transition ${highlightedIndex === idx
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${highlightedIndex === idx ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-300'}`} />
                <span>{email}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                Pilih
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
