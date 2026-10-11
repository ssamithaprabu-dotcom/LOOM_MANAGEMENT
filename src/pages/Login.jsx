import { Eye, EyeOff, LoaderCircle, Moon, Sun, Cpu, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoomContext } from '../context/LoomContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, showToast, theme, toggleTheme } = useLoomContext();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = 'Username or email is required.';
    if (!form.password) nextErrors.password = 'Password is required.';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      await login(form.username.trim(), form.password);
      setIsLoading(false);
      showToast('Welcome to Loomatrix!', 'success');
      navigate('/dashboard');
    } catch (error) {
      setIsLoading(false);
      const msg = error.message || 'Authentication failed. Please check your credentials.';
      setServerError(msg);
      showToast(msg, 'danger');
    }
  };

  const fillDemoCredentials = () => {
    setForm({ username: 'admin', password: 'admin123' });
    setErrors({});
    setServerError('');
  };

  const shellClass = theme === 'light'
    ? 'bg-slate-100 text-slate-900'
    : 'bg-slate-950 text-slate-100';

  return (
    <div className={`relative flex min-h-screen items-center justify-center p-4 ${shellClass}`}>
      {/* Theme Toggle in top-right */}
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={toggleTheme}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            theme === 'light'
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
          }`}
          aria-label="Toggle light and dark theme"
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="card-glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500 ring-1 ring-cyan-500/30">
            <Cpu size={32} />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Loomatrix
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
            Smart Loom Monitoring & Control
          </p>
        </div>

        {serverError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-1.5 block text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Username or Email
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${
                theme === 'light'
                  ? 'border-slate-300 bg-slate-50/50 text-slate-900'
                  : 'border-slate-700 bg-slate-950/60 text-slate-100'
              }`}
              placeholder="e.g. admin"
              autoComplete="username"
            />
            {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${
                  theme === 'light'
                    ? 'border-slate-300 bg-slate-50/50 text-slate-900'
                    : 'border-slate-700 bg-slate-950/60 text-slate-100'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-400 active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin" size={16} />
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={`mt-6 border-t pt-4 text-center text-xs ${theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
          <p>
            Demo account:{' '}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="font-semibold text-cyan-600 underline hover:text-cyan-500 dark:text-cyan-400"
            >
              admin / admin123
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
