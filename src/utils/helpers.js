export const formatMeters = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value || 0));

export const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

export const statusStyles = {
  RUNNING: {
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30',
    dot: 'bg-emerald-400',
    label: 'RUNNING',
  },
  STOPPED: {
    badge: 'bg-slate-500/15 text-slate-300 border border-slate-400/30',
    dot: 'bg-slate-400',
    label: 'STOPPED',
  },
  WARNING: {
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
    dot: 'bg-amber-400',
    label: 'WARNING',
  },
  ALERT: {
    badge: 'bg-red-500/15 text-red-300 border border-red-400/30',
    dot: 'bg-red-400',
    label: 'ALERT',
  },
  OFFLINE: {
    badge: 'bg-red-500/10 text-rose-300 border border-red-500/40',
    dot: 'bg-red-500',
    label: 'OFFLINE',
  },
};

export const normalizeStatus = (status) => {
  const value = String(status || '').trim().toUpperCase();
  if (statusStyles[value]) return value;
  return 'STOPPED';
};

export const generateSetConfig = (count = 4) =>
  Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => ({
    setNumber: index + 1,
    takeup: index + 1,
    meter: index + 1,
  }));

export const buildNotification = (type, text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  type,
  text,
  time: 'Just now',
  read: false,
});

export const getStatusCount = (looms, status) =>
  looms.filter((loom) => normalizeStatus(loom.status) === normalizeStatus(status)).length;
