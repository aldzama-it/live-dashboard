import React from 'react';

export default function Card({ title, children, className = '', delay = 'delay-0', onClick, action }) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all duration-300' 
    : '';

  return (
    <div 
      className={`bg-white p-3 rounded-xl border border-stroke shadow-sm animate-fade-in-up min-w-0 ${delay} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-3 gap-2">
          {title && <h4 className="text-sm font-bold text-boxdark m-0">{title}</h4>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
