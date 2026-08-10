import React from 'react';

export default function Card({ title, children, className = '', delay = 'delay-0', onClick }) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all duration-300' 
    : '';

  return (
    <div 
      className={`bg-white p-6 rounded-xl border border-stroke shadow-sm animate-fade-in-up ${delay} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <h4 className="text-lg font-bold text-boxdark mb-4">{title}</h4>
      )}
      {children}
    </div>
  );
}
