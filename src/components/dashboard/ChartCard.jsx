import { MoreVertical } from 'lucide-react';

const trendColors = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-amber-400',
};

const TrendIndicator = ({ value, label }) => {
  const numeric = Number(value);
  const isNumber = Number.isFinite(numeric);
  const direction = !isNumber || numeric === 0 ? 'neutral' : numeric > 0 ? 'positive' : 'negative';
  const formatted = isNumber ? `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%` : value;
  return (
    <div className={`mt-6 flex items-center gap-2 text-sm font-medium ${trendColors[direction]}`}>
      <span>{formatted}</span>
      <span className="text-slate-400">{label}</span>
    </div>
  );
};

const ChartCard = ({
  title,
  icon: Icon,
  primaryValue,
  primaryHelper,
  trend = { value: 0, label: 'vs período anterior' },
  children,
  className = ''
}) => {
  return (
    <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 bg-slate-800 rounded-2xl shadow p-4 flex flex-col ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{primaryValue}</p>
          {primaryHelper && (
            <p className="mt-1 text-sm text-slate-400">{primaryHelper}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-2 rounded-xl bg-slate-800/70 text-slate-200 shadow-inner">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label={`Ações para ${title}`}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-6 flex-1 min-h-[18rem]">{children}</div>
      <TrendIndicator value={trend.value} label={trend.label} />
    </div>
  );
};

export default ChartCard;
