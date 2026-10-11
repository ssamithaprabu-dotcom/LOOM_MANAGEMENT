import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildNotification, normalizeStatus } from '../utils/helpers';
import { api } from '../services/api';

const LoomContext = createContext(null);

export function LoomProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [looms, setLooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({ username: 'Admin', email: 'admin@example.com' });
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('loom-monitoring-theme');
      return stored ? JSON.parse(stored) : 'light';
    } catch {
      return 'light';
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [toast, setToast] = useState(null);
  const [loadingLooms, setLoadingLooms] = useState(false);
  const [loomsError, setLoomsError] = useState(null);

  // Validate existing session token on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const token = localStorage.getItem('loom-token');
      if (token) {
        try {
          const res = await api.getCurrentUser();
          if (isMounted && res && res.user) {
            setUser(res.user);
            setSettings((prev) => ({
              ...prev,
              username: res.user.username,
              email: res.user.email,
              role: res.user.role,
            }));
          }
        } catch {
          // Token is expired or invalid
          localStorage.removeItem('loom-token');
          if (isMounted) setUser(null);
        }
      }
      if (isMounted) setAuthChecked(true);
    }

    restoreSession();
    return () => { isMounted = false; };
  }, []);

  // Sync data from backend when user is authenticated
  const refreshLooms = async () => {
    setLoadingLooms(true);
    setLoomsError(null);
    try {
      const data = await api.getLooms();
      if (Array.isArray(data)) {
        setLooms(data);
      }
    } catch (err) {
      setLoomsError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoadingLooms(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Notifications fetch notice:', err.message);
    }
  };

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.username) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Settings fetch notice:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      refreshLooms();
      refreshNotifications();
      refreshSettings();
    }
  }, [user]);

  // Apply Theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('loom-monitoring-theme', JSON.stringify(theme));
  }, [theme]);

  // Auto-dismiss Toast
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Authenticate against real backend
  const login = async (username, password) => {
    const data = await api.login(username, password);
    if (data && data.user) {
      setUser(data.user);
      setSettings((prev) => ({ ...prev, username: data.user.username, email: data.user.email }));
      return data.user;
    }
    throw new Error('Invalid response from authentication server');
  };

  const logout = () => {
    localStorage.removeItem('loom-token');
    setUser(null);
    setLooms([]);
    setNotifications([]);
  };

  const updateLoom = async (loomId, updatedValues) => {
    const updated = await api.updateLoom(loomId, updatedValues);
    setLooms((prev) => prev.map((l) => (l.id === loomId ? updated : l)));
    return updated;
  };

  const addLoom = async (loomData) => {
    const created = await api.createLoom(loomData);
    setLooms((prev) => [...prev, created]);
    return created;
  };

  const deleteLoom = async (loomId) => {
    await api.deleteLoom(loomId);
    setLooms((prev) => prev.filter((loom) => loom.id !== loomId));
  };

  const addNotification = async (type, text) => {
    try {
      const item = await api.createNotification(type, text);
      setNotifications((prev) => [item, ...prev]);
    } catch {
      const item = buildNotification(type, text);
      setNotifications((prev) => [item, ...prev]);
    }
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const markNotificationRead = async (notificationId) => {
    await api.markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const updateLoomStatus = async (loomId, actionLabel = 'UPDATE') => {
    const updated = await api.executeLoomAction(loomId, actionLabel);
    setLooms((prev) => prev.map((item) => (item.id === loomId ? updated : item)));
    return updated;
  };

  const value = useMemo(
    () => ({
      user,
      authChecked,
      looms,
      setLooms,
      loadingLooms,
      loomsError,
      refreshLooms,
      notifications,
      setNotifications,
      settings,
      setSettings,
      toast,
      theme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      toggleTheme,
      showToast,
      login,
      logout,
      updateLoom,
      addLoom,
      deleteLoom,
      addNotification,
      markAllNotificationsRead,
      markNotificationRead,
      unreadCount,
      updateLoomStatus,
    }),
    [
      user,
      authChecked,
      looms,
      loadingLooms,
      loomsError,
      notifications,
      settings,
      theme,
      sidebarOpen,
      toast,
      unreadCount,
    ],
  );

  return <LoomContext.Provider value={value}>{children}</LoomContext.Provider>;
}

export const useLoomContext = () => {
  const context = useContext(LoomContext);
  if (!context) {
    throw new Error('useLoomContext must be used within LoomProvider');
  }
  return context;
};
