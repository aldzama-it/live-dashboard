import Card from './Card';

export default function KpiCard({
  title,
  value,
  subtitle,
  notes,
  icon: Icon,
  colorClass = 'text-primary bg-primary/10',
  delay = ''
}) {
  return (
    <Card delay={delay} className="flex flex-col">
      <div className={`flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-full mb-3 md:mb-4 ${colorClass}`}>
        {Icon && <Icon size={20} className="md:w-[22px] md:h-[22px]" />}
      </div>
      
      <div className="flex-1">
        {title && (
          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{title}</p>
        )}
        <h4 className="text-xl md:text-2xl font-bold text-boxdark mb-1 truncate">{value}</h4>
        <p className="text-xs md:text-sm font-medium text-body truncate">{subtitle}</p>
      </div>

      {notes && (
        <div className="mt-4 pt-3 border-t border-stroke text-xs text-gray-400">
          {notes}
        </div>
      )}
    </Card>
  );
}
