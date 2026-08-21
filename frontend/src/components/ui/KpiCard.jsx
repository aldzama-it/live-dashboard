import Card from './Card';

export default function KpiCard({
  title,
  value,
  subtitle,
  notes,
  icon: Icon,
  colorClass = 'text-primary bg-primary/10',
  delay = '',
  onClick,
  action
}) {
  return (
    <Card delay={delay} className={`flex flex-col h-full relative ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-3 mb-1.5">
        <div className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-full ${colorClass}`}>
          {Icon && <Icon size={18} />}
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          {title && (
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</p>
          )}
          <h4 className="text-base md:text-lg font-bold text-boxdark truncate leading-none mt-0.5">{value}</h4>
        </div>
        {action && (
          <div className="absolute top-2 right-2">
            {action}
          </div>
        )}
      </div>

      {(subtitle || notes) && (
        <div className="mt-auto pt-1.5 border-t border-stroke text-[10px] flex items-center justify-between">
          {subtitle && <span className="text-body font-medium truncate">{subtitle}</span>}
          {notes && <span className="text-gray-400 ml-2 whitespace-nowrap">{notes}</span>}
        </div>
      )}
    </Card>
  );
}
