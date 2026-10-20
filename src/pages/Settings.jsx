import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useLoomContext } from '../context/LoomContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SetConfiguration from '../components/SetConfiguration';
import WifiConfiguration from '../components/WifiConfiguration';
import { formatMeters, normalizeStatus } from '../utils/helpers';
import {
  Settings as SettingsIcon,
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
  User,
  Mail,
  Shield,
  Edit3,
  UserCircle2,
  ArrowLeft,
} from 'lucide-react';

const sortOptions = ['Loom Number', 'Meter Run', 'Meter Left', 'Status'];

const createDefaultSets = (count = 4) =>
  Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => ({
    setNumber: index + 1,
    takeup: index + 1,
    meter: 100,
  }));

const defaultWifi = {
  ssid: '',
  password: '',
  ipAddress: '192.168.1.10',
  port: 8080,
  connected: false,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    setUser,
    looms,
    loadingLooms,
    refreshLooms,
    addLoom,
    updateLoom,
    deleteLoom,
    settings,
    setSettings,
    showToast,
    theme,
  } = useLoomContext();

  // Tab State: exactly 3 tabs: 'looms' | 'add-loom' | 'profile'
  const tabParam = searchParams.get('tab');
  const validTabs = ['looms', 'add-loom', 'profile'];
  const activeTab = validTabs.includes(tabParam) ? tabParam : 'looms';

  const handleTabChange = (newTab) => {
    if (newTab !== 'add-loom') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', newTab);
      params.delete('edit');
      setSearchParams(params);
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  // ==========================================
  // TAB 1: Loom Configuration State & Handlers
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
  // TAB 2: Add Loom Form State & Handlers
  // ==========================================
  const editId = searchParams.get('edit');
  const existingLoom = looms.find((l) => l.id === editId);

  const [loomNumber, setLoomNumber] = useState('');
  const [picNumber, setPicNumber] = useState('');
  const [loomStatus, setLoomStatus] = useState('STOPPED');
  const [setCount, setSetCount] = useState(4);
  const [sets, setSets] = useState(() => createDefaultSets(4));
  const [wifi, setWifi] = useState({ ...defaultWifi });
  const [connectionState, setConnectionState] = useState('');
  const [testingWifi, setTestingWifi] = useState(false);
  const [isSubmittingLoom, setIsSubmittingLoom] = useState(false);
  const [loomValidationError, setLoomValidationError] = useState('');

  // Synchronize form when entering add-loom tab or when editId changes
  useEffect(() => {
    if (activeTab === 'add-loom') {
      if (existingLoom) {
        setLoomNumber(String(existingLoom.loomNumber || ''));
        setPicNumber(existingLoom.picNumber || '');
        setLoomStatus(existingLoom.status || 'STOPPED');
        const loadedSets = existingLoom.sets && existingLoom.sets.length > 0 ? existingLoom.sets : createDefaultSets(4);
        setSetCount(loadedSets.length);
        setSets(loadedSets);
        setWifi({
          ssid: existingLoom.wifi?.ssid || '',
          password: '',
          hasPassword: existingLoom.wifi?.hasPassword || false,
          ipAddress: existingLoom.wifi?.ipAddress || '192.168.1.10',
          port: existingLoom.wifi?.port || 8080,
          connected: Boolean(existingLoom.wifi?.connected),
        });
        setConnectionState('');
        setLoomValidationError('');
      } else if (!editId) {
        setLoomNumber('');
        setPicNumber('');
        setLoomStatus('STOPPED');
        setSetCount(4);
        setSets(createDefaultSets(4));
        setWifi({ ...defaultWifi });
        setConnectionState('');
        setLoomValidationError('');
      }
    }
  }, [activeTab, editId, existingLoom]);

  const handleSetCountChange = (val) => {
    const count = Math.max(1, Math.min(24, Number(val) || 1));
    setSetCount(count);
    setSets((prev) =>
      Array.from({ length: count }, (_, index) => {
        const existing = prev[index] || {};
        return {
          setNumber: index + 1,
          takeup: Number(existing.takeup) || index + 1,
          meter: Number(existing.meter) || 100,
        };
      }),
    );
  };

  const handleSetChange = (index, field, val) => {
    setSets((prev) =>
      prev.map((set, sIdx) =>
        sIdx === index ? { ...set, [field]: Math.max(0, Number(val) || 0) } : set,
      ),
    );
  };

  const handleWifiChange = (field, val) => {
    setWifi((prev) => ({
      ...prev,
      [field]: field === 'port' ? Number(val) || 8080 : val,
    }));
  };

  const handleTestConnection = async () => {
    setTestingWifi(true);
    setConnectionState('');
    try {
      const res = await api.testWifi(wifi);
      if (res && res.connected) {
        setConnectionState('Connection verified successfully.');
        setWifi((prev) => ({ ...prev, connected: true }));
      } else {
        setConnectionState(res?.message || 'Connection failed: Unable to reach controller.');
        setWifi((prev) => ({ ...prev, connected: false }));
      }
    } catch (err) {
      setConnectionState('Connection test failed: ' + (err.message || 'Controller unreachable.'));
      setWifi((prev) => ({ ...prev, connected: false }));
    } finally {
      setTestingWifi(false);
    }
  };

  const handleSubmitLoom = async (event) => {
    event.preventDefault();
    setLoomValidationError('');

    const parsedLoomNum = Number(loomNumber);
    if (!loomNumber || isNaN(parsedLoomNum) || parsedLoomNum <= 0) {
      setLoomValidationError('Please enter a valid positive Loom Number.');
      return;
    }

    if (!picNumber.trim()) {
      setLoomValidationError('PIC Number is required.');
      return;
    }

    // Check for duplicate loom number on new entries
    if (!existingLoom) {
      const duplicate = looms.some((l) => Number(l.loomNumber) === parsedLoomNum);
      if (duplicate) {
        setLoomValidationError(`Loom Number ${parsedLoomNum} already exists. Please choose a unique number.`);
        return;
      }
    }

    setIsSubmittingLoom(true);
    try {
      const payload = {
        loomNumber: parsedLoomNum,
        picNumber: picNumber.trim(),
        status: loomStatus,
        sets: sets.map((s, idx) => ({
          setNumber: idx + 1,
          takeup: Number(s.takeup) || 1,
          meter: Number(s.meter) || 100,
        })),
        wifi: {
          ssid: wifi.ssid,
          password: wifi.password,
          ipAddress: wifi.ipAddress,
          port: Number(wifi.port) || 8080,
          connected: Boolean(wifi.connected),
        },
      };

      if (existingLoom) {
        await updateLoom(existingLoom.id, payload);
        showToast(`Loom ${parsedLoomNum} updated successfully.`, 'success');
      } else {
        await addLoom(payload);
        showToast(`Loom ${parsedLoomNum} registered successfully.`, 'success');
      }

      // Reset form fields
      setLoomNumber('');
      setPicNumber('');
      setLoomStatus('STOPPED');
      setSetCount(4);
      setSets(createDefaultSets(4));
      setWifi({ ...defaultWifi });
      handleTabChange('looms');
    } catch (err) {
      setLoomValidationError(err.message || 'Failed to save loom to database.');
      showToast(err.message || 'Error saving loom.', 'danger');
    } finally {
      setIsSubmittingLoom(false);
    }
  };

  // ==========================================
  // TAB 3: Profile State & Handlers
  // ==========================================
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    username: user?.username || settings?.username || 'admin',
    email: user?.email || settings?.email || 'admin@example.com',
  });

  useEffect(() => {
    if (user || settings) {
      setProfileForm({
        username: user?.username || settings?.username || 'admin',
        email: user?.email || settings?.email || 'admin@example.com',
      });
    }
  }, [user, settings]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.username.trim()) {
      setProfileError('Username cannot be empty.');
      return;
    }

    if (!profileForm.email.trim() || !profileForm.email.includes('@')) {
      setProfileError('Please provide a valid email address.');
      return;
    }

    setSavingProfile(true);
    try {
      await api.updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      });

      setSettings((prev) => ({
        ...prev,
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      }));

      if (setUser) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                username: profileForm.username.trim(),
                email: profileForm.email.trim(),
              }
            : prev,
        );
      }

      setEditingProfile(false);
      setProfileSuccess('Profile credentials updated successfully.');
      showToast('Profile credentials updated successfully.', 'success');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
      showToast(err.message || 'Profile update failed.', 'danger');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password State & Handlers (moved from Security tab)
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
      const activeUsername = profileForm.username || user?.username || settings?.username || 'admin';
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

  const currentUsername = profileForm.username || user?.username || settings?.username || 'admin';
  const currentEmail = profileForm.email || user?.email || settings?.email || 'admin@example.com';
  const currentRole = user?.role || 'Administrator';

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
          Configure production looms, register new machines, and manage profile credentials
        </p>
      </div>

      {/* Tabs Navigation Bar (Exactly 3 tabs: Loom Configuration, Add Loom, Profile) */}
      <div className="card-glass flex flex-wrap items-center gap-2 rounded-2xl p-2 sm:gap-3">
        {/* Tab 1: Loom Configuration */}
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

        {/* Tab 2: Add Loom */}
        <button
          type="button"
          onClick={() => handleTabChange('add-loom')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            activeTab === 'add-loom'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Plus size={15} />
          <span>Add Loom</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            activeTab === 'profile'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <UserCircle2 size={15} />
          <span>Profile</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1 CONTENT: LOOM CONFIGURATION (TABLE-BASED)           */}
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
                  onClick={() => handleTabChange('add-loom')}
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
                              onClick={() => handleTabChange('add-loom')}
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
                              to={`/settings?tab=add-loom&edit=${loom.id}`}
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
      {/* TAB 2 CONTENT: ADD LOOM                                    */}
      {/* ========================================================= */}
      {activeTab === 'add-loom' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="card-glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('looms')}
                className={`rounded-xl border p-2 transition ${
                  theme === 'light'
                    ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                aria-label="Back to Loom Configuration"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {existingLoom ? `Edit Loom ${existingLoom.loomNumber}` : 'Add New Loom'}
                </h2>
                <p className={`mt-0.5 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Define loom identification, set sequences, and controller network credentials
                </p>
              </div>
            </div>
          </div>

          {loomValidationError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={18} className="shrink-0" />
              <span>{loomValidationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLoom} className="space-y-6">
            {/* Basic Loom Attributes Card */}
            <div className="card-glass rounded-2xl p-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                Loom Identification & Operating Status
              </h3>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Loom Number *</label>
                  <input
                    type="number"
                    min="1"
                    value={loomNumber}
                    onChange={(e) => setLoomNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold">PIC Controller Number *</label>
                  <input
                    type="text"
                    value={picNumber}
                    onChange={(e) => setPicNumber(e.target.value)}
                    placeholder="e.g. PIC-001"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Status</label>
                  <select
                    value={loomStatus}
                    onChange={(e) => setLoomStatus(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                  >
                    <option value="STOPPED">Stopped</option>
                    <option value="RUNNING">Running</option>
                    <option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Number of Sets (1 – 24)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={setCount}
                    onChange={(e) => handleSetCountChange(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Set Configuration Table */}
            <SetConfiguration sets={sets} onChange={handleSetChange} />

            {/* Wi-Fi & Controller Network */}
            <WifiConfiguration
              wifi={wifi}
              onChange={handleWifiChange}
              onTestConnection={handleTestConnection}
              testing={testingWifi}
              connectionState={connectionState}
              onSave={() => showToast('Wi-Fi parameters updated in form.', 'info')}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleTabChange('looms')}
                disabled={isSubmittingLoom}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingLoom}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-75"
              >
                {isSubmittingLoom && <LoaderCircle className="animate-spin" size={14} />}
                <span>{existingLoom ? 'Save Changes' : 'Register Loom'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3 CONTENT: PROFILE (ACCOUNT DETAILS + CHANGE PASSWORD) */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Card 1: Account Details & Edit Profile */}
          <div className="card-glass rounded-2xl p-6 sm:p-7">
            {/* Profile Identity Bar */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl font-bold text-cyan-600 ring-1 ring-cyan-500/30 dark:text-cyan-400">
                  {currentUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {currentUsername}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      <Shield size={11} />
                      {currentRole}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Active Session
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProfile((prev) => !prev);
                  setProfileError('');
                  setProfileSuccess('');
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Edit3 size={14} />
                <span>{editingProfile ? 'Cancel Editing' : 'Edit Profile'}</span>
              </button>
            </div>

            {profileError && (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* Read-Only Details Grid */}
            {!editingProfile ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div
                  className={`rounded-2xl border p-4 transition ${
                    theme === 'light'
                      ? 'border-slate-200 bg-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/70 shadow-sm'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <User size={14} className="text-cyan-600 dark:text-cyan-400" />
                    Username
                  </span>
                  <p
                    className={`mt-2 font-bold text-base ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {currentUsername}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 transition ${
                    theme === 'light'
                      ? 'border-slate-200 bg-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/70 shadow-sm'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <Mail size={14} className="text-cyan-600 dark:text-cyan-400" />
                    Email Address
                  </span>
                  <p
                    className={`mt-2 font-bold text-base truncate ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {currentEmail}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 transition ${
                    theme === 'light'
                      ? 'border-slate-200 bg-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/70 shadow-sm'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <Shield size={14} className="text-cyan-600 dark:text-cyan-400" />
                    Account Role
                  </span>
                  <p
                    className={`mt-2 font-bold text-base ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {currentRole}
                  </p>
                </div>
              </div>
            ) : (
              /* Edit Profile Form */
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Username *</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Email Address *</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${fieldClass}`}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold">Role & Permissions</label>
                    <input
                      type="text"
                      value={`${currentRole} (Full System Access)`}
                      readOnly
                      disabled
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none opacity-70 ${fieldClass}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileError('');
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                      theme === 'light'
                        ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400 disabled:opacity-75"
                  >
                    {savingProfile && <LoaderCircle className="animate-spin" size={14} />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 2: Change Password (moved from Security tab) */}
          <div className="card-glass rounded-2xl p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-cyan-500" size={22} />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                    Change Password
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Update account authentication credentials. Passwords are verified and securely hashed on the server.
                  </p>
                </div>
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
