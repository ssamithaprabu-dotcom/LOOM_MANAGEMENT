import { ArrowRightLeft, Play, Power, RotateCcw } from 'lucide-react';
import { useLoomContext } from '../context/LoomContext';

// Exactly specified color palette:
// Start: #22A65A
// Stop: #64748B
// Reverse: #F28C28
// Single Take: #0EA5B7
const actionButtons = [
  {
    key: 'START',
    label: 'Start',
    icon: Play,
    style: { backgroundColor: '#22A65A', color: '#ffffff' },
    hoverClass: 'hover:brightness-110 active:brightness-95',
  },
  {
    key: 'STOP',
    label: 'Stop',
    icon: Power,
    style: { backgroundColor: '#64748B', color: '#ffffff' },
    hoverClass: 'hover:brightness-110 active:brightness-95',
  },
  {
    key: 'REVERSE',
    label: 'Reverse',
    icon: ArrowRightLeft,
    style: { backgroundColor: '#F28C28', color: '#ffffff' },
    hoverClass: 'hover:brightness-110 active:brightness-95',
  },
  {
    key: 'SINGLE TAKE',
    label: 'Single Take',
    icon: RotateCcw,
    style: { backgroundColor: '#0EA5B7', color: '#ffffff' },
    hoverClass: 'hover:brightness-110 active:brightness-95',
  },
];

export default function ControlPanel({ onAction, disabled = false }) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
            Loom Command Panel
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Send operational directives to the selected loom controller
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actionButtons.map(({ key, label, icon: Icon, style, hoverClass }) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onAction(key)}
            style={style}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-[0.12em] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${hoverClass}`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
