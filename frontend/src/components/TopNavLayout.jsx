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
  Search,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ValaFlowLogo } from './AppLayout';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const colors = ['bg-blue-600', 'bg-teal-600', 'bg-indigo-600', 'bg-cyan-600'];
  const code = name.charCodeAt(0) || 0;
  return colors[code % colors.length];
};

const TopNavLayout = ({ children, toggleLayout }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: FolderKanban, label: 'Projets', to: '/projects' },
    { icon: MessageSquare, label: 'Messagerie', to: '/messagerie' },
    ...(user?.role === 'admin' ? [{ icon: Users, label: 'Équipe', to: '/users' }] : []),
  ];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
      {/* ====== TOP NAVBAR ====== */}
      <nav className="h-20 shrink-0 bg-[#0f172a] text-white px-8 lg:px-12 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-10">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <ValaFlowLogo className="w-7 h-7" darkForce={true} />
            </div>
            <span className="text-xl font-black tracking-tighter">ValaFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive(item.to) 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-y-[-1px]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">

           <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
              </button>

              <button onClick={toggleLayout} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all" title="Changer l'apparence">
                <Settings size={20} />
              </button>
              
              <Link to="/settings" className="flex items-center gap-3 pl-3 py-1.5 pr-1.5 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                 <div className={`h-8 w-8 rounded-lg shadow-md flex items-center justify-center text-[10px] font-black text-white ${getAvatarColor(user?.nom)}`}>
                    {getInitials(user?.nom)}
                 </div>
                 <ChevronDown size={14} className="text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2.5 rounded-xl bg-white/5">
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
           </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 z-40 bg-[#0f172a] p-6 space-y-4 animate-in slide-in-from-top duration-300">
           {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-extrabold ${isActive(item.to) ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <item.icon size={24} />
                {item.label}
              </Link>
           ))}
           <div className="h-px bg-white/5 my-6" />
           <button onClick={logout} className="flex items-center gap-4 p-4 rounded-2xl text-rose-400 font-extrabold text-lg w-full">
              <LogOut size={24} />
              Déconnexion
           </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto max-w-[1600px] p-8 lg:p-12 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default TopNavLayout;
