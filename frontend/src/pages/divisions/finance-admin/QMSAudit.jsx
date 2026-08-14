import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_QMS_SERVICE_URL = 'http://127.0.0.1:5002';

const MONTHS = [
  { value: '1', label: 'Januari 2026' },
  { value: '2', label: 'Februari 2026' },
  { value: '3', label: 'Maret 2026' },
  { value: '4', label: 'April 2026' },
  { value: '5', label: 'Mei 2026' },
  { value: '6', label: 'Juni 2026' },
  { value: '7', label: 'Juli 2026' },
  { value: '8', label: 'Agustus 2026' },
  { value: '9', label: 'September 2026' },
  { value: '10', label: 'Oktober 2026' },
  { value: '11', label: 'November 2026' },
  { value: '12', label: 'Desember 2026' },
];

function getInitialMonth() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = Number(params.get('month'));

  if (fromUrl >= 1 && fromUrl <= 12) {
    return String(fromUrl);
  }

  const currentMonth = new Date().getMonth() + 1;

  if (currentMonth >= 1 && currentMonth <= 12) {
    return String(currentMonth);
  }

  return '8';
}

export default function QMSAudit() {
  const [month, setMonth] = useState(getInitialMonth);
  const [headerActions, setHeaderActions] = useState(null);

  const configuredUrl =
    import.meta.env.VITE_QMS_SERVICE_URL ||
    DEFAULT_QMS_SERVICE_URL;

  const qmsServiceUrl = configuredUrl.replace(/\/$/, '');

  useEffect(() => {
    const findHeaderActions = () => {
      setHeaderActions(
        document.getElementById('page-header-actions')
      );
    };

    findHeaderActions();

    const timer = window.setTimeout(findHeaderActions, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    url.searchParams.set('month', month);

    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [month]);

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      embed: '1',
      month,
    });

    return `${qmsServiceUrl}/live-kpi?${params.toString()}`;
  }, [qmsServiceUrl, month]);

  const monthFilter = (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-500">
        Periode
      </span>

      <div className="relative">
        <select
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          aria-label="Filter bulan QMS"
          className="
            h-10 min-w-[170px]
            cursor-pointer
            rounded-lg
            border border-slate-200
            bg-white
            px-3 pr-9
            text-sm font-semibold
            text-slate-700
            shadow-sm
            outline-none
            transition
            hover:border-slate-300
            focus:border-indigo-500
            focus:ring-2
            focus:ring-indigo-100
          "
        >
          {MONTHS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      {headerActions &&
        createPortal(monthFilter, headerActions)}

      <div className="-mt-3 w-full min-w-0 overflow-hidden">
        <div className="h-[calc(100dvh-132px)] min-h-0 w-full overflow-hidden bg-gray-50">
          <iframe
            key={dashboardUrl}
            title="QMS Executive Dashboard"
            src={dashboardUrl}
            className="h-full w-full border-0 bg-gray-50"
            allow="fullscreen"
          />
        </div>
      </div>
    </>
  );
}
