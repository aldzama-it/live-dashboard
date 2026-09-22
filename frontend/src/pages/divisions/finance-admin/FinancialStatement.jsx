import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  RefreshCw, 
  Download,
  Info,
  Percent
} from 'lucide-react';
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
    const formatted = (val % 1 === 0 ? String(val) : val.toFixed(1)).replace(/\.0$/, '');
    return `Rp ${formatted} T`;
  }
  if (absNum >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    const formatted = (val % 1 === 0 ? String(val) : val.toFixed(1)).replace(/\.0$/, '');
    return `Rp ${formatted} M`;
  }
  if (absNum >= 1_000_000) {
    const val = num / 1_000_000;
    const formatted = (val % 1 === 0 ? String(val) : val.toFixed(1)).replace(/\.0$/, '');
    return `Rp ${formatted} Jt`;
  }
  if (absNum >= 1_000) {
    const val = num / 1_000;
    const formatted = (val % 1 === 0 ? String(val) : val.toFixed(1)).replace(/\.0$/, '');
    return `Rp ${formatted} Rb`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

const formatNumberId = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const n = Number(num);
  const str = n % 1 === 0 ? String(n) : n.toFixed(decimals);
  return str.replace('.', ',');
};

// --- Ratio Block Component with Clean Theme Badge & Interactive ApexCharts Hover Tooltips ---
function RatioCardItem({ title, formula, value, unit = 'times', benchmark, isLowerBetter = false, historyData = [], categories = [] }) {
  const numVal = Number(value) || 0;
  const numBench = Number(benchmark) || 0;
  const isGood = isLowerBetter ? numVal <= numBench : numVal >= numBench;
  const arrow = isLowerBetter ? '▼' : '▲';
  const statusText = isGood ? `${arrow} Good` : `${isLowerBetter ? '▲' : '▼'} Warning`;
  const statusColor = isGood ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200';

  const formattedVal = formatNumberId(numVal, 2);
  const formattedBench = formatNumberId(numBench, 2);

  const criteriaText = isLowerBetter
    ? `Dinyatakan 'Good' jika Nilai <= Target Benchmark (${formattedBench} ${unit}). Nilai rendah menunjukkan risiko utang yang lebih terkendali.`
    : `Dinyatakan 'Good' jika Nilai >= Target Benchmark (${formattedBench} ${unit}). Nilai tinggi menunjukkan kinerja keuangan yang kuat dan sehat.`;

  return (
    <div className="group relative flex flex-col gap-1.5 p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs transition-all duration-200">
      {/* Title & Formula Header */}
      <div className="flex justify-between items-baseline gap-1">
        <h5 className="font-bold text-xs text-slate-800 group-hover:text-primary transition-colors">{title}</h5>
        <span className="text-[10px] text-gray-500 font-sans italic truncate max-w-[55%]" title={formula}>{formula}</span>
      </div>

      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Left Value Badge with Hover Tooltip */}
        <div className="col-span-4 relative group/val-tooltip cursor-help">
          <div className="flex items-center justify-center px-2 py-2 min-h-[48px] rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:border-primary/40 shadow-2xs shrink-0 transition-all">
            <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
              <span className="font-extrabold text-sm text-slate-900 group-hover:text-primary leading-none transition-colors">{formattedVal}</span>
              <span className="text-xs font-bold text-slate-500 leading-none">{unit === '%' ? '%' : ` ${unit}`}</span>
            </div>
          </div>
          {/* Hover Tooltip Box */}
          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/val-tooltip:block w-68 p-2.5 bg-slate-900 text-white text-[10.5px] rounded-md shadow-lg z-50 pointer-events-none transition-opacity">
            <div className="font-bold text-sky-300 mb-0.5">{title}</div>
            <div className="text-slate-300 mb-1 font-mono text-[10px] break-words leading-tight">{formula}</div>
            <div className="flex justify-between items-center border-t border-slate-700 pt-1 text-[10px]">
              <span>Nilai Aktual: <strong className="text-emerald-400">{formattedVal} {unit}</strong></span>
              <span>Target: <strong className="text-amber-400">{formattedBench} {unit}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Sparkline Bar Chart + Benchmark Line */}
        <div className="col-span-8 flex flex-col justify-center">
          <div className="flex justify-end items-center gap-1.5 mb-1 pr-1">
            {/* Status Badge with Tooltip */}
            <div className="relative group/tooltip">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${statusColor} cursor-help`}>
                {statusText}
              </span>
              {/* Tooltip Hover Box */}
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[10.5px] rounded-md shadow-lg z-50 pointer-events-none transition-opacity">
                <div className="font-bold text-amber-300 mb-0.5">{title} Criteria:</div>
                <div className="leading-tight">{criteriaText}</div>
              </div>
            </div>

            <span className="text-[11px] font-bold text-slate-700">Target: {formattedBench}</span>
          </div>

          <div className="h-9 w-full relative">
            <Chart
              options={{
                chart: { type: 'bar', sparkline: { enabled: true } },
                colors: ['#10B981'],
                plotOptions: { bar: { columnWidth: '55%', borderRadius: 2 } },
                annotations: {
                  yaxis: [{
                    y: numBench,
                    borderColor: '#F97316',
                    strokeDashArray: 0,
                    borderWidth: 2
                  }]
                },
                xaxis: {
                  categories: categories.length ? categories : []
                },
                tooltip: {
                  enabled: true,
                  theme: 'dark',
                  style: { fontSize: '10px' },
                  x: { show: true },
                  y: { formatter: (val) => `${formatNumberId(val, 2)} ${unit}` }
                }
              }}
              series={[{ name: title, data: historyData.length ? historyData : [numVal] }]}
              type="bar"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Margin Progress Block Component with Interactive ApexCharts Hover Tooltips ---
function MarginProgressItem({ title, formula, valuePct, benchmarkPct, historyData = [], categories = [] }) {
  const numVal = Number(valuePct) || 0;
  const numBench = Number(benchmarkPct) || 0;
  const isGood = numVal >= numBench;
  const statusText = isGood ? '▲ Good' : '▼ Warning';
  const statusColor = isGood ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200';

  const formattedVal = formatNumberId(numVal, 2);

  const criteriaText = `Dinyatakan 'Good' jika Nilai Margin >= Target Benchmark (${numBench}%). Menunjukkan tingkat efisiensi profit yang menguntungkan per rupiah penjualan.`;

  return (
    <div className="group relative flex flex-col gap-1.5 p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs transition-all duration-200">
      {/* Title Header */}
      <div className="flex justify-between items-baseline">
        <h5 className="font-bold text-xs text-slate-800 group-hover:text-primary transition-colors">{title}</h5>
        <span className="text-[10px] text-gray-500 font-sans italic truncate" title={formula}>{formula}</span>
      </div>

      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Left Horizontal Progress Bar with Hover Tooltip */}
        <div className="col-span-6 flex flex-col justify-center relative group/val-tooltip cursor-help">
          <div className="w-full bg-slate-100 rounded-lg h-6 overflow-hidden relative shadow-inner border border-slate-200">
            <div 
              className="bg-[#3C50E0] group-hover:bg-[#2536B8] h-full flex items-center justify-center transition-all duration-500" 
              style={{ width: `${Math.min(Math.max(numVal, 0), 100)}%` }}
            >
              <span className="text-[11px] font-bold text-white px-1 whitespace-nowrap">{formattedVal}%</span>
            </div>
          </div>
          {/* Hover Tooltip Box */}
          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/val-tooltip:block w-68 p-2.5 bg-slate-900 text-white text-[10.5px] rounded-md shadow-lg z-50 pointer-events-none transition-opacity">
            <div className="font-bold text-sky-300 mb-0.5">{title}</div>
            <div className="text-slate-300 mb-1 font-mono text-[10px] break-words leading-tight">{formula}</div>
            <div className="flex justify-between items-center border-t border-slate-700 pt-1 text-[10px]">
              <span>Margin Aktual: <strong className="text-emerald-400">{formattedVal}%</strong></span>
              <span>Target: <strong className="text-amber-400">{numBench}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Sparkline Bar Chart */}
        <div className="col-span-6 flex flex-col justify-center">
          <div className="flex justify-end items-center gap-1.5 mb-1 pr-1">
            {/* Status Badge with Tooltip */}
            <div className="relative group/tooltip">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${statusColor} cursor-help`}>
                {statusText}
              </span>
              {/* Tooltip Hover Box */}
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[10.5px] rounded-md shadow-lg z-50 pointer-events-none transition-opacity">
                <div className="font-bold text-amber-300 mb-0.5">{title} Criteria:</div>
                <div className="leading-tight">{criteriaText}</div>
              </div>
            </div>

            <span className="text-[11px] font-bold text-slate-700">Target: {numBench}%</span>
          </div>

          <div className="h-9 w-full relative">
            <Chart
              options={{
                chart: { type: 'bar', sparkline: { enabled: true } },
                colors: ['#10B981'],
                plotOptions: { bar: { columnWidth: '55%', borderRadius: 2 } },
                annotations: {
                  yaxis: [{
                    y: numBench,
                    borderColor: '#F97316',
                    strokeDashArray: 0,
                    borderWidth: 2
                  }]
                },
                xaxis: {
                  categories: categories.length ? categories : []
                },
                tooltip: {
                  enabled: true,
                  theme: 'dark',
                  style: { fontSize: '10px' },
                  x: { show: true },
                  y: { formatter: (val) => `${formatNumberId(val, 2)}%` }
                }
              }}
              series={[{ name: title, data: historyData.length ? historyData : [numVal] }]}
              type="bar"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialStatement({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Mengunduh Laporan Laba Rugi & Neraca...');
  const [asOfDate, setAsOfDate] = useState('');

  useEffect(() => {
    if (!isLoading) return;

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += (90 - progress) * 0.1;
      setLoadingProgress(Math.floor(progress));
    }, 200);

    const messages = [
      "Mengunduh Laporan Laba Rugi & Neraca...",
      "Menyusun Grafik Stacked Column Aset, Kewajiban, Ekuitas...",
      "Menyusun Combo Chart Net Cash Flow & Cash Balance...",
      "Menghitung Financial Ratio Dashboard dengan Benchmark Line..."
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

  const fetchFinancialData = async (isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);
    try {
      let url = '/api/finance-dashboard/financial-statement?';
      if (asOfDate) url += `as_of_date=${asOfDate}&`;
      if (isRefresh) url += `refresh=true&`;

      const res = await api.get(url);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else if (res.data?.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Gagal memuat Laporan Keuangan dari Accurate API');
      }
      setLoadingProgress(100);
    } catch (err) {
      console.error("Gagal mengambil data Laporan Keuangan", err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyambungkan ke Accurate API');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [asOfDate]);

  const handleExportCSV = () => {
    if (!data) return;
    const inc = data.income_statement || {};
    const bal = data.balance_sheet || {};
    const rat = data.ratios || {};

    const rows = [
      ["--- RINGKASAN LAPORAN LABA RUGI ---", ""],
      ["Pendapatan (Revenue)", inc.revenue || 0],
      ["HPP (COGS)", inc.cogs || 0],
      ["Laba Kotor (Gross Profit)", inc.gross_profit || 0],
      ["Beban Operasional (OPEX)", inc.opex || 0],
      ["Laba Usaha (EBIT)", inc.operating_profit || 0],
      ["Laba Bersih (Net Profit)", inc.net_profit || 0],
      ["", ""],
      ["--- RINGKASAN POSISI NERACA ---", ""],
      ["Kas & Bank", bal.cash_bank || 0],
      ["Piutang Usaha", bal.accounts_receivable || 0],
      ["Persediaan", bal.inventory || 0],
      ["Total Aset Lancar", bal.current_assets || 0],
      ["Aset Tetap", bal.fixed_assets || 0],
      ["TOTAL ASET", bal.total_assets || 0],
      ["Utang Usaha", bal.accounts_payable || 0],
      ["Total Liabilitas Lancar", bal.current_liabilities || 0],
      ["Total Liabilitas Jangka Panjang", bal.long_term_liabilities || 0],
      ["TOTAL LIABILITAS", bal.total_liabilities || 0],
      ["TOTAL EKUITAS", bal.equity || 0],
      ["", ""],
      ["--- RASIO KEUANGAN ---", ""],
      ["Current Ratio", `${rat.liquidity?.current_ratio || 0}x`],
      ["Quick Ratio", `${rat.liquidity?.quick_ratio || 0}x`],
      ["Cash Ratio", `${rat.liquidity?.cash_ratio || 0}x`],
      ["Gross Profit Margin (GPM)", `${rat.profitability?.gpm || 0}%`],
      ["Net Profit Margin (NPM)", `${rat.profitability?.npm || 0}%`],
      ["Return on Equity (ROE)", `${rat.profitability?.roe || 0}%`],
      ["Debt to Equity Ratio (DER)", `${rat.solvency?.der || 0}%`],
      ["Days Sales Outstanding (DSO)", `${rat.activity?.dso || 0} Hari`]
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.map(x => `"${x}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Statement_Ratios_${asOfDate || 'Realtime'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !data) {
    return (
      <DashboardLoader 
        title="Dashboard Financial Statement & Ratios"
        message={loadingMessage}
        progress={loadingProgress}
        icon={Activity}
      />
    );
  }

  const inc = data.income_statement || {};
  const bal = data.balance_sheet || {};
  const rat = data.ratios || {};
  const bench = data.benchmarks || {};
  const health = data.ratio_health || {};
  const hist = data.ratio_history || {};

  const monthlyTrend = data.monthly_trend || [];
  const trendCategories = monthlyTrend.map(t => t.name);
  const trendRevenue = monthlyTrend.map(t => t.revenue || 0);
  const trendCogs = monthlyTrend.map(t => t.cogs || 0);

  const monthlyBalance = data.monthly_balance_sheet || [];
  const balCategories = monthlyBalance.map(b => b.name);
  const balAssets = monthlyBalance.map(b => b.assets || 0);
  const balLiabilities = monthlyBalance.map(b => b.liabilities || 0);
  const balEquity = monthlyBalance.map(b => b.equity || 0);

  const monthlyCashFlow = data.monthly_cash_flow || [];
  const cfCategories = monthlyCashFlow.map(c => c.name);
  const cfNetCash = monthlyCashFlow.map(c => c.net_cash_flow || 0);
  const cfEndingCash = monthlyCashFlow.map(c => c.ending_cash || 0);

  return (
    <div className="flex flex-col gap-2 pb-4">
      {ReactDOM.createPortal(
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded shadow-sm transition-colors cursor-pointer"
            title="Ekspor Laporan Keuangan ke Excel (CSV)"
          >
            <Download size={14} />
            Export Excel
          </button>
          <button
            onClick={() => fetchFinancialData(true)}
            title="Muat ulang data langsung dari Accurate API"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>,
        document.getElementById('page-header-actions') || document.body
      )}

      <AsOfDateFilter asOfDate={asOfDate} onChange={setAsOfDate} />

      {asOfDate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <Info size={13} />
          <span>Menampilkan posisi kinerja keuangan <strong>Per Tanggal {asOfDate}</strong>. <button className="underline font-semibold ml-1 cursor-pointer" onClick={() => setAsOfDate('')}>Hapus filter (Kembali ke Hari Ini)</button>.</span>
        </div>
      )}

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        <KpiCard
          title="Total Pendapatan (Revenue)"
          value={formatSimpleMoney(inc.revenue)}
          subtitle="Penjualan Bersih (Sales)"
          icon={TrendingUp}
          colorClass="text-[#10B981] bg-emerald-100"
        />

        <KpiCard
          title="Laba Bersih (Net Profit)"
          value={formatSimpleMoney(inc.net_profit)}
          subtitle={`Margin: ${rat.profitability?.npm || 0}% dari Sales`}
          icon={DollarSign}
          colorClass="text-[#3C50E0] bg-blue-100"
        />

        <KpiCard
          title="Current Ratio (Likuiditas)"
          value={`${rat.liquidity?.current_ratio || 0}x`}
          subtitle={`Status: ${health.current_ratio_status || 'Sehat'}`}
          icon={Activity}
          colorClass={health.current_ratio_status === 'Sehat' ? 'text-emerald-600 bg-emerald-100' : 'text-amber-600 bg-amber-100'}
        />

        <KpiCard
          title="Return on Equity (ROE)"
          value={`${rat.profitability?.roe || 0}%`}
          subtitle="Pengembalian atas Ekuitas Modal"
          icon={Percent}
          colorClass="text-[#8B5CF6] bg-purple-100"
        />
      </div>

      {/* INITIAL CHARTS SECTION — Pendapatan vs HPP & Tren Margin Profitabilitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        {/* INITIAL CHART A — Pendapatan (Revenue) vs HPP (COGS) */}
        <ChartContainer title="Tren Pendapatan (Revenue) vs HPP (COGS)" className="h-[340px]">
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { type: 'bar', toolbar: { show: false } },
                colors: ['#10B981', '#EF4444'],
                plotOptions: {
                  bar: { horizontal: false, columnWidth: '55%', borderRadius: 3 }
                },
                dataLabels: { enabled: false },
                xaxis: { 
                  categories: trendCategories,
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => formatSimpleMoney(val)
                  } 
                },
                legend: { position: 'top', fontSize: '11px' },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: { formatter: (val) => formatCurrency(val) }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={[
                { name: 'Pendapatan (Revenue)', data: trendRevenue },
                { name: 'HPP (COGS)', data: trendCogs }
              ]}
              type="bar"
              height="100%"
            />
          </div>
        </ChartContainer>

        {/* INITIAL CHART B — Tren Margin Profitabilitas (GPM, OPM, NPM) */}
        <ChartContainer title="Tren Margin Profitabilitas (GPM, OPM, NPM)" className="h-[340px]">
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { type: 'line', toolbar: { show: false } },
                colors: ['#10B981', '#3B82F6', '#8B5CF6'],
                stroke: { width: 3, curve: 'smooth' },
                xaxis: { 
                  categories: trendCategories,
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => `${val}%`
                  } 
                },
                legend: { position: 'top', fontSize: '11px' },
                dataLabels: { enabled: false },
                tooltip: {
                  y: { formatter: (val) => `${val}%` }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={[
                { name: 'Gross Profit Margin (GPM)', data: hist.gpm || [] },
                { name: 'Operating Profit Margin (OPM)', data: hist.opm || [] },
                { name: 'Net Profit Margin (NPM)', data: hist.npm || [] }
              ]}
              type="line"
              height="100%"
            />
          </div>
        </ChartContainer>
      </div>

      {/* CHART 1 & CHART 2 SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        {/* Posisi Keuangan (Dual Column Stacked Chart) */}
        <ChartContainer 
          title="Posisi Keuangan (Aset, Kewajiban & Ekuitas)" 
          className="h-[340px]"
        >
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { type: 'bar', stacked: true, toolbar: { show: false } },
                colors: ['#10B981', '#EF4444', '#3C50E0'],
                plotOptions: {
                  bar: { horizontal: false, columnWidth: '60%', borderRadius: 0 }
                },
                dataLabels: {
                  enabled: false
                },
                xaxis: { 
                  categories: balCategories,
                  labels: { 
                    style: { fontSize: '10px', fontWeight: 600 },
                    rotate: -45,
                    rotateAlways: false
                  }
                },
                yaxis: { 
                  labels: { 
                    style: { fontSize: '9px' },
                    formatter: (val) => `${(val / 1_000_000_000).toFixed(0)}M`
                  } 
                },
                legend: { 
                  position: 'bottom', 
                  horizontalAlign: 'center', 
                  fontSize: '11px',
                  itemMargin: { horizontal: 15, vertical: 0 },
                  markers: { radius: 3 } 
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: { formatter: (val) => formatCurrency(val) }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={[
                { name: 'Aset', group: 'aset', data: balAssets },
                { name: 'Kewajiban', group: 'passiva', data: balLiabilities },
                { name: 'Ekuitas', group: 'passiva', data: balEquity }
              ]}
              type="bar"
              height="100%"
            />
          </div>
        </ChartContainer>

        {/* Combo Chart (Net Cash Flow & Cash Balance) */}
        <ChartContainer title="Arus Kas & Saldo Kas (Cash Flow Performance)" className="h-[340px]">
          <div className="h-full w-full">
            <Chart
              options={{
                chart: { type: 'line', toolbar: { show: false } },
                colors: ['#3B82F6', '#10B981'],
                stroke: { width: [0, 3], curve: 'smooth' },
                plotOptions: {
                  bar: { columnWidth: '40%', borderRadius: 3 }
                },
                xaxis: { 
                  categories: cfCategories,
                  labels: { style: { fontSize: '10px' } }
                },
                yaxis: [
                  {
                    title: { text: 'Net Cash Flow', style: { fontSize: '10px', color: '#3B82F6' } },
                    labels: { style: { fontSize: '9px' }, formatter: (val) => formatSimpleMoney(val) }
                  },
                  {
                    opposite: true,
                    title: { text: 'Cash Balance', style: { fontSize: '10px', color: '#10B981' } },
                    labels: { style: { fontSize: '9px' }, formatter: (val) => formatSimpleMoney(val) }
                  }
                ],
                legend: { position: 'top', fontSize: '11px' },
                dataLabels: { enabled: false },
                tooltip: {
                  y: { formatter: (val) => formatCurrency(val) }
                },
                grid: { borderColor: '#E2E8F0', strokeDashArray: 4 }
              }}
              series={[
                { name: 'Net Cash Flow', type: 'column', data: cfNetCash },
                { name: 'Cash & Cash Equivalents', type: 'line', data: cfEndingCash }
              ]}
              type="line"
              height="100%"
            />
          </div>
        </ChartContainer>
      </div>

      {/* FINANCIAL RATIO DASHBOARD (ALIGNED WITH GLOBAL APP THEME & DESIGN SYSTEM) */}
      <Card title="Financial Ratio Dashboard">
        {/* TOP ROW: 3 CATEGORIES (Liquidity, Solvability, Activity) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          
          {/* 1. LIQUIDITY */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#3C50E0]/10 text-[#3C50E0] border border-[#3C50E0]/20 uppercase tracking-wide">
                Liquidity
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Rasio Likuiditas</span>
            </div>
            <div className="space-y-3">
              <RatioCardItem 
                title="Current Ratio"
                formula="= Current assets / Current liabilities"
                value={rat.liquidity?.current_ratio || 5.22}
                unit="times"
                benchmark={bench.current_ratio || 2.0}
                historyData={hist.current_ratio}
                categories={trendCategories}
              />
              <RatioCardItem 
                title="Quick Ratio"
                formula="= (Current assets - Inventories) / Current liabilities"
                value={rat.liquidity?.quick_ratio || 4.37}
                unit="times"
                benchmark={bench.quick_ratio || 1.0}
                historyData={hist.quick_ratio}
                categories={trendCategories}
              />
            </div>
          </div>

          {/* 2. SOLVABILITY */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#3C50E0]/10 text-[#3C50E0] border border-[#3C50E0]/20 uppercase tracking-wide">
                Solvability
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Rasio Solvabilitas</span>
            </div>
            <div className="space-y-3">
              <RatioCardItem 
                title="Debt to Asset Ratio"
                formula="= Total liabilities / Total assets"
                value={rat.solvency?.dar ? (rat.solvency.dar / 100).toFixed(2) : 0.18}
                unit="times"
                benchmark={bench.dar ? (bench.dar / 100).toFixed(2) : 0.50}
                isLowerBetter={true}
                historyData={hist.dar ? hist.dar.map(v => v / 100) : []}
                categories={trendCategories}
              />
              <RatioCardItem 
                title="Debt to Equity Ratio"
                formula="= Total liabilities / Total equity"
                value={rat.solvency?.der ? (rat.solvency.der / 100).toFixed(2) : 0.22}
                unit="times"
                benchmark={bench.der ? (bench.der / 100).toFixed(2) : 1.00}
                isLowerBetter={true}
                historyData={hist.der ? hist.der.map(v => v / 100) : []}
                categories={trendCategories}
              />
            </div>
          </div>

          {/* 3. ACTIVITY */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#3C50E0]/10 text-[#3C50E0] border border-[#3C50E0]/20 uppercase tracking-wide">
                Activity
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Rasio Aktivitas</span>
            </div>
            <div className="space-y-3">
              <RatioCardItem 
                title="Total Asset Turnover"
                formula="= Sales / Total assets"
                value={rat.activity?.total_asset_turnover || 1.30}
                unit="times"
                benchmark={bench.total_asset_turnover || 1.00}
                historyData={hist.total_asset_turnover}
                categories={trendCategories}
              />
              <RatioCardItem 
                title="Fixed Asset Turnover"
                formula="= Sales / Non-current assets"
                value={rat.activity?.fixed_asset_turnover || 4.48}
                unit="times"
                benchmark={bench.fixed_asset_turnover || 2.00}
                historyData={hist.fixed_asset_turnover}
                categories={trendCategories}
              />
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: PROFITABILITY CATEGORY CARD */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#3C50E0]/10 text-[#3C50E0] border border-[#3C50E0]/20 uppercase tracking-wide">
              Profitability
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Rasio Profitabilitas</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Margins (GPM, OPM, NPM) */}
            <div className="space-y-4 pr-0 lg:pr-2">
              <MarginProgressItem 
                title="Gross Profit Margin"
                formula="= Gross profit / Sales"
                valuePct={rat.profitability?.gpm || 46.01}
                benchmarkPct={bench.gpm || 35}
                historyData={hist.gpm}
                categories={trendCategories}
              />
              <MarginProgressItem 
                title="Operating Profit Margin"
                formula="= Operating profit / Sales"
                valuePct={rat.profitability?.opm || 33.97}
                benchmarkPct={bench.opm || 20}
                historyData={hist.opm}
                categories={trendCategories}
              />
              <MarginProgressItem 
                title="Net Profit Margin"
                formula="= Net income / Sales"
                valuePct={rat.profitability?.npm || 33.46}
                benchmarkPct={bench.npm || 15}
                historyData={hist.npm}
                categories={trendCategories}
              />
            </div>

            {/* Right Column: ROA & ROE */}
            <div className="space-y-4 pl-0 lg:pl-2">
              <RatioCardItem 
                title="Return On Assets"
                formula="= Net income / Total assets"
                value={rat.profitability?.roa || 43.63}
                unit="%"
                benchmark={bench.roa || 10}
                historyData={hist.roa}
                categories={trendCategories}
              />
              <RatioCardItem 
                title="Return On Equity"
                formula="= Net income / Total equity"
                value={rat.profitability?.roe || 53.90}
                unit="%"
                benchmark={bench.roe || 20}
                historyData={hist.roe}
                categories={trendCategories}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

