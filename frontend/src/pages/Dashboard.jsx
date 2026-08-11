import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Menu, DollarSign, FolderOpen, Users, TrendingUp, ChevronDown, ChevronRight, User, Settings } from 'lucide-react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import api from '../axios';
import { useCountUp } from '../hooks/useCountUp';
import { menuData } from '../menuData';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ChartContainer from '../components/ui/ChartContainer';
import PageHeader from '../components/ui/PageHeader';

// Import Division Components
import BusinessDevelopment from './divisions/sales-engineering/BusinessDevelopment';
import Trading from './divisions/sales-engineering/Trading';
import Marketing from './divisions/sales-engineering/Marketing';
import Engineering from './divisions/sales-engineering/Engineering';

import SiteOperations from './divisions/operations/SiteOperations';
import ProjectControl from './divisions/operations/ProjectControl';
import HSE from './divisions/operations/HSE';

import AdHoc from './divisions/projects/AdHoc';
import Fabrication from './divisions/projects/Fabrication';

import AssetMaintenance from './divisions/asset-logistics/AssetMaintenance';
import Transport from './divisions/asset-logistics/Transport';
import Procurement from './divisions/asset-logistics/Procurement';
import Warehouse from './divisions/asset-logistics/Warehouse';

import OfficeSupport from './divisions/general-affairs/OfficeSupport';
import ExternalRelation from './divisions/general-affairs/ExternalRelation';
import ExportImport from './divisions/general-affairs/ExportImport';

import Finance from './divisions/finance-admin/Finance';
import HRD from './divisions/finance-admin/HRD';
import QMSAudit from './divisions/finance-admin/QMSAudit';
import Legal from './divisions/finance-admin/Legal';
import ITSystem from './divisions/finance-admin/ITSystem';

// Import Admin Pages
import UserManagement from './UserManagement';

