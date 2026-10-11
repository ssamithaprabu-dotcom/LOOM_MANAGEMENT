import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ControlPanel from '../components/ControlPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import MeterChart from '../components/MeterChart';
import MeterProgress from '../components/MeterProgress';
import StatusBadge from '../components/StatusBadge';
import { useLoomContext } from '../context/LoomContext';
import { formatMeters } from '../utils/helpers';

export default function LoomDetails() {
  const { loomId } = useParams();
  const navigate = useNavigate();
  const { looms, showToast, addNotification, updateLoomStatus } = useLoomContext();
  const loom = looms.find((item) => item.id === loomId);
  const [pendingAction, setPendingAction] = useState(null);

  if (!loom) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 text-center text-slate-300">
        Loom not found.
      </div>
    );
  }

  const progress = useMemo(() => {
    const total = loom.totalMeterCapacity || 11000;
    return total > 0 ? Math.min((loom.totalMeterRun / total) * 100, 100) : 0;
  }, [loom]);

  const applyAction = async (action) => {
    let nextStatus = loom.status;
    if (action === 'START') nextStatus = 'RUNNING';
    if (action === 'STOP') nextStatus = 'STOPPED';
    if (action === 'REVERSE') nextStatus = 'WARNING';
    if (action === 'SINGLE TAKE') nextStatus = 'RUNNING';

    await updateLoomStatus(loom.id, nextStatus, action);
    showToast(`✓ Loom ${loom.loomNumber} ${action.toLowerCase()} completed`, 'success');
    addNotification('SUCCESS', `Loom ${loom.loomNumber} ${action.toLowerCase()} completed.`);
    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="card-glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-400">Loom Telemetry</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Loom {loom.loomNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={loom.status} />
          <button
            type="button"
            onClick={() => navigate('/settings?tab=looms')}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            Back to list
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card-glass grid gap-4 rounded-2xl p-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">PIC Number</p>
              <p className="mt-2 text-xl font-bold text-cyan-600 dark:text-cyan-400">{loom.picNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Status</p>
              <p className="mt-2 text-xl font-bold">{loom.status}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Wi-Fi Status</p>
              <p className="mt-2 text-xl font-bold">{loom.wifi?.connected ? 'Connected' : 'Disconnected'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Current Set</p>
              <p className="mt-2 text-xl font-bold text-cyan-600 dark:text-cyan-400">SET {loom.currentSet}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Current Meter</p>
              <p className="mt-2 font-mono text-xl font-bold">{formatMeters(loom.currentMeter)} m</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Total Meter Run</p>
              <p className="mt-2 font-mono text-xl font-bold">{formatMeters(loom.totalMeterRun)} m</p>
            </div>
          </div>

          <MeterProgress label="Meter Progress" current={loom.totalMeterRun} total={loom.totalMeterCapacity} tone="cyan" />
          <MeterChart data={loom.chartData || []} />
        </div>

        <div className="space-y-6">
          <ControlPanel onAction={(action) => setPendingAction(action)} />

          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Recent Operations</h3>
            <div className="mt-4 space-y-2.5">
              {(loom.history || []).slice(0, 6).map((entry, index) => (
                <div key={`${entry.time}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="text-slate-500 dark:text-slate-400">{entry.time}</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{entry.action}</span>
                  <span className="text-slate-400">{entry.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {pendingAction && (
        <ConfirmDialog
          title={`${pendingAction === 'START' ? 'Start' : pendingAction === 'STOP' ? 'Stop' : pendingAction === 'REVERSE' ? 'Reverse' : 'Single Take'} Loom`}
          message={pendingAction === 'STOP' ? `Are you sure you want to stop Loom ${loom.loomNumber}?` : pendingAction === 'REVERSE' ? `Are you sure you want to reverse Loom ${loom.loomNumber}?` : pendingAction === 'START' ? `Start Loom ${loom.loomNumber}?` : `Trigger single take for Loom ${loom.loomNumber}?`}
          cancelLabel="Cancel"
          confirmLabel={pendingAction === 'STOP' ? 'Stop Loom' : pendingAction === 'REVERSE' ? 'Reverse Loom' : 'Confirm'}
          confirmButtonClass={pendingAction === 'STOP' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => applyAction(pendingAction)}
        />
      )}
    </div>
  );
}
