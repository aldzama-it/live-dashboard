import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-boxdark">{title}</h2>
        {subtitle && <p className="text-sm text-body mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        {children}
        <div id="page-header-actions" className="flex items-center gap-1"></div>
      </div>
    </div>
  );
}
