import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, BarChart2, Clock, Filter, Layers, Info, Sparkles, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const Gantt = () => {
    const { api } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewRange, setViewRange] = useState(3); // months

    useEffect(() => {
        const fetchData = async () => {
            try { 
                const res = await api.get('/projects'); 
                const data = Array.isArray(res.data) ? res.data : [];
                // Filter projects that actually have some form of dates
                setProjects(data); 
            } catch (e) { 
                toast.error('Échec de la synchronisation temporelle'); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [api]);

    // Robust timeline calculation
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + viewRange, 0);
    const totalTime = endDate.getTime() - startDate.getTime();
    
    const months = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
        months.push(new Date(curr));
        curr.setMonth(curr.getMonth() + 1);
    }

    const calcPos = (startStr, endStr) => {
        if (!startStr) return { left: '0%', width: '5%' };
        
        const sDate = new Date(startStr);
        const eDate = endStr ? new Date(endStr) : new Date(sDate.getTime() + 86400000 * 14);
        
        const sTs = isNaN(sDate.getTime()) ? today.getTime() : sDate.getTime();
        const eTs = isNaN(eDate.getTime()) ? sTs + 86400000 * 14 : eDate.getTime();

        const startOffset = Math.max(0, sTs - startDate.getTime());
        const duration = Math.max(86400000, eTs - sTs); 
        
        if (totalTime <= 0) return { left: '0%', width: '10%' };

        return { 
            left: `${(startOffset / totalTime) * 100}%`, 
            width: `${Math.min(100, (duration / totalTime) * 100)}%` 
        };
    };

    if (loading) return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-50 border-t-blue-600 shadow-xl" />
            <div className="text-center space-y-2">
               <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.3em]">Orchestration temporelle</p>
               <p className="text-xs font-bold text-slate-400 animate-shimmer">Initialisation des flux stratégiques…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-20">
            {/* Header Control */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between bg-white dark:bg-[#0f172a] p-10 rounded-[3rem] shadow-soft-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-premium shadow-xl shadow-blue-500/30 text-white">
                        <BarChart2 size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Vision Séquentielle</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none" style={{fontWeight:900}}>Chronologie Globale</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-5">
                    <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                        <button className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-blue-600 bg-white dark:bg-slate-800 rounded-xl shadow-soft-sm transition-all">Période : Mois</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn-icon rounded-2xl w-14 h-14 bg-white dark:bg-slate-900 shadow-soft-sm hover:text-blue-600 transition-all"><ChevronLeft size={24} /></button>
                        <button className="btn-icon rounded-2xl w-14 h-14 bg-white dark:bg-slate-900 shadow-soft-sm hover:text-blue-600 transition-all"><ChevronRight size={24} /></button>
                    </div>
                </div>
            </div>

            {/* Gantt Matrix */}
            <div className="card-premium overflow-hidden border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-soft-lg">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[1400px]">
                        {/* Matrix Header */}
                        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                            <div className="w-80 shrink-0 border-r border-slate-100 dark:border-slate-800 px-10 py-7">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Flux Opérationnels</span>
                            </div>
                            <div className="flex flex-1">
                                {months.map((month, i) => (
                                    <div key={i} className="flex-1 border-r border-slate-100/50 dark:border-slate-800/50 px-2 py-7 text-center">
                                        <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                                            {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matrix Grid */}
                        <div className="relative min-h-[600px] bg-white dark:bg-[#020617]">
                            <div className="pointer-events-none absolute inset-0 flex">
                                <div className="w-80 shrink-0 border-r border-slate-50 dark:border-slate-800/50" />
                                <div className="flex flex-1">
                                    {months.map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-slate-50/50 dark:border-slate-800/30" />
                                    ))}
                                </div>
                            </div>

                            {/* Today Pointer */}
                            <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10 shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                                style={{ left: calcPos(today, today).left }}
                            >
                                <div className="absolute top-0 -translate-x-1/2 bg-blue-600 text-[10px] text-white px-4 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl border-2 border-white dark:border-[#020617] whitespace-nowrap">Status: Live</div>
                            </div>

                            {/* Operational Rows */}
                            <div className="relative z-10 divide-y divide-slate-50 dark:divide-slate-800/50">
                                {projects.map((project, idx) => {
                                    const tasks = project.tasks || [];
                                    const completed = tasks.filter(t => t.statut === 'Done').length;
                                    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                                    const barColor = idx % 2 === 0 ? 'bg-blue-600' : 'bg-teal-600';

                                    return (
                                        <div key={project.id} className="flex group hover:bg-slate-50/50 dark:hover:bg-blue-900/10 transition-all duration-300">
                                            <div className="flex w-80 shrink-0 items-center gap-6 px-10 py-8">
                                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] text-white font-black text-xl shadow-lg transition-all duration-700 group-hover:rotate-6 ${barColor}`}>
                                                    {project.nom?.charAt(0).toUpperCase() || 'P'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[16px] font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors tracking-tighter">{project.nom}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full ${barColor} shadow-lg`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative flex-1 py-8 flex items-center">
                                                <div 
                                                    className={`absolute h-12 rounded-[1.5rem] flex items-center px-8 shadow-soft-md border-2 border-white/20 dark:border-white/5 overflow-hidden group/bar transition-all duration-700 hover:h-16 hover:z-30 cursor-pointer ${barColor}`}
                                                    style={calcPos(project.date_debut, project.date_fin)}
                                                >
                                                    <div className="absolute inset-0 bg-white/10 opacity-60 group-hover:opacity-0 transition-opacity" />
                                                    <div className="absolute inset-0 bg-black/10" style={{ width: `${100 - progress}%`, left: `${progress}%` }} />
                                                    
                                                    <div className="relative z-10 flex items-center gap-4 w-full">
                                                         <Layers size={20} className="text-white/80" />
                                                         <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] truncate">
                                                            {project.nom}
                                                         </span>
                                                    </div>
                                                    
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 hidden group-hover/bar:block z-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <div className="bg-[#0f172a] text-white p-8 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-white/10 min-w-[320px]">
                                                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-6">
                                                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Fiche de Flux</span>
                                                                <Activity size={20} className="text-teal-500 animate-pulse" />
                                                            </div>
                                                            <p className="text-xl font-black mb-2 tracking-tight">{project.nom}</p>
                                                            <p className="text-[13px] text-slate-400 font-medium mb-8">{new Date(project.date_debut).toLocaleDateString()} &rarr; {project.date_fin ? new Date(project.date_fin).toLocaleDateString() : 'Indéfini'}</p>
                                                            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                                                <div className="flex items-center justify-between text-[11px] font-black mb-3 uppercase tracking-widest">
                                                                    <span className="text-slate-500">Progression</span>
                                                                    <span className="text-teal-400">{progress}%</span>
                                                                </div>
                                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-6 h-6 bg-[#0f172a] rotate-45 absolute -bottom-3 left-1/2 -translate-x-1/2 border-r border-b border-white/10" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Analytics Dashboard (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="card-premium p-10 flex flex-col gap-6 bg-white dark:bg-[#0f172a]">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-soft-sm">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">IA Engine</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Analyse Prédictive de Flux Terminée</p>
                    </div>
                </div>
                <div className="md:col-span-2 card-premium p-10 flex flex-col justify-between bg-white dark:bg-[#0f172a]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Protocoles de Légende</h3>
                        <div className="px-5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800">Système V2.1</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-10">
                        {[
                            { c: 'bg-blue-600', t: 'Core System', p: 'Fondations' },
                            { c: 'bg-teal-600', t: 'Innovation', p: 'R&D Actif' },
                            { c: 'bg-rose-600', t: 'Points d\'arrêt', p: 'Bloquants' },
                            { c: 'bg-slate-800', t: 'Stratégie', p: 'Haut Niveau' }
                        ].map((item) => (
                            <div key={item.t} className="flex items-center gap-5 group cursor-help">
                                <div className={`h-4 w-4 rounded-full ${item.c} shadow-lg transition-transform group-hover:scale-125`} />
                                <div>
                                    <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">{item.t}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.p}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gantt;
