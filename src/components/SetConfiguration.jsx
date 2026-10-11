import { useLoomContext } from '../context/LoomContext';

export default function SetConfiguration({ sets, onChange }) {
  const { theme } = useLoomContext();
  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';
  const tableHead = theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-700 text-slate-400';

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Set Configuration</h3>
      </div>

      <div className="overflow-x-auto">
        <table className={`min-w-full text-left text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
          <thead>
            <tr className={`border-b text-[10px] uppercase tracking-[0.2em] ${tableHead}`}>
              <th className="pb-3 pr-4">Set</th>
              <th className="pb-3 pr-4">Take-up</th>
              <th className="pb-3">Meter</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, index) => (
              <tr key={set.setNumber || index} className={`border-b last:border-none ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                <td className={`py-3 pr-4 font-medium ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>SET {set.setNumber}</td>
                <td className="py-3 pr-4">
                  <input
                    type="number"
                    min="0"
                    value={set.takeup || 0}
                    onChange={(event) => onChange(index, 'takeup', event.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ring-0 transition focus:border-cyan-500 ${fieldClass}`}
                  />
                </td>
                <td className="py-3">
                  <input
                    type="number"
                    min="0"
                    value={set.meter || 0}
                    onChange={(event) => onChange(index, 'meter', event.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ring-0 transition focus:border-cyan-500 ${fieldClass}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
