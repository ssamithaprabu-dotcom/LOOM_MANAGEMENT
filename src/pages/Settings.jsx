import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useLoomContext } from '../context/LoomContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatMeters, normalizeStatus } from '../utils/helpers';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  ShieldCheck,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const sortOptions = ['Loom Number', 'Meter Run', 'Meter Left', 'Status'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    looms,
    loadingLooms,
    refreshLooms,
    deleteLoom,
    settings,
    setSettings,
    showToast,
    theme,
  } = useLoomContext();

  // Tab State: 'general' | 'looms' | 'security'
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'looms' || tabParam === 'security' ? tabParam : 'general';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // ==========================================
  // TAB 1: General Settings Form State
  // ==========================================
  const [generalForm, setGeneralForm] = useState({
    username: user?.username || settings?.username || 'admin',
    email: user?.email || settings?.email || 'admin@example.com',
  });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');

  useEffect(() => {
    if (settings || user) {
      setGeneralForm((prev) => ({
        ...prev,
        username: settings?.username || user?.username || prev.username,
        email: settings?.email || user?.email || prev.email,
      }));
    }
  }, [settings, user]);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');

    if (!generalForm.username.trim()) {
      setGeneralError('Username is required.');
      return;
    }

    if (!generalForm.email.trim() || !generalForm.email.includes('@')) {
      setGeneralError('A valid email address is required.');
      return;
    }

    setSavingGeneral(true);
    try {
      const res = await api.updateSettings({
        username: generalForm.username.trim(),
        email: generalForm.email.trim(),
      });
      setSettings((prev) => ({
        ...prev,
        username: generalForm.username.trim(),
        email: generalForm.email.trim(),
      }));
      setGeneralSuccess(res.message || 'General settings saved successfully.');
      showToast('General settings updated successfully.', 'success');
    } catch (err) {
      setGeneralError(err.message || 'Failed to update general settings.');
      showToast(err.message || 'Failed to update general settings.', 'danger');
    } finally {
      setSavingGeneral(false);
    }
  };

  // ==========================================
  // TAB 2: Loom Configuration (Table Management)
  // ==========================================
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

  const handleDeleteLoom = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLoom(deleteTarget.id);
      showToast(`Loom ${deleteTarget.loomNumber} deleted successfully.`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete loom.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // TAB 3: Security Form State
  // ==========================================
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!securityForm.currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }

    if (!securityForm.newPassword) {
      setPasswordError('Please provide a new password.');
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const activeUsername = generalForm.username || user?.username || settings?.username || 'admin';
      const res = await api.updateSettings({
        username: activeUsername,
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });

      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordSuccess(res.message || 'Password updated successfully.');
      showToast('Security credentials updated successfully.', 'success');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
      showToast(err.message || 'Password update failed.', 'danger');
    } finally {
      setSavingPassword(false);
    }
  };

  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="card-glass flex flex-col gap-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="text-cyan-500" size={24} />
          <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            System Settings
          </h1>
        </div>
        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          Manage general application defaults, production loom configuration, and account security
        </p>
      </div>

      {/* Tabs Navigation Bar (Exact 3 tabs: General, Loom Configuration, Security) */}
      <div className="card-glass flex flex-wrap items-center gap-2 rounded-2xl p-2 sm:gap-3">
        {/* Tab 1: General */}
        <button
          type="button"
          onClick={() => handleTabChange('general')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            activeTab === 'general'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Sliders size={15} />
          <span>General</span>
        </button>

        {/* Tab 2: Loom Configuration */}
        <button
          type="button"
          onClick={() => handleTabChange('looms')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            activeTab === 'looms'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Cpu size={15} />
          <span>Loom Configuration</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === 'looms'
                ? 'bg-slate-950/20 text-slate-950'
                : theme === 'light'
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-800 text-slate-300'
            }`}
          >
            {looms.length}
          </span>
        </button>

        {/* Tab 3: Security */}
        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            activeTab === 'security'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1 CONTENT: GENERAL                                    */}
      {/* ========================================================= */}
      {activeTab === 'general' && (
        <div className="card-glass rounded-2xl p-6 sm:p-7">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                General Application & Account Settings
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Update basic administrator profile and review system machine allocation
              </p>
            </div>
          </div>

          {generalError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {generalSuccess && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{generalSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveGeneral} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Username *</label>
                <input
                  type="text"
                  value={generalForm.username}
                  onChange={(e) => setGeneralForm((prev) => ({ ...prev, username: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Email Address *</label>
                <input
                  type="email"
                  value={generalForm.email}
                  onChange={(e) => setGeneralForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold">Number of Looms Configured</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={looms.length}
                    readOnly
                    className={`w-full max-w-[200px] rounded-xl border px-3.5 py-2.5 text-xs outline-none opacity-80 ${fieldClass}`}
                  />
                  <span className="text-xs text-slate-400">
                    Active loom inventory is managed dynamically under{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('looms')}
                      className="font-semibold text-cyan-600 underline hover:text-cyan-500 dark:text-cyan-400"
                    >
                      Loom Configuration
                    </button>
                    .
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingGeneral}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400 disabled:opacity-75"
              >
                {savingGeneral && <LoaderCircle className="animate-spin" size={14} />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2 CONTENT: LOOM CONFIGURATION (TABLE-BASED)           */}
      {/* ========================================================= */}
      {activeTab === 'looms' && (
        <div className="space-y-5">
          {/* Action & Filter Toolbar */}
          <div className="card-glass rounded-2xl p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
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

              {/* Filters, Refresh, Add Loom */}
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

                <button
                  type="button"
                  onClick={refreshLooms}
                  disabled={loadingLooms}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    theme === 'light'
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600'
                  }`}
                  aria-label="Refresh looms"
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
          </div>

          {/* Table Container */}
          <div className="card-glass overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead
                  className={`border-b text-[10px] uppercase tracking-[0.18em] ${
                    theme === 'light'
                      ? 'border-slate-200 bg-slate-50 text-slate-500'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
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
                            {loadingLooms ? 'Loading looms from database...' : 'No looms match your criteria.'}
                          </p>
                          {!loadingLooms && (
                            <button
                              type="button"
                              onClick={() => navigate('/add-loom')}
                              className="mt-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                            >
                              Add a new loom
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3 CONTENT: SECURITY                                   */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="card-glass rounded-2xl p-6 sm:p-7">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                Account Security (Change Password)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Update account authentication credentials. Passwords are verified and securely hashed on the server.
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold">Current Password *</label>
                <input
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password to verify identity"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">New Password *</label>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Confirm New Password *</label>
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400 disabled:opacity-75"
              >
                {savingPassword && <LoaderCircle className="animate-spin" size={14} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Loom Record"
          message={`Are you sure you want to delete Loom ${deleteTarget.loomNumber} (PIC: ${deleteTarget.picNumber})? All associated set configurations and logs will be permanently removed.`}
          cancelLabel="Cancel"
          confirmLabel={deleting ? 'Deleting...' : 'Confirm Delete'}
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteLoom}
        />
      )}
    </div>
  );
}
