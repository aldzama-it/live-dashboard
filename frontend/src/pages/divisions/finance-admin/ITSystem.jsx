import React, { useState, useEffect } from 'react';
import { Monitor, Mail, Terminal, DollarSign, Star, Network, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import Modal from '../../../components/ui/Modal';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';
import api from '../../../axios';
import Chart from 'react-apexcharts';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';

const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '28px',
    height: '28px',
    fontSize: '0.75rem',
    borderRadius: '0.25rem',
    borderColor: '#E2E8F0',
    boxShadow: 'none',
    '&:hover': { borderColor: '#94A3B8' }
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    minHeight: '28px'
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '28px'
  }),
  menu: (base) => ({
    ...base,
    fontSize: '0.75rem',
    zIndex: 99999
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999
  })
};

const LOCATIONS = [
  "Aldzama - Head Office",
  "Aldzama - Antam Lining",
  "Aldzama - Vale",
  "Aldzama - Antam Electrode Casing",
  "Aldzama - Hotmetal",
  "Aldzama - Vacuum PTFI",
  "Aldzama - Lime Package",
  "Aldzama - Refractory",
  "Aldzama - Scaffolding",
  "Aldzama - Tapper Skimmer",
  "Aldzama - Hydraulic",
  "Aldzama - Excavator",
  "Aldzama - Vacuum Antam",
  "Aldzama - Fabrication",
  "Aldzama - CMP",
  "Aldzama - Smelting",
  "Aldzama - Demolish",
  "Aldzama - BAI"
];

const AssetRow = ({ asset, isPIC, onUpdate, onDelete, onCancelAdd, departmentsData }) => {
  // If it's a new unsaved asset, start in editing mode
  const [isEditing, setIsEditing] = useState(asset.isNew || false);
  const [formData, setFormData] = useState(asset);

  if (isEditing) {
    return (
      <tr>
        <td className="px-2 py-2"><input autoFocus placeholder="Nama Asset" type="text" className="w-full border rounded px-2 py-1 text-xs" value={formData.asset_name || ''} onChange={e => setFormData({ ...formData, asset_name: e.target.value })} /></td>
        {asset.type === 'general' ? (
          <>
            <td className="px-2 py-2"><input placeholder="Brand/Spek" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.brand_description || ''} onChange={e => setFormData({ ...formData, brand_description: e.target.value })} /></td>
            <td className="px-2 py-2 min-w-[150px]">
              <Select
                styles={selectStyles}
                options={LOCATIONS.map(l => ({ label: l, value: l }))}
                value={formData.location ? { label: formData.location, value: formData.location } : null}
                onChange={v => setFormData({ ...formData, location: v?.value || '' })}
                placeholder="Pilih Lokasi..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
          </>
        ) : (
          <>
            <td className="px-2 py-2"><input placeholder="Penerima" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.receiver_name || ''} onChange={e => setFormData({ ...formData, receiver_name: e.target.value })} /></td>
            <td className="px-2 py-2 min-w-[150px]">
              <Select
                styles={selectStyles}
                options={[...new Set(departmentsData?.filter(d => d.division).map(d => d.division.name))].map(name => ({ label: name, value: name }))}
                value={formData.department ? { label: formData.department, value: formData.department } : null}
                onChange={v => setFormData({ ...formData, department: v?.value || '' })}
                placeholder="Pilih Dept..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
            <td className="px-2 py-2 min-w-[150px]">
              <CreatableSelect
                styles={selectStyles}
                options={departmentsData?.map(d => ({ label: d.name, value: d.name }))}
                value={formData.division_project ? { label: formData.division_project, value: formData.division_project } : null}
                onChange={v => setFormData({ ...formData, division_project: v?.value || '' })}
                placeholder="Div/Proj..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
            <td className="px-2 py-2"><input type="date" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.handover_date || ''} onChange={e => setFormData({ ...formData, handover_date: e.target.value })} /></td>
            <td className="px-2 py-2"><input placeholder="Brand/Spek" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.specification || ''} onChange={e => setFormData({ ...formData, specification: e.target.value })} /></td>
          </>
        )}
        <td className="px-2 py-2 min-w-[120px]">
          <Select
            styles={selectStyles}
            options={[{ label: 'Baik', value: 'Baik' }, { label: 'Rusak', value: 'Rusak' }]}
            value={formData.condition ? { label: formData.condition, value: formData.condition } : { label: 'Baik', value: 'Baik' }}
            onChange={v => setFormData({ ...formData, condition: v?.value || 'Baik' })}
            isClearable={false}
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => {
              if (!formData.asset_name) return alert('Nama Asset harus diisi');
              onUpdate(formData);
              if (!asset.isNew) setIsEditing(false);
            }}
              className="text-success p-1 hover:bg-success/10 rounded" title="Save">
              <Check size={14} />
            </button>
            <button onClick={() => {
              if (asset.isNew) {
                onCancelAdd();
              } else {
                setIsEditing(false);
                setFormData(asset); // reset
              }
            }}
              className="text-danger p-1 hover:bg-danger/10 rounded" title="Cancel">
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">{asset.asset_name}</td>
      {asset.type === 'general' ? (
        <>
          <td className="px-4 py-3">{asset.brand_description}</td>
          <td className="px-4 py-3">{asset.location}</td>
        </>
      ) : (
        <>
          <td className="px-4 py-3">{asset.receiver_name}</td>
          <td className="px-4 py-3">{asset.department}</td>
          <td className="px-4 py-3">{asset.division_project}</td>
          <td className="px-4 py-3">{asset.handover_date}</td>
          <td className="px-4 py-3">{asset.specification}</td>
        </>
      )}
      <td className={`px-4 py-3 ${asset.condition?.toLowerCase().includes('baik') ? 'text-success' : 'text-warning'}`}>{asset.condition}</td>
      {isPIC && (
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(asset.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
          </div>
        </td>
      )}
    </tr>
  );
};

