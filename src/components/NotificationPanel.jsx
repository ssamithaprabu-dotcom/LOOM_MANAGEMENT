import { BellRing, CheckCheck } from 'lucide-react';
import { useLoomContext } from '../context/LoomContext';

export default function NotificationPanel({ notifications, onClose }) {
  const { markAllNotificationsRead, markNotificationRead, theme } = useLoomContext();

  return (
    <div className={`absolute right-0 top-14 z-30 w-[360px] rounded-2xl border p-4 shadow-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-800 shadow-slate-200/60' : 'border-slate-700 bg-slate-900/95 text-slate-100 shadow-slate-950/60'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing size={16} className={theme === 'light' ? 'text-cyan-600' : 'text-cyan-300'} />
          <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Alerts</h3>
        </div>
        <button type="button" onClick={markAllNotificationsRead} className={`text-[10px] uppercase tracking-[0.18em] transition ${theme === 'light' ? 'text-cyan-600 hover:text-cyan-700' : 'text-cyan-300 hover:text-cyan-200'}`}>
          Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>No new notifications.</p>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => { markNotificationRead(notification.id); onClose?.(); }}
              className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                notification.read
                  ? theme === 'light' ? 'border-slate-200 bg-slate-100' : 'border-slate-700 bg-slate-800/50'
                  : 'border-cyan-500/40 bg-cyan-500/5'
              }`}
            >
              <div>
                <span className={`inline-flex rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.2em] ${
                  notification.type === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-600' :
                  notification.type === 'WARNING' ? 'bg-amber-500/15 text-amber-600' :
                  notification.type === 'ALERT' ? 'bg-red-500/15 text-red-600' :
                  'bg-sky-500/15 text-sky-600'
                }`}>
                  {notification.type}
                </span>
                <p className={`mt-2 text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{notification.text}</p>
                <p className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{notification.time}</p>
              </div>
              {!notification.read && <CheckCheck size={16} className={theme === 'light' ? 'mt-1 text-cyan-600' : 'mt-1 text-cyan-300'} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
