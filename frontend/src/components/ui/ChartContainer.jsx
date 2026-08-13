import Card from './Card';

export default function ChartContainer({ 
  title, 
  children, 
  delay = '',
  className = '',
  action = null
}) {
  return (
    <Card delay={delay} className={`flex flex-col min-h-[260px] ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold text-boxdark">{title}</h4>
          {action && <div>{action}</div>}
        </div>
      )}
      
      <div className="flex-1 w-full relative">
        {/* The wrapper handles sizing for responsive charting libraries like Recharts */}
        <div className="absolute inset-0">
          {children}
        </div>
      </div>
    </Card>
  );
}
