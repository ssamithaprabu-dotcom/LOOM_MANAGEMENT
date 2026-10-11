import { Search, Plus, Eye, Pencil, Trash2, RefreshCw, Cpu, Wifi, WifiOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useLoomContext } from '../context/LoomContext';
import { formatMeters, normalizeStatus } from '../utils/helpers';

const sortOptions = ['Loom Number', 'Meter Run', 'Meter Left', 'Status'];

export default function LoomManagement() {
  const navigate = useNavigate();
  const { looms, loadingLooms, loomsError, refreshLooms, deleteLoom, showToast, theme } = useLoomContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Loom Number');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredLooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    const visible = looms.filter((loom) => {
      const matchesSearch =
        !query ||
        String(loom.loomNumber).includes(query) ||
        (loom.picNumber || '').toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'All' || normalizeStatus(loom.status) === normalizeStatus(statusFilter);
      return matchesSearch && matchesStatus;
    });

    return [...visible].sort((a, b) => {
      switch (sortBy) {
        case 'Meter Run':
          return (b.totalMeterRun || 0) - (a.totalMeterRun || 0);
        case 'Meter Left':
          return (b.totalMeterLeft || 0) - (a.totalMeterLeft || 0);
        case 'Status':
          return String(a.status || '').localeCompare(b.status || '');
        case 'Loom Number':
        default:
          return (a.loomNumber || 0) - (b.loomNumber || 0);
      }
    });
  }, [looms, search, sortBy, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLoom(deleteTarget.id);
      showToast(`Loom ${deleteTarget.loomNumber} removed successfully.`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete loom.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button Banner */}
      <div className="card-glass flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Loom Management
          </h1>
          <p className={`mt-0.5 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Configure, inspect, and maintain all registered production looms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshLooms}
            disabled={loadingLooms}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              theme === 'light'
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600'
            }`}
            aria-label="Refresh looms list"
          >
            <RefreshCw size={14} className={loadingLooms ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/add-loom')}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400 active:scale-[0.99]"
          >
            <Plus size={15} />
            <span>Add Loom</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass rounded-2xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by loom or PIC number..."
              className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs outline-none transition ${fieldClass}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs outline-none transition ${fieldClass}`}
            >
              <option value="All">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="STOPPED">Stopped</option>
              <option value="WARNING">Warning</option>
              <option value="ALERT">Alert</option>
              <option value="OFFLINE">Offline</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs outline-none transition ${fieldClass}`}
            >
              {sortOptions.map((opt) => (
                <option key={opt} value={opt}>
                  Sort: {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="card-glass overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className={`border-b text-[10px] uppercase tracking-[0.18em] ${
              theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}>
              <tr>
                <th className="px-4 py-3.5 font-bold">Loom No.</th>
                <th className="px-4 py-3.5 font-bold">PIC No.</th>
                <th className="px-4 py-3.5 font-bold">Sets</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Meter Run</th>
                <th className="px-4 py-3.5 font-bold">Meter Left</th>
                <th className="px-4 py-3.5 font-bold">Wi-Fi State</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200/80' : 'divide-slate-800/80'}`}>
              {filteredLooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Cpu size={32} className="text-slate-400 opacity-50" />
                      <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {loadingLooms ? 'Loading looms from database...' : 'No looms match your current criteria.'}
                      </p>
                      {!loadingLooms && (
                        <button
                          type="button"
                          onClick={() => navigate('/add-loom')}
                          className="mt-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                        >
                          Register a new loom
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLooms.map((loom) => (
                  <tr
                    key={loom.id}
                    className={`transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                      theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-cyan-600 dark:text-cyan-400">
                      Loom {loom.loomNumber}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">{loom.picNumber}</td>
                    <td className="px-4 py-3.5 font-medium">{loom.sets?.length || 0} Sets</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={loom.status} />
                    </td>
                    <td className="px-4 py-3.5 font-mono">{formatMeters(loom.totalMeterRun)} m</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{formatMeters(loom.totalMeterLeft)} m</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          loom.wifi?.connected
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {loom.wifi?.connected ? <Wifi size={13} /> : <WifiOff size={13} />}
                        <span>{loom.wifi?.connected ? 'Online' : 'Offline'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/loom/${loom.id}`}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            theme === 'light'
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                              : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Link>
                        <Link
                          to={`/add-loom?edit=${loom.id}`}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            theme === 'light'
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                              : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(loom)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Loom Record"
          message={`Are you sure you want to delete Loom ${deleteTarget.loomNumber} (PIC: ${deleteTarget.picNumber})? All associated set configurations and logs will be permanently removed.`}
          cancelLabel="Cancel"
          confirmLabel={deleting ? 'Deleting...' : 'Confirm Delete'}
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
