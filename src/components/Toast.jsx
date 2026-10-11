export default function Toast({ message, type = 'success' }) {
  const styles = {
    success: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
    warning: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
    danger: 'border-red-400/50 bg-red-500/15 text-red-200',
    info: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className={`min-w-[260px] rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg shadow-slate-950/30 ${styles[type] || styles.success}`}>
        {message}
      </div>
    </div>
  );
}
