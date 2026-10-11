import { RefreshCw, Cpu, AlertCircle, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoomContext } from '../context/LoomContext';
import LoomCard from '../components/LoomCard';
import StatCard from '../components/StatCard';
import { getStatusCount } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    looms,
    loadingLooms,
    loomsError,
    refreshLooms,
    updateLoomStatus,
    showToast,
    addNotification,
    theme,
  } = useLoomContext();

  const [pendingLoomId, setPendingLoomId] = useState(null);

  // Status Summary Metrics calculated from actual loaded looms
  const summary = useMemo(
    () => [
      { title: 'Total Looms', value: looms.length, accent: 'cyan' },
      { title: 'Running', value: getStatusCount(looms, 'RUNNING'), accent: 'green' },
      { title: 'Stopped', value: getStatusCount(looms, 'STOPPED'), accent: 'slate' },
      { title: 'Warning', value: getStatusCount(looms, 'WARNING'), accent: 'yellow' },
      { title: 'Alert', value: getStatusCount(looms, 'ALERT'), accent: 'red' },
    ],
    [looms],
  );

  const handleAction = async (loom, action) => {
    setPendingLoomId(loom.id);
    try {
      await updateLoomStatus(loom.id, action);
      addNotification('SUCCESS', `Loom ${loom.loomNumber}: Action "${action}" recorded by system.`);
      showToast(`Loom ${loom.loomNumber}: ${action} directive executed.`, 'success');
    } catch (err) {
      showToast(err.message || `Failed to execute ${action} on Loom ${loom.loomNumber}`, 'danger');
    } finally {
      setPendingLoomId(null);
    }
  };

  const handleManualRefresh = async () => {
    await refreshLooms();
    showToast('Dashboard metrics refreshed from backend.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Operating Dashboard
          </h1>
          <p className={`mt-0.5 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time machine status and production meter monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loadingLooms}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              theme === 'light'
                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600'
            }`}
          >
            <RefreshCw size={14} className={loadingLooms ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend / Hardware Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-600 dark:text-slate-300">
        <Info size={18} className="mt-0.5 shrink-0 text-cyan-500" />
        <div>
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">System Telemetry Mode: </span>
          <span>
            Displaying live persisted database metrics. Physical controller commands update software registers and audit logs. Physical PLC communication requires active hardware interface link.
          </span>
        </div>
      </div>

      {loomsError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="shrink-0" />
          <span>Database Notice: {loomsError}. Ensure backend server is running on port 5000.</span>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} accent={card.accent} />
        ))}
      </div>

      {/* Looms Cards Grid */}
      {looms.length === 0 ? (
        <div className="card-glass flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
          <Cpu size={36} className="text-slate-400 opacity-50" />
          <h2 className="text-sm font-semibold">
            {loadingLooms ? 'Fetching active looms from backend...' : 'No production looms configured yet.'}
          </h2>
          <p className="max-w-sm text-xs text-slate-400">
            Add your first loom to monitor operating status, set sequences, and meter progression.
          </p>
          {!loadingLooms && (
            <button
              type="button"
              onClick={() => navigate('/add-loom')}
              className="mt-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400"
            >
              Add First Loom
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {looms.map((loom) => (
            <LoomCard
              key={loom.id}
              loom={loom}
              onAction={handleAction}
              actionPending={pendingLoomId === loom.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
