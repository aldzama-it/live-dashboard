import React, { useState, useEffect, useMemo } from 'react';
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
  RotateCcw
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import Modal from '../../../components/ui/Modal';
import ChartContainer from '../../../components/ui/ChartContainer';
import api from '../../../axios';

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
    if (activeDetailModal === 'documents') {
      fetchDocumentsList();
    }
  }, [activeDetailModal, docCategoryTab, docUrgencyFilter, docSearch]);


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
  const fetchKpiDetail = async () => {
    try {
      const res = await api.get(`/api/legal-dashboard/kpi-performance?month=${selectedMonth}`);
      if (res.data?.status === 'success') {
        setKpiDetail(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching KPI detail:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'kpi') {
      fetchKpiDetail();
    }
  }, [activeDetailModal, selectedMonth]);

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
  const fetchDownloadsList = async (categoryFilter = 'all') => {
    try {
      const res = await api.get(`/api/legal-dashboard/downloads?category=${categoryFilter}&search=${downloadSearch}`);
      if (res.data?.status === 'success') {
        setDownloadsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching Downloads:', err);
    }
  };

  useEffect(() => {
    if (activeDetailModal === 'downloads_permits') {
      fetchDownloadsList('Perizinan Usaha');
    } else if (activeDetailModal === 'downloads_templates') {
      fetchDownloadsList('Template Kontrak & MoU');
    }
  }, [activeDetailModal]);

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
  const handleTriggerSopEmail = async () => {
    setSendingEmail(true);
    try {
      if (sopType === 'legal_docs') {
        const res = await api.post('/api/legal-dashboard/send-reminder-email', { type: 'batch_monthly' });
        setActionSuccessMsg(res.data.message || 'Reminder SOP Perizinan & SILO berhasil dikirimkan!');
      } else {
        const res = await api.post('/api/legal-dashboard/send-mp-reminder-email', { audience: 'HR, Direksi, & PJO' });
        setActionSuccessMsg(res.data.message || 'Rekap Kontrak Karyawan berhasil dikirimkan ke HR, Direksi, & PJO!');
      }
      setIsSopModalOpen(false);
      setTimeout(() => setActionSuccessMsg(''), 5000);
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock size={11} className="text-amber-700" />
          Perlu Perpanjangan ({daysRemaining} hr - {threshold})
        </span>
      );
    }
    if (urgencyStatus === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {daysRemaining} hari lagi
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

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[580px] w-full overflow-hidden text-xs gap-2.5">
      {/* 1. TOP HEADER & FILTER BAR */}
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-2 rounded-xl border border-stroke shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Building2 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-boxdark leading-none">
                Legal & Document Control Executive Dashboard
              </h2>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] font-semibold rounded border border-gray-200">
                FRM-AZM-603
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Live Monitoring Perizinan, SILO, Kontrak Karyawan, KPI, Budget, & Download Center
            </p>
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Periode Month Dropdown */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1 px-2.5 bg-gray-50 border border-stroke rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-primary cursor-pointer"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* SOP Reminder Button */}
          <button
            onClick={() => {
              setSopType('legal_docs');
              setIsSopModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-xs transition"
            title="Kirim email reminder gabungan SOP tgl 1-5"
          >
            <Mail size={13} />
            <span>Reminder SOP Tgl 1-5</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchExecutiveSummary}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="flex shrink-0 items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shadow-xs text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. EXECUTIVE 6-CARD GRID (1-PAGE COMPACT OVERVIEW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* ===================================================================== */}
        {/* CARD 1: Monitoring Dokumen & SILO (Alert H-30/H-60)                   */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('documents')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition">
                <Wrench size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  Monitoring Perizinan & SILO
                </h3>
                <p className="text-[10px] text-gray-400">SILO (H-60), Izin, Perjanjian, Kontrak & Mobil</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          {/* Stat Row */}
          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-base font-bold text-boxdark">{docs.total_documents || 241}</div>
              <div className="text-[10px] text-gray-400">Total Terpantau</div>
            </div>
            <div>
              <div className="text-base font-bold text-amber-600">{docs.total_critical || 0}</div>
              <div className="text-[10px] text-amber-600 font-medium">Kritis (H-30/60)</div>
            </div>
            <div>
              <div className="text-base font-bold text-danger">{docs.total_expired || 0}</div>
              <div className="text-[10px] text-danger font-medium">Expired</div>
            </div>
          </div>

          {/* Sub Categories Tags */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">SILO: {docs.total_silo || 0}</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">Permit: {docs.total_permit || 0}</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">PKS: {docs.total_agreement || 0}</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">Mobil: {docs.total_vehicle || 0}</span>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* CARD 2: Reminder Kontrak Karyawan (MP Baseline)                       */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('manpower')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  Kontrak Karyawan (MP Baseline)
                </h3>
                <p className="text-[10px] text-gray-400">Rekapitulasi Berkala SOP Tgl 1–5 ke HR & PJO</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-base font-bold text-boxdark">{mp.total_employees || 805}</div>
              <div className="text-[10px] text-gray-400">Total Manpower</div>
            </div>
            <div>
              <div className="text-base font-bold text-amber-600">{mp.expiring_30_days || 18}</div>
              <div className="text-[10px] text-amber-600 font-medium">Habis &lt; 30 Hari</div>
            </div>
            <div>
              <div className="text-base font-bold text-primary">{mp.expiring_this_month || 14}</div>
              <div className="text-[10px] text-primary font-medium">Bulan Ini</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="text-gray-400">Site: HO, Freeport, Antam, Vale, BAI</span>
            <span className="font-semibold text-primary flex items-center gap-1">
              Buka Rekap <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CARD 3: Data KPI Divisi Legal 2026                                   */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('kpi')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  KPI Kinerja Divisi Legal
                </h3>
                <p className="text-[10px] text-gray-400">Review, Drafting, Advisory, Litigasi (YTD & Bulanan)</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-base font-bold text-emerald-600">{kpi.achievement_rate || 100}%</div>
              <div className="text-[10px] text-gray-400">Capaian KPI</div>
            </div>
            <div>
              <div className="text-base font-bold text-boxdark">{(kpi.total_review_ytd || 30) + (kpi.total_drafting_ytd || 28)}</div>
              <div className="text-[10px] text-gray-400">Review & Draft</div>
            </div>
            <div>
              <div className="text-base font-bold text-emerald-600">0</div>
              <div className="text-[10px] text-emerald-600 font-medium">Kasus / Sengketa</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span>Target: 14 hari | Realisasi: {kpi.avg_duration_days || 3.1} hari</span>
            <span className="font-semibold text-emerald-600">Target Tercapai</span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CARD 4: Budget & Dana Operasional                                     */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('budget')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  Budget & Dana Operasional
                </h3>
                <p className="text-[10px] text-gray-400">Pengajuan vs Realisasi LPJ (Notaris, OSS, Materai)</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-sm font-bold text-boxdark">{formatCurrency(budget.ytd_budget || 51000000)}</div>
              <div className="text-[10px] text-gray-400">Anggaran YTD</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-600">{formatCurrency(budget.ytd_actual || 31441407)}</div>
              <div className="text-[10px] text-purple-600 font-medium">Realisasi LPJ ({budget.ytd_utilization_rate || 61.6}%)</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span>Bulan Terpilih: {formatCurrency(budget.current_month_actual || 420000)}</span>
            <span className="font-semibold text-purple-600 flex items-center gap-1">
              Rincian COA <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CARD 5: Pusat Unduh Dokumen Perizinan & SBU                           */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('downloads_permits')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition">
                <FileCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  Pusat Unduh Perizinan & SBU
                </h3>
                <p className="text-[10px] text-gray-400">IUI, IUJK, IUJP, SIUP, PKP, SKT, SBU & BPJS</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-base font-bold text-boxdark">{downloadsCount.perizinan_sbu || 32}</div>
              <div className="text-[10px] text-gray-400">File Legalitas</div>
            </div>
            <div>
              <div className="text-base font-bold text-indigo-600">PDF / Doc</div>
              <div className="text-[10px] text-gray-400">Format File</div>
            </div>
            <div>
              <div className="text-base font-bold text-emerald-600">Tersedia</div>
              <div className="text-[10px] text-emerald-600 font-medium">Status Arsip</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="flex items-center gap-1 text-gray-400">
              <FolderLock size={12} /> Izin Unduh Divisi
            </span>
            <span className="font-semibold text-indigo-600 flex items-center gap-1">
              Buka Download <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CARD 6: Template Perjanjian, MoU & Kontrak Project                     */}
        {/* ===================================================================== */}
        <div
          onClick={() => setActiveDetailModal('downloads_templates')}
          className="group relative flex flex-col justify-between p-3.5 bg-white border border-stroke hover:border-primary/50 hover:shadow-md rounded-xl transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:scale-105 transition">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-boxdark text-xs md:text-sm group-hover:text-primary transition">
                  Template Perjanjian & PKWT
                </h3>
                <p className="text-[10px] text-gray-400">Draft PKWT Project (Freeport, Antam, Vale, BAI)</p>
              </div>
            </div>
            <Maximize2 size={14} className="text-gray-400 group-hover:text-primary transition" />
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-stroke/60 text-center">
            <div>
              <div className="text-base font-bold text-boxdark">{downloadsCount.templates || 26}</div>
              <div className="text-[10px] text-gray-400">Draft Template</div>
            </div>
            <div>
              <div className="text-base font-bold text-teal-600">DOCX</div>
              <div className="text-[10px] text-gray-400">Siap Pakai</div>
            </div>
            <div>
              <div className="text-base font-bold text-emerald-600">Standard</div>
              <div className="text-[10px] text-emerald-600 font-medium">Format Legal</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="text-gray-400">Template Terverifikasi</span>
            <span className="font-semibold text-teal-600 flex items-center gap-1">
              Unduh Template <ChevronRight size={12} />
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FULL MODAL 1: Detail Monitoring Perizinan & SILO                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeDetailModal === 'documents'}
        onClose={() => setActiveDetailModal(null)}
        title="Detail Monitoring Dokumen Perizinan, Perjanjian, Kontrak & SILO"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3 text-xs">
          {/* Tabs inside modal */}
          <div className="flex border-b border-stroke overflow-x-auto gap-1 bg-gray-50/80 p-1 rounded-lg">
            {[
              { id: 'silo', label: '1. Monitoring SILO', icon: Wrench },
              { id: 'permit', label: '2. Monitoring Perizinan', icon: FileCheck },
              { id: 'agreement', label: '3. Monitoring Perjanjian', icon: Building2 },
              { id: 'project_contract', label: '4. Kontrak Project', icon: Briefcase },
              { id: 'vehicle', label: '5. Izin Kendaraan', icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = docCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDocCategoryTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                    isActive ? 'bg-white text-primary shadow-xs border border-stroke' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

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
              className="py-1.5 px-2 bg-gray-50 border border-stroke rounded-lg text-xs"
            >
              <option value="all">Semua Status Expiry</option>
              <option value="critical">🟠 Kritis (H-30/H-60)</option>
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
                      } catch (e) {}
                    }

                    if (docCategoryTab === 'vehicle') {
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-boxdark whitespace-nowrap">{doc.identifier || '-'}</td>
                          <td className="p-2 font-semibold text-boxdark">{doc.document_name}</td>
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
                              className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded font-semibold text-[10px]"
                            >
                              Update PIC
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-medium">{doc.identifier || '-'}</td>
                        <td className="p-2">
                          <div className="font-semibold text-boxdark">{doc.document_name}</div>
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
                            className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded font-semibold text-[10px]"
                          >
                            Update PIC
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
        title="Detail Kontrak Karyawan Berakhir (Manpower Baseline)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
            <div>
              <div className="font-semibold">SOP Notifikasi Masa Berlaku Kontrak Karyawan (Periode Tanggal 1 – 5 Setiap Bulan)</div>
              <div className="text-[11px] text-blue-800 leading-relaxed">
                Sistem mengompilasi daftar tenaga kerja yang masa perjanjian kerjanya (PKWT) mendekati jatuh tempo ke dalam satu dokumen rekapitulasi terpadu, untuk didistribusikan kepada Departemen HR, Direksi, dan PJO / Site Manager terkait.
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
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
                  downloadAsCsv(`Rekapitulasi_Kontrak_Karyawan_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition whitespace-nowrap"
                title="Unduh data tabel saat ini ke format Excel"
              >
                <Download size={13} />
                <span>Unduh Excel Rekap</span>
              </button>
              <button
                onClick={() => {
                  setSopType('mp_contracts');
                  setIsSopModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition whitespace-nowrap"
              >
                <Send size={13} />
                <span>Kirim Notifikasi Berkala</span>
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          emp.status === 'Permanent' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
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
        title="Detail KPI Kinerja Divisi Legal 2026 (Akumulatif YTD & Bulanan)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-xl font-bold text-emerald-600">100%</div>
              <div className="text-gray-500 text-[10px]">Capaian KPI 2026</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{kpiDetail?.ytd_totals?.total_review || 30}</div>
              <div className="text-gray-500 text-[10px]">Total Legal Review</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{kpiDetail?.ytd_totals?.total_drafting || 28}</div>
              <div className="text-gray-500 text-[10px]">Total Legal Drafting</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{kpiDetail?.ytd_totals?.total_advisory || 17}</div>
              <div className="text-gray-500 text-[10px]">Total Legal Advisory</div>
            </div>
          </div>

          <div className="p-3.5 bg-gray-50 border border-stroke rounded-lg space-y-2">
            <div className="font-semibold text-boxdark">Rekapitulasi KPI per Komponen (Target vs Realisasi):</div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 bg-white border border-stroke rounded">
                <div className="font-semibold text-primary">1. Legal Review & Drafting</div>
                <div className="text-gray-500 mt-1">Target SLA: <b>14 Hari Kerja</b></div>
                <div className="text-gray-500">Rata-rata Realisasi: <b>3.1 Hari Kerja</b> (Memenuhi Target)</div>
              </div>
              <div className="p-2.5 bg-white border border-stroke rounded">
                <div className="font-semibold text-primary">2. Legal Advisory / Pendapat Hukum</div>
                <div className="text-gray-500 mt-1">Target SLA: <b>7 Hari Kerja</b></div>
                <div className="text-gray-500">Rata-rata Realisasi: <b>2.8 Hari Kerja</b> (Memenuhi Target)</div>
              </div>
              <div className="p-2.5 bg-white border border-stroke rounded">
                <div className="font-semibold text-emerald-600">3. Perkara Litigasi / Pengadilan</div>
                <div className="text-gray-500 mt-1">Target: <b>0 Kasus</b></div>
                <div className="text-emerald-700 font-bold">Realisasi: 0 Kasus (Sempurna)</div>
              </div>
              <div className="p-2.5 bg-white border border-stroke rounded">
                <div className="font-semibold text-emerald-600">4. Pelanggaran Hukum / Compliance</div>
                <div className="text-gray-500 mt-1">Target: <b>0 Pelanggaran</b></div>
                <div className="text-emerald-700 font-bold">Realisasi: 0 Pelanggaran (Sempurna)</div>
              </div>
            </div>
          </div>
        </div>
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
                {downloadsList.map((file, idx) => (
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
                        className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded font-semibold transition"
                      >
                        <Download size={12} />
                        <span>Unduh File</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
      {/* SUB MODAL: SOP Email Reminders Trigger & Live Preview / Download Excel    */}
      {/* ========================================================================= */}
      <Modal

        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
        title={sopType === 'legal_docs' ? 'Preview & Distribusi Reminder SOP Perizinan & SILO' : 'Preview & Distribusi Notifikasi Kontrak Karyawan ke HR & PJO'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="font-semibold">Ketentuan SOP Periode Tanggal 1 – 5 Setiap Bulan:</div>
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
                  const headers = ['No', 'Nama Karyawan', 'Status', 'Project / Branch Site', 'Tanggal Berakhir Kontrak'];
                  const rows = mpList.map((emp, i) => [
                    i + 1,
                    emp.nama,
                    emp.status || 'Contract',
                    emp.branch,
                    emp.end_date || '-'
                  ]);
                  downloadAsCsv(`Rekapitulasi_Kontrak_Karyawan_SOP_Tgl_1-5_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
                } else {
                  const urgentDocs = documentsList.filter(d => d.urgency_status === 'critical' || d.urgency_status === 'expired' || d.urgency_status === 'warning');
                  const headers = ['No', 'Kategori', 'Identitas / No Reg', 'Nama Dokumen / Item', 'Pihak / Lokasi', 'Expired Date', 'Status Urgensi', 'PIC'];
                  const rows = (urgentDocs.length > 0 ? urgentDocs : documentsList).map((doc, i) => [
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition whitespace-nowrap self-start md:self-center"
              title="Unduh file Excel untuk diperiksa sebelum didistribusikan"
            >
              <Download size={13} />
              <span>Unduh File Excel Rekap</span>
            </button>
          </div>

          {/* Live Data Preview Section */}
          <div>
            <div className="flex items-center justify-between pb-1 text-gray-600 font-semibold">
              <span>Preview Data yang Akan Dikirimkan:</span>
              <span className="text-[11px] text-gray-400">
                {sopType === 'mp_contracts' ? `${mpList.length} Karyawan Termonitor` : `${documentsList.length} Dokumen Termonitor`}
              </span>
            </div>

            <div className="border border-stroke rounded-lg overflow-x-auto max-h-[35vh]">
              {sopType === 'mp_contracts' ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 sticky top-0 border-b border-stroke text-gray-500 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">No</th>
                      <th className="p-2">Nama Karyawan</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Project / Branch Site</th>
                      <th className="p-2">Tanggal Berakhir Kontrak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {mpList.slice(0, 20).map((emp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-1.5 font-semibold text-boxdark">{emp.nama}</td>
                        <td className="p-1.5">{emp.status || 'Contract'}</td>
                        <td className="p-1.5 text-gray-600">{emp.branch}</td>
                        <td className="p-1.5 text-danger font-semibold">{emp.end_date || '-'}</td>
                      </tr>
                    ))}
                    {mpList.length > 20 && (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-gray-400 bg-gray-50/50 italic">
                          ... dan {mpList.length - 20} data karyawan lainnya (dapat dilihat lengkap di file unduhan Excel).
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
                    {documentsList.slice(0, 20).map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-1.5 font-medium uppercase text-[10px] text-gray-500">{doc.category}</td>
                        <td className="p-1.5 font-semibold text-boxdark">{doc.document_name}</td>
                        <td className="p-1.5 text-gray-600">{doc.expired_date ? doc.expired_date.substring(0, 10) : '-'}</td>
                        <td className="p-1.5">{getUrgencyBadge(doc.urgency_status, doc.days_remaining, doc.category)}</td>
                        <td className="p-1.5 text-gray-600">{doc.pic_name || 'PIC Legal'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stroke">
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
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
      </Modal>


    </div>
  );
}

function roundTo1(num) {
  return Math.round((num || 0) * 10) / 10;
}
