import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Calendar, ArrowRight, FolderKanban,
  CheckCircle2, Clock, BarChart3, Search, X, Layers,
  MoreVertical, MoreHorizontal, LayoutGrid, List, Filter, Sparkles,
  ChevronRight, Users, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  { bg: 'linear-gradient(135deg, #2563eb, #1e40af)', accent: '#60a5fa', shadow: 'shadow-blue-500/20' },
  { bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', accent: '#5eead4', shadow: 'shadow-teal-500/20' },
  { bg: 'linear-gradient(135deg, #0f172a, #1e293b)', accent: '#94a3b8', shadow: 'shadow-slate-500/20' },
  { bg: 'linear-gradient(135deg, #4f46e5, #4338ca)', accent: '#818cf8', shadow: 'shadow-indigo-500/20' },
];

const Projects = () => {
  const { api, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newProject, setNewProject] = useState({ nom: '', description: '', statut: 'en cours', date_debut: '', date_fin: '' });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) { 
        console.error(e);
        const msg = e.response?.data?.detail || "Erreur de connexion au système";
        toast.error(msg);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ nom: '', description: '', statut: 'en cours', date_debut: '', date_fin: '' });
      fetchProjects();
      toast.success('Nouveau flux opérationnel activé');
    } catch (e) { toast.error('Échec de la configuration'); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Confirmer la désactivation définitive de cette unité ?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
      toast.success('Unité de travail supprimée');
    } catch (e) { toast.error('Action interdite par le protocole'); }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch = p.nom?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-[1500px] mx-auto pb-20">
      {/* ===== Premium SaaS Header ===== */}
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600/70">Orchestration Stratégique</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight" style={{fontWeight:900}}>Espaces de Travail</h1>
          <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed">Centralisez vos ressources, synchronisez vos équipes et accélérez vos cycles de développement.</p>
        </div>

        <div className="flex items-center gap-5">
           <div className="hidden sm:flex bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-inner">
              <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-soft-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={22} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-soft-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={22} />
              </button>
           </div>
           {user?.role === 'admin' && (
              <button onClick={() => setShowModal(true)} className="btn-primary h-16 px-10 rounded-[1.5rem] text-[16px] font-black shadow-2xl shadow-blue-600/30">
                <Plus size={24} strokeWidth={3} />
                <span>Nouveau Projet</span>
              </button>
           )}
        </div>
      </div>

      {/* ===== Toolbar & Insight ===== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white dark:bg-[#0f172a] p-8 rounded-[2.5rem] shadow-soft-sm border border-slate-50 dark:border-slate-800">
         <div className="flex items-center gap-12">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unités Totales</span>
               <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{projects.length}</span>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Flux</span>
               <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-blue-600 tracking-tight">{projects.filter(p => p.statut === 'en cours').length}</span>
                  <div className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black">Actifs</div>
               </div>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative group flex-1">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Rechercher une unité opérationnelle..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="input-field w-full h-14 pl-14 pr-6 bg-slate-50/50 dark:bg-[#020617] border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner font-bold text-[15px]"
               />
            </div>
            <div className="relative">
              <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary h-14 px-6 rounded-2xl ${filterStatus !== 'all' ? 'border-blue-500 text-blue-600 shadow-sm' : ''}`}>
                 <Filter size={18} />
                 <span>Filtres</span>
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => {setFilterStatus('all'); setShowFilters(false);}} className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterStatus === 'all' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-600 dark:text-slate-300'}`}>Tous les projets</button>
                  <button onClick={() => {setFilterStatus('en cours'); setShowFilters(false);}} className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterStatus === 'en cours' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-600 dark:text-slate-300'}`}>En cours</button>
                  <button onClick={() => {setFilterStatus('terminé'); setShowFilters(false);}} className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterStatus === 'terminé' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-600 dark:text-slate-300'}`}>Terminés</button>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* ===== Projects Display ===== */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-6"}>
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-48 flex flex-col items-center justify-center bg-slate-50/20 dark:bg-[#020617]/20 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div className="h-28 w-28 bg-white dark:bg-slate-800 rounded-[3rem] shadow-soft-lg flex items-center justify-center mb-10 border border-slate-100 dark:border-slate-700">
                <FolderKanban className="h-12 w-12 text-slate-200 dark:text-slate-600" />
             </div>
             <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Système de données vide</h3>
             <p className="mt-4 text-slate-500 font-medium text-xl text-center max-w-lg px-10">Initialisez une nouvelle unité opérationnelle pour synchroniser vos flux de travail.</p>
          </div>
        ) : (
          filteredProjects.map((project, i) => {
            const isDone = project.statut !== 'en cours';
            const isOverdue = project.date_fin && new Date(project.date_fin) < new Date() && !isDone;
            const totalTasks = project.tasks?.length || 0;
            const completedTasks = project.tasks?.filter((t) => t.statut === 'Done').length || 0;
            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            const colorScheme = PROJECT_COLORS[i % PROJECT_COLORS.length];

            return (
              <div key={project.id} className="group relative">
                <div className="card-premium h-full bg-white dark:bg-[#0f172a] border-slate-50 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-700 hover:shadow-soft-lg">
                  
                  {/* Decorative Header Bar */}
                  <div className="h-2 w-full transition-all group-hover:h-3" style={{ background: isDone ? 'linear-gradient(90deg, #10b981, #059669)' : colorScheme.bg }} />

                  <div className="p-10 flex flex-col flex-1">
                    {/* Top: Badges & Controls */}
                    <div className="flex items-center justify-between mb-10">
                       <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] border shadow-sm transition-all duration-500 ${
                          isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 
                          isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20' : 
                          'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20'
                       }`}>
                          {isDone ? 'FINALISÉ' : isOverdue ? 'ALERTE RETARD' : 'OPÉRATIONNEL'}
                       </div>
                       <div className="flex gap-2">
                          {user?.role === 'admin' && (
                            <button onClick={() => deleteProject(project.id)} className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all">
                               <Trash2 size={18} />
                            </button>
                          )}
                          <button className="p-2.5 text-slate-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all">
                             <MoreHorizontal size={22} />
                          </button>
                       </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex items-start gap-8 mb-10">
                       <div className={`h-20 w-20 shrink-0 rounded-[1.75rem] shadow-xl flex items-center justify-center text-white font-black text-3xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 ${colorScheme.shadow}`} style={{ background: colorScheme.bg }}>
                          {project.nom?.charAt(0).toUpperCase()}
                       </div>
                       <div className="min-w-0 pt-2">
                          <h3 className="text-3xl font-black text-slate-900 dark:text-white truncate tracking-tighter leading-[1.1] group-hover:text-blue-600 transition-colors duration-500">{project.nom}</h3>
                          <div className="flex items-center gap-2.5 mt-3 text-slate-400 font-extrabold text-[11px] uppercase tracking-[0.15em]">
                             <Calendar size={14} className="text-blue-500" />
                             <span>{project.date_fin ? new Date(project.date_fin).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Flux continu'}</span>
                          </div>
                       </div>
                    </div>

                    <p className="text-[16px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium mb-12 line-clamp-2 min-h-[48px]">
                      {project.description || "Unité opérationnelle haute performance. Documentation stratégique en cours d'indexation."}
                    </p>

                    {/* Progress Analytics */}
                    <div className="mt-auto space-y-6">
                       <div>
                          <div className="flex items-center justify-between mb-4 px-1">
                             <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Index de Maturité</span>
                                <Sparkles size={12} className={progress > 85 ? "text-teal-500 animate-pulse" : "text-slate-300"} />
                             </div>
                             <span className="text-[16px] font-black text-blue-600">{progress}%</span>
                          </div>
                          <div className="progress-bar-modern h-4 bg-slate-50 dark:bg-slate-800/50 rounded-full shadow-inner p-1">
                             <div 
                                className="progress-fill-modern h-full rounded-full transition-all duration-1000 ease-out relative group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                style={{ 
                                  width: `${progress}%`, 
                                  background: isDone ? 'linear-gradient(90deg, #10b981, #059669)' : colorScheme.bg 
                                }}
                             >
                                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
                             </div>
                          </div>
                       </div>

                       {/* Bottom: Team & Action */}
                       <div className="flex items-center justify-between pt-10 border-t border-slate-50 dark:border-slate-800 mt-10">
                          <div className="flex items-center gap-6">
                             <div className="flex -space-x-3">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-11 h-11 rounded-[1rem] border-4 border-white dark:border-[#0f172a] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-soft-sm">
                                    {String.fromCharCode(64 + i)}
                                  </div>
                                ))}
                                {totalTasks > 3 && (
                                   <div className="w-11 h-11 rounded-[1rem] border-4 border-white dark:border-[#0f172a] bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-black shadow-soft-sm">
                                     +{totalTasks - 3}
                                   </div>
                                )}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{totalTasks} Flux</span>
                                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">Opérationnels</span>
                             </div>
                          </div>

                          <Link 
                            to={`/projects/${project.id}/tasks`}
                            className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-500 shadow-xl shadow-slate-900/10 dark:shadow-blue-600/20 active:scale-90 group/btn"
                          >
                             <ArrowRight size={28} className="transition-transform duration-500 group-hover/btn:translate-x-1" />
                          </Link>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== Create Modal (Refonte) ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl max-h-[95vh] overflow-y-auto custom-scrollbar rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
              
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-[#020617]/50">
                 <div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                       <FolderKanban size={24} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Nouveau Projet</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Créez un nouveau projet pour collaborer avec votre équipe.</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-95">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                 <div className="space-y-3">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nom du projet *</label>
                    <input 
                       type="text" required 
                       value={newProject.nom} 
                       onChange={e => setNewProject({...newProject, nom: e.target.value})}
                       className="input-field" 
                       placeholder="Ex: Refonte du site web"
                    />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date de début</label>
                       <input 
                          type="date" 
                          value={newProject.date_debut} 
                          onChange={e => setNewProject({...newProject, date_debut: e.target.value})} 
                          className="input-field cursor-pointer" 
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date de fin prévue</label>
                       <input 
                          type="date" 
                          value={newProject.date_fin} 
                          onChange={e => setNewProject({...newProject, date_fin: e.target.value})} 
                          className="input-field cursor-pointer" 
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                       value={newProject.description} 
                       onChange={e => setNewProject({...newProject, description: e.target.value})}
                       rows={4} 
                       className="input-field resize-none" 
                       placeholder="Décrivez les objectifs et les détails de ce projet..."
                    />
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 h-12 font-extrabold text-sm uppercase tracking-wider">Annuler</button>
                    <button type="submit" className="btn-primary flex-1 h-12 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20">Créer le projet</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
