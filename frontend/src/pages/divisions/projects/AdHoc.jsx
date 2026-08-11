import React from 'react';
import { Users, DollarSign, FolderOpen, TrendingUp } from 'lucide-react';
import { useCountUp } from '../../../hooks/useCountUp';
import Card from '../../../components/ui/Card';
import KpiCard from '../../../components/ui/KpiCard';
import ChartContainer from '../../../components/ui/ChartContainer';
import MonthFilter from '../../../components/ui/MonthFilter';

export default function AdHoc({ user }) {
  const revenueCount = useCountUp(1250, 800);
  const projectsCount = useCountUp(42, 800);
  const teamCount = useCountUp(128, 800);

  return (
    <>
      <MonthFilter />
      {/* KPI Cards Grid - Staggered reveal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-1 gap-x-2 md:gap-y-1 gap-x-2 mb-3">
        
        {/* Welcome Card */}
        <KpiCard
          value="AdHoc"
          subtitle="Projects"
          icon={Users}
          colorClass="text-primary bg-primary/10"
          delay="delay-0"
        />

        {/* Mock KPI 1 */}
        <KpiCard
          title="Total Revenue"
          value={`$${revenueCount.toLocaleString()}k`}
          subtitle="Total Revenue"
          icon={DollarSign}
          colorClass="text-[#10B981] bg-success/10"
          delay="delay-75"
        />

        {/* Mock KPI 2 */}
        <KpiCard
          title="Active Projects"
          value={projectsCount}
          subtitle="Active Projects"
          icon={FolderOpen}
          colorClass="text-[#F59E0B] bg-warning/10"
          delay="delay-150"
        />

        {/* Mock KPI 3 */}
        <KpiCard
          title="Team Members"
          value={teamCount}
          subtitle="Team Members"
          icon={Users}
          colorClass="text-[#3C50E0] bg-secondary/10"
          delay="delay-225"
        />

      </div>

      {/* Main Chart/Insights Area - Appears after KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-1 gap-x-2">
        <ChartContainer title="Revenue Growth Chart" delay="delay-300" className="lg:col-span-2">
          <div className="flex flex-col justify-center items-center text-body h-full min-h-[200px]">
            <TrendingUp size={48} className="text-gray-300 mb-4" />
            <p className="text-sm opacity-70">(Data visualization placeholder for AdHoc)</p>
          </div>
        </ChartContainer>

        <Card title="Executive Insights" delay="delay-300" className="flex flex-col">
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-gray-50 rounded border border-gray-100">
              <p className="text-sm text-boxdark font-medium">Revenue up 15%</p>
              <p className="text-xs text-body mt-1">Compared to last quarter performance.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded border border-gray-100">
              <p className="text-sm text-boxdark font-medium">3 Projects at risk</p>
              <p className="text-xs text-body mt-1">Logistics division reporting delays.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
