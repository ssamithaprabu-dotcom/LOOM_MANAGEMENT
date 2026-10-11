import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLoomContext } from '../context/LoomContext';

export default function MeterChart({ data }) {
  const { theme } = useLoomContext();
  const textColor = theme === 'light' ? '#475569' : '#cbd5e1';
  const tooltipBg = theme === 'light' ? '#ffffff' : '#0f172a';

  return (
    <div className="card-glass h-80 rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Meter Usage</h3>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? 'rgba(100,116,139,0.18)' : 'rgba(148,163,184,0.18)'} />
          <XAxis dataKey="time" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis tick={{ fill: textColor, fontSize: 12 }} />
          <Tooltip contentStyle={{ background: tooltipBg, border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12 }} />
          <Line type="monotone" dataKey="meters" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#67e8f9' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
