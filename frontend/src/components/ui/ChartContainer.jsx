import React from 'react';
import Card from './Card';

export default function ChartContainer({ 
  title, 
  children, 
  delay = '',
  className = '',
  action = null,
  bodyClassName = 'overflow-hidden p-2.5'
}) {
  return (
    <Card title={title} action={action} delay={delay} bodyClassName={bodyClassName} className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex-1 w-full relative min-h-0">
        <div className="absolute inset-0 flex flex-col">
          {children}
        </div>
      </div>
    </Card>
  );
}

