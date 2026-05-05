import React, { useState, useContext, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderRoot,
  BarChart2,
  MessageSquare,
  Users,
  Settings,
  Search,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Folder,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';

const NavIcon = ({ icon: Icon, active = false, to, title }) => (
  <Link
    to={to}
    title={title}
    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
      active
        ? 'bg-vf text-white shadow-md shadow-vf/25'
        : 'text-slate-500 hover:bg-vf-soft hover:text-vf dark:text-slate-400 dark:hover:bg-vf/15 dark:hover:text-vf/90'
    }`}
  >
    <Icon size={20} strokeWidth={1.75} />
  </Link>
);

const ProjectItem = ({ project, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full cursor-pointer items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
      active
        ? 'border-vf/25 bg-gradient-to-r from-vf-soft to-vf-muted/40 shadow-sm dark:from-vf/20 dark:to-vf/10 dark:border-vf/30'
        : 'border-transparent hover:bg-white/80 dark:hover:bg-zinc-800/60'
    }`}
  >
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          active
            ? 'bg-vf text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300'
        }`}
      >
        <Folder size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-navy dark:text-white">{project.nom}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {project.statut || 'En cours'}
        </p>
      </div>
    </div>
    <ChevronRight
      size={16}
      className={`shrink-0 text-slate-400 transition-transform ${
        active ? 'translate-x-0 text-vf opacity-100' : 'opacity-0 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1'
      }`}
    />
  </button>
);

const CreativeLayout = ({ children }) => {
  const { user, logout, api } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const isProjectsView = location.pathname.includes('/projects');
  const currentProjectId = location.pathname.split('/')[2];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to fetch projects for sidebar', err);
      }
    };
    if (user) fetchProjects();
  }, [api, user]);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-app-gradient font-sans text-navy transition-colors dark:text-zinc-100">
      <aside className="flex w-[76px] shrink-0 flex-col items-center border-r border-white/60 bg-white/70 py-5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <Link to="/dashboard" className="mb-7 px-2 transition-opacity hover:opacity-90" title="Accueil">
          <Logo className="h-10 w-auto max-w-[54px]" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          <NavIcon
            icon={LayoutDashboard}
            active={location.pathname === '/dashboard'}
            to="/dashboard"
            title="Tableau de bord"
          />
          <NavIcon icon={FolderRoot} active={isProjectsView} to="/projects" title="Projets" />
          <NavIcon
            icon={BarChart2}
            active={location.pathname === '/timeline'}
            to="/timeline"
            title="Planning"
          />
          <NavIcon
            icon={MessageSquare}
            active={location.pathname === '/messagerie'}
            to="/messagerie"
            title="Messagerie"
          />
          {user?.role === 'admin' && (
            <NavIcon icon={Users} active={location.pathname === '/users'} to="/users" title="Équipe" />
          )}
          <NavIcon
            icon={Settings}
            active={location.pathname === '/settings'}
            to="/settings"
            title="Paramètres"
          />
        </nav>

        <div className="mt-auto flex flex-col gap-1.5">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-vf-soft hover:text-vf dark:hover:bg-vf/15"
            title="Thème"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {isProjectsView && (
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-white/50 bg-white/50 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/50 md:flex">
          <div className="flex h-full flex-col p-5">
            <h2 className="mb-1 text-base font-bold text-navy dark:text-white">Projets</h2>
            <p className="mb-4 text-xs font-medium text-slate-500">Tous vos espaces</p>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un projet…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-slate-200/80 bg-[#F0F4F8]/80 pl-10 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-vf/35 focus:bg-white focus:ring-4 focus:ring-vf/10 dark:border-zinc-700 dark:bg-zinc-800/80 dark:focus:bg-zinc-800"
              />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
              {filteredProjects.length === 0 ? (
                <p className="py-10 text-center text-xs font-medium text-slate-500">Aucun projet</p>
              ) : (
                filteredProjects.map((p) => (
                  <ProjectItem
                    key={p.id}
                    project={p}
                    active={currentProjectId === p.id.toString()}
                    onClick={() => navigate(`/projects/${p.id}/tasks`)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      )}

      <main className="relative min-w-0 flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default CreativeLayout;
