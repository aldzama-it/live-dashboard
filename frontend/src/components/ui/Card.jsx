export default function Card({ children, className = '', delay = '', title }) {
  const delayClass = delay ? `animate-fade-in-up ${delay}` : '';
  
  return (
    <div className={`bg-white rounded-xl border border-stroke p-4 md:p-6 shadow-sm ${delayClass} ${className}`}>
      {title && (
        <h4 className="text-lg font-bold text-boxdark mb-4">{title}</h4>
      )}
      {children}
    </div>
  );
}
