import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';

export default function AsOfDateFilter({ 
  asOfDate, 
  onChange, 
  disablePortal = false, 
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateVal, setDateVal] = useState(asOfDate || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    setDateVal(asOfDate || '');
  }, [asOfDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    if (onChange) {
      onChange(dateVal);
    }
    setIsOpen(false);
  };

  const handleResetToday = () => {
    setDateVal('');
    if (onChange) {
      onChange('');
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (asOfDate) {
      const parts = asOfDate.split('-');
      if (parts.length === 3) {
        return `Per Tanggal: ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return `Per Tanggal: ${asOfDate}`;
    }
    return 'Per Tanggal: Hari Ini (Real-time)';
  };

  const filterContent = (
    <div className={`relative inline-block text-left z-20 ${className}`} ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-between items-center w-full min-w-[210px] border border-stroke rounded-md px-3 sm:px-4 h-9 sm:h-10 bg-white text-boxdark text-xs sm:text-sm focus:outline-none focus:border-primary shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span className="truncate pr-2 font-semibold text-slate-700">{getDisplayText()}</span>
          <Calendar size={15} className="text-gray-500 shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 w-64 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black/5 focus:outline-none border border-stroke z-50">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Posisi Cut-off Per Tanggal</label>
              <input 
                type="date" 
                className="w-full border border-stroke rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleApply}
                className="flex-1 bg-primary text-white py-1.5 rounded text-xs font-semibold hover:bg-opacity-90 transition-colors cursor-pointer shadow-xs"
              >
                Terapkan
              </button>
              <button 
                type="button"
                onClick={handleResetToday}
                className="px-3 bg-gray-100 text-gray-700 border border-gray-300 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const targetNode = document.getElementById('page-header-actions');
  if (!disablePortal && targetNode) {
    return ReactDOM.createPortal(filterContent, targetNode);
  }

  return filterContent;
}
