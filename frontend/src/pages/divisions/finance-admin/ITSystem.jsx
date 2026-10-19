import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Monitor, Mail, Terminal, DollarSign, Star, Network, ChevronRight, ChevronDown, ChevronLeft, Plus, Pencil, Trash2, Check, X, RefreshCw, ExternalLink, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import Modal from '../../../components/ui/Modal';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';
import api from '../../../axios';
import Chart from 'react-apexcharts';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';

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

const AssetRow = ({ asset, canEdit, onUpdate, onDelete, onCancelAdd, departmentsData }) => {
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
      {canEdit && (
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

const EmailRow = ({ email, canEdit, onUpdate, onDelete, onCancelAdd, departmentsData }) => {
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
      {canEdit && (
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

const BudgetRow = ({ expense, canEdit, onUpdate, onDelete, onCancelAdd, budgetCategories }) => {
  const [isEditing, setIsEditing] = React.useState(expense.isNew || false);
  const [formData, setFormData] = React.useState({ ...expense });

  if (isEditing) {
    return (
      <tr>
        <td className="px-2 py-2 min-w-[130px]">
          <input type="date" className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.expense_date || ''} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} />
        </td>
        <td className="px-2 py-2 min-w-[200px]">
          <input type="text" placeholder="Keterangan..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <CreatableSelect
            styles={selectStyles}
            options={budgetCategories?.map(c => ({ label: c, value: c }))}
            value={formData.group_category ? { label: formData.group_category, value: formData.group_category } : null}
            onChange={v => setFormData({ ...formData, group_category: v?.value || '' })}
            placeholder="Kategori..."
            isClearable
            menuPortalTarget={document.body}
          />
        </td>
        <td className="px-2 py-2 min-w-[130px]">
          <input type="number" placeholder="Nominal..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => {
              if (!formData.expense_date || !formData.description || !formData.amount || !formData.group_category) return alert('Data wajib diisi semua');
              onUpdate({ ...formData });
              if (!expense.isNew) setIsEditing(false);
            }}
              className="text-success p-1 hover:bg-success/10 rounded" title="Save">
              <Check size={14} />
            </button>
            <button onClick={() => {
              if (expense.isNew) onCancelAdd();
              else { setIsEditing(false); setFormData(expense); }
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
      <td className="px-3 py-2 whitespace-nowrap">{expense.expense_date}</td>
      <td className="px-3 py-2 whitespace-normal break-words max-w-[260px]">
        <div className="flex flex-col">
          <span className="font-medium text-boxdark">{expense.description}</span>
          {expense.trans_number && expense.trans_number !== '-' && (
            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
              {expense.trans_number} {expense.transaction_type ? `• ${expense.transaction_type}` : ''}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-primary">{expense.budget?.category || expense.group_category}</td>
      <td className="px-3 py-2 text-right font-medium text-boxdark whitespace-nowrap">Rp {parseFloat(expense.amount).toLocaleString('id-ID')}</td>
      {canEdit && (
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
          </div>
        </td>
      )}
    </tr>
  );
};

const SoftwareRow = ({ software, canEdit, onUpdate, onDelete, onCancelAdd }) => {
  const [isEditing, setIsEditing] = React.useState(software.isNew || false);
  const [formData, setFormData] = React.useState({ ...software });

  if (isEditing) {
    return (
      <div className="p-3 bg-white rounded border border-primary/30 flex flex-col gap-2">
        <div className="flex gap-2">
          <input type="text" placeholder="Nama Software..." className="flex-1 border rounded px-2 py-1 text-xs h-7" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <select className="border rounded px-2 py-1 text-xs h-7" value={formData.status || 'development'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="development">Development</option>
            <option value="launched">Launched</option>
          </select>
        </div>
        <div className="flex gap-2">
          {formData.status === 'development' && (
            <input type="number" placeholder="Progress (0-100)..." className="w-32 border rounded px-2 py-1 text-xs h-7" value={formData.progress || ''} onChange={e => setFormData({ ...formData, progress: e.target.value })} />
          )}
          <input type="text" placeholder="Deskripsi..." className="flex-1 border rounded px-2 py-1 text-xs h-7" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-1 mt-1">
          <button onClick={() => {
            if (!formData.name) return alert('Nama wajib diisi');
            onUpdate({ ...formData });
            if (!software.isNew) setIsEditing(false);
          }} className="text-white bg-success px-2 py-1 rounded text-xs flex items-center gap-1"><Check size={12}/> Save</button>
          <button onClick={() => {
            if (software.isNew) onCancelAdd();
            else { setIsEditing(false); setFormData(software); }
          }} className="text-white bg-danger px-2 py-1 rounded text-xs flex items-center gap-1"><X size={12}/> Cancel</button>
        </div>
      </div>
    );
  }

  if (software.status === 'development') {
    return (
      <div className="p-3 bg-gray-50 rounded border border-stroke flex flex-col gap-2 group relative">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-boxdark">{software.name}</span>
          <span className="text-primary font-medium">{software.progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${software.progress}%` }}></div>
        </div>
        {software.description && <p className="text-[10px] text-gray-500 mt-1">{software.description}</p>}
        {canEdit && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white p-1 rounded shadow">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(software.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded border border-stroke flex justify-between items-center group relative">
      <div className="flex flex-col min-w-0 pr-10">
        <span className="text-sm font-semibold text-boxdark truncate">{software.name}</span>
        <span className="text-xs text-gray-500 truncate">{software.description}</span>
      </div>
      <div className="flex flex-col items-end shrink-0 pl-2">
        <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
          Launched
        </span>
      </div>
      {canEdit && (
        <div className="absolute top-1/2 -translate-y-1/2 right-14 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white p-1 rounded shadow">
          <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
          <button onClick={() => onDelete(software.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
};

const TicketRow = ({ ticket, canEdit, onUpdate, onDelete, onCancelAdd }) => {
  const [isEditing, setIsEditing] = React.useState(ticket.isNew || false);
  const [formData, setFormData] = React.useState({ ...ticket });

  if (isEditing) {
    return (
      <tr>
        <td className="px-2 py-2 min-w-[120px]">
          <input type="text" placeholder="No. Ticket..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.ticket_number || ''} onChange={e => setFormData({ ...formData, ticket_number: e.target.value })} />
        </td>
        <td className="px-2 py-2 min-w-[200px]">
          <input type="text" placeholder="Subject..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.subject || ''} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
        </td>
        <td className="px-2 py-2 min-w-[120px]">
          <input type="text" placeholder="Department..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} />
        </td>
        <td className="px-2 py-2 min-w-[120px]">
          <select className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.status || 'NEW'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING_USER">WAITING_USER</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </td>
        <td className="px-2 py-2 min-w-[130px]">
          <input type="text" placeholder="Assigned To..." className="w-full border rounded px-2 py-1 text-xs h-7" value={formData.assigned_to || ''} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} />
        </td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => {
              if (!formData.ticket_number || !formData.subject) return alert('No Ticket dan Subject wajib diisi');
              onUpdate({ ...formData });
              if (!ticket.isNew) setIsEditing(false);
            }} className="text-success p-1 hover:bg-success/10 rounded"><Check size={14} /></button>
            <button onClick={() => {
              if (ticket.isNew) onCancelAdd();
              else { setIsEditing(false); setFormData(ticket); }
            }} className="text-danger p-1 hover:bg-danger/10 rounded"><X size={14} /></button>
          </div>
        </td>
      </tr>
    );
  }

  const statusColors = {
    Open: 'bg-warning/20 text-warning',
    NEW: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-primary/20 text-primary',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    WAITING_USER: 'bg-amber-100 text-amber-700',
    Resolved: 'bg-success/20 text-success',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    Closed: 'bg-gray-200 text-gray-500',
    CLOSED: 'bg-slate-200 text-slate-600',
  };

  const priorityColors = {
    Low: 'text-gray-500 bg-gray-100',
    Medium: 'text-blue-600 bg-blue-50',
    High: 'text-amber-600 bg-amber-50',
    Urgent: 'text-rose-600 bg-rose-50 font-bold',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 font-medium text-boxdark">
        {ticket.detail_url ? (
          <a
            href={ticket.detail_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 font-semibold group/link"
            title="Buka tiket di aplikasi Ticketing"
          >
            {ticket.ticket_number}
            <ExternalLink size={11} className="opacity-60 group-hover/link:opacity-100" />
          </a>
        ) : (
          ticket.ticket_number
        )}
      </td>
      <td className="px-3 py-2 whitespace-normal break-words max-w-[200px]">
        <div>{ticket.subject}</div>
        {ticket.reporter_name && (
          <div className="text-[10px] text-gray-400 mt-0.5">Pelapor: {ticket.reporter_name}</div>
        )}
      </td>
      <td className="px-3 py-2">
        <div>{ticket.department || '-'}</div>
        {ticket.location && <div className="text-[10px] text-gray-400">{ticket.location}</div>}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1 items-start">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColors[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
            {ticket.status}
          </span>
          {ticket.priority && (
            <span className={`px-1.5 py-0.5 text-[9px] rounded font-medium ${priorityColors[ticket.priority] || 'text-gray-500'}`}>
              {ticket.priority}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">{ticket.assigned_to || '-'}</td>
      {canEdit && (
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(ticket.id)} className="text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
          </div>
        </td>
      )}
    </tr>
  );
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

export default function ITSystem({ user }) {
  const [modalType, setModalType] = useState(null);

  // Default to all-time / overtime
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const isPIC = user?.roles?.some(r => r.name === 'Division PIC');
  const isAdmin = user?.roles?.some(r => r.name.toLowerCase().includes('admin')) || user?.roles?.some(r => r.name === 'Super Admin') || (user?.role && user.role.toLowerCase().includes('admin')) || false;
  const canSync = isPIC || isAdmin;
  const canEdit = false;

  const [assetsData, setAssetsData] = useState({ general: [], individual: [], total: 0 });
  const [departmentsData, setDepartmentsData] = useState([]);
  const [newAssetType, setNewAssetType] = useState(null); // 'general' or 'individual'
  const [selectedAssetTab, setSelectedAssetTab] = useState('general'); // 'general' or 'individual'
  const [emailsData, setEmailsData] = useState([]);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [showSoftwareDetails, setShowSoftwareDetails] = useState(false);
  const [ticketsData, setTicketsData] = useState(null);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [isSyncingTickets, setIsSyncingTickets] = useState(false);
  const [budgetData, setBudgetData] = useState(null);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [softwareData, setSoftwareData] = useState(null);
  const [isAddingSoftware, setIsAddingSoftware] = useState(false);
  const [highlightsData, setHighlightsData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAssets = async (isRefresh = false) => {
    try {
      const res = await api.get(`/api/it-assets${isRefresh ? '?refresh=true' : ''}`);
      setAssetsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmails = async (isRefresh = false) => {
    try {
      const res = await api.get(`/api/it-emails${isRefresh ? '?refresh=true' : ''}`);
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

  const fetchTickets = async (isRefresh = false) => {
    try {
      let qs = dateRange.startDate && dateRange.endDate ? `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}` : '';
      if (isRefresh) {
        qs += (qs ? '&' : '?') + 'refresh=true';
      }
      const res = await api.get(`/api/it-dashboard/tickets${qs}`);
      setTicketsData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncTickets = async () => {
    try {
      setIsSyncingTickets(true);
      const qs = dateRange.startDate && dateRange.endDate ? `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}` : '';
      const res = await api.post(`/api/it-dashboard/sync-tickets${qs}`);
      alert(res.data.message || 'Sinkronisasi berhasil!');
      await fetchTickets(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menyinkronkan data tiket.');
    } finally {
      setIsSyncingTickets(false);
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

  const fetchHighlights = async () => {
    try {
      const qs = dateRange.startDate ? `?month=${new Date(dateRange.startDate).toLocaleString('id-ID', { month: 'long' })}&year=${new Date(dateRange.startDate).getFullYear()}` : '';
      const res = await api.get(`/api/it-dashboard/highlights${qs}`);
      setHighlightsData(res.data.data);
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
    fetchHighlights();
  }, [dateRange]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/api/it-dashboard/sync');
      await Promise.all([
        fetchAssets(true),
        fetchEmails(true),
        fetchTickets(true),
        fetchBudget(),
        fetchSoftware(),
        fetchHighlights()
      ]);
      alert(res.data?.message || 'Data IT System berhasil disinkronkan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyinkronkan data: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleSaveBudget = async (formData) => {
    try {
      if (formData.isNew) {
        await api.post('/api/it-budget-expenses', formData);
        setIsAddingBudget(false);
      } else {
        await api.put(`/api/it-budget-expenses/${formData.id}`, formData);
      }
      fetchBudget();
    } catch (err) {
      alert('Gagal menyimpan data budget');
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengeluaran ini?')) return;
    try {
      await api.delete(`/api/it-budget-expenses/${id}`);
      fetchBudget();
    } catch (err) {
      alert('Gagal menghapus data budget');
      console.error(err);
    }
  };

  const handleSaveSoftware = async (formData) => {
    try {
      if (formData.isNew) {
        await api.post('/api/it-softwares', formData);
        setIsAddingSoftware(false);
      } else {
        await api.put(`/api/it-softwares/${formData.id}`, formData);
      }
      fetchSoftware();
    } catch (err) {
      alert('Gagal menyimpan data software');
      console.error(err);
    }
  };

  const handleDeleteSoftware = async (id) => {
    if (!window.confirm('Yakin ingin menghapus software ini?')) return;
    try {
      await api.delete(`/api/it-softwares/${id}`);
      fetchSoftware();
    } catch (err) {
      alert('Gagal menghapus data software');
      console.error(err);
    }
  };

  const handleSaveTicket = async (formData) => {
    try {
      if (formData.isNew) {
        await api.post('/api/it-tickets', formData);
        setIsAddingTicket(false);
      } else {
        await api.put(`/api/it-tickets/${formData.id}`, formData);
      }
      fetchTickets();
    } catch (err) {
      alert('Gagal menyimpan data ticket (pastikan no ticket unik)');
      console.error(err);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ticket ini?')) return;
    try {
      await api.delete(`/api/it-tickets/${id}`);
      fetchTickets();
    } catch (err) {
      alert('Gagal menghapus data ticket');
      console.error(err);
    }
  };

  const getAssetChartsData = () => {
    const pieData = [
      { name: 'General', value: assetsData.general.length },
      { name: 'Individual', value: assetsData.individual.length }
    ];

    const categoryCounts = {};
    const locCounts = {};

    const formatCategoryName = (cat) => {
      if (!cat) return 'Other';
      const map = {
        'laptop': 'Laptop',
        'ht': 'HT',
        'printer': 'Printer',
        'camera': 'Camera',
        'cctv': 'CCTV',
        'dashcam': 'Dashcam',
        'network-device': 'Network Device',
        'starlink': 'Starlink',
        'tablet': 'Tablet',
        'general-inventory': 'General Inventory',
        'general-asset': 'General Asset'
      };
      return map[cat.toLowerCase()] || (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '));
    };

    [...assetsData.general, ...assetsData.individual].forEach(a => {
      let cat = a.category;
      if (!cat) {
        const text = ((a.asset_name || '') + ' ' + (a.brand_description || '') + ' ' + (a.specification || '')).toLowerCase();
        if (text.includes('laptop') || text.includes('lpt') || text.includes('notebook') || text.includes('vivobook') || text.includes('thinkpad')) cat = 'laptop';
        else if (text.includes('ht') || text.includes('handy talky') || text.includes('motorola')) cat = 'ht';
        else if (text.includes('printer') || text.includes('prn') || text.includes('epson') || text.includes('canon')) cat = 'printer';
        else if (text.includes('camera') || text.includes('kamera')) cat = 'camera';
        else if (text.includes('cctv')) cat = 'cctv';
        else if (text.includes('dashcam')) cat = 'dashcam';
        else if (text.includes('starlink')) cat = 'starlink';
        else if (text.includes('tablet') || text.includes('ipad')) cat = 'tablet';
        else if (text.includes('network') || text.includes('switch') || text.includes('router') || text.includes('mikrotik')) cat = 'network-device';
        else cat = a.type === 'individual' ? 'General Asset' : 'General Inventory';
      }

      const catLabel = formatCategoryName(cat);
      categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;

      const rawLoc = a.type === 'general' ? a.location : (a.department || a.division_project);
      const loc = (rawLoc && String(rawLoc).trim() && String(rawLoc).trim() !== '-') ? String(rawLoc).trim() : 'Unknown';
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });

    const itemData = Object.keys(categoryCounts)
      .map(k => ({ name: k, count: categoryCounts[k] }))
      .sort((a, b) => b.count - a.count);

    const locData = Object.keys(locCounts)
      .map(k => ({ name: k, count: locCounts[k] }))
      .sort((a, b) => b.count - a.count);

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
  const [assetSorting, setAssetSorting] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetConditionFilter, setAssetConditionFilter] = useState('all');
  const [assetPagination, setAssetPagination] = useState({ pageIndex: 0, pageSize: 10 });

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

  const filteredGeneralData = useMemo(() => {
    let list = assetsData.general || [];
    if (assetConditionFilter !== 'all') {
      list = list.filter(item => (item.condition || '').toLowerCase() === assetConditionFilter.toLowerCase());
    }
    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase();
      list = list.filter(item =>
        (item.asset_name || '').toLowerCase().includes(q) ||
        (item.brand_description || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.condition || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [assetsData.general, assetConditionFilter, assetSearch]);

  const filteredIndividualData = useMemo(() => {
    let list = assetsData.individual || [];
    if (assetConditionFilter !== 'all') {
      list = list.filter(item => (item.condition || '').toLowerCase() === assetConditionFilter.toLowerCase());
    }
    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase();
      list = list.filter(item =>
        (item.asset_name || '').toLowerCase().includes(q) ||
        (item.receiver_name || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q) ||
        (item.division_project || '').toLowerCase().includes(q) ||
        (item.specification || '').toLowerCase().includes(q) ||
        (item.condition || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [assetsData.individual, assetConditionFilter, assetSearch]);

  const generalTable = useReactTable({
    data: filteredGeneralData,
    columns: generalColumns,
    state: {
      sorting: assetSorting,
      pagination: assetPagination,
    },
    onSortingChange: setAssetSorting,
    onPaginationChange: setAssetPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const individualTable = useReactTable({
    data: filteredIndividualData,
    columns: individualColumns,
    state: {
      sorting: assetSorting,
      pagination: assetPagination,
    },
    onSortingChange: setAssetSorting,
    onPaginationChange: setAssetPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  const getHorizontalBarOptions = (categories, color) => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 3,
        barHeight: '65%',
        distributed: false
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: { fontSize: '10px', fontWeight: 'bold' },
      offsetX: 4,
      formatter: (val) => val
    },
    xaxis: {
      categories: categories || [],
      labels: { style: { fontSize: '10px', colors: '#64748B' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: '#334155', fontWeight: 500 },
        maxWidth: 160
      }
    },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
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
        {ReactDOM.createPortal(
          canSync && (
            <button 
              onClick={handleManualSync} 
              disabled={isSyncing}
              title="Sinkronisasi seluruh data IT System (Synology, Asset API, & Tiket)"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded shadow-sm transition-colors ${isSyncing ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          ),
          document.getElementById('page-header-actions') || document.body
        )}
        <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />

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
            // No onClick and no action for Asset, as requested by user.
          />
          <KpiCard 
            title="Total Active Email" 
            value={emailsData.length.toString()} 
            subtitle="All Domains" 
            icon={Mail} 
            colorClass="text-[#3C50E0] bg-primary/10" 
            action={canEdit && <button onClick={(e) => { e.stopPropagation(); setModalType('email'); }} className="text-gray-400 hover:text-primary transition-colors bg-white rounded-full p-1 shadow-sm"><Pencil size={12} /></button>} 
          />
          <KpiCard 
            title="Total Software" 
            value={softwareData && softwareData.summary ? ((softwareData.summary.launched || 0) + (softwareData.summary.development || 0)).toString() : '0'} 
            subtitle="Active & In Progress" 
            icon={Terminal} 
            colorClass="text-[#F59E0B] bg-warning/10" 
            action={canEdit && <button onClick={(e) => { e.stopPropagation(); setModalType('software'); }} className="text-gray-400 hover:text-primary transition-colors bg-white rounded-full p-1 shadow-sm"><Pencil size={12} /></button>} 
          />
          <KpiCard
            title="Pemakaian Budget"
            value={budgetData ? formatSimpleMoney(budgetData.total_used) : 'Rp 0'}
            subtitle={budgetData ? `Rp ${Math.round(budgetData.total_used).toLocaleString('id-ID')} / Rp ${Math.round(budgetData.total_budget).toLocaleString('id-ID')}` : 'Loading...'}
            icon={DollarSign}
            colorClass="text-danger bg-danger/10"
            action={<button onClick={(e) => { e.stopPropagation(); setModalType('budget'); }} className="text-gray-400 hover:text-primary transition-colors bg-white rounded-full p-1 shadow-sm"><Pencil size={12} /></button>}
          />
          <KpiCard 
            title="Resolved Tickets" 
            value={ticketsData ? ticketsData.total_resolved.toString() : '0'} 
            subtitle={ticketsData && ticketsData.avg_resolution_time ? `Avg Time: ${ticketsData.avg_resolution_time}` : "Tickets Resolved"} 
            icon={Star} 
            colorClass="text-[#F59E0B] bg-warning/10" 
            action={canEdit && <button onClick={(e) => { e.stopPropagation(); setModalType('ticketing'); }} className="text-gray-400 hover:text-primary transition-colors bg-white rounded-full p-1 shadow-sm"><Pencil size={12} /></button>} 
          />
        </div>


        {/* 
        [PENGATURAN BARIS 2: HIGHLIGHTS] 
        - Card delay="delay-150" dll. juga diberi class "shrink-0" jika ditaruh dalam layout flex agar tidak tertekan.
      */}
        {/* Row 2: Highlight & Plan */}
        <Card delay="delay-150" className="mb-2 p-2.5 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border-l-[3px] border-primary pl-3">
              <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Highlight</p>
              <p className="text-xs font-medium text-boxdark leading-relaxed">
                {highlightsData?.find(h => h.type?.toLowerCase() === 'highlight')?.description || '-'}
              </p>
            </div>
            <div className="border-l-[3px] border-warning pl-3">
              <p className="text-[9px] font-bold text-warning uppercase tracking-wider mb-0.5">Plan</p>
              <p className="text-xs font-medium text-boxdark leading-relaxed">
                {highlightsData?.find(h => h.type?.toLowerCase() === 'plan')?.description || '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Main Dashboard Layout (Row 2 + 3 combined) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2 lg:h-[380px]">
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
                        labels: { formatter: (val) => "Rp " + Math.round(val || 0).toLocaleString('id-ID'), style: { fontSize: '10px' } }
                      },
                      legend: { position: 'top', fontSize: '10px', itemMargin: { horizontal: 5, vertical: 0 } },
                      dataLabels: { enabled: false },
                      tooltip: { 
                        shared: true, 
                        intersect: false,
                        y: {
                          formatter: (val) => val !== undefined && val !== null ? "Rp " + Math.round(val).toLocaleString('id-ID') : '-',
                          title: {
                            formatter: (seriesName) => {
                              const map = {
                                'Asset': 'Asset (Hardware):',
                                'Sub': 'Subscription (Langganan):',
                                'Maint': 'Maintenance (Perbaikan):',
                                'Ops': 'Operasional:',
                                'Total': 'Total Pengeluaran:'
                              };
                              return map[seriesName] || (seriesName + ':');
                            }
                          }
                        }
                      }
                    }}
                    series={[
                      { name: 'Asset', type: 'column', data: budgetData.monthly_trend.map(item => Math.round(item.Asset || 0)) },
                      { name: 'Sub', type: 'column', data: budgetData.monthly_trend.map(item => Math.round(item.Subscription || 0)) },
                      { name: 'Maint', type: 'column', data: budgetData.monthly_trend.map(item => Math.round(item.Maintenance || 0)) },
                      { name: 'Ops', type: 'column', data: budgetData.monthly_trend.map(item => Math.round(item.Operational || 0)) },
                      { name: 'Total', type: 'line', data: budgetData.monthly_trend.map(item => Math.round(item.Total || 0)) }
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
                  bar: { horizontal: true, borderRadius: 3, barHeight: '65%' }
                },
                colors: ['#3C50E0'],
                dataLabels: { 
                  enabled: true, 
                  style: { fontSize: '10px', fontWeight: 'bold' },
                  offsetX: 5
                },
                xaxis: {
                  categories: itemData.map(d => d.name),
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: {
                  labels: { style: { fontSize: '10px' }, maxWidth: 110 }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
                tooltip: { theme: 'light' }
              }}
              series={[{ name: 'Jumlah', data: itemData.map(d => d.count) }]}
              type="bar"
              height="100%"
              width="100%"
            />
          </ChartContainer>

          {/* Software & Ticketing (Stacked in 1 Column) */}
          <div className="lg:col-span-1 flex flex-col gap-2 h-[600px] lg:h-full min-h-0">
            {/* Software Develop */}
            <ChartContainer 
              title="Software Develop" 
              delay="delay-200" 
              className="flex-1 min-h-0"
              action={<button onClick={() => setModalType('software')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
            >
              {softwareData && softwareData.summary ? (
                <div className="flex h-full w-full items-center justify-between gap-2 overflow-hidden">
                  {/* Donut Chart with HTML Centered Overlay */}
                  <div className="relative flex-shrink-0 w-[44%] h-full flex items-center justify-center">
                    <Chart
                      options={{
                        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', sparkline: { enabled: true } },
                        labels: ['Launched', 'In Development'],
                        colors: ['#10B981', '#3C50E0'],
                        dataLabels: { enabled: false },
                        legend: { show: false },
                        plotOptions: { 
                          pie: { 
                            donut: { 
                              size: '72%', 
                              labels: { show: false }
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
                        }
                      }}
                      series={[softwareData.summary?.launched || 0, softwareData.summary?.development || 0]}
                      type="donut"
                      height="90%"
                      width="100%"
                    />
                    {/* Non-Colliding HTML Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-base font-bold text-boxdark leading-none">
                        {(softwareData.summary?.launched || 0) + (softwareData.summary?.development || 0)}
                      </span>
                      <span className="text-[8px] font-semibold text-gray-400 uppercase mt-1 tracking-wider">
                        APPS
                      </span>
                    </div>
                  </div>

                  {/* Clean Legend Badges */}
                  <div className="flex-1 flex flex-col justify-center gap-2 pr-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                      <span className="flex items-center gap-1.5 text-gray-600 text-[11px] font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span> Launched
                      </span>
                      <span className="font-bold text-boxdark text-xs flex-shrink-0">{softwareData.summary?.launched || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                      <span className="flex items-center gap-1.5 text-gray-600 text-[11px] font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-[#3C50E0] flex-shrink-0"></span> In Dev
                      </span>
                      <span className="font-bold text-boxdark text-xs flex-shrink-0">{softwareData.summary?.development || 0}</span>
                    </div>
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
              className="flex-1 min-h-0"
              action={<button onClick={() => setModalType('ticketing')} className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition flex items-center gap-1">View Details <ChevronRight size={12} /></button>}
            >

              {ticketsData && ticketsData.categories ? (() => {
                const TICKET_COLORS = ['#EF4444','#F97316','#EAB308','#3B82F6','#8B5CF6','#10B981','#6366F1','#EC4899','#14B8A6','#F43F5E'];
                const total = ticketsData.categories.reduce((s, c) => s + parseInt(c.total), 0);

                // Ambil Top 4 kategori, dan rangkum sisanya menjadi "Lainnya" agar pas dan tidak ada scrollbar
                const topCategories = ticketsData.categories.slice(0, 4);
                const remainingCategories = ticketsData.categories.slice(4);
                const remainingTotal = remainingCategories.reduce((s, c) => s + parseInt(c.total), 0);

                const displayCategories = [...topCategories];
                if (remainingTotal > 0) {
                  displayCategories.push({
                    category: `${remainingCategories.length} Kategori Lainnya`,
                    total: remainingTotal,
                    isOther: true
                  });
                }

                return (
                  <div className="flex h-full min-h-0 w-full items-center gap-2 overflow-hidden">
                    {/* Donut with HTML Centered Overlay */}
                    <div className="relative flex-shrink-0 w-[44%] h-full flex items-center justify-center">
                      <Chart
                        options={{
                          chart: { type: 'donut', fontFamily: 'Inter, sans-serif', sparkline: { enabled: true } },
                          labels: ticketsData.categories.map(c => c.category),
                          legend: { show: false },
                          dataLabels: { enabled: false },
                          colors: TICKET_COLORS,
                          plotOptions: {
                            pie: {
                              donut: {
                                size: '72%',
                                labels: { show: false }
                              }
                            }
                          },
                          tooltip: {
                            theme: 'light',
                            y: {
                              formatter: (val) => {
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return `${val} (${pct}%)`;
                              }
                            }
                          },
                          stroke: { width: 1 }
                        }}
                        series={ticketsData.categories.map(c => parseInt(c.total))}
                        type="donut"
                        height="90%"
                        width="100%"
                      />
                      {/* Non-Colliding HTML Center Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-base font-bold text-boxdark leading-none">
                          {ticketsData.total_resolved || 0}
                        </span>
                        <span className="text-[8px] font-semibold text-gray-400 uppercase mt-1 tracking-wider">
                          RESOLVED
                        </span>
                      </div>
                    </div>

                    {/* Clean compact legend without scrollbar */}
                    <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center gap-1.5 overflow-hidden">
                      {displayCategories.map((c, i) => {
                        const pct = total > 0 ? ((parseInt(c.total) / total) * 100).toFixed(1) : 0;
                        const color = c.isOther ? '#94A3B8' : TICKET_COLORS[i % TICKET_COLORS.length];
                        return (
                          <div key={i} className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                              <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-gray-600 truncate font-medium text-[10px]" title={c.category}>{c.category}</span>
                            </div>
                            <span className="font-bold text-boxdark flex-shrink-0 text-[10px]">
                              {c.total} <span className="font-normal text-gray-400 text-[9px]">({pct}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
              )}
            </ChartContainer>
          </div>
        </div>


      </div>

      {/* Asset Modal */}
      <Modal isOpen={modalType === 'asset'} onClose={() => setModalType(null)} title="Rincian Total Asset Fisik" maxWidth="max-w-6xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Tipe Aset</h5>
              <div className="flex-1 w-full min-h-0">
                <Chart options={pieOptions} series={pieSeries} type="donut" height="100%" />
              </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-72 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Top 10 Lokasi / Departemen</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getHorizontalBarOptions(locData.slice(0, 10).map(d => d.name), '#10B981')}
                  series={[{ name: 'Jumlah', data: locData.slice(0, 10).map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-lg p-4 bg-white shadow-sm">
            {/* Filter and Dropdown Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4 pb-3 border-b border-stroke">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Asset Type Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe Aset:</label>
                  <div className="relative">
                    <select
                      value={selectedAssetTab}
                      onChange={(e) => {
                        setSelectedAssetTab(e.target.value);
                        setAssetPagination(p => ({ ...p, pageIndex: 0 }));
                      }}
                      className="appearance-none bg-white border border-stroke rounded-lg pl-3 pr-8 py-1.5 text-sm font-semibold text-boxdark shadow-sm hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer transition-all"
                    >
                      <option value="general">General Assets ({assetsData.general?.length || 0})</option>
                      <option value="individual">Individual Assets ({assetsData.individual?.length || 0})</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kondisi:</label>
                  <select
                    value={assetConditionFilter}
                    onChange={(e) => {
                      setAssetConditionFilter(e.target.value);
                      setAssetPagination(p => ({ ...p, pageIndex: 0 }));
                    }}
                    className="bg-white border border-stroke rounded-lg px-2.5 py-1.5 text-xs font-medium text-boxdark hover:border-primary focus:border-primary outline-none cursor-pointer shadow-sm"
                  >
                    <option value="all">Semua Kondisi</option>
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                    <option value="hilang">Hilang</option>
                    <option value="perlu servis">Perlu Servis</option>
                  </select>
                </div>
              </div>

              {/* Search & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => {
                      setAssetSearch(e.target.value);
                      setAssetPagination(p => ({ ...p, pageIndex: 0 }));
                    }}
                    placeholder={selectedAssetTab === 'general' ? 'Cari nama, brand, lokasi...' : 'Cari penerima, dept, spesifikasi...'}
                    className="w-full bg-white border border-stroke rounded-lg pl-8 pr-7 py-1.5 text-xs text-boxdark placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  {assetSearch && (
                    <button
                      onClick={() => {
                        setAssetSearch('');
                        setAssetPagination(p => ({ ...p, pageIndex: 0 }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleImportModal(selectedAssetTab === 'general' ? 'asset' : 'email')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                      Import
                    </button>
                    <button onClick={() => handleAddAsset(selectedAssetTab)} disabled={newAssetType === selectedAssetTab} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                      <Plus size={14} /> Add Asset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table Content */}
            {selectedAssetTab === 'general' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b border-stroke text-xs">
                    {generalTable.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, i) => (
                          <th
                            key={header.id}
                            className={`px-4 py-2.5 font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors ${i === 0 ? 'rounded-tl-md' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp size={13} className="text-primary font-bold" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown size={13} className="text-primary font-bold" />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            </div>
                          </th>
                        ))}
                        {canEdit && <th className="px-4 py-2.5 font-semibold rounded-tr-md text-right w-24">Actions</th>}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {newAssetType === 'general' && (
                      <AssetRow
                        asset={{ isNew: true, type: 'general', asset_name: '', condition: 'Baik' }}
                        canEdit={canEdit}
                        onUpdate={handleSaveAsset}
                        onCancelAdd={handleCancelAdd}
                        departmentsData={departmentsData}
                      />
                    )}
                    {generalTable.getRowModel().rows.length > 0 ? (
                      generalTable.getRowModel().rows.map(row => (
                        <AssetRow key={row.original.id} asset={row.original} canEdit={canEdit} onUpdate={handleSaveAsset} onDelete={handleDeleteAsset} departmentsData={departmentsData} />
                      ))
                    ) : (
                      newAssetType !== 'general' && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            <p className="text-sm">Tidak ada data general asset yang cocok</p>
                            {(assetSearch || assetConditionFilter !== 'all') && (
                              <button
                                onClick={() => { setAssetSearch(''); setAssetConditionFilter('all'); }}
                                className="text-xs text-primary underline mt-1"
                              >
                                Reset filter & pencarian
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 border-b border-stroke text-xs">
                    {individualTable.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, i) => (
                          <th
                            key={header.id}
                            className={`px-4 py-2.5 font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors ${i === 0 ? 'rounded-tl-md' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp size={13} className="text-primary font-bold" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown size={13} className="text-primary font-bold" />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            </div>
                          </th>
                        ))}
                        {canEdit && <th className="px-4 py-2.5 font-semibold rounded-tr-md text-right w-24">Actions</th>}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {newAssetType === 'individual' && (
                      <AssetRow
                        asset={{ isNew: true, type: 'individual', asset_name: '', condition: 'Baik' }}
                        canEdit={canEdit}
                        onUpdate={handleSaveAsset}
                        onCancelAdd={handleCancelAdd}
                        departmentsData={departmentsData}
                      />
                    )}
                    {individualTable.getRowModel().rows.length > 0 ? (
                      individualTable.getRowModel().rows.map(row => (
                        <AssetRow key={row.original.id} asset={row.original} canEdit={canEdit} onUpdate={handleSaveAsset} onDelete={handleDeleteAsset} departmentsData={departmentsData} />
                      ))
                    ) : (
                      newAssetType !== 'individual' && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400">
                            <p className="text-sm">Tidak ada data individual asset yang cocok</p>
                            {(assetSearch || assetConditionFilter !== 'all') && (
                              <button
                                onClick={() => { setAssetSearch(''); setAssetConditionFilter('all'); }}
                                className="text-xs text-primary underline mt-1"
                              >
                                Reset filter & pencarian
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {(() => {
              const activeTable = selectedAssetTab === 'general' ? generalTable : individualTable;
              const totalFiltered = selectedAssetTab === 'general' ? filteredGeneralData.length : filteredIndividualData.length;
              const totalRaw = selectedAssetTab === 'general' ? (assetsData.general?.length || 0) : (assetsData.individual?.length || 0);
              const startRow = totalFiltered === 0 ? 0 : assetPagination.pageIndex * assetPagination.pageSize + 1;
              const endRow = Math.min((assetPagination.pageIndex + 1) * assetPagination.pageSize, totalFiltered);
              const pageCount = activeTable.getPageCount();

              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-stroke text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tampilkan:</span>
                    <select
                      value={assetPagination.pageSize}
                      onChange={(e) => {
                        const size = Number(e.target.value);
                        setAssetPagination({ pageIndex: 0, pageSize: size });
                      }}
                      className="bg-white border border-stroke rounded px-2 py-1 text-xs text-boxdark font-medium focus:border-primary outline-none cursor-pointer shadow-sm"
                    >
                      {[10, 25, 50, 100].map(pageSize => (
                        <option key={pageSize} value={pageSize}>{pageSize} baris</option>
                      ))}
                    </select>
                    <span className="text-gray-500 ml-1">
                      Menampilkan <span className="font-semibold text-boxdark">{startRow}</span> - <span className="font-semibold text-boxdark">{endRow}</span> dari <span className="font-semibold text-boxdark">{totalFiltered}</span> data
                      {totalFiltered !== totalRaw && <span className="text-gray-400 ml-1">(difilter dari {totalRaw})</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => activeTable.previousPage()}
                      disabled={!activeTable.getCanPreviousPage()}
                      className="px-2.5 py-1.5 border border-stroke rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-boxdark font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>

                    <div className="px-3 py-1 bg-gray-50 border border-stroke rounded-md font-semibold text-boxdark">
                      Hal {pageCount === 0 ? 0 : assetPagination.pageIndex + 1} / {pageCount || 1}
                    </div>

                    <button
                      onClick={() => activeTable.nextPage()}
                      disabled={!activeTable.getCanNextPage()}
                      className="px-2.5 py-1.5 border border-stroke rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-boxdark font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Halaman Selanjutnya"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={modalType === 'email'} onClose={() => setModalType(null)} title="Rincian Active Email" maxWidth="max-w-6xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-2">
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-80 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Distribusi Domain Email</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getHorizontalBarOptions(domainData.slice(0, 10).map(d => d.name), '#3C50E0')}
                  series={[{ name: 'Jumlah', data: domainData.slice(0, 10).map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
            <div className="bg-white rounded shadow-sm border border-stroke p-4 h-80 flex flex-col">
              <h5 className="text-sm font-bold text-boxdark mb-2">Top 10 Divisi / Departemen</h5>
              <div className="flex-1 w-full min-h-0 -ml-2 mt-2">
                <Chart
                  options={getHorizontalBarOptions(divData.slice(0, 10).map(d => d.name), '#10B981')}
                  series={[{ name: 'Jumlah', data: divData.slice(0, 10).map(d => d.count) }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-boxdark">Daftar Email Aktif</h4>
              {canEdit && (
                <div className="flex gap-1">
                  <button onClick={() => handleImportModal('software')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
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
                      {canEdit && <th className="px-4 py-2 font-medium rounded-tr-md text-right w-24">Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-stroke">
                  {isAddingEmail && (
                    <EmailRow
                      email={{ isNew: true, domain: '', user_name: '', email_address: '' }}
                      canEdit={canEdit}
                      onUpdate={handleSaveEmail}
                      onCancelAdd={() => setIsAddingEmail(false)}
                      departmentsData={departmentsData}
                    />
                  )}
                  {emailTable.getRowModel().rows.length > 0 ? emailTable.getRowModel().rows.map(row => (
                    <EmailRow key={row.original.id} email={row.original} canEdit={canEdit} onUpdate={handleSaveEmail} onDelete={handleDeleteEmail} departmentsData={departmentsData} />
                  )) : (!isAddingEmail && <tr><td colSpan={5} className="text-center py-4 text-gray-400">No data found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={modalType === 'budget'} onClose={() => setModalType(null)} title="Rincian Penggunaan Budget IT" maxWidth="max-w-4xl">
        {budgetData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 border border-stroke rounded p-3 -mt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-boxdark">Sumber Realisasi: Accurate Online (Akun 6211 - IT Internet, Software, Server, dll)</span>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">Live Accurate API</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded border border-stroke p-3 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-medium mb-1">Total Alokasi (Tahun Ini)</p>
                <h3 className="text-lg font-bold text-boxdark">Rp {Math.round(budgetData.total_budget).toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-white rounded border border-stroke p-3 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-medium mb-1">Total Terpakai (Mutasi Accurate)</p>
                <h3 className="text-lg font-bold text-danger">Rp {Math.round(budgetData.total_used).toLocaleString('id-ID')}</h3>
                <span className="text-[10px] text-danger font-medium mt-0.5">
                  Utilisasi: {budgetData.total_budget > 0 ? ((budgetData.total_used / budgetData.total_budget) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="bg-white rounded border border-stroke p-3 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-medium mb-1">Sisa Anggaran</p>
                <h3 className="text-lg font-bold text-success">Rp {Math.max(0, Math.round(budgetData.total_budget - budgetData.total_used)).toLocaleString('id-ID')}</h3>
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
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-boxdark">Histori Pengeluaran (Terbaru)</h4>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => handleImportModal('budgetallocation')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                      Import Alokasi
                    </button>
                    <button onClick={() => handleImportModal('budgetexpenses')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                      Import Pengeluaran
                    </button>
                    <button onClick={() => setIsAddingBudget(true)} disabled={isAddingBudget} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                      <Plus size={14} /> Add Expense
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-stroke">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Keterangan</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Nominal</th>
                      {canEdit && <th className="px-3 py-2 text-right w-20">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {isAddingBudget && (
                      <BudgetRow
                        expense={{ isNew: true, group_category: '', description: '', expense_date: new Date().toISOString().split('T')[0], amount: '' }}
                        canEdit={canEdit}
                        onUpdate={handleSaveBudget}
                        onCancelAdd={() => setIsAddingBudget(false)}
                        budgetCategories={budgetData.breakdown ? budgetData.breakdown.map(c => c.category) : []}
                      />
                    )}
                    {budgetData.raw_expenses && budgetData.raw_expenses.map((exp, idx) => (
                      <BudgetRow 
                        key={exp.id || idx} 
                        expense={{...exp, group_category: exp.budget?.category || exp.group_category}} 
                        canEdit={canEdit} 
                        onUpdate={handleSaveBudget} 
                        onDelete={handleDeleteBudget} 
                        budgetCategories={budgetData.breakdown ? budgetData.breakdown.map(c => c.category) : []} 
                      />
                    ))}
                    {(!budgetData.raw_expenses || budgetData.raw_expenses.length === 0) && !isAddingBudget && (
                      <tr><td colSpan={canEdit ? 5 : 4} className="text-center py-4 text-gray-400">Belum ada pengeluaran</td></tr>
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
                      <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                        Launched
                      </span>
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
      <Modal isOpen={modalType === 'ticketing'} onClose={() => setModalType(null)} title="Rincian IT Ticketing" maxWidth="max-w-6xl">
        {ticketsData ? (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut Kategori Ticket */}
              <div className="bg-white rounded border border-stroke p-4 h-72 flex flex-col">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kategori Ticket</h5>
                {ticketsData.categories && ticketsData.categories.length > 0 ? (() => {
                  const TICKET_COLORS = ['#EF4444','#F97316','#EAB308','#3B82F6','#8B5CF6','#10B981','#6366F1','#EC4899','#14B8A6','#F43F5E'];
                  const total = ticketsData.categories.reduce((s, c) => s + parseInt(c.total || 0), 0);

                  return (
                    <div className="flex h-full min-h-0 w-full items-center justify-between gap-3 overflow-hidden">
                      {/* Controlled Donut with Fixed Dimensions */}
                      <div className="relative flex-shrink-0 w-[135px] h-[135px] flex items-center justify-center">
                        <Chart
                          options={{
                            chart: { type: 'donut', fontFamily: 'Inter, sans-serif', sparkline: { enabled: true } },
                            labels: ticketsData.categories.map(c => c.category),
                            legend: { show: false },
                            dataLabels: { enabled: false },
                            colors: TICKET_COLORS,
                            plotOptions: {
                              pie: {
                                donut: {
                                  size: '72%',
                                  labels: { show: false }
                                }
                              }
                            },
                            tooltip: {
                              theme: 'light',
                              y: {
                                formatter: (val) => {
                                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                  return `${val} (${pct}%)`;
                                }
                              }
                            },
                            stroke: { width: 1 }
                          }}
                          series={ticketsData.categories.map(c => parseInt(c.total || 0))}
                          type="donut"
                          height={135}
                          width={135}
                        />
                        {/* HTML Center Overlay Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-sm font-bold text-boxdark leading-none">
                            {ticketsData.total_resolved || 0}
                          </span>
                          <span className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5 tracking-wider">
                            RESOLVED
                          </span>
                        </div>
                      </div>

                      {/* Legend List */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 overflow-y-auto max-h-56 pr-1">
                        {ticketsData.categories.map((c, i) => {
                          const pct = total > 0 ? ((parseInt(c.total || 0) / total) * 100).toFixed(1) : 0;
                          const color = TICKET_COLORS[i % TICKET_COLORS.length];
                          return (
                            <div key={i} className="flex items-center justify-between text-[11px] gap-1 leading-tight">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                <span className="truncate text-gray-600 font-medium text-[10px]" title={c.category}>{c.category}</span>
                              </div>
                              <span className="text-boxdark font-semibold shrink-0 text-right text-[10px]">
                                {c.total} <span className="text-[9px] text-gray-400 font-normal">({pct}%)</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">Tidak ada data kategori</div>
                )}
              </div>

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

            <div className="bg-white rounded border border-stroke p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-boxdark">Daftar Ticket</h4>
                {canEdit && (
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => handleImportModal('ticketing')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-medium rounded hover:bg-gray-200">
                      Import Excel
                    </button>
                    <button onClick={() => setIsAddingTicket(true)} disabled={isAddingTicket} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
                      <Plus size={14} /> Add Ticket
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-stroke sticky top-0">
                    <tr>
                      <th className="px-3 py-2">No. Ticket</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Department / Lokasi</th>
                      <th className="px-3 py-2">Status & Prioritas</th>
                      <th className="px-3 py-2">Assigned To</th>
                      {canEdit && <th className="px-3 py-2 text-right w-20">Actions</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stroke">
                    {isAddingTicket && (
                      <TicketRow
                        ticket={{ isNew: true, ticket_number: '', subject: '', department: '', status: 'Open', assigned_to: '' }}
                        canEdit={canEdit}
                        onUpdate={handleSaveTicket}
                        onCancelAdd={() => setIsAddingTicket(false)}
                      />
                    )}
                    {ticketsData.raw_tickets && ticketsData.raw_tickets.map((ticket, idx) => (
                      <TicketRow key={ticket.id || idx} ticket={ticket} canEdit={canEdit} onUpdate={handleSaveTicket} onDelete={handleDeleteTicket} />
                    ))}
                    {(!ticketsData.raw_tickets || ticketsData.raw_tickets.length === 0) && !isAddingTicket && (
                      <tr><td colSpan={canEdit ? 6 : 5} className="text-center py-4 text-gray-400">Belum ada ticket</td></tr>
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
    </>
  );
}