const EmailRow = ({ email, isPIC, onUpdate, onDelete, onCancelAdd, departmentsData }) => {
  const [isEditing, setIsEditing] = useState(email.isNew || false);
  const [formData, setFormData] = useState({
    ...email,
    email_prefix: email.email_address ? email.email_address.split('@')[0] : ''
  });

  if (isEditing) {
    return (
      <tr>
        <td className="px-2 py-2 min-w-[150px]">
          <CreatableSelect
            styles={selectStyles}
            options={[{ label: '@aldzama.com', value: '@aldzama.com' }, { label: '@project.aldzama.com', value: '@project.aldzama.com' }]}
            value={formData.domain ? { label: formData.domain, value: formData.domain } : null}
            onChange={v => setFormData({ ...formData, domain: v?.value || '' })}
            placeholder="Domain..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <input placeholder="Nama Pengguna" type="text" className="w-full border rounded px-2 py-1 text-xs h-7 mb-1" value={formData.user_name || ''} onChange={e => setFormData({ ...formData, user_name: e.target.value })} />
          <div className="flex items-center text-xs border rounded bg-white overflow-hidden h-7">
            <input placeholder="Prefix Email (misal: wanda)" type="text" className="w-full px-2 py-1 outline-none" value={formData.email_prefix || ''} onChange={e => setFormData({ ...formData, email_prefix: e.target.value })} />
          </div>
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <Select
            styles={selectStyles}
            options={[...new Set(departmentsData?.filter(d => d.division).map(d => d.division.name))].map(name => ({ label: name, value: name }))}
            value={formData.department ? { label: formData.department, value: formData.department } : null}
            onChange={v => setFormData({ ...formData, department: v?.value || '' })}
            placeholder="Pilih Dept..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <CreatableSelect
            styles={selectStyles}
            options={departmentsData?.map(d => ({ label: d.name, value: d.name }))}
            value={formData.division_project ? { label: formData.division_project, value: formData.division_project } : null}
            onChange={v => setFormData({ ...formData, division_project: v?.value || '' })}
            placeholder="Div/Proj..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => {
              if (!formData.email_prefix || !formData.domain || !formData.user_name) return alert('Data wajib diisi (Prefix Email, Domain, Username)');
              const fullEmail = formData.email_prefix + (formData.domain.startsWith('@') ? formData.domain : '@' + formData.domain);
              onUpdate({ ...formData, email_address: fullEmail });
              if (!email.isNew) setIsEditing(false);
            }}
              className="text-success p-1 hover:bg-success/10 rounded" title="Save">
              <Check size={14} />
            </button>
            <button onClick={() => {
              if (email.isNew) {
                onCancelAdd();
              } else {
                setIsEditing(false);
                setFormData(email);
              }
            }}
              className="text-danger p-1 hover:bg-danger/10 rounded" title="Cancel">
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">{email.domain}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-boxdark">{email.user_name}</span>
          <span className="text-xs text-gray-500">{email.email_address}</span>
        </div>
      </td>
      <td className="px-4 py-3">{email.department}</td>
      <td className="px-4 py-3">{email.division_project}</td>
      {isPIC && (
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(email.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default function ITSystem({ user }) {
  const [modalType, setModalType] = useState(null);

  // Default to current month range
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ startDate: firstDay, endDate: lastDay });
  const isPIC = user?.roles?.[0]?.name === 'Division PIC';

  const [assetsData, setAssetsData] = useState({ general: [], individual: [], total: 0 });
  const [departmentsData, setDepartmentsData] = useState([]);
  const [newAssetType, setNewAssetType] = useState(null); // 'general' or 'individual'
  const [emailsData, setEmailsData] = useState([]);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [showSoftwareDetails, setShowSoftwareDetails] = useState(false);
  const [ticketsData, setTicketsData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [softwareData, setSoftwareData] = useState(null);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/api/it-assets');
      setAssetsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await api.get('/api/it-emails');
      setEmailsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/divisions');
      setDepartmentsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      const qs = dateRange.startDate && dateRange.endDate ? `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}` : '';
      const res = await api.get(`/api/it-dashboard/tickets${qs}`);
      setTicketsData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBudget = async () => {
    try {
      const qs = dateRange.startDate && dateRange.endDate ? `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}` : '';
      const res = await api.get(`/api/it-dashboard/budget${qs}`);
      setBudgetData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSoftware = async () => {
    try {
      const res = await api.get('/api/it-dashboard/software');
      setSoftwareData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchEmails();
    fetchDepartments();
    fetchTickets();
    fetchBudget();
    fetchSoftware();
  }, [dateRange]);

  const handleAddAsset = (type) => {
    setNewAssetType(type);
  };

  const handleCancelAdd = () => {
    setNewAssetType(null);
  };

  const handleSaveAsset = async (data) => {
    try {
      if (data.isNew) {
        // Create
        await api.post('/api/it-assets', { ...data, isNew: undefined });
        setNewAssetType(null);
      } else {
        // Update
        await api.put(`/api/it-assets/${data.id}`, data);
      }
      fetchAssets();
    } catch (err) {
      alert('Failed to save asset');
      console.error(err);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Delete asset?')) return;
    try {
      await api.delete(`/api/it-assets/${id}`);
      fetchAssets();
    } catch (err) {
      alert('Failed to delete asset');
    }
  };

  const handleSaveEmail = async (data) => {
    try {
      if (data.isNew) {
        await api.post('/api/it-emails', { ...data, isNew: undefined });
        setIsAddingEmail(false);
      } else {
        await api.put(`/api/it-emails/${data.id}`, data);
      }
      fetchEmails();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Failed to save email: ${errorMsg}`);
      console.error(err);
    }
  };

  const handleDeleteEmail = async (id) => {
    if (!window.confirm('Delete email?')) return;
    try {
      await api.delete(`/api/it-emails/${id}`);
      fetchEmails();
    } catch (err) {
      alert('Failed to delete email');
    }
  };

  const scrollToElement = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getAssetChartsData = () => {
    const pieData = [
      { name: 'General', value: assetsData.general.length },
      { name: 'Individual', value: assetsData.individual.length }
    ];

    const itemCounts = {};
    const locCounts = {};

    [...assetsData.general, ...assetsData.individual].forEach(a => {
      const name = a.asset_name || 'Unknown';
      itemCounts[name] = (itemCounts[name] || 0) + 1;

      const loc = a.type === 'general' ? (a.location || 'Unknown Loc') : (a.department || 'Unknown Dept');
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });

    const itemData = Object.keys(itemCounts).map(k => ({ name: k, count: itemCounts[k] })).sort((a, b) => b.count - a.count);
    const locData = Object.keys(locCounts).map(k => ({ name: k, count: locCounts[k] })).sort((a, b) => b.count - a.count);

    return { pieData, itemData, locData };
  };

  const getEmailChartsData = () => {
    const domainCounts = {};
    const divCounts = {};

    emailsData.forEach(e => {
      const dom = e.domain || 'Unknown';
      domainCounts[dom] = (domainCounts[dom] || 0) + 1;

      const div = e.division_project || e.department || 'Unknown';
      divCounts[div] = (divCounts[div] || 0) + 1;
    });

    const domainData = Object.keys(domainCounts).map(k => ({ name: k, count: domainCounts[k] })).sort((a, b) => b.count - a.count);
    const divData = Object.keys(divCounts).map(k => ({ name: k, count: divCounts[k] })).sort((a, b) => b.count - a.count);

    return { domainData, divData };
  };

  const { pieData, itemData, locData } = getAssetChartsData();
  const { domainData, divData } = getEmailChartsData();
  const COLORS = ['#3C50E0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

  const [sorting, setSorting] = useState([]);

  const generalColumns = React.useMemo(() => [
    { accessorKey: 'asset_name', header: 'Asset' },
    { accessorKey: 'brand_description', header: 'Brand/Deskripsi' },
    { accessorKey: 'location', header: 'Lokasi' },
    { accessorKey: 'condition', header: 'Kondisi' },
  ], []);

  const individualColumns = React.useMemo(() => [
    { accessorKey: 'asset_name', header: 'Asset' },
    { accessorKey: 'receiver_name', header: 'Penerima' },
    { accessorKey: 'department', header: 'Departemen' },
    { accessorKey: 'division_project', header: 'Div/Project' },
    { accessorKey: 'handover_date', header: 'Tgl Serah Terima' },
    { accessorKey: 'specification', header: 'Brand & Spek' },
    { accessorKey: 'condition', header: 'Kondisi' },
  ], []);

  const generalTable = useReactTable({
    data: assetsData.general,
    columns: generalColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const individualTable = useReactTable({
    data: assetsData.individual,
    columns: individualColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const emailColumns = React.useMemo(() => [
    { accessorKey: 'domain', header: 'Domain' },
    { accessorKey: 'user_name', header: 'Nama Pengguna & Email' },
    { accessorKey: 'department', header: 'Departemen' },
    { accessorKey: 'division_project', header: 'Divisi / Project' },
  ], []);

  const emailTable = useReactTable({
    data: emailsData,
    columns: emailColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ApexCharts Configs
  const pieOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: pieData.map(d => d.name),
    colors: ['#3C50E0', '#10B981'],
    dataLabels: {
      enabled: true,
      dropShadow: { enabled: false },
      style: { fontSize: '10px' }
    },
    legend: { position: 'bottom', fontSize: '12px', markers: { radius: 12 } },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true, fontSize: '10px' },
            value: { show: true, fontSize: '16px', fontWeight: 'bold' },
            total: { show: true, label: 'Total', fontSize: '10px' }
          }
        }
      }
    },
    stroke: { width: 0 }
  };
  const pieSeries = pieData.map(d => d.value);

  const getBarOptions = (categories, color) => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories,
      labels: {
        style: { fontSize: '10px', colors: '#64748B' },
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: false
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { fontSize: '10px', colors: '#64748B' } }
    },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    colors: [color],
    tooltip: { theme: 'light' }
  });

  return (
    <>
      {/* 
        [PENGATURAN LAYOUT UTAMA]
        - h-[calc(100vh-120px)]: Membatasi tinggi dashboard persis seukuran layar monitor dikurangi header (120px). Ubah 120px jika header berubah ukuran.
        - flex flex-col: Membuat sistem layout kolom elastis.
        - min-h-0: Mencegah elemen anak dari memaksa ukuran melewati batas layar (mencegah scrollbar tidak terduga).
      */}
      <div className="flex flex-col pb-2">
        <div className="shrink-0">
          <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
        </div>

        {/* 
          [PENGATURAN BARIS 1: KPI]
          - shrink-0: Elemen ini TIDAK BOLEH mengecil, ukurannya tetap.
          - lg:grid-cols-5: Membagi menjadi 5 kolom sejajar di layar besar.
          - gap-y-1 gap-x-2: Jarak antar kotak (kerapatan).
        */}
        <div className="shrink-0 grid grid-cols-2 lg:grid-cols-5 gap-1 mb-2">
          <KpiCard
            title="Total Asset Fisik"
            value={assetsData.total.toString()}
            subtitle="Hardware & Devices"
            icon={Monitor}
            colorClass="text-[#10B981] bg-success/10"
            onClick={() => setModalType('asset')}
          />
          <KpiCard title="Total Active Email" value={emailsData.length.toString()} subtitle="All Domains" icon={Mail} colorClass="text-[#3C50E0] bg-primary/10" onClick={() => setModalType('email')} />
          <KpiCard title="Total Software" value="8" subtitle="Active & In Progress" icon={Terminal} colorClass="text-[#F59E0B] bg-warning/10" onClick={() => scrollToElement('software-develop')} />
          <KpiCard
            title="Pemakaian Budget"
            value={budgetData ? `${parseFloat(((budgetData.total_used / (budgetData.total_budget || 1)) * 100).toFixed(1))}%` : '0%'}
            subtitle={budgetData ? `Rp ${budgetData.total_used.toLocaleString('id-ID')} / Rp ${budgetData.total_budget.toLocaleString('id-ID')}` : 'Loading...'}
            icon={DollarSign}
            colorClass="text-danger bg-danger/10"
            onClick={() => scrollToElement('budget-section')}
          />
          <KpiCard title="Rating IT Support" value="4.8/5" subtitle="Average Satisfaction" icon={Star} colorClass="text-[#F59E0B] bg-warning/10" onClick={() => scrollToElement('it-support-section')} />
        </div>


        {/* 
        [PENGATURAN BARIS 2: HIGHLIGHTS] 
        - Card delay="delay-150" dll. juga diberi class "shrink-0" jika ditaruh dalam layout flex agar tidak tertekan.
      */}
        {/* Row 2: Highlights */}
        <Card delay="delay-150" className="mb-2 p-2 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
            <div className="border-l-[3px] border-success pl-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Highlight</p>
              <p className="text-[10px] font-medium text-boxdark leading-tight">Migrated 90% of local servers to cloud.</p>
            </div>
            <div className="border-l-[3px] border-danger pl-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Risk</p>
              <p className="text-[10px] font-medium text-boxdark leading-tight">Hardware replacement delays (Supply Chain).</p>
            </div>
            <div className="border-l-[3px] border-primary pl-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Achievement</p>
              <p className="text-[10px] font-medium text-boxdark leading-tight">IT Support rating hit 4.8 this month.</p>
            </div>
            <div className="border-l-[3px] border-warning pl-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Plan</p>
              <p className="text-[10px] font-medium text-boxdark leading-tight">ERP Alpha testing next week.</p>
            </div>
          </div>
        </Card>

        {/* Main Dashboard Layout (Row 2 + 3 combined) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-1 mb-2 lg:h-[340px]">
          <ChartContainer 
            title="IT Budget" 
            delay="delay-300" 
            id="budget-section" 
            className="lg:col-span-2 h-[300px] lg:h-full"
            action={<button onClick={() => setModalType('budget')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
          >
            {budgetData && budgetData.monthly_trend ? (
              <div className="flex flex-col w-full h-full min-w-0 relative">
                <div className="absolute inset-0">
                  <Chart
                    options={{
                      chart: { type: 'line', stacked: false, toolbar: { show: false }, fontFamily: 'inherit' },
                      colors: ['#3C50E0', '#10B981', '#F59E0B', '#64748B', '#EF4444'],
                      stroke: { width: [0, 0, 0, 0, 2], curve: 'smooth' },
                      plotOptions: { bar: { columnWidth: '50%' } },
                      xaxis: {
                        categories: budgetData.monthly_trend?.map(item => item.month) || [],
                        labels: { style: { fontSize: '10px' } }
                      },
                      yaxis: {
                        labels: { formatter: (val) => "Rp " + val.toLocaleString('id-ID'), style: { fontSize: '10px' } }
                      },
                      legend: { position: 'top', fontSize: '10px', itemMargin: { horizontal: 5, vertical: 0 } },
                      dataLabels: { enabled: false },
                      tooltip: { shared: true, intersect: false }
                    }}
                    series={[
                      { name: 'Asset', type: 'column', data: budgetData.monthly_trend.map(item => item.Asset) },
                      { name: 'Sub', type: 'column', data: budgetData.monthly_trend.map(item => item.Subscription) },
                      { name: 'Maint', type: 'column', data: budgetData.monthly_trend.map(item => item.Maintenance) },
                      { name: 'Ops', type: 'column', data: budgetData.monthly_trend.map(item => item.Operational) },
                      { name: 'Total', type: 'line', data: budgetData.monthly_trend.map(item => item.Total) }
                    ]}
                    type="line"
                    height="100%"
                    width="100%"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading budget data...</div>
            )}
          </ChartContainer>

          <ChartContainer 
            title="Rincian Total Asset Fisik" 
            delay="delay-200" 
            id="asset-section" 
            className="lg:col-span-1 h-[300px] lg:h-full"
            action={<button onClick={() => setModalType('asset')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
          >
            <Chart
              options={{
                chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                plotOptions: {
                  bar: { horizontal: true, borderRadius: 2, barHeight: '70%' }
                },
                colors: ['#3C50E0'],
                dataLabels: { enabled: false },
                xaxis: {
                  categories: itemData.slice(0, 10).map(d => d.name),
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: {
                  labels: { style: { fontSize: '9px' }, maxWidth: 100 }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
                tooltip: { theme: 'light' }
              }}
              series={[{ name: 'Jumlah', data: itemData.slice(0, 10).map(d => d.count) }]}
              type="bar"
              height="100%"
              width="100%"
            />
          </ChartContainer>

          {/* Software & Ticketing (Stacked in 1 Column) */}
          <div className="lg:col-span-1 flex flex-col gap-1 h-[600px] lg:h-full min-h-0">
            {/* Software Develop */}
            <ChartContainer 
              title="Software Develop" 
              delay="delay-200" 
              className="flex-1 !min-h-0"
              action={<button onClick={() => setModalType('software')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
            >
              {softwareData && softwareData.summary ? (
                <div className="flex flex-col h-full items-center relative -mt-2">
                  <div className="w-full h-[100%] relative">
                    <Chart
                      options={{
                        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
                        labels: ['Launched', 'In Development'],
                        colors: ['#10B981', '#3C50E0'],
                        dataLabels: { enabled: false },
                        plotOptions: { 
                          pie: { 
                            donut: { 
                              size: '70%', 
                              offsetY: 0,
                              labels: {
                                show: true,
                                name: {
                                  show: true,
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  offsetY: 20
                                },
                                value: {
                                  show: true,
                                  fontSize: '26px',
                                  fontWeight: 'bold',
                                  color: '#1c2434',
                                  offsetY: -16
                                },
                                total: {
                                  show: true,
                                  showAlways: true,
                                  label: 'APPS',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                                  }
                                }
                              }
                            } 
                          } 
                        },
                        legend: { position: 'right', fontSize: '10px', offsetY: 0 },
                        tooltip: { 
                          theme: 'light',
                          y: {
                            formatter: function (val, opts) {
                              try {
                                const total = opts.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return val + " (" + percent + "%)";
                              } catch(e) { return val; }
                            }
                          }
                        }
                      }}
                      series={[softwareData.summary?.launched || 0, softwareData.summary?.development || 0]}
                      type="donut"
                      height="100%"
                      width="100%"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
              )}
            </ChartContainer>

            {/* IT Ticketing */}
            <ChartContainer 
              title="IT Ticketing" 
              delay="delay-300" 
              className="flex-1 !min-h-0"
              action={<button onClick={() => setModalType('ticketing')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
            >
              {ticketsData && ticketsData.categories ? (
                <div className="flex flex-col h-full items-center relative -mt-2">
                  <div className="w-[100%] h-[100%] relative">
                    <Chart
                      options={{
                        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
                        labels: ticketsData.categories.map(c => c.category),
                        legend: { show: true, position: 'right', fontSize: '9px', offsetY: 0, itemMargin: { horizontal: 0, vertical: 2 } },
                        dataLabels: { enabled: false },
                        colors: ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#8B5CF6'],
                        plotOptions: { 
                          pie: { 
                            donut: { 
                              size: '70%', 
                              offsetY: 0,
                              labels: {
                                show: true,
                                name: {
                                  show: true,
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  offsetY: 15
                                },
                                value: {
                                  show: true,
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  color: '#1c2434',
                                  offsetY: -10
                                },
                                total: {
                                  show: true,
                                  showAlways: true,
                                  label: 'RESOLVED',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  formatter: function (w) {
                                    return ticketsData.total_resolved;
                                  }
                                }
                              }
                            } 
                          } 
                        },
                        tooltip: { 
                          theme: 'light',
                          y: {
                            formatter: function (val, opts) {
                              try {
                                const total = opts.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return val + " (" + percent + "%)";
                              } catch(e) { return val; }
                            }
                          }
                        },
                        stroke: { width: 1 }
                      }}
                      series={ticketsData.categories.map(c => parseInt(c.total))}
                      type="donut"
                      height="100%"
                      width="100%"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
              )}
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* Asset Modal */}
      <Modal isOpen={modalType === 'asset'} onClose={() => setModalType(null)} title="Rincian Total Asset Fisik" maxWidth="max-w-6xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1 gap-x-2">
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Tipe Aset</h5>
              <div className="flex-1 w-full min-h-0">
                <Chart options={pieOptions} series={pieSeries} type="donut" height="100%" />
              </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Item Aset</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getBarOptions(itemData.map(d => d.name), '#3C50E0')}
                  series={[{ name: 'Jumlah', data: itemData.map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Lokasi / Dept</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getBarOptions(locData.map(d => d.name), '#10B981')}
                  series={[{ name: 'Jumlah', data: locData.map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-boxdark">General Assets</h4>
              {isPIC && (
                <div className="flex gap-1">
                  <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                    Import
                  </button>
                  <button onClick={() => handleAddAsset('general')} disabled={newAssetType === 'general'} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                    <Plus size={14} /> Add Asset
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  {generalTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, i) => (
                        <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i === 0 ? 'rounded-tl-md' : ''}`} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ðŸ”¼',
                            desc: ' ðŸ”½',
                          }[header.column.getIsSorted()] ?? null}
                        </th>
                      ))}
                      {isPIC && <th className="px-4 py-2 font-medium rounded-tr-md text-right w-24">Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-stroke">
                  {newAssetType === 'general' && (
                    <AssetRow
                      asset={{ isNew: true, type: 'general', asset_name: '', condition: 'Baik' }}
                      isPIC={isPIC}
                      onUpdate={handleSaveAsset}
                      onCancelAdd={handleCancelAdd}
                      departmentsData={departmentsData}
                    />
                  )}
                  {generalTable.getRowModel().rows.length > 0 ? generalTable.getRowModel().rows.map(row => (
                    <AssetRow key={row.original.id} asset={row.original} isPIC={isPIC} onUpdate={handleSaveAsset} onDelete={handleDeleteAsset} departmentsData={departmentsData} />
                  )) : (newAssetType !== 'general' && <tr><td colSpan={5} className="text-center py-4 text-gray-400">No data found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-boxdark">Individual Assets</h4>
              {isPIC && (
                <div className="flex gap-1">
                  <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                    Import
                  </button>
                  <button onClick={() => handleAddAsset('individual')} disabled={newAssetType === 'individual'} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                    <Plus size={14} /> Add Asset
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500">
                  {individualTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, i) => (
                        <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i === 0 ? 'rounded-tl-md' : ''}`} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ðŸ”¼',
                            desc: ' ðŸ”½',
                          }[header.column.getIsSorted()] ?? null}
                        </th>
                      ))}
                      {isPIC && <th className="px-4 py-2 font-medium rounded-tr-md text-right w-24">Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-stroke">
                  {newAssetType === 'individual' && (
                    <AssetRow
                      asset={{ isNew: true, type: 'individual', asset_name: '', condition: 'Baik' }}
                      isPIC={isPIC}
                      onUpdate={handleSaveAsset}
                      onCancelAdd={handleCancelAdd}
                      departmentsData={departmentsData}
                    />
                  )}
                  {individualTable.getRowModel().rows.length > 0 ? individualTable.getRowModel().rows.map(row => (
                    <AssetRow key={row.original.id} asset={row.original} isPIC={isPIC} onUpdate={handleSaveAsset} onDelete={handleDeleteAsset} departmentsData={departmentsData} />
                  )) : (newAssetType !== 'individual' && <tr><td colSpan={8} className="text-center py-4 text-gray-400">No data found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={modalType === 'email'} onClose={() => setModalType(null)} title="Rincian Active Email" maxWidth="max-w-6xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-2">
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Domain Email</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getBarOptions(domainData.map(d => d.name), '#3C50E0')}
                  series={[{ name: 'Jumlah', data: domainData.map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Divisi / Dept</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getBarOptions(divData.map(d => d.name), '#10B981')}
                  series={[{ name: 'Jumlah', data: divData.map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-boxdark">Daftar Email Aktif</h4>
              {isPIC && (
                <div className="flex gap-1">
                  <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                    Import
                  </button>
                  <button onClick={() => setIsAddingEmail(true)} disabled={isAddingEmail} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                    <Plus size={14} /> Add Email
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  {emailTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, i) => (
                        <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i === 0 ? 'rounded-tl-md' : ''}`} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ðŸ”¼',
                            desc: ' ðŸ”½',
                          }[header.column.getIsSorted()] ?? null}
                        </th>
                      ))}
                      {isPIC && <th className="px-4 py-2 font-medium rounded-tr-md text-right w-24">Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-stroke">
                  {isAddingEmail && (
                    <EmailRow
                      email={{ isNew: true, domain: '', user_name: '', email_address: '' }}
                      isPIC={isPIC}
                      onUpdate={handleSaveEmail}
                      onCancelAdd={() => setIsAddingEmail(false)}
                      departmentsData={departmentsData}
                    />
                  )}
                  {emailTable.getRowModel().rows.length > 0 ? emailTable.getRowModel().rows.map(row => (
                    <EmailRow key={row.original.id} email={row.original} isPIC={isPIC} onUpdate={handleSaveEmail} onDelete={handleDeleteEmail} departmentsData={departmentsData} />
                  )) : (!isAddingEmail && <tr><td colSpan={5} className="text-center py-4 text-gray-400">No data found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={modalType === 'budget'} onClose={() => setModalType(null)} title="Rincian Penggunaan Budget" maxWidth="max-w-4xl">
        {budgetData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded border border-stroke p-4 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Alokasi (Tahun Ini)</p>
                <h3 className="text-2xl font-bold text-boxdark">Rp {budgetData.total_budget.toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-white rounded border border-stroke p-4 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Terpakai</p>
                <h3 className="text-2xl font-bold text-danger">Rp {budgetData.total_used.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            <div className="bg-white rounded border border-stroke p-4">
              <h4 className="font-bold text-boxdark mb-3">Breakdown per Kategori</h4>
              <div className="space-y-3">
                {budgetData.breakdown && budgetData.breakdown.map((cat, idx) => {
                  const pct = cat.allocated > 0 ? (cat.used / cat.allocated) * 100 : 0;
                  const barColor = pct > 100 ? 'bg-danger' : (pct > 80 ? 'bg-warning' : 'bg-primary');
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-boxdark">{cat.category}</span>
                        <span className="text-gray-500">Rp {cat.used.toLocaleString('id-ID')} / Rp {cat.allocated.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded border border-stroke p-4">
              <h4 className="font-bold text-boxdark mb-3">Histori Pengeluaran (Terbaru)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-stroke">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Keterangan</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {budgetData.raw_expenses && budgetData.raw_expenses.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{exp.expense_date}</td>
                        <td className="px-3 py-2 whitespace-normal break-words max-w-[200px]">{exp.description}</td>
                        <td className="px-3 py-2 text-primary">{exp.budget?.category}</td>
                        <td className="px-3 py-2 text-right font-medium text-boxdark">Rp {parseFloat(exp.amount).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    {(!budgetData.raw_expenses || budgetData.raw_expenses.length === 0) && (
                      <tr><td colSpan={4} className="text-center py-4 text-gray-400">Belum ada pengeluaran</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading data...</div>
        )}
      </Modal>

      {/* Software Modal */}
      <Modal isOpen={modalType === 'software'} onClose={() => setModalType(null)} title="Rincian Software Develop" maxWidth="max-w-4xl">
        {softwareData && softwareData.summary ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Development Progress List */}
              <div className="bg-white rounded border border-stroke p-4 flex flex-col gap-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">In Development</h5>
                {softwareData.development_list?.map((sw, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-stroke flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-boxdark">{sw.name}</span>
                      <span className="text-primary font-medium">{sw.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${sw.progress}%` }}></div>
                    </div>
                  </div>
                ))}
                {(!softwareData.development_list || softwareData.development_list.length === 0) && <p className="text-xs text-gray-400">No active development</p>}
              </div>

              {/* Launched Software List */}
              <div className="bg-white rounded border border-stroke p-4 flex flex-col gap-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Launched Software</h5>
                {softwareData.launched_list?.map((sw, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-stroke flex justify-between items-center">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-boxdark truncate">{sw.name}</span>
                      <span className="text-xs text-gray-500 truncate">{sw.description}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">
                        {new Intl.NumberFormat('id-ID').format(sw.active_users || 0)}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">Active Users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading data...</div>
        )}
      </Modal>

      {/* Ticketing Modal */}
      <Modal isOpen={modalType === 'ticketing'} onClose={() => setModalType(null)} title="Rincian IT Ticketing" maxWidth="max-w-4xl">
        {ticketsData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Volume (Tickets per Day) */}
              <div className="bg-white rounded border border-stroke p-4 h-72 flex flex-col">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tickets per Day (Sen-Min)</h5>
                <div className="flex-1 w-full min-h-0">
                  <Chart
                    options={{
                      chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                      colors: ['#3C50E0'],
                      plotOptions: { bar: { horizontal: true, borderRadius: 2, barHeight: '70%' } },
                      xaxis: {
                        categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                        labels: { style: { fontSize: '10px' } },
                      },
                      yaxis: { labels: { style: { fontSize: '10px' } } },
                      dataLabels: { enabled: false },
                      tooltip: { theme: 'light' }
                    }}
                    series={[{ name: 'Tickets', data: ticketsData.daily_ticket_volume || [] }]}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>

              {/* Avg Resolution Time */}
              <div className="bg-white rounded border border-stroke p-4 h-72 flex flex-col">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avg Resolution (Daily Hours)</h5>
                <div className="flex-1 w-full min-h-0">
                  <Chart
                    options={{
                      chart: { type: 'line', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2 },
                      colors: ['#10B981'],
                      xaxis: {
                        categories: ticketsData.daily_resolution_labels || Array.from({ length: ticketsData.daily_resolution_time?.length || 31 }, (_, i) => i + 1),
                        labels: { style: { fontSize: '9px' } },
                        tickAmount: 15
                      },
                      yaxis: {
                        labels: { style: { fontSize: '10px' }, formatter: (value) => value + 'h' },
                        min: 0
                      },
                      dataLabels: { enabled: false },
                      tooltip: { theme: 'light', y: { formatter: (val) => val + " hours" } }
                    }}
                    series={[{ name: 'Resolution Time', data: ticketsData.daily_resolution_time || [] }]}
                    type="line"
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading data...</div>
        )}
      </Modal>
    </>
  );
}