// Placeholder Component for main dashboard overview
function MainOverview({ user }) {
  const revenueCount = useCountUp(1250, 800);
  const projectsCount = useCountUp(42, 800);
  const teamCount = useCountUp(128, 800);
  const location = useLocation();
  const deptName = "Overview";
  const divName = "Main Dashboard";

  return (
    <>
      {/* KPI Cards Grid - Staggered reveal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-1 gap-x-2 md:gap-y-1 gap-x-2 mb-3">

        {/* Welcome Card */}
        <KpiCard
          value={divName || 'Welcome!'}
          subtitle={deptName}
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
            <p className="text-sm opacity-70">(Data visualization placeholder for {divName || 'Dashboard'})</p>
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

export default function Dashboard({ user, setUser }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  // RBAC logic for sidebar
  const isAdmin = user?.roles?.some(r => r.name === 'Admin');
  const isTopManagement = user?.roles?.some(r => r.name === 'Top Management');
  const isPIC = user?.roles?.some(r => r.name === 'Division PIC');

  const filteredMenuData = menuData.map(dept => {
    if (isAdmin || isTopManagement) return dept;
    if (isPIC && user?.department) {
       const matchingDivisions = dept.divisions.filter(d => 
         d.name.toLowerCase() === user.department.name.toLowerCase()
       );
       if (matchingDivisions.length > 0) {
          return { ...dept, divisions: matchingDivisions };
       }
       return null;
    }
    // Fallback: if no role matches correctly, show nothing
    return null;
  }).filter(Boolean);


  // Handle window resize to auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Accordion state
  const [expandedDept, setExpandedDept] = useState(null);
  const [expandedDiv, setExpandedDiv] = useState(null);

  // Sync expanded state with current URL
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 1) {
      const currentDeptPath = pathParts[0];
      const deptIndex = filteredMenuData.findIndex(d => d.pathPrefix === currentDeptPath);
      if (deptIndex !== -1) {
        setExpandedDept(deptIndex);
        if (pathParts.length >= 2) {
          const currentDivPath = pathParts[1];
          const divIndex = filteredMenuData[deptIndex].divisions.findIndex(div => div.path === currentDivPath);
          if (divIndex !== -1) {
            setExpandedDiv(divIndex);
          }
        }
      }
    } else {
      // Root URL, reset
      setExpandedDept(null);
      setExpandedDiv(null);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeptClick = (index) => {
    if (isCollapsed) {
      setIsCollapsed(false); // Auto-expand sidebar if interacting while collapsed
    }
    setExpandedDept(expandedDept === index ? null : index);
    // Reset division when changing dept
    if (expandedDept !== index) {
      setExpandedDiv(null);
    }
  };

  const handleDivClick = (index) => {
    setExpandedDiv(expandedDiv === index ? null : index);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in-up"
          style={{ animationDuration: '0.2s', transform: 'none' }}
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-stroke text-boxdark flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-50 md:z-30 h-full ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-72'
          }`}
      >
        <div className="p-2 text-center border-b border-stroke flex items-center justify-center h-[76px]">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 w-full justify-start pl-2">
              <img src="/Symbol.png" alt="PT Aldzama" className="w-15 h-15 object-contain" />
              <h2 className="text-lg font-bold text-boxdark text-left leading-tight">
                Dashboard<br />
                <span className="text-sm font-normal text-body">PT. Aldzama</span>
              </h2>
            </div>
          ) : (
            <img src="/Symbol.png" alt="PT Aldzama" className="w-9 h-9 object-contain" />
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Main Dashboard Link */}
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all mb-4 ${location.pathname === '/' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
              }`}
            title="Main Dashboard"
            onClick={() => {
              if (isCollapsed && window.innerWidth >= 768) {
                setIsCollapsed(false);
              } else if (window.innerWidth < 768) {
                setIsCollapsed(true);
              }
            }}
          >
            <div className="flex-shrink-0">
              <LayoutDashboard size={20} />
            </div>
            <span className={`whitespace-nowrap font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
              Main Dashboard
            </span>
          </Link>

          {/* Dynamic 3-level Menu (RBAC filtered) */}
          {filteredMenuData.map((dept, deptIndex) => {
            const isDeptExpanded = expandedDept === deptIndex && !isCollapsed;
            const isDeptActive = location.pathname.startsWith(`/${dept.pathPrefix}`);
            const Icon = dept.icon;

            return (
              <div key={deptIndex} className="mb-1">
                {/* Level 1: Department */}
                <button
                  onClick={() => handleDeptClick(deptIndex)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-all ${isDeptActive && !isDeptExpanded ? 'text-primary font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
                    }`}
                  title={dept.name}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isDeptActive ? 'text-primary' : ''} />
                    <span className={`whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
                      {dept.name}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div className="text-gray-400">
                      {isDeptExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  )}
                </button>

                {/* Level 2: Divisions */}
                {isDeptExpanded && (
                  <div className="mt-1 flex flex-col gap-1 pl-11 pr-2 animate-fade-in-up delay-0" style={{ animationDuration: '0.2s' }}>
                    {dept.divisions.map((div, divIndex) => {
                      const isDivExpanded = expandedDiv === divIndex;
                      const isDivActive = location.pathname.includes(`/${dept.pathPrefix}/${div.path}`);

                      return (
                        <div key={divIndex}>
                          <button
                            onClick={() => handleDivClick(divIndex)}
                            className={`w-full flex items-center justify-between py-2 text-left transition-all ${isDivActive ? 'text-primary font-medium' : 'text-gray-500 hover:text-primary'
                              }`}
                          >
                            <span className="text-sm">{div.name}</span>
                            <div className="text-gray-500">
                              {isDivExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          </button>

                          {/* Level 3: Pages */}
                          {isDivExpanded && (
                            <div className="mt-1 flex flex-col gap-1 pl-4 border-l border-stroke ml-1 py-1">
                              {div.pages.map((page, pageIndex) => {
                                const pagePath = `/${dept.pathPrefix}/${div.path}/${page.path}`;
                                const isPageActive = location.pathname === pagePath;

                                return (
                                  <Link
                                    key={pageIndex}
                                    to={pagePath}
                                    onClick={() => {
                                      if (window.innerWidth < 768) setIsCollapsed(true);
                                    }}
                                    className={`py-1.5 px-3 rounded-md text-sm transition-all ${isPageActive
                                      ? 'bg-primary text-white font-medium'
                                      : 'text-gray-500 hover:text-primary hover:bg-gray-100'
                                      }`}
                                  >
                                    {page.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Appears first */}
        <header className="bg-white shadow-sm border-b border-stroke flex items-center justify-between px-6 h-[76px] animate-fade-in-up delay-0 relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-body hover:text-primary rounded-full hover:bg-gray-100 transition block"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-boxdark">
              Live Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-boxdark">{user?.name}</span>
              <span className="block text-xs text-body">
                {user?.roles?.[0]?.name || 'User'} - {user?.department?.name || 'No Division'}
              </span>
            </div>

            {/* Profile Toggle Button */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1 p-1.5 text-body hover:text-primary rounded-full hover:bg-gray-100 transition"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <User size={18} />
              </div>
              <ChevronDown size={16} className={`hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-stroke py-2 z-50 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsProfileOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-boxdark hover:bg-gray-50 transition">
                    <User size={16} /> Profile
                  </a>

                  {/* Settings only for admin */}
                  {isAdmin && (
                    <Link to="/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-boxdark hover:bg-gray-50 transition">
                      <Users size={16} /> User Management
                    </Link>
                  )}

                  <div className="border-t border-stroke my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-gray-50 transition"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {location.pathname !== '/' && (
            <PageHeader 
              title={(() => {
                const parts = location.pathname.split('/').filter(Boolean);
                if (location.pathname.startsWith('/users')) return "User Management";
                const dept = menuData.find(d => d.pathPrefix === parts[0]);
                if (dept) {
                  const div = dept.divisions.find(d => d.path === parts[1]);
                  return div ? div.name : dept.name;
                }
                return "Overview";
              })()} 
              subtitle={(() => {
                if (location.pathname.includes('/finance-admin/it-system')) {
                  return "Overview of IT Infrastructure, Digital Assets, and Service Operations.";
                }
                return null;
              })()}
            />
          )}
          <Routes>
            <Route path="/" element={<MainOverview user={user} />} />
            
            {/* Sales & Engineering */}
            <Route path="/sales-engineering/business-development/overview" element={<BusinessDevelopment user={user} />} />
            <Route path="/sales-engineering/trading/overview" element={<Trading user={user} />} />
            <Route path="/sales-engineering/marketing/overview" element={<Marketing user={user} />} />
            <Route path="/sales-engineering/engineering/overview" element={<Engineering user={user} />} />

            {/* Operations */}
            <Route path="/operations/site-operations/overview" element={<SiteOperations user={user} />} />
            <Route path="/operations/project-control/overview" element={<ProjectControl user={user} />} />
            <Route path="/operations/hse/overview" element={<HSE user={user} />} />

            {/* Projects */}
            <Route path="/projects/ad-hoc/overview" element={<AdHoc user={user} />} />
            <Route path="/projects/fabrication/overview" element={<Fabrication user={user} />} />

            {/* Asset & Logistics */}
            <Route path="/asset-logistics/asset-maintenance/overview" element={<AssetMaintenance user={user} />} />
            <Route path="/asset-logistics/transport/overview" element={<Transport user={user} />} />
            <Route path="/asset-logistics/procurement/overview" element={<Procurement user={user} />} />
            <Route path="/asset-logistics/warehouse/overview" element={<Warehouse user={user} />} />

            {/* General Affairs */}
            <Route path="/general-affairs/office-support/overview" element={<OfficeSupport user={user} />} />
            <Route path="/general-affairs/external-relation/overview" element={<ExternalRelation user={user} />} />
            <Route path="/general-affairs/export-import/overview" element={<ExportImport user={user} />} />

            {/* Finance & Administration */}
            <Route path="/finance-admin/finance/overview" element={<Finance user={user} />} />
            <Route path="/finance-admin/hrd/overview" element={<HRD user={user} />} />
            <Route path="/finance-admin/qms-audit/overview" element={<QMSAudit user={user} />} />
            <Route path="/finance-admin/legal/overview" element={<Legal user={user} />} />
            <Route path="/finance-admin/it-system/overview" element={<ITSystem user={user} />} />

            {/* Admin Routes */}
            {isAdmin && (
              <Route path="/users" element={<UserManagement user={user} />} />
            )}

            {/* Catch all to redirect back to root if path not found */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

    </div>
  );
}
