import { useLoomContext } from '../context/LoomContext';
import { formatMeters, formatPercent } from '../utils/helpers';

export default function MeterProgress({ label, current, total, tone = 'cyan' }) {
  const { theme } = useLoomContext();
  const progress = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const accent = {
    cyan: 'from-cyan-400 to-sky-500',
    emerald: 'from-emerald-400 to-green-500',
    amber: 'from-amber-400 to-yellow-500',
    red: 'from-red-400 to-rose-500',
  }[tone] || 'from-cyan-400 to-sky-500';

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className={`mb-3 flex items-center justify-between gap-4 text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
        <span className={`font-medium uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <span className={theme === 'light' ? 'text-cyan-600' : 'text-cyan-300'}>{formatPercent(progress / 100)}</span>
      </div>
      <div className={`meter-track h-4 overflow-hidden rounded-full ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${progress}%` }} />
      </div>
      <div className={`mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
        <span>{formatMeters(current)} m</span>
        <span>{formatMeters(total)} m</span>
      </div>
    </div>
  );
}
