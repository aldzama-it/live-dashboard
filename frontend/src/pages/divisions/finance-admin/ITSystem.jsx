import React, { useState, useEffect } from 'react';
import { Monitor, Mail, Terminal, DollarSign, Star, Network, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import Modal from '../../../components/ui/Modal';
import MonthFilter from '../../../components/ui/MonthFilter';
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
        <td className="px-2 py-2"><input autoFocus placeholder="Nama Asset" type="text" className="w-full border rounded px-2 py-1 text-xs" value={formData.asset_name || ''} onChange={e=>setFormData({...formData, asset_name: e.target.value})} /></td>
        {asset.type === 'general' ? (
          <>
            <td className="px-2 py-2"><input placeholder="Brand/Spek" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.brand_description || ''} onChange={e=>setFormData({...formData, brand_description: e.target.value})} /></td>
            <td className="px-2 py-2 min-w-[150px]">
              <Select 
                styles={selectStyles}
                options={LOCATIONS.map(l => ({label: l, value: l}))}
                value={formData.location ? {label: formData.location, value: formData.location} : null}
                onChange={v => setFormData({...formData, location: v?.value || ''})}
                placeholder="Pilih Lokasi..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
          </>
        ) : (
          <>
            <td className="px-2 py-2"><input placeholder="Penerima" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.receiver_name || ''} onChange={e=>setFormData({...formData, receiver_name: e.target.value})} /></td>
            <td className="px-2 py-2 min-w-[150px]">
              <Select
                styles={selectStyles}
                options={[...new Set(departmentsData?.filter(d=>d.division).map(d => d.division.name))].map(name => ({label: name, value: name}))}
                value={formData.department ? {label: formData.department, value: formData.department} : null}
                onChange={v => setFormData({...formData, department: v?.value || ''})}
                placeholder="Pilih Dept..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
            <td className="px-2 py-2 min-w-[150px]">
              <CreatableSelect
                styles={selectStyles}
                options={departmentsData?.map(d => ({label: d.name, value: d.name}))}
                value={formData.division_project ? {label: formData.division_project, value: formData.division_project} : null}
                onChange={v => setFormData({...formData, division_project: v?.value || ''})}
                placeholder="Div/Proj..."
                isClearable
                menuPortalTarget={document.body}
              />
            </td>
            <td className="px-2 py-2"><input type="date" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.handover_date || ''} onChange={e=>setFormData({...formData, handover_date: e.target.value})} /></td>
            <td className="px-2 py-2"><input placeholder="Brand/Spek" type="text" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.specification || ''} onChange={e=>setFormData({...formData, specification: e.target.value})} /></td>
          </>
        )}
        <td className="px-2 py-2 min-w-[120px]">
          <Select
            styles={selectStyles}
            options={[{label: 'Baik', value: 'Baik'}, {label: 'Rusak', value: 'Rusak'}]}
            value={formData.condition ? {label: formData.condition, value: formData.condition} : {label: 'Baik', value: 'Baik'}}
            onChange={v => setFormData({...formData, condition: v?.value || 'Baik'})}
            isClearable={false}
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => { 
                if(!formData.asset_name) return alert('Nama Asset harus diisi');
                onUpdate(formData); 
                if(!asset.isNew) setIsEditing(false); 
              }} 
              className="text-success p-1 hover:bg-success/10 rounded" title="Save">
              <Check size={14}/>
            </button>
            <button onClick={() => {
                if(asset.isNew) {
                  onCancelAdd();
                } else {
                  setIsEditing(false);
                  setFormData(asset); // reset
                }
              }} 
              className="text-danger p-1 hover:bg-danger/10 rounded" title="Cancel">
              <X size={14}/>
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
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14}/></button>
            <button onClick={() => onDelete(asset.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14}/></button>
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
            options={[{label: '@aldzama.com', value: '@aldzama.com'}, {label: '@project.aldzama.com', value: '@project.aldzama.com'}]}
            value={formData.domain ? {label: formData.domain, value: formData.domain} : null}
            onChange={v => setFormData({...formData, domain: v?.value || ''})}
            placeholder="Domain..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <input placeholder="Nama Pengguna" type="text" className="w-full border rounded px-2 py-1 text-xs h-7 mb-1" value={formData.user_name || ''} onChange={e=>setFormData({...formData, user_name: e.target.value})} />
          <div className="flex items-center text-xs border rounded bg-white overflow-hidden h-7">
            <input placeholder="Prefix Email (misal: wanda)" type="text" className="w-full px-2 py-1 outline-none" value={formData.email_prefix || ''} onChange={e=>setFormData({...formData, email_prefix: e.target.value})} />
          </div>
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <Select
            styles={selectStyles}
            options={[...new Set(departmentsData?.filter(d=>d.division).map(d => d.division.name))].map(name => ({label: name, value: name}))}
            value={formData.department ? {label: formData.department, value: formData.department} : null}
            onChange={v => setFormData({...formData, department: v?.value || ''})}
            placeholder="Pilih Dept..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <CreatableSelect
            styles={selectStyles}
            options={departmentsData?.map(d => ({label: d.name, value: d.name}))}
            value={formData.division_project ? {label: formData.division_project, value: formData.division_project} : null}
            onChange={v => setFormData({...formData, division_project: v?.value || ''})}
            placeholder="Div/Proj..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => { 
                if(!formData.email_prefix || !formData.domain || !formData.user_name) return alert('Data wajib diisi (Prefix Email, Domain, Username)');
                const fullEmail = formData.email_prefix + (formData.domain.startsWith('@') ? formData.domain : '@' + formData.domain);
                onUpdate({ ...formData, email_address: fullEmail }); 
                if(!email.isNew) setIsEditing(false); 
              }} 
              className="text-success p-1 hover:bg-success/10 rounded" title="Save">
              <Check size={14}/>
            </button>
            <button onClick={() => {
                if(email.isNew) {
                  onCancelAdd();
                } else {
                  setIsEditing(false);
                  setFormData(email);
                }
              }} 
              className="text-danger p-1 hover:bg-danger/10 rounded" title="Cancel">
              <X size={14}/>
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
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14}/></button>
            <button onClick={() => onDelete(email.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14}/></button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default function ITSystem({ user }) {
  const [modalType, setModalType] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(['Agustus 2026']);
  const isPIC = user?.roles?.[0]?.name === 'Division PIC';
  
  const [assetsData, setAssetsData] = useState({ general: [], individual: [], total: 0 });
  const [departmentsData, setDepartmentsData] = useState([]);
  const [newAssetType, setNewAssetType] = useState(null); // 'general' or 'individual'
  const [emailsData, setEmailsData] = useState([]);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  
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
    } catch(err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/divisions');
      setDepartmentsData(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchEmails();
    fetchDepartments();
  }, []);

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
    if(!window.confirm('Delete asset?')) return;
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
    if(!window.confirm('Delete email?')) return;
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

    const itemData = Object.keys(itemCounts).map(k => ({ name: k, count: itemCounts[k] })).sort((a,b)=>b.count-a.count);
    const locData = Object.keys(locCounts).map(k => ({ name: k, count: locCounts[k] })).sort((a,b)=>b.count-a.count);

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

    const domainData = Object.keys(domainCounts).map(k => ({ name: k, count: domainCounts[k] })).sort((a,b)=>b.count-a.count);
    const divData = Object.keys(divCounts).map(k => ({ name: k, count: divCounts[k] })).sort((a,b)=>b.count-a.count);

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
      <div className="flex justify-end mb-6">
        <MonthFilter selectedMonths={selectedMonths} onChange={setSelectedMonths} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <KpiCard title="Total Budget Used" value="$100k" subtitle="From $125k Allocated" icon={DollarSign} colorClass="text-danger bg-danger/10" onClick={() => scrollToElement('budget-section')} />
        <KpiCard title="Rating IT Support" value="4.8/5" subtitle="Average Satisfaction" icon={Star} colorClass="text-[#F59E0B] bg-warning/10" onClick={() => scrollToElement('it-support-section')} />
      </div>

      {/* Row 2: Highlights */}
      <Card delay="delay-150" className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="text-warning w-5 h-5" />
          <h4 className="text-md font-bold text-boxdark uppercase">Key Highlights & Milestones</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="border-l-4 border-success pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Highlight</p>
            <p className="text-sm font-medium text-boxdark">Migrated 90% of local servers to cloud.</p>
          </div>
          <div className="border-l-4 border-danger pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Risk</p>
            <p className="text-sm font-medium text-boxdark">Hardware replacement delays (Supply Chain).</p>
          </div>
          <div className="border-l-4 border-primary pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Achievement</p>
            <p className="text-sm font-medium text-boxdark">IT Support rating hit 4.8 this month.</p>
          </div>
          <div className="border-l-4 border-warning pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Plan</p>
            <p className="text-sm font-medium text-boxdark">ERP Alpha testing next week.</p>
          </div>
        </div>
      </Card>

      {/* Row 3: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Network & Infrastructure" delay="delay-200">
          <div className="flex flex-col justify-center items-center h-48 bg-gray-50 rounded-md border border-dashed border-stroke">
            <Network className="text-gray-400 mb-2 w-8 h-8" />
            <p className="text-sm font-medium text-boxdark">Active Users: 320</p>
            <p className="text-xs text-body">Available Access Points: 45</p>
            <p className="text-xs text-body mt-2 text-center text-gray-400 max-w-[200px]">(Placeholder for Network Chart)</p>
          </div>
        </ChartContainer>

        <ChartContainer title="Software Develop" delay="delay-200" id="software-develop">
          <div className="flex flex-col justify-between h-48">
            <div className="flex-1 flex flex-col justify-center items-center text-body">
               <Terminal size={32} className="text-gray-300 mb-2" />
               <p className="text-sm font-medium text-boxdark">3 Projects In Progress</p>
               <p className="text-xs text-body">5 Live Systems Active</p>
               <p className="text-xs mt-1 text-gray-400 italic">(Primary Software Chart)</p>
            </div>
            <div className="mt-2 py-2 border-t border-dashed border-stroke flex items-center justify-center cursor-pointer hover:bg-gray-50 transition rounded-b-md" onClick={() => setModalType('software')}>
               <span className="text-xs text-primary flex items-center gap-1 font-medium">Click for view more <ChevronRight size={14}/></span>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Row 4: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Budget" delay="delay-300" id="budget-section">
           <div className="flex flex-col justify-between h-48">
             <div className="flex-1 flex flex-col justify-center items-center text-body">
                <DollarSign size={32} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-boxdark">$100k Used</p>
                <div className="w-1/2 h-2 bg-gray-200 rounded-full mt-2"><div className="h-full bg-danger w-[80%] rounded-full"></div></div>
                <p className="text-xs mt-2 text-gray-400 italic">(Primary Budget Chart)</p>
             </div>
             <div className="mt-2 py-2 border-t border-dashed border-stroke flex items-center justify-center cursor-pointer hover:bg-gray-50 transition rounded-b-md" onClick={() => setModalType('budget')}>
                <span className="text-xs text-primary flex items-center gap-1 font-medium">Click for view more <ChevronRight size={14}/></span>
              </div>
           </div>
        </ChartContainer>

        <Card title="IT Service Support" delay="delay-300" id="it-support-section">
           <div className="space-y-4">
              <div>
                <h5 className="text-xs font-semibold uppercase text-gray-500 mb-2">Most Frequent Keywords (NLP Extraction)</h5>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Jaringan lambat (45%)</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">Lupa password (30%)</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Printer error (25%)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-gray-50 rounded border border-stroke">
                    <p className="text-xs text-gray-500 mb-1">Avg Resolution Time</p>
                    <p className="text-lg font-bold text-boxdark">1h 45m</p>
                 </div>
                 <div className="p-3 bg-gray-50 rounded border border-stroke">
                    <p className="text-xs text-gray-500 mb-1">Total Resolved (Month)</p>
                    <p className="text-lg font-bold text-boxdark">150 Tickets</p>
                 </div>
              </div>
              <div>
                <h5 className="text-xs font-semibold uppercase text-gray-500 mb-2">Workload by Assignee</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-body">Budi Santoso</span>
                    <span className="font-medium text-boxdark">60 (40%)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-body">Andi Pratama</span>
                    <span className="font-medium text-boxdark">45 (30%)</span>
                  </div>
                </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Asset Modal */}
      <Modal isOpen={modalType === 'asset'} onClose={() => setModalType(null)} title="Rincian Total Asset Fisik" maxWidth="max-w-6xl">
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                   options={getBarOptions(itemData.map(d=>d.name), '#3C50E0')} 
                   series={[{ name: 'Jumlah', data: itemData.map(d=>d.count) }]} 
                   type="bar" 
                   height="100%" 
                 />
               </div>
             </div>

             <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
               <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Lokasi / Dept</h5>
               <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                 <Chart 
                   options={getBarOptions(locData.map(d=>d.name), '#10B981')} 
                   series={[{ name: 'Jumlah', data: locData.map(d=>d.count) }]} 
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
                 <div className="flex gap-2">
                   <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                     Import
                   </button>
                   <button onClick={() => handleAddAsset('general')} disabled={newAssetType === 'general'} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                     <Plus size={14}/> Add Asset
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
                         <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i===0?'rounded-tl-md':''}`} onClick={header.column.getToggleSortingHandler()}>
                           {flexRender(header.column.columnDef.header, header.getContext())}
                           {{
                             asc: ' 🔼',
                             desc: ' 🔽',
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
                 <div className="flex gap-2">
                   <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                     Import
                   </button>
                   <button onClick={() => handleAddAsset('individual')} disabled={newAssetType === 'individual'} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                     <Plus size={14}/> Add Asset
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
                         <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i===0?'rounded-tl-md':''}`} onClick={header.column.getToggleSortingHandler()}>
                           {flexRender(header.column.columnDef.header, header.getContext())}
                           {{
                             asc: ' 🔼',
                             desc: ' 🔽',
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
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
               <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Domain Email</h5>
               <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                 <Chart 
                   options={getBarOptions(domainData.map(d=>d.name), '#3C50E0')} 
                   series={[{ name: 'Jumlah', data: domainData.map(d=>d.count) }]} 
                   type="bar" 
                   height="100%" 
                 />
               </div>
             </div>
             <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
               <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Divisi / Dept</h5>
               <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                 <Chart 
                   options={getBarOptions(divData.map(d=>d.name), '#10B981')} 
                   series={[{ name: 'Jumlah', data: divData.map(d=>d.count) }]} 
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
                 <div className="flex gap-2">
                   <button onClick={() => alert('Fitur Import Excel akan segera hadir!')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                     Import
                   </button>
                   <button onClick={() => setIsAddingEmail(true)} disabled={isAddingEmail} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                     <Plus size={14}/> Add Email
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
                         <th key={header.id} className={`px-4 py-2 font-medium cursor-pointer select-none ${i===0?'rounded-tl-md':''}`} onClick={header.column.getToggleSortingHandler()}>
                           {flexRender(header.column.columnDef.header, header.getContext())}
                           {{
                             asc: ' 🔼',
                             desc: ' 🔽',
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

      {/* Software Modal */}
      <Modal isOpen={modalType === 'software'} onClose={() => setModalType(null)} title="Software Develop Details" maxWidth="max-w-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium rounded-tl-md">Software Name</th>
                <th className="px-4 py-2 font-medium">Status (Progress / Exist)</th>
                <th className="px-4 py-2 font-medium">Progress %</th>
                <th className="px-4 py-2 font-medium rounded-tr-md">Active Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              <tr>
                <td className="px-4 py-3 font-medium text-boxdark">New ERP System</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Development</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4"></div>
                    </div>
                    <span className="text-xs">75%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-body">0 (Testing)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-boxdark">Internal HRIS</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">Live (Exist)</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-success w-full"></div>
                    </div>
                    <span className="text-xs">100%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-body">245 Users</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={modalType === 'budget'} onClose={() => setModalType(null)} title="Rincian Visualisasi Budget">
         <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stroke rounded-xl bg-gray-50">
           <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
           <p className="text-boxdark font-medium mb-1">Detailed Budget Visualization</p>
           <p className="text-sm text-body text-center max-w-sm">This area will contain detailed charts (e.g., Pie chart or Bar chart) showing budget allocated vs used per IT category once the charting library is fully integrated.</p>
           <div className="w-full mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Software Licenses</span>
                <span className="font-medium">$45k / $50k</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full"><div className="h-full bg-primary w-[90%] rounded-full"></div></div>
              
              <div className="flex justify-between text-sm mt-4">
                <span>Hardware Upgrades</span>
                <span className="font-medium">$32k / $40k</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full"><div className="h-full bg-warning w-[80%] rounded-full"></div></div>
           </div>
         </div>
      </Modal>
    </>
  );
}
