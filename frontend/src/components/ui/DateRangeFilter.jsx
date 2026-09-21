import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';

export default function DateRangeFilter({ 
  dateRange, 
  onChange, 
  disablePortal = false, 
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(dateRange?.startDate || '');
  const [endDate, setEndDate] = useState(dateRange?.endDate || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    setStartDate(dateRange?.startDate || '');
    setEndDate(dateRange?.endDate || '');
  }, [dateRange?.startDate, dateRange?.endDate]);

  // Handle clicking outside to close the dropdown
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
      onChange({ startDate, endDate });
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (dateRange?.startDate && dateRange?.endDate) {
      return `${dateRange.startDate} s/d ${dateRange.endDate}`;
    }
    return 'Pilih Range Tanggal';
  };

  const filterContent = (
    <div className={`relative inline-block text-left z-20 ${className}`} ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-between items-center w-full min-w-[200px] border border-stroke rounded-md px-3 sm:px-4 h-9 sm:h-10 bg-white text-boxdark text-xs sm:text-sm focus:outline-none focus:border-primary shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span className="truncate pr-3 font-medium text-slate-700">{getDisplayText()}</span>
          <Calendar size={15} className="text-gray-500 shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 w-64 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black/5 focus:outline-none border border-stroke z-50">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mulai Tanggal</label>
              <input 
                type="date" 
                className="w-full border border-stroke rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <input 
                type="date" 
                className="w-full border border-stroke rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button 
              type="button"
              onClick={handleApply}
              className="mt-2 w-full bg-primary text-white py-1.5 rounded text-sm font-semibold hover:bg-opacity-90 transition-colors cursor-pointer shadow-xs"
            >
              Terapkan
            </button>
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
