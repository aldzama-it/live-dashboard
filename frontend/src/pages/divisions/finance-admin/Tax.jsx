import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { DollarSign, FileText, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../../../axios';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import DateRangeFilter from '../../../components/ui/DateRangeFilter';

export default function Tax({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: firstDay, endDate: lastDay });

  const isAdmin = user?.roles?.some(r => r.name.toLowerCase().includes('admin')) || user?.roles?.some(r => r.name === 'Super Admin') || (user?.role && user.role.toLowerCase().includes('admin')) || false;
  const isPIC = user?.roles?.some(r => r.name === 'Division PIC');
  const canSync = isAdmin || isPIC;

  const fetchTaxData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/tax-dashboard/summary?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tax data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [dateRange]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('/api/tax-dashboard/sync');
      fetchTaxData();
      alert('Data successfully synced from Synology!');
    } catch (err) {
      console.error(err);
      alert('Failed to sync data: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">Memuat data Dashboard Tax...</p>
      </div>
    );
  }

  const summary = data?.summary || { total_masukan: 0, total_keluaran: 0, net_ppn: 0, status: '-' };

  return (
    <div className="flex flex-col gap-2 pb-2">
      {/* 
        [PENGATURAN PORTAL ACTION]
        Render tombol sync dan filter ke PageHeader
      */}
      {ReactDOM.createPortal(
        canSync && (
          <button 
            onClick={handleManualSync} 
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded shadow-sm transition-colors ${isSyncing ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        ),
        document.getElementById('page-header-actions') || document.body
      )}
      
      <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-1 gap-x-2 md:gap-y-1 md:gap-x-2 mb-3">
        
        <KpiCard
          title="Total PPN Keluaran"
          value={formatCurrency(summary.total_keluaran)}
          subtitle="VAT Out (Sales)"
          icon={TrendingUp}
          colorClass="text-[#10B981] bg-success/10"
          delay="delay-0"
        />

        <KpiCard
          title="Total PPN Masukan"
          value={formatCurrency(summary.total_masukan)}
          subtitle="VAT In (Purchases)"
          icon={FileText}
          colorClass="text-[#3C50E0] bg-secondary/10"
          delay="delay-75"
        />

        <KpiCard
          title="Net PPN"
          value={formatCurrency(Math.abs(summary.net_ppn))}
          subtitle="Selisih Masukan & Keluaran"
          icon={Activity}
          colorClass="text-[#F59E0B] bg-warning/10"
          delay="delay-150"
        />

        <KpiCard
          title="Status PPN"
          value={summary.status}
          subtitle="Kurang/Lebih Bayar"
          icon={DollarSign}
          colorClass={summary.net_ppn > 0 ? "text-danger bg-danger/10" : "text-success bg-success/10"}
          delay="delay-225"
        />

      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-1 gap-x-2">
        <ChartContainer title="PPN Masukan vs Keluaran (Monthly)" delay="delay-300" className="lg:col-span-2">
          <div className="flex flex-col justify-center items-center text-body h-full min-h-[300px]">
             {/* Chart Placeholder for now */}
            <Activity size={48} className="text-gray-300 mb-4" />
            <p className="text-sm opacity-70">Chart will visualize monthly differences based on `chart_data`</p>
          </div>
        </ChartContainer>

        <Card title="Tax Insights" delay="delay-300" className="flex flex-col">
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-gray-50 rounded border border-gray-100">
              <p className="text-sm text-boxdark font-medium">Status PPN Saat Ini:</p>
              <p className={`text-lg font-bold mt-1 ${summary.net_ppn > 0 ? 'text-danger' : 'text-success'}`}>
                {summary.status}
              </p>
              <p className="text-xs text-body mt-2">Dihitung dari selisih PPN Masukan dan Keluaran.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
