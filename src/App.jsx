import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutDashboard, MonitorCog, PlusSquare, Settings, UserCircle2, LoaderCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoomManagement from './pages/LoomManagement';
import AddLoom from './pages/AddLoom';
import LoomDetails from './pages/LoomDetails';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import Toast from './components/Toast';
import { useLoomContext } from './context/LoomContext';

// Exact Navigation Order specified in requirements:
// 1. Dashboard
// 2. Settings
// 3. Profile
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
];

function ProtectedLayout() {
  const { user, authChecked, theme, sidebarOpen } = useLoomContext();

  if (!authChecked) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-950'}`}>
        <LoaderCircle className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const shellTheme = theme === 'light'
    ? 'min-h-screen bg-slate-100 text-slate-900'
    : 'min-h-screen bg-slate-950 text-slate-100';

  return (
    <div className={shellTheme}>
      <div className="flex min-h-screen">
        <Sidebar navItems={navItems} />
        <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
          <Header />
          <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/add-loom" element={<AddLoom />} />
              <Route path="/loom/:loomId" element={<LoomDetails />} />
              <Route path="/loom-management" element={<Navigate to="/settings?tab=looms" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { toast } = useLoomContext();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
