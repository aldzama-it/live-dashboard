import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToExcel, exportToCsv } from '../../utils/exportUtils';

/**
 * Reusable Export Button dengan opsi Excel (.xlsx) dan CSV (.csv)
 * Menghasilkan file yang bersih, rapi, dan langsung terformat di Microsoft Excel
 */
export default function ExportButton({
  filename = 'export_data',
  sheetName = 'Data',
  headers = [],
  rows = [],
  className = '',
  buttonLabel = 'Export Data',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    exportToExcel(filename, sheetName, headers, rows);
    setIsOpen(false);
  };

  const handleExportCsv = () => {
    exportToCsv(filename, headers, rows);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div className="inline-flex rounded-lg shadow-2xs border border-slate-300 bg-white hover:border-slate-400 transition-colors">
        {/* Tombol Utama: Langsung Ekspor ke Excel (.xlsx) */}
        <button
          type="button"
          onClick={handleExportExcel}
          title="Unduh sebagai file Excel (.xlsx) rapi dengan lebar kolom otomatis"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-l-lg transition-colors cursor-pointer"
        >
          <FileSpreadsheet size={13} className="text-emerald-600" />
          <span>{buttonLabel}</span>
        </button>

        {/* Tombol Dropdown Opsi Format */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Pilih format ekspor (Excel atau CSV)"
          className="px-1.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-l border-slate-200 rounded-r-lg transition-colors cursor-pointer flex items-center justify-center"
        >
          <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu Dropdown Pilihan Format */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Format Unduhan</span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full px-3 py-2 text-left hover:bg-emerald-50/60 flex items-start gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700 shrink-0 mt-0.5 group-hover:bg-emerald-200/80 transition-colors">
              <FileSpreadsheet size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 flex items-center gap-1.5">
                <span>Microsoft Excel</span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">.xlsx</span>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                Rapi, kolom otomatis & siap dipresentasikan (Rekomendasi).
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full px-3 py-2 text-left hover:bg-blue-50/60 flex items-start gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700 shrink-0 mt-0.5 group-hover:bg-blue-200/80 transition-colors">
              <FileText size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-800 flex items-center gap-1.5">
                <span>File Teks CSV</span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">.csv</span>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                Pemisah titik-koma (;) UTF-8 kompatibel Excel Windows.
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
