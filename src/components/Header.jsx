import { Bell, ChevronDown, CircleUserRound, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';
import { useLoomContext } from '../context/LoomContext';

export default function Header() {
  const { user, notifications, unreadCount, theme, toggleTheme, toggleSidebar } = useLoomContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateLabel = currentTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeLabel = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const surfaceClass = theme === 'light'
    ? 'border-slate-200/90 bg-white/95 text-slate-800 shadow-sm'
    : 'border-slate-800 bg-slate-900/90 text-slate-100 shadow-md';

  const buttonClass = theme === 'light'
    ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/80 active:bg-slate-200'
    : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-700';

  const panelClass = theme === 'light'
    ? 'border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-200/60'
    : 'border-slate-700 bg-slate-900 text-slate-200 shadow-xl shadow-slate-950/60';

  return (
    <header className={`sticky top-0 z-30 flex h-16 shrink-0 items-center border-b px-4 backdrop-blur-xl sm:px-6 ${surfaceClass}`}>
      <div className="flex w-full items-center justify-between gap-4">
        {/* Left: Hamburger and System Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className={`rounded-xl border p-2 transition active:scale-95 ${buttonClass}`}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <Link to="/dashboard" className="text-base font-bold tracking-tight text-cyan-600 dark:text-cyan-400 hover:opacity-90">
              Loomatrix
            </Link>
            <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">|</span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:inline">
              Smart Loom Monitoring & Control
            </span>
          </div>
        </div>

        {/* Right: Date/Time, Theme, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Clock */}
          <div className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs md:flex ${buttonClass}`}>
            <span>{dateLabel}</span>
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <span>{timeLabel}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${buttonClass}`}
            aria-label="Toggle light and dark theme"
          >
            {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
            <span className="hidden lg:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Notifications Button */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen((prev) => !prev)}
              className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${buttonClass}`}
              aria-label="Alerts and notifications"
            >
              <Bell size={15} />
              <span className="hidden sm:inline">Alerts</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>
            {notificationOpen && (
              <NotificationPanel
                notifications={notifications}
                onClose={() => setNotificationOpen(false)}
              />
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${buttonClass}`}
              aria-label="User profile menu"
            >
              <CircleUserRound className="text-cyan-500" size={16} />
              <span className="max-w-[90px] truncate">{user?.username || 'Admin'}</span>
              <ChevronDown size={13} className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'} />
            </button>

            {profileOpen && (
              <div className={`absolute right-0 top-12 w-48 rounded-2xl border p-1.5 shadow-xl backdrop-blur-xl ${panelClass}`}>
                <div className="border-b border-slate-200/80 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.username || 'Admin'}</p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.email || 'admin@example.com'}</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <Link
                    to="/settings?tab=profile"
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      theme === 'light'
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      theme === 'light'
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
