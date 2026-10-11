import { Wifi } from 'lucide-react';
import { useLoomContext } from '../context/LoomContext';

export default function WifiConfiguration({ wifi, onChange, onSave, onTestConnection, testing, connectionState }) {
  const { theme } = useLoomContext();
  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';
  const labelClass = theme === 'light' ? 'text-slate-700' : 'text-slate-300';

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wifi className="text-cyan-500" size={16} />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Wi-Fi Configuration</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${wifi.connected ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
          <span className={`status-dot ${wifi.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {wifi.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={`text-xs font-semibold ${labelClass}`}>
          <span className="mb-1.5 block">Wi-Fi SSID</span>
          <input value={wifi.ssid || ''} onChange={(event) => onChange('ssid', event.target.value)} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`} />
        </label>
        <label className={`text-xs font-semibold ${labelClass}`}>
          <span className="mb-1.5 block">Wi-Fi Password</span>
          <input type="password" value={wifi.password || ''} onChange={(event) => onChange('password', event.target.value)} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`} />
        </label>
        <label className={`text-xs font-semibold ${labelClass}`}>
          <span className="mb-1.5 block">IP Address</span>
          <input value={wifi.ipAddress || ''} onChange={(event) => onChange('ipAddress', event.target.value)} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`} />
        </label>
        <label className={`text-xs font-semibold ${labelClass}`}>
          <span className="mb-1.5 block">Port</span>
          <input type="number" value={wifi.port || 8080} onChange={(event) => onChange('port', event.target.value)} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onSave} className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400">
          Save Configuration
        </button>
        <button type="button" onClick={onTestConnection} disabled={testing} className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200' : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-400 hover:bg-slate-700'} disabled:cursor-wait disabled:opacity-60`}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {connectionState && (
        <p className={`mt-4 text-sm ${connectionState.includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
          {connectionState}
        </p>
      )}
    </div>
  );
}
