import { useLoomContext } from '../context/LoomContext';

export default function ConfirmDialog({ title, message, cancelLabel = 'Cancel', confirmLabel = 'Confirm', onCancel, onConfirm, confirmButtonClass = 'bg-red-500 hover:bg-red-600 text-white' }) {
  const { theme } = useLoomContext();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${theme === 'light' ? 'bg-slate-900/20' : 'bg-slate-950/80'}`}>
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${theme === 'light' ? 'border-slate-200 bg-white shadow-slate-200/80' : 'border-slate-700 bg-slate-900 shadow-slate-950/80'}`}>
        <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
        <p className={`mt-3 text-sm leading-6 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200' : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'}`}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${confirmButtonClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
