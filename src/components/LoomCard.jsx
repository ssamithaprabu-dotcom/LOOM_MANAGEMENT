import { Wifi, WifiOff, Play, Power, ArrowRightLeft, RotateCcw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatMeters } from '../utils/helpers';
import { useLoomContext } from '../context/LoomContext';
import { Link } from 'react-router-dom';

export default function LoomCard({ loom, onAction, actionPending = false }) {
  const { theme } = useLoomContext();
  const isOnline = Boolean(loom.wifi?.connected);

  return (
    <div className="card-glass flex flex-col justify-between rounded-2xl p-5 transition hover:border-cyan-500/40">
      {/* Header Info */}
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/loom/${loom.id}`}
              className="text-base font-bold tracking-tight text-cyan-600 hover:underline dark:text-cyan-400"
            >
              Loom {loom.loomNumber}
            </Link>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{loom.picNumber}</p>
          </div>
          <StatusBadge status={loom.status} />
        </div>

        {/* Metric Rows */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
            <span className="text-slate-400">Current Set</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              SET {loom.currentSet || 1}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
            <span className="text-slate-400">Current Meter</span>
            <span className="font-mono font-bold">
              {formatMeters(loom.currentMeter)} m
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
            <span className="text-slate-400">Total Meter Run</span>
            <span className="font-mono font-medium">
              {formatMeters(loom.totalMeterRun)} m
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
            <span className="text-slate-400">Total Meter Left</span>
            <span className="font-mono font-medium text-slate-400">
              {formatMeters(loom.totalMeterLeft)} m
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400">Controller State</span>
            <span className={`inline-flex items-center gap-1.5 font-medium ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons with exact required hex codes */}
      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* START button: #22A65A */}
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAction(loom, 'START')}
            style={{ backgroundColor: '#22A65A', color: '#ffffff' }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={`Start Loom ${loom.loomNumber}`}
          >
            <Play size={13} />
            <span>Start</span>
          </button>

          {/* STOP button: #64748B */}
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAction(loom, 'STOP')}
            style={{ backgroundColor: '#64748B', color: '#ffffff' }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={`Stop Loom ${loom.loomNumber}`}
          >
            <Power size={13} />
            <span>Stop</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* REVERSE button: #F28C28 */}
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAction(loom, 'REVERSE')}
            style={{ backgroundColor: '#F28C28', color: '#ffffff' }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={`Reverse Loom ${loom.loomNumber}`}
          >
            <ArrowRightLeft size={13} />
            <span>Reverse</span>
          </button>

          {/* SINGLE TAKE button: #0EA5B7 */}
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAction(loom, 'SINGLE TAKE')}
            style={{ backgroundColor: '#0EA5B7', color: '#ffffff' }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={`Single Take Loom ${loom.loomNumber}`}
          >
            <RotateCcw size={13} />
            <span>Single Take</span>
          </button>
        </div>
      </div>
    </div>
  );
}
