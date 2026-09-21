import React from 'react';
import Card from './Card';

export default function ChartContainer({ 
  title, 
  children, 
  delay = '',
  className = '',
  action = null
}) {
  return (
    <Card title={title} action={action} delay={delay} className={`flex flex-col min-h-[260px] ${className}`}>
      <div className="flex-1 w-full relative min-h-[200px]">
        <div className="absolute inset-0 flex flex-col">
          {children}
        </div>
      </div>
    </Card>
  );
}
