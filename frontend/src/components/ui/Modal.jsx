import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-2xl",
  allowFullscreen = true,
  zIndex = "z-[9999]",
  onBack = null,
  backText = "Kembali",
  backTitle = "Kembali"
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset fullscreen when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-3 sm:p-6'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className={`relative w-full bg-white flex flex-col transition-all duration-200 shadow-2xl ${
          isFullscreen 
            ? 'w-screen h-screen max-w-none max-h-screen rounded-none z-10' 
            : `${maxWidth} max-h-[92vh] rounded-xl animate-fade-in-up`
        }`}
        style={!isFullscreen ? { animationDuration: '0.2s' } : {}}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b border-stroke bg-gray-50/90 backdrop-blur-xs ${isFullscreen ? 'rounded-none' : 'rounded-t-xl'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-primary rounded-lg border border-slate-300 shadow-xs hover:shadow transition-all text-xs font-semibold cursor-pointer group shrink-0"
                title={backTitle || "Kembali"}
              >
                <ArrowLeft size={15} className="text-slate-500 group-hover:text-primary transition-transform group-hover:-translate-x-0.5" />
                <span>{backText || "Kembali"}</span>
              </button>
            )}
            <h3 className="text-base sm:text-lg font-bold text-boxdark flex items-center gap-2 truncate">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {allowFullscreen && (
              <button 
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title={isFullscreen ? "Kembalikan Ukuran Normal" : "Perbesar Layar Penuh (Fullscreen)"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 ${isFullscreen ? 'max-h-[calc(100vh-60px)]' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

