import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function DashboardLoader({ 
  title = "Memuat Data...", 
  message = "Sedang mengambil data dari server...", 
  progress = null, 
  icon: Icon = Activity 
}) {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-full max-w-md bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
        {/* Animated Ring & Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Icon className="absolute text-primary" size={24} />
        </div>

        {/* Title & Status Message */}
        <div className="w-full">
          <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-500 transition-all duration-300 min-h-[20px] flex items-center justify-center">
            {message}
          </p>
        </div>

        {/* Progress Bar (Visible if progress is specified) */}
        {progress !== null && progress !== undefined && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-100">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-0.5">
              <span>Accurate Sync</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
