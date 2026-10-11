import { useState, useEffect } from 'react';
import { useLoomContext } from '../context/LoomContext';
import { api } from '../services/api';
import { User, Mail, Shield, CheckCircle2, AlertCircle, LoaderCircle, Edit3 } from 'lucide-react';

export default function Profile() {
  const { user, settings, setSettings, showToast, theme } = useLoomContext();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    username: user?.username || settings?.username || '',
    email: user?.email || settings?.email || '',
  });

  useEffect(() => {
    if (user || settings) {
      setForm({
        username: user?.username || settings?.username || '',
        email: user?.email || settings?.email || '',
      });
    }
  }, [user, settings]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.username.trim()) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        username: form.username.trim(),
        email: form.email.trim(),
      });

      setSettings((prev) => ({
        ...prev,
        username: form.username.trim(),
        email: form.email.trim(),
      }));

      setEditing(false);
      showToast('Profile credentials updated successfully.', 'success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
      showToast(err.message || 'Profile update failed.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';

  const currentUsername = form.username || user?.username || settings?.username || 'User';
  const currentEmail = form.email || user?.email || settings?.email || 'admin@example.com';
  const currentRole = user?.role || 'Administrator';

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="card-glass flex flex-col gap-2 rounded-2xl p-5">
        <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          User Profile
        </h1>
        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          Account identity and authorization details for the active session
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-500">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="card-glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl font-bold text-cyan-600 ring-1 ring-cyan-500/30 dark:text-cyan-400">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {currentUsername}
              </p>
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
              setEditing((prev) => !prev);
              setErrorMessage('');
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
              theme === 'light'
                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Edit3 size={14} />
            <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Read-Only Details Grid */}
        {!editing ? (
          <div className="mt-8 grid gap-4 border-t border-slate-200/80 pt-6 sm:grid-cols-2 dark:border-slate-800">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <User size={12} />
                Username
              </span>
              <p className="mt-1.5 font-semibold text-sm">{currentUsername}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Mail size={12} />
                Email Address
              </span>
              <p className="mt-1.5 font-semibold text-sm truncate">{currentEmail}</p>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSaveProfile} className="mt-8 border-t border-slate-200/80 pt-6 space-y-4 dark:border-slate-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${fieldClass}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${fieldClass}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400 disabled:opacity-75"
              >
                {saving && <LoaderCircle className="animate-spin" size={13} />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
