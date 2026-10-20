import { X, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLoomContext } from '../context/LoomContext';

export default function Sidebar({ navItems }) {
  const navigate = useNavigate();
  const { logout, theme, sidebarOpen, setSidebarOpen } = useLoomContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Auto-close drawer on mobile devices
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          theme === 'light'
            ? 'border-slate-200 bg-white/95 text-slate-800 shadow-lg shadow-slate-200/50'
            : 'border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl shadow-slate-950/70'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header: Perfectly matches Header.jsx height (h-16) and border line */}
        <div
          className={`flex h-16 shrink-0 items-center justify-between border-b px-4 ${
            theme === 'light' ? 'border-slate-200/80' : 'border-slate-800'
          }`}
        >
          {/* Subtle Navigation Label aligned with navigation items */}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
            Navigation
          </span>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={`rounded-lg p-1.5 transition lg:hidden ${
              theme === 'light'
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            aria-label="Close navigation drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List: Consistent left alignment, same width, padding, and spacing */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-3">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? theme === 'light'
                      ? 'bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/30 font-bold shadow-sm'
                      : 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30 font-bold shadow-sm'
                    : theme === 'light'
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Separated Logout Section at the Bottom: Perfectly aligned with navigation items */}
        <div className={`border-t p-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition ${
              theme === 'light'
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <LogOut size={18} className="shrink-0 text-rose-500" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
