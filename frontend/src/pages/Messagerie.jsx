import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProjectChat from '../components/ProjectChat';
import { MessageSquare, Search, Filter, Hash, Bell, ChevronDown, Sparkles } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const Messagerie = () => {
    const { api, user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects/');
                setProjects(res.data);
                if (res.data.length > 0) setSelectedProjectId(res.data[0].id);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchProjects();
    }, [api]);

    const filteredProjects = projects.filter(p => p.nom?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-0 overflow-hidden card-premium shadow-soft-lg border-white/40">
            {/* Sidebar de Messagerie */}
            <div className="flex w-80 shrink-0 flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f172a]/50 backdrop-blur-md">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                <MessageSquare size={22} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter" style={{fontWeight:900}}>Messages</h2>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un canal…" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="input-field w-full py-3 pl-11 pr-4 text-xs bg-white dark:bg-[#020617] border-slate-100 dark:border-slate-800 shadow-sm" 
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">
                    <div>
                        <div className="flex items-center justify-between px-3 mb-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canaux Opérationnels</p>
                             <Sparkles size={12} className="text-blue-500 opacity-50" />
                        </div>
                        <div className="space-y-1.5">
                            {loading ? (
                                <div className="space-y-3 px-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800" />
                                    ))}
                                </div>
                            ) : (
                                filteredProjects.map((p) => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => setSelectedProjectId(p.id)} 
                                        className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-300 group ${
                                            selectedProjectId === p.id 
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft-sm'
                                        }`}
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                                            selectedProjectId === p.id 
                                                ? 'bg-white/20 text-white rotate-6' 
                                                : 'bg-slate-100 dark:bg-[#020617] text-slate-400 group-hover:text-blue-600'
                                        }`}>
                                            <Hash size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-[14px] font-extrabold tracking-tight ${selectedProjectId === p.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{p.nom}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`h-1.5 w-1.5 rounded-full ${selectedProjectId === p.id ? 'bg-white/60' : 'bg-teal-500'} animate-pulse`} />
                                                <p className={`truncate text-[10px] font-bold uppercase tracking-tighter ${selectedProjectId === p.id ? 'text-white/70' : 'text-slate-400'}`}>Activités IA</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-6 bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] shadow-inner border border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-xs font-black text-blue-600 shadow-sm">
                                {getInitials(user?.nom)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-[#0f172a] bg-teal-500 shadow-md" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800 dark:text-white tracking-tight">{user?.nom}</p>
                            <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest">Connecté</p>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Zone de Chat */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#020617]">
                {!selectedProjectId ? (
                    <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-soft-lg border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-700">
                            <MessageSquare className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter" style={{fontWeight:900}}>Flux de Communication</h3>
                        <p className="mt-4 max-w-md text-slate-500 font-medium leading-relaxed text-lg">Sélectionnez une unité opérationnelle pour synchroniser vos échanges avec l'équipe.</p>
                        <div className="mt-10 flex gap-4">
                            <div className="px-5 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[11px] font-black border border-blue-100 dark:border-blue-900/30 uppercase tracking-widest">#SaaS_Core</div>
                            <div className="px-5 py-2.5 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-[11px] font-black border border-teal-100 dark:border-teal-900/30 uppercase tracking-widest">#Temps_Réel</div>
                        </div>
                    </div>
                ) : (
                    <ProjectChat projectId={selectedProjectId} key={selectedProjectId} />
                )}
            </div>
        </div>
    );
};

export default Messagerie;
