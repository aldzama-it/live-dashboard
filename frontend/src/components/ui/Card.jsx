import React from 'react';

export default function Card({ title, children, className = '', delay = 'delay-0', onClick, action }) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all duration-300' 
    : '';

  const hasHeader = Boolean(title || action);

  return (
    <div 
      className={`bg-white rounded-xl border border-stroke shadow-sm animate-fade-in-up min-w-0 flex flex-col overflow-hidden ${delay} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {hasHeader && (
        <div className="flex justify-between items-center px-3 pt-3 pb-2 gap-2 shrink-0 bg-white z-10 border-b border-gray-100">
          {title && <h4 className="text-sm font-bold text-boxdark m-0">{title}</h4>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 p-3 min-h-0 flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

