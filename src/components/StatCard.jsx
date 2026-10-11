import { useLoomContext } from '../context/LoomContext';

export default function StatCard({ title, value, accent = 'cyan' }) {
  const { theme } = useLoomContext();

  const accentMap = {
    cyan: theme === 'light' ? 'from-cyan-100 to-sky-50 text-cyan-700' : 'from-cyan-500/20 to-sky-500/10 text-cyan-300',
    green: theme === 'light' ? 'from-emerald-100 to-green-50 text-emerald-700' : 'from-emerald-500/20 to-green-500/10 text-emerald-300',
    yellow: theme === 'light' ? 'from-amber-100 to-yellow-50 text-amber-700' : 'from-amber-500/20 to-yellow-500/10 text-amber-300',
    red: theme === 'light' ? 'from-red-100 to-rose-50 text-red-700' : 'from-red-500/20 to-rose-500/10 text-red-300',
    slate: theme === 'light' ? 'from-slate-200 to-slate-100 text-slate-700' : 'from-slate-500/20 to-slate-400/10 text-slate-300',
  };

  return (
    <div className={`card-glass rounded-2xl bg-gradient-to-br ${accentMap[accent] || accentMap.cyan} p-5`}>
      <p className={`text-[10px] font-medium uppercase tracking-[0.32em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{title}</p>
      <p className={`mt-4 text-3xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{value}</p>
    </div>
  );
}
