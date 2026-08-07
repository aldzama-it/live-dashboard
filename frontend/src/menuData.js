import { Briefcase, Cog, FolderKanban, Package, Building2, Calculator } from 'lucide-react';

export const menuData = [
  {
    name: "Sales & Engineering",
    icon: Briefcase,
    pathPrefix: "sales-engineering",
    divisions: [
      { name: "Business Development", path: "business-development", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Trading", path: "trading", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Marketing & Communication", path: "marketing", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Engineering", path: "engineering", pages: [{ name: "Overview", path: "overview" }] }
    ]
  },
  {
    name: "Operations",
    icon: Cog,
    pathPrefix: "operations",
    divisions: [
      { name: "Site Operations", path: "site-operations", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Project Control", path: "project-control", pages: [{ name: "Overview", path: "overview" }] },
      { name: "HSE", path: "hse", pages: [{ name: "Overview", path: "overview" }] }
    ]
  },
  {
    name: "Projects",
    icon: FolderKanban,
    pathPrefix: "projects",
    divisions: [
      { name: "Ad-Hoc Projects", path: "ad-hoc", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Fabrication & Hydraulic", path: "fabrication", pages: [{ name: "Overview", path: "overview" }] }
    ]
  },
  {
    name: "Asset & Logistics",
    icon: Package,
    pathPrefix: "asset-logistics",
    divisions: [
      { name: "Asset Maintenance", path: "asset-maintenance", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Transport", path: "transport", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Procurement", path: "procurement", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Warehouse", path: "warehouse", pages: [{ name: "Overview", path: "overview" }] }
    ]
  },
  {
    name: "General Affairs",
    icon: Building2,
    pathPrefix: "general-affairs",
    divisions: [
      { name: "Office Support", path: "office-support", pages: [{ name: "Overview", path: "overview" }] },
      { name: "External Relation", path: "external-relation", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Export & Import", path: "export-import", pages: [{ name: "Overview", path: "overview" }] }
    ]
  },
  {
    name: "Finance & Administration",
    icon: Calculator,
    pathPrefix: "finance-admin",
    divisions: [
      { name: "Finance, Accounting & Tax", path: "finance", pages: [{ name: "Overview", path: "overview" }] },
      { name: "HRD", path: "hrd", pages: [{ name: "Overview", path: "overview" }] },
      { name: "QMS & Audit", path: "qms-audit", pages: [{ name: "Overview", path: "overview" }] },
      { name: "Legal & Document Control", path: "legal", pages: [{ name: "Overview", path: "overview" }] },
      { name: "IT & System", path: "it-system", pages: [{ name: "Overview", path: "overview" }] }
    ]
  }
];
