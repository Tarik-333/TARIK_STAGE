import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, User, Info, AlertCircle, Layers, ArrowRight, Sparkles } from 'lucide-react';

const ProjectTimeline = ({ tasks = [], allUsers = [] }) => {
    const [tooltipState, setTooltipState] = useState(null);

    // Filter and validate tasks with dates
    const validTasks = useMemo(() => {
        return tasks.filter(t => {
            const hasStart = t.start_date || t.created_at;
            const hasEnd = t.deadline;
            if (!hasStart || !hasEnd) return false;
            
            const s = new Date(hasStart).getTime();
            const e = new Date(hasEnd).getTime();
            return !isNaN(s) && !isNaN(e);
        }).sort((a, b) => new Date(a.start_date || a.created_at) - new Date(b.start_date || b.created_at));
    }, [tasks]);

    if (validTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="h-24 w-24 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-soft-md flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700">
                    <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Données temporelles absentes</h3>
                <p className="mt-3 text-slate-500 font-medium text-lg">Attribuez des dates d'échéance à vos flux pour activer la vue chronologique.</p>
            </div>
        );
    }

    // Safely calculate range
    const timestamps = validTasks.flatMap(t => [
        new Date(t.start_date || t.created_at).getTime(),
        new Date(t.deadline).getTime()
    ]);

    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    
    const minDate = new Date(minTs);
    const maxDate = new Date(maxTs);
    
    // Add buffer: 2 days before, 7 days after
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 7);

    const totalTime = maxDate.getTime() - minDate.getTime();
    const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24));

    const getPosition = (dateStr) => {
        const dateTs = new Date(dateStr).getTime();
        const offset = dateTs - minDate.getTime();
        return (offset / totalTime) * 100;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft-sm transition-all duration-500">
            {/* Header Control */}
            <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/30 dark:bg-slate-900/50 gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-sm">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">Orchestration des flux</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vision séquentielle</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-soft-sm border border-slate-100 dark:border-slate-800">
                        <button className="btn-icon w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><ChevronLeft size={14}/></button>
                        <div className="px-5 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Mai - Juin 2026</div>
                        <button className="btn-icon w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><ChevronRight size={14}/></button>
                    </div>
                </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 overflow-x-auto custom-scrollbar bg-white dark:bg-[#020617] p-10">
                <div className="relative min-w-[1400px]" style={{ height: `${validTasks.length * 60 + 100}px` }}>
                    
                    {/* Grid of days (every 3 days to avoid clutter) */}
                    <div className="absolute inset-0 flex">
                        {Array.from({ length: Math.ceil(totalDays / 3) }).map((_, i) => {
                            const current = new Date(minDate.getTime() + (i * 3 * 24 * 60 * 60 * 1000));
                            const left = ( (current.getTime() - minDate.getTime()) / totalTime ) * 100;
                            return (
                                <div 
                                    key={i} 
                                    className="border-l border-slate-200 dark:border-slate-800/50 h-full absolute" 
                                    style={{ left: `${left}%` }}
                                >
                                    <span className="absolute -top-6 -left-6 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {current.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Task Bars */}
                    <div className="relative pt-12 space-y-4">
                        {validTasks.map((task, idx) => {
                            const start = task.start_date || task.created_at;
                            const end = task.deadline;
                            const left = Math.max(0, getPosition(start));
                            const right = Math.min(100, getPosition(end));
                            const width = Math.max(right - left, 1); // min 1% width

                            const colors = [
                                'bg-blue-600 shadow-blue-500/20',
                                'bg-teal-600 shadow-teal-500/20',
                                'bg-indigo-600 shadow-indigo-500/20',
                                'bg-slate-800 shadow-slate-500/20'
                            ];
                            const barStyle = task.statut === 'Done' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                           task.statut === 'Blocked' ? 'bg-rose-500 shadow-rose-500/20' : 
                                           colors[idx % colors.length];

                            return (
                                <div 
                                    key={task.id} 
                                    className="relative group" 
                                    style={{ height: '40px' }}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltipState({ task, rect, start, end, idx, left, width });
                                    }}
                                    onMouseLeave={() => setTooltipState(null)}
                                >
                                    <div 
                                        className={`absolute h-full rounded-[1.25rem] shadow-lg flex items-center px-5 transition-all duration-500 group-hover:h-[48px] group-hover:-mt-1 group-hover:z-30 cursor-pointer overflow-hidden border-2 border-white/10 ${barStyle}`}
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                    >
                                        <div className="flex items-center w-full justify-between gap-3 overflow-hidden">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Layers size={14} className="text-white/60 shrink-0" />
                                                <span className="text-[11px] font-black text-white uppercase tracking-widest truncate">{task.nom}</span>
                                            </div>
                                            {task.assignee_id && (
                                                <div className="w-6 h-6 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-[10px] text-white font-black shrink-0">
                                                    {allUsers.find(u => u.id === task.assignee_id)?.nom[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Status Glow */}
                                        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Strategy Legend */}
            <div className="px-10 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Planifié</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-md"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Exécution</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bloqué</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Finalisé</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-soft-sm border border-slate-100 dark:border-slate-700">
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Temps réel actif</span>
                </div>
            </div>
            {tooltipState && createPortal(
                <div 
                    className="fixed pointer-events-none transition-opacity duration-300 z-[9999] animate-in fade-in zoom-in-95"
                    style={{
                        top: tooltipState.rect.top - 12,
                        left: tooltipState.rect.left + (tooltipState.left / 100) * tooltipState.rect.width + ((tooltipState.width / 100) * tooltipState.rect.width) / 2,
                        transform: `translate(-50%, -100%)`
                    }}
                >
                    <div className="bg-[#0f172a] text-white p-5 rounded-[1.5rem] shadow-2xl flex flex-col border border-white/10 min-w-[240px]">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Détails de l'unité</span>
                            <Info size={14} className="text-slate-500" />
                        </div>
                        <p className="text-[14px] font-black mb-1 leading-tight">{tooltipState.task.nom}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mb-4">
                            <span>{new Date(tooltipState.start).toLocaleDateString()}</span>
                            <ArrowRight size={10} />
                            <span>{new Date(tooltipState.end).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-slate-500">Statut actuel</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                tooltipState.task.statut === 'Done' ? 'text-emerald-400 bg-emerald-400/10' :
                                tooltipState.task.statut === 'Blocked' ? 'text-rose-400 bg-rose-400/10' : 'text-blue-400 bg-blue-400/10'
                            }`}>{tooltipState.task.statut}</span>
                        </div>
                        <div className="w-4 h-4 bg-[#0f172a] rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2 border-r border-b border-white/10" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ProjectTimeline;
