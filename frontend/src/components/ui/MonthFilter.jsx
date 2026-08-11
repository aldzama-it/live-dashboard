import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const availableMonths = [
  'Agustus 2026',
  'Juli 2026',
  'Juni 2026'
];

export default function MonthFilter({ selectedMonths, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalMonths, setInternalMonths] = useState(['Agustus 2026']);
  const dropdownRef = useRef(null);

  const activeMonths = selectedMonths || internalMonths;

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

  const toggleMonth = (month) => {
    let newMonths;
    if (activeMonths.includes(month)) {
      newMonths = activeMonths.filter(m => m !== month);
    } else {
      newMonths = [...activeMonths, month];
    }
    
    if (onChange) {
      onChange(newMonths);
    } else {
      setInternalMonths(newMonths);
    }
  };

  const getDisplayText = () => {
    if (!activeMonths || activeMonths.length === 0) return 'Select Months';
    if (activeMonths.length === 1) return activeMonths[0];
    if (activeMonths.length === availableMonths.length) return 'All Months';
    return `${activeMonths.length} Months Selected`;
  };

  const filterContent = (
    <div className="relative inline-block text-left z-20" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-between items-center w-full min-w-[160px] border border-stroke rounded-md px-4 h-10 bg-white text-boxdark text-sm focus:outline-none focus:border-primary shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="truncate pr-4">{getDisplayText()}</span>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-stroke">
          <div className="py-1">
            {availableMonths.map((month) => {
              const isSelected = activeMonths && activeMonths.includes(month);
              return (
                <div
                  key={month}
                  onClick={() => toggleMonth(month)}
                  className="flex items-center px-4 py-2.5 text-sm text-boxdark hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`mr-3 flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  {month}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const targetNode = document.getElementById('page-header-actions');
  if (targetNode) {
    return ReactDOM.createPortal(filterContent, targetNode);
  }

  return filterContent;
}
