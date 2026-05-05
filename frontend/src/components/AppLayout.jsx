import React, { useState, useContext, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  X,
  Search,
  ChevronRight,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ValaFlowLogo = ({ className = "w-8 h-8", darkForce = false }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Pilule : coins arrondis uniquement à gauche, droite plate */}
    <path 
      d="M 20 25 V 75 H 14 A 4 4 0 0 1 10 71 V 29 A 4 4 0 0 1 14 25 Z" 
      className={darkForce ? "fill-white" : "fill-slate-900 dark:fill-white"} 
    />
    
    {/* Bloc central : c'est un TRIANGLE RECTANGLE (angle droit en haut à gauche) */}
    <path 
      d="M 24 25 H 60 L 24 70 Z" 
      className={darkForce ? "fill-white" : "fill-slate-900 dark:fill-white"} 
    />
    
    {/* Forme 'A' de droite : s'aligne parfaitement avec l'écart du triangle */}
    <path 
      d="M 64 25 H 90 V 75 H 74 V 35 L 42 75 H 24 Z" 
      className="fill-blue-600" 
    />
  </svg>
);

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const colors = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-slate-700', 'bg-cyan-600'];
  const code = name.charCodeAt(0) || 0;
  return colors[code % colors.length];
};

const AppLayout = ({ children, toggleLayout }) => {
  const { user, logout, api } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed for auto-expand
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const mainNav = [
    { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard' },
    { icon: FolderKanban, label: 'Projets', to: '/projects' },
    { icon: MessageSquare, label: 'Messagerie', to: '/messagerie' },
    ...(user?.role === 'admin' ? [{ icon: Users, label: 'Équipe', to: '/users' }] : []),
  ];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');
  const currentNav = mainNav.find(n => isActive(n.to));
  const currentPageLabel = currentNav?.label || 'Application';
  const CurrentPageIcon = currentNav?.icon || Zap;
  
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-500">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ====== OPTION A: AUTO-COLLAPSE SIDEBAR ====== */}
      <aside
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-[88px]' : 'w-[280px] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)]'}`}
        style={{ background: 'var(--vf-sidebar)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className={`flex h-24 shrink-0 items-center transition-all duration-500 ${sidebarCollapsed ? 'justify-center px-2' : 'px-8 justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-4 min-w-0 group">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/5 shadow-lg group-hover:scale-110 transition-transform">
              <ValaFlowLogo className="w-8 h-8" darkForce={true} />
            </div>
            <span className={`text-[20px] font-black tracking-tighter text-white transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>ValaFlow</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-10">
          <div>
             <p className={`px-4 mb-4 text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-500 transition-all duration-500 ${sidebarCollapsed ? 'opacity-0' : 'opacity-50'}`}>Menu</p>
             <nav className="space-y-1.5">
               {mainNav.map((item) => (
                 <Link
                   key={item.to}
                   to={item.to}
                   className={`sidebar-link ${isActive(item.to) ? 'active' : ''} ${sidebarCollapsed ? 'w-12 h-12 justify-center p-0 mx-auto !gap-0' : ''}`}
                 >
                   <item.icon size={22} className={`${isActive(item.to) ? 'text-white' : 'text-slate-400'} shrink-0`} />
                   <span className={`font-bold transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{item.label}</span>
                 </Link>
               ))}
             </nav>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <Link to="/settings" className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}>
             <div className={`h-10 w-10 shrink-0 rounded-[0.8rem] shadow-md flex items-center justify-center text-white font-extrabold text-xs transition-all ${getAvatarColor(user?.nom)} ${sidebarCollapsed ? 'scale-110' : ''}`}>
               {getInitials(user?.nom)}
             </div>
             <div className={`min-w-0 flex-1 transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
               <p className="truncate text-[14px] font-extrabold text-white tracking-tight">{user?.nom}</p>
               <p className="truncate text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.role}</p>
             </div>
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }} className={`sidebar-link w-full mt-4 text-slate-500 hover:text-rose-400 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
            <LogOut size={20} />
            <span className={`font-extrabold text-[11px] uppercase tracking-widest transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Quitter</span>
          </button>
        </div>
      </aside>

      {/* ====== MAIN AREA ====== */}
      <div className="flex min-w-0 flex-1 flex-col relative">
        <header className="flex h-24 shrink-0 items-center justify-between bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl px-8 lg:px-12 z-30 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
                 <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-black text-[10px] uppercase tracking-widest shadow-sm">ValaFlow</span>
                    <span className="text-[12px] font-bold text-slate-400 capitalize">{todayDate}</span>
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight flex items-center gap-3">
                    <CurrentPageIcon className="text-blue-600 dark:text-blue-500 drop-shadow-sm" size={28} strokeWidth={2.5} />
                    {currentPageLabel}
                 </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="btn-icon w-14 h-14 relative group">
                <Bell size={22} className="group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-600 border-2 border-white dark:border-slate-900 rounded-full"></span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                  <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-black text-slate-800 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700">Tout lire</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm font-semibold">Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => !n.is_read && handleMarkAsRead(n.id)} className={`p-4 border-b border-slate-50 dark:border-slate-800/50 transition-colors cursor-pointer ${n.is_read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleDarkMode} className="btn-icon w-14 h-14 group">
              {isDark ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} className="group-hover:text-blue-600" />}
            </button>
            <button onClick={toggleLayout} className="btn-icon w-14 h-14 group" title="Changer l'apparence">
              <Settings size={22} className="group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[1600px] p-8 lg:p-12 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
