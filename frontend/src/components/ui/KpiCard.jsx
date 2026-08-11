import Card from './Card';

export default function KpiCard({
  title,
  value,
  subtitle,
  notes,
  icon: Icon,
  colorClass = 'text-primary bg-primary/10',
  delay = '',
  onClick
}) {
  return (
    <Card delay={delay} className={`flex flex-col h-full ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-4 mb-2">
        <div className={`flex shrink-0 h-11 w-11 items-center justify-center rounded-full ${colorClass}`}>
          {Icon && <Icon size={22} />}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">{title}</p>
          )}
          <h4 className="text-lg md:text-xl font-bold text-boxdark truncate leading-none mt-1">{value}</h4>
        </div>
      </div>

      {(subtitle || notes) && (
        <div className="mt-auto pt-2 border-t border-stroke text-[11px] flex items-center justify-between">
          {subtitle && <span className="text-body font-medium truncate">{subtitle}</span>}
          {notes && <span className="text-gray-400 ml-2 whitespace-nowrap">{notes}</span>}
        </div>
      )}
    </Card>
  );
}
