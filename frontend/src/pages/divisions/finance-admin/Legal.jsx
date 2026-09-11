import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck,
  FolderLock,
  Maximize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import Modal from '../../../components/ui/Modal';
import ChartContainer from '../../../components/ui/ChartContainer';
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
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Monitoring SILO - Legal.xlsx',
    fullFile: 'Monitoring SILO - Legal.xlsx',
    sheet: 'Monitoring',
    label: 'Monitoring SILO (Alat Berat)',
    desc: 'Surat Izin Layak Operasi Alat Berat, Genset & Crane'
  },
  permit: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'FRM-AZM-603-008.xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project) (1).xlsx',
    sheet: 'Permit',
    label: 'Monitoring Perizinan',
    desc: 'Izin Operasional, OSS, SBU, IUJK & Legalitas Usaha'
  },
  agreement: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'FRM-AZM-603-008.xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project) (1).xlsx',
    sheet: 'Agreement',
    label: 'Monitoring Perjanjian Kerjasama (PKS)',
    desc: 'Perjanjian Kerjasama Vendor, Supplier & Rekanan'
  },
  project_contract: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'FRM-AZM-603-008.xlsx',
    fullFile: 'FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project) (1).xlsx',
    sheet: 'Kontrak Project',
    label: 'Monitoring Kontrak Project',
    desc: 'Kontrak Induk Proyek (PTFI, Antam, IMIP, BAI)'
  },
  vehicle: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'FRM-AZM-603-016.xlsx',
    fullFile: 'FRM-AZM-603-016 (Monitoring Izin Kendaraan) (1).xlsx',
    sheet: 'Monitoring Kendaraan',
    label: 'Monitoring Izin Kendaraan',
    desc: 'Pajak Tahunan, STNK 5 Tahun & Uji KIR Kendaraan'
  },
  manpower: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Data MP_baseline.xlsx',
    sheet: 'Master Baseline Karyawan',
    label: 'Kontrak Karyawan (PKWT)',
    desc: 'Rekapitulasi Kontrak Tenaga Kerja PKWT (HR & PJO)'
  },
  kpi: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Data KPI Divisi Legal 2026 .xlsx',
    sheet: '5 Sheet: Legal Review, Legal Advisory, Legal Drafting, Litigasi, Pelanggaran',
    label: 'KPI Kinerja Divisi Legal',
    desc: 'SLA Drafting, Review Kontrak, Advisory, Litigasi & Pelanggaran 2026'
  },
  budget: {
    folder: 'Z:\\dashboard-data\\legal\\',
    file: 'Dana Operasional / Buku Kas LPJ 2026.xlsx',
    sheet: 'Realisasi LPJ vs Budget',
    label: 'Realisasi Budget Legal',
    desc: 'Pengajuan & LPJ Kas Operasional Legal 2026'
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
  }
};

function DataSourceCard() {
  return null;
}

