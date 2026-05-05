import React from 'react';
import {
  CheckCircle, Target, TrendingUp, Calendar, ArrowRight,
  Search, Clock, Zap, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const EmployeeDashboard = ({ stats, myTasks, projects, user, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-16 animate-fade-in">
      {/* ===== Header / Hero ===== */}
      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8 p-12 relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.1)] rounded-[32px] bg-gradient-to-br from-[#0a0f1d] via-[#0f172a] to-[#06142c]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-600/10 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 text-[11px] font-extrabold uppercase tracking-widest border border-teal-500/20 backdrop-blur-md">
                  Mon Espace Personnel
                </span>
                <span className="text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.15em]">{todayDate}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-tight mb-4 tracking-tighter" style={{fontWeight:900, textShadow: '0 4px 20px rgba(0,0,0,0.2)'}}>
                {greeting}, {user?.nom?.split(' ')[0]}!
              </h1>
              <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed drop-shadow-sm">
                Vous avez actuellement <span className="text-white font-extrabold drop-shadow-md">{myTasks?.length || 0}</span> urgences à traiter.
                Votre efficacité globale est à <span className="text-teal-400 font-extrabold drop-shadow-md">{stats.progress}%</span>.
              </p>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button className="px-8 py-4 rounded-2xl font-extrabold text-[15px] bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-[0_8px_24px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_32px_rgba(20,184,166,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 border border-teal-400/20">
                Traiter mes urgences
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="group bg-white dark:bg-[#0f172a] p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-center flex-1 relative overflow-hidden hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-teal-500" />
            <div className="w-16 h-16 rounded-[20px] bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 mb-6 shadow-[0_8px_20px_rgba(20,184,166,0.15)] group-hover:scale-105 transition-transform">
              <Target size={28} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-2">Mes Tâches Réalisées</p>
              <div className="flex items-end gap-4">
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{stats.completedTasks}</h3>
                <span className="flex items-center text-[13px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-3 py-1.5 rounded-xl mb-2 shadow-sm">
                  <TrendingUp size={16} className="mr-1" /> Super !
                </span>
              </div>
            </div>
          </div>
          
          <div className="group bg-white dark:bg-[#0f172a] p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-center flex-1 relative overflow-hidden hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-500" />
            <div className="w-16 h-16 rounded-[20px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6 shadow-[0_8px_20px_rgba(37,99,235,0.15)] group-hover:scale-105 transition-transform">
              <Zap size={28} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-2">Mon Implication</p>
              <div className="flex items-end gap-4">
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{stats.totalProjects}</h3>
                <span className="text-[13px] font-bold text-slate-500 mb-3 ml-2">Projets actifs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* ===== My Tasks ===== */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 shadow-[0_4px_12px_rgba(225,29,72,0.15)]">
              <AlertCircle size={24} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Mes Urgences</h3>
              <p className="text-[14px] text-slate-500 font-bold">À traiter au plus vite</p>
            </div>
          </div>

          {myTasks && myTasks.length > 0 ? (
            <div className="flex flex-col gap-4">
              {myTasks.map(task => (
                <div key={task.id} className="p-6 rounded-[24px] bg-white dark:bg-[#0f172a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border-2 border-slate-100 dark:border-slate-800 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] transition-all duration-300 group flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 line-clamp-2">{task.nom}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                        task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-wider">
                        {task.statut}
                      </span>
                    </div>
                    <button onClick={() => navigate(`/projects/${task.project_id}/tasks`)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
                      <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <CheckCircle size={48} className="text-teal-400 mb-4 opacity-50" />
              <p className="text-slate-500 font-bold">Aucune tâche assignée en attente.<br/>Beau travail !</p>
            </div>
          )}
        </div>

        {/* ===== My Projects Table ===== */}
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] border-2 border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-8 lg:px-10 border-b-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)]">
                <Calendar size={24} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Mes Projets</h3>
                <p className="text-[14px] text-slate-500 font-bold">Espaces où vous êtes impliqué</p>
              </div>
            </div>
            <div className="relative group w-full sm:w-64 shadow-sm rounded-xl">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  className="w-full py-3 pl-12 pr-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-[#0f172a] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all duration-300 outline-none text-[14px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#0f172a]">
                  <th className="px-8 py-5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/80">Projet</th>
                  <th className="px-8 py-5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/80">Avancement</th>
                  <th className="px-8 py-5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 text-right border-b border-slate-100 dark:border-slate-800/80">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0f172a]">
                {projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a] transition-all duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                          {project.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[15px] font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{project.nom}</p>
                          <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${project.statut === 'terminé' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>{project.statut}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-300">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => navigate(`/projects/${project.id}/tasks`)} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[13px] shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all">
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