export default function Legal({ user }) {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Active Detailed Modals (Pop-ups for 1-Page non-scroll layout)
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  // 'documents' | 'manpower' | 'kpi' | 'budget' | 'downloads_permits' | 'downloads_templates'

  // Module 1 (Documents & SILO) Tab & Data
  const [docCategoryTab, setDocCategoryTab] = useState('silo');
  const [documentsList, setDocumentsList] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [docUrgencyFilter, setDocUrgencyFilter] = useState('all');
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

  // Module 5 & 6 (Downloads) Data
  const [downloadsList, setDownloadsList] = useState([]);
  const [downloadSearch, setDownloadSearch] = useState('');
  const [downloadPermissionModal, setDownloadPermissionModal] = useState(null);
  const [downloadReason, setDownloadReason] = useState('');

  // SOP Reminders Trigger Modal
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [sopType, setSopType] = useState('legal_docs'); // 'legal_docs' | 'mp_contracts'
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    subject: '',
    notes: '',
  });

  const sopMpDaysRange = 30; // Khusus 30 hari saja (H-30)

  // Bersihkan riwayat email lama dari localStorage saat komponen dimuat
  useEffect(() => {
    try {
      localStorage.removeItem('legal_dashboard_email_history');
    } catch (e) { }
  }, []);

  // Filter khusus SOP Distribusi: Kontrak PKWT Jatuh Tempo Khusus 30 Hari Ke Depan (H-30, Exclude Permanen)
  const sopMpExpiringList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (mpList || [])
      .filter((emp) => {
        const statusLower = (emp.status || '').toLowerCase();
        if (statusLower.includes('permanen') || statusLower.includes('permanent')) return false;
        if (!emp.end_date || emp.end_date === '-' || !emp.end_date.trim()) return false;

        try {
          const d = new Date(emp.end_date);
          if (isNaN(d.getTime())) return false;
          d.setHours(0, 0, 0, 0);
          const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30;
        } catch {
          return false;
        }
      })
      .map((emp) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(emp.end_date);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...emp, days_remaining: diffDays };
      })
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  }, [mpList]);

  // Filter khusus SOP Distribusi: Dokumen Legalitas & SILO yang Kritis / Expired / Warning
  const sopUrgentDocsList = useMemo(() => {
    return (documentsList || []).filter(d =>
      d.urgency_status === 'critical' || d.urgency_status === 'expired' || d.urgency_status === 'warning'
    );
  }, [documentsList]);

  const openSopModal = (type) => {
    setSopType(type);
    if (type === 'mp_contracts') {
      if (!mpList || mpList.length === 0) {
        fetchMpList();
      }
      setSopMpDaysRange(30);
      setEmailForm({
        to: 'shafira2784@gmail.com',
        cc: '',
        subject: '[SOP TGL 1-5] Rekapitulasi Kontrak Karyawan (PKWT) Jatuh Tempo 30 Hari Ke Depan (H-30)',
        notes: 'Yth. Bapak/Ibu Departemen HR, Direksi, & PJO Site Terkait,\n\nBerikut terlampir rekapitulasi data tenaga kerja (PKWT) yang masa berlaku perjanjian kerjanya akan jatuh tempo dalam 30 hari ke depan (H-30) sesuai ketentuan SOP periode tanggal 1 - 5 bulan ini untuk dievaluasi dan ditindaklanjuti perpanjangannya.',
      });
    } else {
      if (!documentsList || documentsList.length === 0) {
        fetchDocumentsList();
      }
      setEmailForm({
        to: 'shafira2784@gmail.com',
        cc: '',
        subject: '[SOP TGL 1-5] Rekapitulasi Reminder Masa Berlaku Dokumen Legalitas, SILO & Kendaraan',
        notes: 'Yth. Seluruh Rekan PIC & Jajaran Manajemen,\n\nBerikut terlampir rekapitulasi dokumen legalitas perusahaan, izin operasional, SILO (H-60), dan kendaraan yang mendekati masa jatuh tempo sesuai SOP periode tanggal 1 - 5 bulan ini untuk segera diproses perpanjangannya.',
      });
    }
    setIsSopModalOpen(true);
  };

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
      const res = await api.get(`/api/legal-dashboard/summary?month=${selectedMonth}`);
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
    fetchExecutiveSummary();
  }, [selectedMonth]);

  // Fetch Documents List for Modal 1
  const fetchDocumentsList = async () => {
    try {
      const params = new URLSearchParams();
      params.append('category', docCategoryTab);
      if (docSearch) params.append('search', docSearch);
      if (docUrgencyFilter !== 'all') params.append('urgency', docUrgencyFilter);

      const res = await api.get(`/api/legal-documents?${params.toString()}`);
      if (res.data?.status === 'success') {
        setDocumentsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching documents list:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'documents' || isSopModalOpen) {
      fetchDocumentsList();
    }
  }, [activeDetailModal, isSopModalOpen, docCategoryTab, docUrgencyFilter, docSearch]);


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
    if (activeDetailModal === 'manpower' || isSopModalOpen) {
      fetchMpList();
    }
  }, [activeDetailModal, isSopModalOpen, mpFilter, mpStatusFilter, mpBranchFilter, mpSortOrder]);


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
  const fetchBudgetDetail = async () => {
    try {
      const res = await api.get(`/api/legal-dashboard/operational-budget?month=${selectedMonth}`);
      if (res.data?.status === 'success') {
        setBudgetDetail(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching Budget detail:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'budget') {
      fetchBudgetDetail();
    }
  }, [activeDetailModal, selectedMonth]);

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

  // Handle Trigger SOP Email Reminders
  const handleTriggerSopEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailForm.to.trim()) {
      alert('Alamat email tujuan (To) wajib diisi.');
      return;
    }
    setSendingEmail(true);
    try {
      if (sopType === 'legal_docs') {
        const res = await api.post('/api/legal-dashboard/send-reminder-email', {
          type: 'batch_monthly',
          to: emailForm.to,
          cc: emailForm.cc,
          subject: emailForm.subject,
          notes: emailForm.notes,
        });
        setActionSuccessMsg(res.data.message || 'Reminder SOP Perizinan & SILO berhasil dikirimkan!');
      } else {
        const res = await api.post('/api/legal-dashboard/send-mp-reminder-email', {
          audience: 'HR, Direksi, & PJO',
          to: emailForm.to,
          cc: emailForm.cc,
          subject: emailForm.subject,
          notes: emailForm.notes,
        });
        setActionSuccessMsg(res.data.message || 'Rekap Kontrak Karyawan berhasil didistribusikan!');
      }

      // Simpan alamat email ke riwayat agar otomatis muncul di autocomplete selanjutnya
      saveEmailToHistory(emailForm.to);
      saveEmailToHistory(emailForm.cc);
      setKnownEmails(loadSavedEmails());

      setIsSopModalOpen(false);
      setTimeout(() => setActionSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Error sending SOP email:', err);
      alert('Gagal mengirim email reminder SOP.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle Download Authorization Request
  const handleRequestDownloadPermission = async (e) => {
    e.preventDefault();
    if (!downloadPermissionModal) return;
    try {
      const res = await api.post('/api/legal-dashboard/request-download-permission', {
        filename: downloadPermissionModal.filename,
        division: user?.division || 'Divisi Pemohon',
        reason: downloadReason,
      });
      alert(res.data.message || 'Izin unduh berhasil disetujui. File mulai diunduh.');
      setDownloadPermissionModal(null);
      setDownloadReason('');
    } catch (err) {
      console.error('Error requesting download permission:', err);
      alert('Gagal memproses izin unduh.');
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
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} className="text-emerald-600" />
        Masih Berlaku ({daysRemaining} hr)
      </span>
    );
  };

  const docs = summaryData?.documents || {};
  const mp = summaryData?.manpower || {};
  const kpi = summaryData?.kpi || {};
  const budget = summaryData?.budget || {};
  const downloadsCount = summaryData?.downloads_count || {};

  // =========================================================================
  // APEXCHARTS CONFIGURATIONS FOR 1-PAGE EXECUTIVE VIEW
  // =========================================================================
  // APEXCHARTS & VISUAL CONFIGURATIONS (ROBUST & IMMUNE TO ZOOM 80%-120%)
  // =========================================================================
  // 1. Chart Donut Status Dokumen (Aman vs Kritis vs Expired) - Zero Label Collisions
  const docStatusChart = useMemo(() => {
    const safe = Number(docs.total_safe ?? 180);
    const critical = Number(docs.total_critical ?? 21);
    const expired = Number(docs.total_expired ?? 89);
    const warning = Number(docs.total_warning ?? 29);

    const series = [safe, critical, expired, warning];
    const options = {
      chart: { type: 'donut', sparkline: { enabled: true } },
      labels: ['Aman / Valid', 'Kritis H-30/60', 'Expired', 'Mendekati Expired'],
      colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
      plotOptions: {
        pie: {
          donut: {
            size: '74%',
            labels: { show: false }, // Avoid duplicate overlap inside circle
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
  }, [docs.total_safe, docs.total_critical, docs.total_expired, docs.total_warning]);

  // 2. Site Progress Distribution List for Manpower (Immune to label truncation)
  const siteProgressList = useMemo(() => {
    return [
      { name: 'Hotmetal', expiring: 12, percent: 75, color: 'bg-amber-500' },
      { name: 'Freeport', expiring: 6, percent: 50, color: 'bg-blue-500' },
      { name: 'Antam', expiring: 4, percent: 35, color: 'bg-emerald-500' },
      { name: 'Vale & BAI', expiring: 5, percent: 45, color: 'bg-purple-500' },
    ];
  }, []);

  // 3. Gauge Chart Capaian KPI Legal (Circular Ring Gauge)
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
              fontSize: '13px',
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
    const rate = Math.min(100, Math.round(Number(budget.ytd_utilization_rate ?? 60.2)));
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
              offsetY: 4,
              fontSize: '12px',
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
  }, [budget.ytd_utilization_rate]);

  // Expiry & Compliance Stacked Bar Chart (SILO H-60, Perizinan H-30, PKWT, Proyek, Kendaraan)
  const expiryChart = useMemo(() => {
    const categories = ['SILO (H-60)', 'Perizinan', 'PKWT', 'Kontrak Proyek', 'Kendaraan'];
    const series = [
      {
        name: 'Kritis (H-30/60)',
        data: [
          docs.silo_critical_h60 || 21,
          docs.permit_critical_h30 || 14,
          mp.expiring_30_days || 68,
          5,
          4,
        ],
      },
      {
        name: 'Mendekati Expired',
        data: [8, 10, 42, 7, 2],
      },
      {
        name: 'Masa Berlaku Aman',
        data: [65, 76, 692, 18, 12],
      },
    ];

    const options = {
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        sparkline: { enabled: false },
        events: {
          dataPointSelection: () => {
            setActiveDetailModal('urgent_actions');
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 2,
          barHeight: '52%',
        },
      },
      colors: ['#ef4444', '#f59e0b', '#10b981'],
      dataLabels: { enabled: false },
      stroke: { width: 1, colors: ['#fff'] },
      xaxis: {
        categories,
        labels: {
          style: { fontSize: '9.5px', colors: '#64748b' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { fontSize: '9.5px', fontWeight: 600, colors: '#334155' },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '9.5px',
        markers: { radius: 2, width: 7, height: 7 },
        itemMargin: { horizontal: 4, vertical: 0 },
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val) => `${val} Item/Dokumen`,
        },
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
        padding: { top: -14, bottom: -6, left: 10, right: 10 },
      },
    };

    return { series, options };
  }, [docs, mp]);

  // Legal Monthly Workload Trend (Legal Review, Legal Drafting, Legal Advisory)
  const workloadTrendChart = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData = kpi.monthly_trend || {};
    const reviewData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      return m ? m.review : 0;
    });
    const draftingData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      return m ? m.drafting : 0;
    });
    const advisoryData = months.map((_, i) => {
      const m = monthlyData[String(i + 1)];
      return m ? m.advisory : 0;
    });

    const series = [
      {
        name: 'Legal Review',
        data: reviewData.some((v) => v > 0)
          ? reviewData
          : [6, 3, 7, 5, 3, 11, 5, 0, 0, 0, 0, 0],
      },
      {
        name: 'Legal Drafting',
        data: draftingData.some((v) => v > 0)
          ? draftingData
          : [2, 4, 4, 10, 9, 11, 9, 0, 0, 0, 0, 0],
      },
      {
        name: 'Legal Advisory',
        data: advisoryData.some((v) => v > 0)
          ? advisoryData
          : [2, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0],
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
        y: {
          formatter: (val) => `${val} Berkas`,
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

  return (
    <div className="w-full flex flex-col gap-2 pb-1 text-xs min-w-0">
      {/* 1. TOP COMPACT TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700">
            Monitoring Legalitas, Kontrak Kerja & Anggaran 2026
          </span>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded-lg">
            <Calendar size={13} className="text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => openSopModal('legal_docs')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition shadow-2xs cursor-pointer"
            title="Kirim email reminder gabungan SOP tgl 1-5"
          >
            <Mail size={13} />
            <span>Kirim Reminder SOP</span>
          </button>

          <button
            type="button"
            onClick={fetchExecutiveSummary}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-slate-800' : ''} />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="flex shrink-0 items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shadow-xs text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      {/* 2. 4-CARD EXECUTIVE KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">

        {/* CARD 1: Dokumen & Perizinan */}
        <div
          onClick={() => setActiveDetailModal('documents')}
          className="group relative flex flex-col justify-between p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-50 text-amber-700 rounded-md">
                <Wrench size={14} />
              </div>
              <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                Dokumen & Perizinan
              </h3>
            </div>
            <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition" />
          </div>

          <div className="flex items-center justify-between gap-1.5 my-1 py-1 border-y border-slate-100">
            <div className="w-[62px] h-[62px] flex items-center justify-center shrink-0">
              <Chart
                options={docStatusChart.options}
                series={docStatusChart.series}
                type="donut"
                height={62}
                width={62}
              />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1 text-center">
              <div className="p-0.5 rounded bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">{docs.total_documents || 319}</div>
                <div className="text-[9px] text-slate-500">Total</div>
              </div>
              <div className="p-0.5 rounded bg-orange-50 border border-orange-200">
                <div className="text-xs font-bold text-orange-700">{docs.total_critical || 21}</div>
                <div className="text-[9px] text-orange-700 font-semibold">Kritis</div>
              </div>
              <div className="p-0.5 rounded bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-700">{docs.total_warning || 29}</div>
                <div className="text-[9px] text-amber-700 font-semibold">Mendekati</div>
              </div>
              <div className="p-0.5 rounded bg-rose-50 border border-rose-200">
                <div className="text-xs font-bold text-rose-600">{docs.total_expired || 89}</div>
                <div className="text-[9px] text-rose-700 font-semibold">Expired</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span>319 Terdaftar</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-600 flex items-center transition">
              Kelola PIC <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* CARD 2: Kontrak Karyawan (PKWT) */}
        <div
          onClick={() => setActiveDetailModal('manpower')}
          className="group relative flex flex-col justify-between p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-50 text-blue-700 rounded-md">
                <Users size={14} />
              </div>
              <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                Kontrak Karyawan (PKWT)
              </h3>
            </div>
            <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition" />
          </div>

          <div className="flex items-center justify-between gap-1.5 my-1 py-1 border-y border-slate-100">
            <div className="flex-1 space-y-1 min-w-0">
              {siteProgressList.slice(0, 3).map((site) => (
                <div key={site.name} className="flex items-center justify-between text-[9px]">
                  <span className="font-medium text-slate-600 w-14 truncate">{site.name}</span>
                  <div className="flex-1 mx-1.5 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`${site.color} h-1.5 rounded-full`} style={{ width: `${site.percent}%` }} />
                  </div>
                  <span className="font-semibold text-slate-700">{site.expiring}</span>
                </div>
              ))}
            </div>

            <div className="w-[80px] grid grid-cols-1 gap-0.5 text-center shrink-0">
              <div className="flex items-center justify-between px-1 py-0.5 rounded bg-slate-50 border border-slate-100">
                <span className="text-[9px] text-slate-500">Total:</span>
                <span className="text-xs font-bold text-slate-900">{mp.total_employees || 802}</span>
              </div>
              <div className="flex items-center justify-between px-1 py-0.5 rounded bg-amber-50 border border-amber-200">
                <span className="text-[9px] text-amber-800">&lt;30 Hr:</span>
                <span className="text-xs font-bold text-amber-700">{mp.expiring_30_days || 68}</span>
              </div>
              <div className="flex items-center justify-between px-1 py-0.5 rounded bg-blue-50 border border-blue-200">
                <span className="text-[9px] text-blue-800">Bln Ini:</span>
                <span className="text-xs font-bold text-blue-700">{mp.expiring_this_month || 14}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span className="text-amber-700 font-medium">{mp.expiring_30_days || 68} Jatuh Tempo</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-600 flex items-center transition">
              Buka Rekap <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* CARD 3: KPI Kinerja Legal */}
        <div
          onClick={() => {
            if (selectedMonth !== 'all') {
              setKpiViewMode('monthly');
              setKpiSelectedMonth(selectedMonth);
            } else {
              setKpiViewMode('ytd');
              setKpiSelectedMonth('all');
            }
            setActiveDetailModal('kpi');
          }}
          className="group relative flex flex-col justify-between p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-50 text-emerald-700 rounded-md">
                <TrendingUp size={14} />
              </div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                  KPI Legal
                </h3>
                <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedMonth !== 'all' ? (MONTH_NAMES.find(m => m.id === selectedMonth)?.label?.split(' ')[0] || `Bulan ${selectedMonth}`) : 'YTD'}
                </span>
              </div>
            </div>
            <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition" />
          </div>

          <div className="flex items-center justify-between gap-1.5 my-1 py-1 border-y border-slate-100">
            <div className="w-[62px] h-[62px] flex items-center justify-center shrink-0">
              <Chart
                options={kpiGaugeChart.options}
                series={kpiGaugeChart.series}
                type="radialBar"
                height={62}
                width={62}
              />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-0.5 text-center">
              <div className="p-0.5 rounded bg-blue-50/60 border border-blue-100">
                <div className="text-xs font-bold text-blue-700">
                  {kpi.review_count ?? (kpi.total_review_ytd ?? 40)}
                </div>
                <div className="text-[8px] text-blue-800 font-semibold truncate">Review</div>
              </div>
              <div className="p-0.5 rounded bg-amber-50/60 border border-amber-100">
                <div className="text-xs font-bold text-amber-700">
                  {kpi.drafting_count ?? (kpi.total_drafting_ytd ?? 49)}
                </div>
                <div className="text-[8px] text-amber-800 font-semibold truncate">Drafting</div>
              </div>
              <div className="p-0.5 rounded bg-purple-50/60 border border-purple-100">
                <div className="text-xs font-bold text-purple-700">
                  {kpi.advisory_count ?? (kpi.total_advisory_ytd ?? 12)}
                </div>
                <div className="text-[8px] text-purple-800 font-semibold truncate">Advisory</div>
              </div>
              <div className="col-span-3 px-1 py-0.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-[8px] text-slate-600">Avg Durasi:</span>
                <span className="text-[8.5px] font-bold text-slate-900">{kpi.avg_duration_days ?? 2.3} Hari</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-600" /> 0 Litigasi &bull; 0 Pelanggaran
            </span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-600 flex items-center transition">
              Detail KPI <ChevronRight size={10} />
            </span>
          </div>
        </div>

        {/* CARD 4: Budget Operasional */}
        <div
          onClick={() => setActiveDetailModal('budget')}
          className="group relative flex flex-col justify-between p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl transition cursor-pointer"
        >
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-50 text-purple-700 rounded-md">
                <DollarSign size={14} />
              </div>
              <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                Budget Operasional
              </h3>
            </div>
            <Maximize2 size={11} className="text-slate-400 group-hover:text-slate-700 transition" />
          </div>

          <div className="flex items-center justify-between gap-1.5 my-1 py-1 border-y border-slate-100">
            <div className="w-[62px] h-[62px] flex items-center justify-center shrink-0">
              <Chart
                options={budgetGaugeChart.options}
                series={budgetGaugeChart.series}
                type="radialBar"
                height={62}
                width={62}
              />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                <span className="text-[8.5px] text-slate-500">Anggaran:</span>
                <span className="text-[10.5px] font-bold text-slate-900 truncate">{formatCurrency(budget.ytd_budget || 53000000)}</span>
              </div>
              <div className="flex items-center justify-between bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                <span className="text-[8.5px] text-purple-800">Realisasi:</span>
                <span className="text-[10.5px] font-bold text-purple-700 truncate">{formatCurrency(budget.ytd_actual || 31885407)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span>Bln Ini: {formatCurrency(budget.current_month_actual || 420000)}</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-600 flex items-center transition">
              Rincian LPJ <ChevronRight size={10} />
            </span>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM SECTION: 2 EXECUTIVE CHARTS + 1 DOWNLOADS HUB (100% VISUAL & DIAGRAMS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 w-full">

        {/* CHART 1: DISTRIBUSI EXPIRED & KEPATUHAN (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-rose-50 text-rose-700 rounded-md">
                <Clock size={13} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">
                  Distribusi Jatuh Tempo (H-30 / H-60)
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveDetailModal('urgent_actions')}
              className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition"
              title="Buka tabel rincian PIC & update progress"
            >
              <span>Buka Tabel PIC</span>
              <ChevronRight size={11} />
            </button>
          </div>

          <div className="w-full my-auto py-1">
            <Chart
              options={expiryChart.options}
              series={expiryChart.series}
              type="bar"
              height={140}
            />
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="font-medium text-slate-700">112 Item Kritis</span> butuh follow-up
            </span>
            <button
              type="button"
              onClick={() => setActiveDetailModal('urgent_actions')}
              className="text-blue-600 hover:underline cursor-pointer font-medium"
            >
              Klik grafik untuk rincian &rarr;
            </button>
          </div>
        </div>

        {/* CHART 2: TREN BEBAN KERJA & LAYANAN LEGALITAS (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-blue-50 text-blue-700 rounded-md">
                <TrendingUp size={13} />
              </div>
              <h3 className="font-bold text-slate-900 text-xs">
                Tren Beban Kerja Legalitas (Bulanan)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDetailModal('kpi')}
              className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition"
            >
              <span>Detail KPI</span>
              <ChevronRight size={11} />
            </button>
          </div>

          <div className="w-full my-auto py-1">
            <Chart
              options={workloadTrendChart.options}
              series={workloadTrendChart.series}
              type="area"
              height={140}
            />
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
            <span>YTD: <strong className="text-blue-600">40 Review</strong> &bull; <strong className="text-amber-600">49 Drafting</strong> &bull; <strong className="text-purple-600">12 Advisory</strong></span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 size={10} /> 0 Sengketa
            </span>
          </div>
        </div>

        {/* TILE 3: PUSAT BERKAS & UNDUHAN RESMI (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FileSpreadsheet size={13} className="text-slate-500" />
              <span>Pusat Berkas & Unduhan</span>
            </h3>
          </div>

          <div className="space-y-1.5 my-auto py-1">
            {/* Box 1: Arsip Perizinan */}
            <div
              onClick={() => setActiveDetailModal('downloads_permits')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-slate-800 text-[11px] group-hover:text-indigo-600 transition flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-indigo-600 shrink-0" /> Arsip Dokumen Perizinan
                </span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">16 File</span>
              </div>
              <p className="text-[9.5px] text-slate-500 truncate">Izin Usaha, SBU Konstruksi, PKP, BPJS</p>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-semibold text-indigo-600 flex items-center">
                  Unduh Dokumen <ChevronRight size={10} />
                </span>
              </div>
            </div>

            {/* Box 2: Template Kontrak */}
            <div
              onClick={() => setActiveDetailModal('downloads_templates')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-slate-800 text-[11px] group-hover:text-teal-600 transition flex items-center gap-1.5">
                  <FileText size={13} className="text-teal-600 shrink-0" /> Template Kontrak & MoU
                </span>
                <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-700 text-[9px] font-bold">10 Draft</span>
              </div>
              <p className="text-[9.5px] text-slate-500 truncate">Format Baku Freeport, Antam, Vale, HO</p>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-semibold text-teal-600 flex items-center">
                  Unduh Template <ChevronRight size={10} />
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100 text-[9.5px] text-slate-400 flex items-center justify-between">
            <span>Akses Izin Terverifikasi</span>
            <span className="text-slate-600 font-medium">Standar Legal PT AZM</span>
          </div>
        </div>

      </div>

      {/* MODAL: TABEL JATUH TEMPO & TINDAK LANJUT PIC (DIBUKA SAAT KLIK GRAFIK / TOMBOL DETAIL) */}
      <Modal
        isOpen={activeDetailModal === 'urgent_actions'}
        onClose={() => setActiveDetailModal(null)}
        title="Daftar Dokumen & Kontrak Mendekati Jatuh Tempo (Tindak Lanjut PIC)"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          {/* Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <div className="text-[11px] text-rose-700 font-semibold">Total Butuh Tindakan</div>
              <div className="text-lg font-bold text-rose-800">4 Item Prioritas</div>
              <div className="text-[10px] text-rose-600">Jatuh tempo &le; 30 hari</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-[11px] text-amber-700 font-semibold">SILO Kritis (H-60)</div>
              <div className="text-lg font-bold text-amber-800">{docs.total_critical || 21} Unit</div>
              <div className="text-[10px] text-amber-600">Alat berat di site</div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-[11px] text-purple-700 font-semibold">MP Baseline (PKWT)</div>
              <div className="text-lg font-bold text-purple-800">{mp.expiring_30_days || 68} Karyawan</div>
              <div className="text-[10px] text-purple-600">&le; 30 hari masa kerja</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-[11px] text-blue-700 font-semibold">Perizinan & Kendaraan</div>
              <div className="text-lg font-bold text-blue-800">18 Dokumen</div>
              <div className="text-[10px] text-blue-600">OSS & sewa transport</div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Filter Khusus:</span>
              <button
                type="button"
                onClick={() => {
                  setDocCategoryTab('silo');
                  setDocUrgencyFilter('critical');
                  setActiveDetailModal('documents');
                }}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs transition cursor-pointer"
              >
                Kelola Semua SILO H-60 ({docs.total_critical || 21}) &rarr;
              </button>
              <button
                type="button"
                onClick={() => {
                  setMpFilter('expiring_soon');
                  setActiveDetailModal('manpower');
                }}
                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-semibold text-xs transition cursor-pointer"
              >
                Kelola Semua PKWT Karyawan ({mp.expiring_30_days || 68}) &rarr;
              </button>
            </div>
            <button
              type="button"
              onClick={() => openSopModal('legal_docs')}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs cursor-pointer shadow-xs"
            >
              <Mail size={12} />
              <span>Kirim Email Reminder SOP</span>
            </button>
          </div>

          {/* Full Interactive Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Dokumen / Item</th>
                  <th className="py-2 px-2.5">Kategori</th>
                  <th className="py-2 px-2.5">Lokasi / Site</th>
                  <th className="py-2 px-2.5">PIC Bertanggung Jawab</th>
                  <th className="py-2 px-2.5 text-center">Batas Waktu</th>
                  <th className="py-2 px-2.5 text-center">Status Progress</th>
                  <th className="py-2 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    SILO Kress Hauler No. 04 / Excavator
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      SILO (H-60)
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600">Hotmetal & Kress Hauler</td>
                  <td className="py-2.5 px-2.5 text-slate-700 font-medium">Budi Santoso (Safety)</td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-rose-600 font-mono">12 Hari</td>
                  <td className="py-2.5 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Progress: 60%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setDocCategoryTab('silo');
                        setDocUrgencyFilter('critical');
                        setActiveDetailModal('documents');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-xs transition cursor-pointer"
                    >
                      Update Progress
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    IUJK Konsultan & Konstruksi 71102
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      Perizinan (H-30)
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600">DPMPTSP / OSS RBA</td>
                  <td className="py-2.5 px-2.5 text-slate-700 font-medium">Ahmad Fauzi (Legal)</td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-rose-600 font-mono">22 Hari</td>
                  <td className="py-2.5 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Perlu Submit
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setDocCategoryTab('permit');
                        setDocUrgencyFilter('critical');
                        setActiveDetailModal('documents');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-xs transition cursor-pointer"
                    >
                      Update Progress
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    14 Tenaga Kerja Project Freeport
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      Kontrak PKWT
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600">Freeport Indonesia (PTFI)</td>
                  <td className="py-2.5 px-2.5 text-slate-700 font-medium">HRD & PJO Site</td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-amber-700 font-mono">Bulan Ini</td>
                  <td className="py-2.5 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Drafting PKWT
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMpFilter('expiring_soon');
                        setActiveDetailModal('manpower');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-xs transition cursor-pointer"
                    >
                      Lihat Rekap
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Sewa 4 Unit Mobil Operasional BAI
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      Izin Kendaraan
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600">Rental Transport Kendari</td>
                  <td className="py-2.5 px-2.5 text-slate-700 font-medium">Transport & Asset</td>
                  <td className="py-2.5 px-2.5 text-center font-bold text-rose-600 font-mono">20 Hari</td>
                  <td className="py-2.5 px-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Review Adendum
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setDocCategoryTab('vehicle');
                        setDocUrgencyFilter('critical');
                        setActiveDetailModal('documents');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-xs transition cursor-pointer"
                    >
                      Update Progress
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
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
          <DataSourceCard source={DATA_SOURCE_MAPPING[docCategoryTab]} />

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

            <select
              value={docUrgencyFilter}
              onChange={(e) => setDocUrgencyFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-gray-50 border border-stroke rounded-lg text-xs font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Semua Status Expiry</option>
              <option value="critical">🟠 Kritis (H-30 / H-60)</option>
              <option value="warning">🟡 Mendekati Expired</option>
              <option value="expired">🔴 Expired</option>
              <option value="safe">🟢 Masih Berlaku</option>
            </select>
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
                    <th className="p-2">Progress PIC</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-2 w-10 text-center">No</th>
                    <th className="p-2">Identitas / No Reg</th>
                    <th className="p-2">Nama Dokumen / Item</th>
                    <th className="p-2">Pihak / Lokasi</th>
                    <th className="p-2">Expired Date</th>
                    <th className="p-2">Status & Countdown</th>
                    <th className="p-2">Progress PIC</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-stroke">
                {documentsList.length === 0 ? (
                  <tr>
                    <td colSpan={docCategoryTab === 'vehicle' ? 10 : 8} className="p-8 text-center text-gray-400">
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
                          <td className="p-2 max-w-[150px] text-[11px] text-gray-600">
                            {doc.extension_progress ? (
                              <span className="p-1 bg-amber-50 text-amber-800 rounded border border-amber-200 block truncate" title={doc.extension_progress}>
                                {doc.extension_progress}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedDocForDetail(doc)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition"
                                title="Lihat Detail & Asal File Excel"
                              >
                                <Eye size={11} />
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDocForPic(doc);
                                  setPicFormData({
                                    extension_submission_date: doc.extension_submission_date ? doc.extension_submission_date.substring(0, 10) : '',
                                    extension_progress: doc.extension_progress || '',
                                    status: doc.status || 'Masih Berlaku',
                                    new_expired_date: '',
                                    notes: doc.notes || '',
                                    pic_name: doc.pic_name || user?.name || '',
                                    pic_email: doc.pic_email || '',
                                  });
                                }}
                                className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded font-semibold text-[10px] cursor-pointer transition"
                              >
                                Update PIC
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

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
                        <td className="p-2 whitespace-nowrap">{doc.expired_date ? doc.expired_date.substring(0, 10) : '-'}</td>
                        <td className="p-2 whitespace-nowrap">{getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}</td>
                        <td className="p-2 max-w-[180px] text-[11px] text-gray-600">
                          {doc.extension_progress ? (
                            <span className="p-1 bg-amber-50 text-amber-800 rounded border border-amber-200 block truncate" title={doc.extension_progress}>
                              {doc.extension_progress}
                            </span>
                          ) : (
                            <span className="text-gray-300 italic">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition"
                              title="Lihat Detail & Asal File Excel"
                            >
                              <Eye size={11} />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocForPic(doc);
                                setPicFormData({
                                  extension_submission_date: doc.extension_submission_date ? doc.extension_submission_date.substring(0, 10) : '',
                                  extension_progress: doc.extension_progress || '',
                                  status: doc.status || 'Masih Berlaku',
                                  new_expired_date: '',
                                  notes: doc.notes || '',
                                  pic_name: doc.pic_name || user?.name || '',
                                  pic_email: doc.pic_email || '',
                                });
                              }}
                              className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded font-semibold text-[10px] cursor-pointer transition"
                            >
                              Update PIC
                            </button>
                          </div>
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
              <button
                type="button"
                onClick={() => openSopModal('mp_contracts')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Send size={13} />
                <span>Kirim Notifikasi</span>
              </button>
            </div>
          </div>

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

            {/* Dropdown Filter Project / Branch Site */}
            <div className="flex items-center gap-1">
              <select
                value={mpBranchFilter}
                onChange={(e) => setMpBranchFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-stroke rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-primary cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">Semua Site / Branch</option>
                {availableBranches.map((br) => (
                  <option key={br} value={br}>
                    Site: {br}
                  </option>
                ))}
              </select>
            </div>

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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${emp.status === 'Permanent' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          }`}>
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

              {/* 7 Ringkasan Angka Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xl font-bold text-emerald-600">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Capaian SLA</div>
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
          <DataSourceCard source={DATA_SOURCE_MAPPING.budget} />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-50 border border-stroke rounded-lg">
              <div className="text-lg font-bold text-boxdark">{formatCurrency(budgetDetail?.summary?.ytd_budget || 51000000)}</div>
              <div className="text-gray-400 text-[10px]">Total Anggaran Pengajuan YTD</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-lg font-bold text-purple-700">{formatCurrency(budgetDetail?.summary?.ytd_actual || 31441407)}</div>
              <div className="text-purple-600 text-[10px] font-medium">Realisasi LPJ YTD</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-lg font-bold text-emerald-700">{formatCurrency((budgetDetail?.summary?.ytd_budget || 51000000) - (budgetDetail?.summary?.ytd_actual || 31441407))}</div>
              <div className="text-emerald-600 text-[10px] font-medium">Sisa / Efisiensi Anggaran</div>
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
                {Object.entries(budgetDetail?.monthly_trend || {}).map(([mId, item]) => (
                  <tr key={mId} className="hover:bg-gray-50">
                    <td className="p-2.5 font-semibold text-boxdark">{item.month_name}</td>
                    <td className="p-2.5 text-right">{formatCurrency(item.budget)}</td>
                    <td className="p-2.5 text-right font-semibold text-purple-700">{formatCurrency(item.actual)}</td>
                    <td className="p-2.5 text-right font-medium text-gray-600">
                      {roundTo1((item.actual / Math.max(1, item.budget)) * 100)}%
                    </td>
                    <td className="p-2.5 text-gray-500">
                      {Object.keys(item.categories || {}).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL MODAL 5 & 6: Pusat Unduh Dokumen / Template                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'downloads_permits' || activeDetailModal === 'downloads_templates'}
        onClose={() => setActiveDetailModal(null)}
        title={activeDetailModal === 'downloads_permits' ? 'Pusat Unduh Dokumen Perizinan & SBU' : 'Pusat Unduh Template Kontrak & MoU'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3 text-xs">
          {/* Asal Sumber Data File (Clean & Structured) */}
          <DataSourceCard
            source={activeDetailModal === 'downloads_permits' ? DATA_SOURCE_MAPPING.downloads_permits : DATA_SOURCE_MAPPING.downloads_templates}
          />

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={downloadSearch}
              onChange={(e) => setDownloadSearch(e.target.value)}
              placeholder="Cari file dokumen yang ingin diunduh..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-stroke rounded-lg text-xs"
            />
          </div>

          <div className="border border-stroke rounded-lg overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                <tr>
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5">Kategori / Folder</th>
                  <th className="p-2.5">Nama File</th>
                  <th className="p-2.5 text-right">Ukuran</th>
                  <th className="p-2.5 text-center">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {downloadsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      <FileText size={28} className="mx-auto mb-2 text-gray-300 opacity-60" />
                      <p className="font-semibold text-gray-500">Tidak ada file yang ditemukan</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Memuat atau coba kata kunci pencarian yang lain.</p>
                    </td>
                  </tr>
                ) : (
                  downloadsList.map((file, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 text-center text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 text-gray-600 font-medium">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">{file.category}</span>
                        {file.subfolder && <span className="text-gray-400 ml-1">/ {file.subfolder}</span>}
                      </td>
                      <td className="p-2.5 font-semibold text-boxdark">{file.filename}</td>
                      <td className="p-2.5 text-right text-gray-400">{file.filesize_kb} KB</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => setDownloadPermissionModal(file)}
                          className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded font-semibold transition cursor-pointer"
                        >
                          <Download size={12} />
                          <span>Unduh File</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB MODAL: Izin Unduh Approval Form                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(downloadPermissionModal)}
        onClose={() => setDownloadPermissionModal(null)}
        title="Form Izin Unduh Dokumen Legalitas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestDownloadPermission} className="space-y-3 text-xs">
          <div className="p-3 bg-gray-50 border border-stroke rounded-lg space-y-1">
            <div className="text-gray-500">File yang Diminta:</div>
            <div className="font-semibold text-boxdark">{downloadPermissionModal?.filename}</div>
            <div className="text-[10px] text-gray-400">{downloadPermissionModal?.category}</div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Divisi Pemohon</label>
            <input
              type="text"
              defaultValue={user?.division || 'Divisi Pemohon'}
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-gray-100 text-gray-600 text-xs"
              readOnly
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Keperluan / Alasan Pengunduhan *</label>
            <textarea
              rows={2}
              required
              value={downloadReason}
              onChange={(e) => setDownloadReason(e.target.value)}
              placeholder="Contoh: Persyaratan Tender Proyek PTFI / Audit Klien..."
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stroke">
            <button
              type="button"
              onClick={() => setDownloadPermissionModal(null)}
              className="px-3 py-1.5 border border-stroke text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-primary text-white font-semibold rounded-lg shadow-xs"
            >
              Setujui & Unduh
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB MODAL: PIC Progress Update                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDocForPic)}
        onClose={() => setSelectedDocForPic(null)}
        title={`Update Progress PIC: ${selectedDocForPic?.document_name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSavePicProgress} className="space-y-3 text-xs">
          {/* Asal Sumber Data File (Clean & Structured) */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs">
            <div className="font-semibold text-slate-800 text-xs flex items-center justify-between">
              <span className="truncate" title={selectedDocForPic?.document_name}>{selectedDocForPic?.document_name}</span>
              <span className="font-mono text-[10px] text-gray-400">ID #{selectedDocForPic?.id}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 flex-wrap pt-0.5">
              <FileSpreadsheet size={13} className="text-emerald-700 flex-shrink-0" />
              <span className="text-gray-500 font-medium">File Sumber:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs text-[10px]">
                {DATA_SOURCE_MAPPING[selectedDocForPic?.category || docCategoryTab]?.file}
              </span>
              <span>•</span>
              <span>Sheet: <strong>{DATA_SOURCE_MAPPING[selectedDocForPic?.category || docCategoryTab]?.sheet}</strong></span>
              <span>•</span>
              <span className="text-gray-500">Folder: <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200 text-[10px]">{DATA_SOURCE_MAPPING[selectedDocForPic?.category || docCategoryTab]?.folder}</code></span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Tanggal Pengajuan Perpanjangan</label>
            <input
              type="date"
              value={picFormData.extension_submission_date}
              onChange={(e) => setPicFormData({ ...picFormData, extension_submission_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Progress / Tindak Lanjut</label>
            <input
              type="text"
              value={picFormData.extension_progress}
              onChange={(e) => setPicFormData({ ...picFormData, extension_progress: e.target.value })}
              placeholder="Contoh: PJK3 release, submit Disnaker, dll."
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Status</label>
            <select
              value={picFormData.status}
              onChange={(e) => setPicFormData({ ...picFormData, status: e.target.value })}
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
            >
              <option value="Masih Berlaku">Masih Berlaku</option>
              <option value="On Progress">On Progress / Dalam Perpanjangan</option>
              <option value="Expired">Expired</option>
              <option value="Done">Done / Selesai</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Nama PIC</label>
              <input
                type="text"
                value={picFormData.pic_name}
                onChange={(e) => setPicFormData({ ...picFormData, pic_name: e.target.value })}
                placeholder="Nama PIC penanggung jawab"
                className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email PIC (Notifikasi)</label>
              <input
                type="email"
                value={picFormData.pic_email}
                onChange={(e) => setPicFormData({ ...picFormData, pic_email: e.target.value })}
                placeholder="pic.email@aldzama.com"
                className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Tanggal Expired Baru (Jika Terbit)</label>
            <input
              type="date"
              value={picFormData.new_expired_date}
              onChange={(e) => setPicFormData({ ...picFormData, new_expired_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Catatan / Keterangan</label>
            <textarea
              rows={2}
              value={picFormData.notes}
              onChange={(e) => setPicFormData({ ...picFormData, notes: e.target.value })}
              placeholder="Catatan tambahan untuk dokumen ini..."
              className="w-full px-3 py-1.5 border border-stroke rounded-lg bg-white text-xs"
            />
          </div>


          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stroke">
            <button
              type="button"
              onClick={() => setSelectedDocForPic(null)}
              className="px-3 py-1.5 border border-stroke text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-primary text-white font-semibold rounded-lg shadow-xs"
            >
              Simpan Progress
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
            <DataSourceCard source={DATA_SOURCE_MAPPING[selectedDocForDetail.category || docCategoryTab]} />

            {/* Informasi Detail Dokumen */}
            <div className="p-3 bg-gray-50 border border-stroke rounded-xl space-y-2.5">
              <div className="font-bold text-boxdark text-xs border-b border-stroke pb-1.5 flex items-center justify-between">
                <span>Rincian Metadata Dokumen</span>
                <span className="font-mono text-gray-500 text-[10px]">Database ID #{selectedDocForDetail.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <div className="text-gray-400">Identitas / No. Registrasi:</div>
                  <div className="font-mono font-bold text-boxdark mt-0.5">{selectedDocForDetail.identifier || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Kategori / Modul:</div>
                  <div className="font-semibold text-primary mt-0.5">
                    {DATA_SOURCE_MAPPING[selectedDocForDetail.category || docCategoryTab]?.label}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">Pihak Terkait / Rekanan:</div>
                  <div className="font-medium text-boxdark mt-0.5">{selectedDocForDetail.related_party || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Lokasi / Project Site:</div>
                  <div className="font-medium text-boxdark mt-0.5">{selectedDocForDetail.location || '-'}</div>
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

              {/* Progress PIC */}
              <div className="pt-2 border-t border-stroke text-[11px]">
                <div className="text-gray-400 mb-1 font-medium">Status Tindak Lanjut PIC:</div>
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-amber-900">
                      PIC: {selectedDocForDetail.pic_name || 'Belum Ditugaskan'} {selectedDocForDetail.pic_email && `(${selectedDocForDetail.pic_email})`}
                    </div>
                    <div className="text-gray-600 text-[10px] mt-0.5">
                      Progress: {selectedDocForDetail.extension_progress || 'Belum ada catatan tindak lanjut'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const doc = selectedDocForDetail;
                      setSelectedDocForDetail(null);
                      setSelectedDocForPic(doc);
                      setPicFormData({
                        extension_submission_date: doc.extension_submission_date ? doc.extension_submission_date.substring(0, 10) : '',
                        extension_progress: doc.extension_progress || '',
                        status: doc.status || 'Masih Berlaku',
                        new_expired_date: '',
                        notes: doc.notes || '',
                        pic_name: doc.pic_name || user?.name || '',
                        pic_email: doc.pic_email || '',
                      });
                    }}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[10px] transition cursor-pointer flex-shrink-0"
                  >
                    Update Progress &rarr;
                  </button>
                </div>
              </div>
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
      {/* SUB MODAL: SOP Email Reminders Trigger & Live Preview / Download Excel    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
        title={sopType === 'legal_docs' ? 'Pengaturan & Distribusi Reminder SOP Perizinan & SILO' : 'Pengaturan & Distribusi Notifikasi Kontrak Karyawan ke HR & PJO'}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-3.5 text-xs">
          {/* Ketentuan SOP Info & Excel Download */}
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="font-semibold text-xs">Ketentuan SOP Periode Tanggal 1 – 5 Setiap Bulan:</div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {sopType === 'legal_docs'
                  ? 'Rekapitulasi dokumen legalitas, perizinan, SILO (H-60), dan kendaraan yang mendekati jatuh tempo didistribusikan kepada seluruh PIC terkait.'
                  : 'Rekapitulasi tenaga kerja yang masa berlaku perjanjian kerjanya (PKWT) mendekati jatuh tempo didistribusikan kepada Departemen HR, Direksi, dan PJO.'}
              </p>
            </div>

            {/* Download Excel Button */}
            <button
              type="button"
              onClick={() => {
                if (sopType === 'mp_contracts') {
                  const headers = ['No', 'Nama Karyawan', 'Status', 'Project / Branch Site', 'Tanggal Berakhir Kontrak', 'Sisa Hari Menuju Jatuh Tempo'];
                  const rows = sopMpExpiringList.map((emp, i) => [
                    i + 1,
                    emp.nama,
                    emp.status || 'Contract',
                    emp.branch,
                    emp.end_date || '-',
                    `${emp.days_remaining} hari`
                  ]);
                  downloadAsCsv(`Rekapitulasi_Kontrak_PKWT_Jatuh_Tempo_H-${sopMpDaysRange}_SOP_Tgl_1-5_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                } else {
                  const headers = ['No', 'Kategori', 'Identitas / No Reg', 'Nama Dokumen / Item', 'Pihak / Lokasi', 'Expired Date', 'Status Urgensi', 'PIC'];
                  const rows = sopUrgentDocsList.map((doc, i) => [
                    i + 1,
                    doc.category,
                    doc.identifier || '-',
                    doc.document_name,
                    doc.location || doc.related_party || '-',
                    doc.expired_date ? doc.expired_date.substring(0, 10) : '-',
                    doc.urgency_status,
                    doc.pic_name || 'Legal'
                  ]);
                  downloadAsCsv(`Rekapitulasi_Dokumen_Legalitas_SILO_SOP_Tgl_1-5_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition whitespace-nowrap self-start md:self-center cursor-pointer"
              title="Unduh file Excel untuk diperiksa sebelum didistribusikan"
            >
              <Download size={13} />
              <span>Unduh File Excel Rekap</span>
            </button>
          </div>

          {/* Batas Jatuh Tempo Kontrak (H-30 Saja) */}
          {sopType === 'mp_contracts' && (
            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                <Clock size={14} className="text-blue-600" />
                <span>Batas Jatuh Tempo Kontrak (SOP Tanggal 1-5):</span>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold shadow-xs">
                30 Hari Ke Depan (H-30)
              </span>
            </div>
          )}

          {/* Pengaturan Distribusi Email Form */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            {/* Safety Notice Mode Uji Coba */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-600 shrink-0" />
              <span>
                <strong>Mode Uji Coba Terproteksi:</strong> Pengiriman saat ini dikunci hanya ke <strong>shafira2784@gmail.com</strong>. Email kantor/divisi lain otomatis dicegat dan tidak akan dikirim selama tahap pengembangan.
              </span>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Mail size={14} className="text-primary" />
                <span>Pengaturan Distribusi Email Notifikasi</span>
              </div>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Tujuan uji coba: shafira2784@gmail.com
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* TO Field - Hard-locked to shafira2784@gmail.com */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kepada / Penerima (To) <span className="text-emerald-600 font-bold">(Terkunci Khusus Uji Coba)</span>
                </label>
                <input
                  type="email"
                  value="shafira2784@gmail.com"
                  readOnly
                  className="w-full px-2.5 py-1.5 bg-emerald-50/80 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                  Email hanya akan dikirimkan ke <strong>shafira2784@gmail.com</strong>
                </span>
              </div>

              {/* CC Field - Hard-disabled */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tembusan (CC) <span className="text-rose-500 font-bold">(Dinonaktifkan)</span>
                </label>
                <input
                  type="text"
                  value=""
                  disabled
                  placeholder="CC Dinonaktifkan (Tidak ada email tembusan)"
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Semua tembusan ke HRD, Ismaya, Syahrul, Legal, dll telah dimatikan total.
                </span>
              </div>
            </div>

            {/* SUBJECT Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Subjek Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Subjek email..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* NOTES / BODY Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Catatan / Pesan Pengantar (Isi Badan Email)
              </label>
              <textarea
                rows={5}
                value={emailForm.notes}
                onChange={(e) => setEmailForm({ ...emailForm, notes: e.target.value })}
                placeholder="Tuliskan catatan khusus atau instruksi yang akan disertakan dalam badan email..."
                className="w-full min-h-[120px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y font-sans leading-relaxed shadow-2xs"
              />
            </div>
          </div>

          {/* Live Data Preview Section (Posisi lebih ke bawah & teratur) */}
          <div className="pt-2 border-t border-stroke">
            <div className="flex items-center justify-between pb-1.5 text-gray-700 font-semibold">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet size={13} className="text-emerald-600" />
                <span>Preview Data Rekapitulasi yang Dilampirkan:</span>
              </div>
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                {sopType === 'mp_contracts'
                  ? `${sopMpExpiringList.length} Kontrak PKWT Jatuh Tempo (H-${sopMpDaysRange})`
                  : `${sopUrgentDocsList.length} Dokumen Kritis & Warning Termonitor`}
              </span>
            </div>

            <div className="border border-stroke rounded-lg overflow-x-auto max-h-[18vh]">
              {sopType === 'mp_contracts' ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">No</th>
                      <th className="p-2">Nama Karyawan</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Project / Branch Site</th>
                      <th className="p-2">Tanggal Berakhir Kontrak</th>
                      <th className="p-2 text-center">Sisa Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {sopMpExpiringList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">
                          Tidak ada kontrak PKWT yang jatuh tempo dalam {sopMpDaysRange} hari ke depan.
                        </td>
                      </tr>
                    ) : (
                      sopMpExpiringList.slice(0, 25).map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-1.5 font-semibold text-boxdark">{emp.nama}</td>
                          <td className="p-1.5">{emp.status || 'Contract'}</td>
                          <td className="p-1.5 text-gray-600">{emp.branch}</td>
                          <td className="p-1.5 text-danger font-semibold">{emp.end_date || '-'}</td>
                          <td className="p-1.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {emp.days_remaining} hr lagi
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {sopMpExpiringList.length > 25 && (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-gray-400 bg-gray-50/50 italic">
                          ... dan {sopMpExpiringList.length - 25} data karyawan lainnya (dapat dilihat lengkap di file unduhan Excel).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">No</th>
                      <th className="p-2">Kategori</th>
                      <th className="p-2">Nama Dokumen / Item</th>
                      <th className="p-2">Expired Date</th>
                      <th className="p-2">Status Urgensi</th>
                      <th className="p-2">PIC Terkait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {sopUrgentDocsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">
                          Tidak ada dokumen yang kritis atau expired saat ini.
                        </td>
                      </tr>
                    ) : (
                      sopUrgentDocsList.slice(0, 25).map((doc, idx) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-1.5 font-medium uppercase text-[10px] text-gray-500">{doc.category}</td>
                          <td className="p-1.5 font-semibold text-boxdark">{doc.document_name}</td>
                          <td className="p-1.5 text-gray-600">{doc.expired_date ? doc.expired_date.substring(0, 10) : '-'}</td>
                          <td className="p-1.5">{getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}</td>
                          <td className="p-1.5 text-gray-600">{doc.pic_name || 'PIC Legal'}</td>
                        </tr>
                      ))
                    )}
                    {sopUrgentDocsList.length > 25 && (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-gray-400 bg-gray-50/50 italic">
                          ... dan {sopUrgentDocsList.length - 25} dokumen lainnya (dapat dilihat lengkap di file unduhan Excel).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stroke">
            <div className="text-[11px] text-gray-400 hidden sm:block">
              * Rekap file Excel akan otomatis disertakan sebagai lampiran email.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSopModalOpen(false)}
                disabled={sendingEmail}
                className="px-3.5 py-1.5 border border-stroke text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                Tutup / Batal
              </button>
              <button
                type="button"
                onClick={handleTriggerSopEmail}
                disabled={sendingEmail}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Mengirim Email...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Kirim Notifikasi via Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
