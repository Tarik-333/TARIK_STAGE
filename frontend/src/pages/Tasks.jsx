import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    Plus, Search, LayoutGrid, Download, 
    Trash2, Paperclip, Sparkles, Users, 
    ChevronRight, Info, User as UserIcon, X, ArrowRight, CircleDashed,
    MessageCircle, UserPlus, Filter, MoreVertical, Calendar, Clock,
    Layout, CheckCircle2, AlertCircle, Layers, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectChat from '../components/ProjectChat';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTimeline from '../components/ProjectTimeline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Tasks = () => {
    const { projectId } = useParams();
    const { api, user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');
    
    const [searchTask, setSearchTask] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterAssignee, setFilterAssignee] = useState('All');
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({ nom: '', statut: 'To Do', priority: 'Medium', deadline: '', assignee_id: '' });

    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [commentText, setCommentText] = useState('');

    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        try {
            const [tasksRes, usersRes, projectsRes] = await Promise.all([
                api.get(`/tasks/project/${projectId}`),
                api.get('/auth/users').catch(() => ({data: []})),
                api.get('/projects').catch(() => ({data: []}))
            ]);
            
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            
            if (Array.isArray(projectsRes.data)) {
                const currentProject = projectsRes.data.find(p => p.id === parseInt(projectId));
                if (currentProject) setProject(currentProject);
            }
        } catch (error) {
            console.error(error);
            toast.error("Échec de la synchronisation tactique");
        }
    }, [api, projectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTask };
            if (!payload.deadline) delete payload.deadline;
            if (!payload.assignee_id) delete payload.assignee_id;
            
            await api.post(`/tasks/project/${projectId}`, payload);
            setShowCreateModal(false);
            setNewTask({ nom: '', statut: 'To Do', priority: 'Medium', deadline: '', assignee_id: '' });
            fetchData();
            toast.success("Nouveau flux initialisé");
        } catch { toast.error("Erreur de configuration du flux"); }
    };

    const handleExportPDF = async () => {
        try {
            setIsExportingPDF(true);
            const response = await api.get(`/reports/project/${projectId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport_projet_${projectId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Rapport exporté avec succès");
        } catch (error) {
            toast.error("Erreur lors de l'exportation");
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleGenerateAI = async (e) => {
        e.preventDefault();
        if (!aiPrompt) return;
        try {
            setIsGeneratingAI(true);
            const res = await api.post('/ai/chat', { message: aiPrompt });
            toast.success("IA : " + res.data.response, { duration: 6000 });
            setShowAIModal(false);
            setAiPrompt('');
        } catch {
            toast.error("Erreur avec l'IA");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleUpdateTaskDetail = async (field, value) => {
        if (!selectedTask || user.role !== 'admin') return;
        try {
            const res = await api.put(`/tasks/${selectedTask.id}`, { [field]: value });
            setSelectedTask(res.data);
            setTasks(prev => prev.map(t => t.id === res.data.id ? res.data : t));
            toast.success("Tâche mise à jour");
        } catch {
            toast.error("Erreur de mise à jour");
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedTask) return;
        try {
            const res = await api.post(`/tasks/${selectedTask.id}/comments`, { text: commentText });
            setSelectedTask(prev => ({
                ...prev,
                comments: [...(prev.comments || []), res.data]
            }));
            setCommentText('');
            fetchData();
        } catch {
            toast.error("Erreur lors de l'ajout du commentaire");
        }
    };

    const handleUploadAttachment = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedTask) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/tasks/${selectedTask.id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSelectedTask(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), res.data]
            }));
            fetchData();
            toast.success("Fichier ajouté");
        } catch {
            toast.error("Erreur lors de l'upload");
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        
        const newStatus = destination.droppableId;
        const taskId = parseInt(draggableId);
        
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, statut: newStatus } : t));
        try {
            await api.put(`/tasks/${taskId}`, { statut: newStatus });
        } catch {
            fetchData();
            toast.error("Transition d'état corrompue");
        }
    };

    const columns = [
        { id: 'To Do', title: 'Planification', dot: 'bg-slate-300', icon: Calendar },
        { id: 'In Progress', title: 'Exécution', dot: 'bg-blue-600', icon: Activity },
        { id: 'Blocked', title: 'Alerte Flux', dot: 'bg-rose-500', icon: AlertCircle },
        { id: 'Done', title: 'Livrables', dot: 'bg-teal-500', icon: CheckCircle2 }
    ];

    const getPriorityStyle = (prio) => {
        if(prio === 'High') return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800';
        if(prio === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800';
        return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    const filteredTasks = tasks.filter(t => {
        const matchSearch = t.nom?.toLowerCase().includes(searchTask.toLowerCase());
        const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
        const matchAssignee = filterAssignee === 'All' || t.assignee_id === parseInt(filterAssignee);
        return matchSearch && matchPriority && matchAssignee;
    });

    return (
        <div className="space-y-10 animate-fade-in max-w-[1700px] mx-auto pb-20">
            {/* ====== PREMIUM SaaS HEADER ====== */}
            <div className="card-premium p-10 bg-white dark:bg-[#0f172a] shadow-soft-lg flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex-wrap">
                        <Link to="/projects" className="hover:text-blue-600 transition-colors shrink-0">Espaces</Link>
                        <ChevronRight size={12} className="opacity-40 shrink-0" />
                        <span className="text-blue-600 font-black">{project?.nom || '...'}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight break-words" style={{fontWeight:900}}>{project?.nom || 'Pilotage de Projet'}</h1>
                </div>

                <div className="flex overflow-x-auto custom-scrollbar items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-inner shrink-0 max-w-full">
                    {[
                        { id: 'kanban', label: 'Flux Kanban', icon: LayoutGrid },
                        { id: 'timeline', label: 'Chronologie', icon: Clock },
                        { id: 'chat', label: 'Communication', icon: MessageCircle },
                        { id: 'members', label: 'Ressources', icon: Users }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex shrink-0 items-center gap-3 rounded-2xl px-7 py-3 text-sm font-extrabold transition-all duration-500 ${
                                activeTab === tab.id 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-soft-md scale-[1.02]' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                            }`}
                        >
                            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ====== MAIN OPERATIONAL AREA ====== */}
            <div className="min-h-[70vh]">
                {activeTab === 'kanban' && (
                    <div className="space-y-10">
                        {/* 🚀 MODERN ACTION BAR (GLASSMORPHISM STYLE) */}
                        <div className="sticky top-0 z-20 flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/60 dark:border-slate-700/50">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                                <div className="relative group w-full sm:w-[400px]">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Identifier un flux..."
                                        value={searchTask}
                                        onChange={(e) => setSearchTask(e.target.value)}
                                        className="input-field w-full h-14 pl-14 pr-6 bg-slate-50/50 dark:bg-[#0f172a] border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner font-bold text-[15px]"
                                    />
                                </div>
                                
                                {/* Filters */}
                                <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 h-14">
                                    <select 
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value)}
                                        className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest px-4 text-slate-500 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        <option value="All">Priorité: Tout</option>
                                        <option value="High">Haute</option>
                                        <option value="Medium">Moyenne</option>
                                        <option value="Low">Basse</option>
                                    </select>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center" />
                                    <select 
                                        value={filterAssignee}
                                        onChange={(e) => setFilterAssignee(e.target.value)}
                                        className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest px-4 text-slate-500 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        <option value="All">Membre: Tout</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full xl:w-auto">
                                <button onClick={() => setShowAIModal(true)} className="btn-secondary h-14 px-8 rounded-2xl border-blue-100 text-blue-600 hover:bg-blue-50 transition-all font-extrabold active:scale-95 group">
                                    <Sparkles size={18} className="text-blue-500 group-hover:animate-pulse" />
                                    <span>Intelligence IA</span>
                                </button>
                                <button onClick={handleExportPDF} disabled={isExportingPDF} className="btn-secondary h-14 px-6 rounded-2xl border-slate-100 hover:text-blue-600 active:scale-95 disabled:opacity-50">
                                    {isExportingPDF ? <div className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-blue-600 animate-spin" /> : <Download size={18} />}
                                    <span>{isExportingPDF ? 'Export...' : 'Export'}</span>
                                </button>
                                <button onClick={() => setShowCreateModal(true)} className="btn-primary h-14 px-10 rounded-[1.25rem] shadow-xl shadow-blue-600/30 font-black text-[16px] active:scale-95 transition-all">
                                    <Plus size={24} strokeWidth={3} />
                                    <span>Nouvelle Tâche</span>
                                </button>
                            </div>
                        </div>

                        {/* 📊 KANBAN BOARD REDESIGN */}
                        <div className="overflow-x-auto custom-scrollbar pb-10">
                            <div className="flex gap-8 min-w-[1400px]">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    {columns.map(col => {
                                        const colTasks = filteredTasks.filter(t => t.statut === col.id);
                                        return (
                                            <Droppable droppableId={col.id} key={col.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`kanban-column w-1/4 ${snapshot.isDraggingOver ? 'bg-blue-50/40 dark:bg-blue-900/10 border-blue-200/50' : ''}`}
                                                    >
                                                        {/* Column Header */}
                                                        <div className="flex justify-between items-center mb-8 px-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ${col.dot}`}>
                                                                    <col.icon size={20} />
                                                                </div>
                                                                <div>
                                                                    <h2 className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">{col.title}</h2>
                                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{colTasks.length} unités actives</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => { setNewTask({...newTask, statut: col.id}); setShowCreateModal(true); }}
                                                                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 text-slate-300 hover:text-blue-600 hover:shadow-soft-sm transition-all active:scale-90"
                                                            >
                                                                <Plus size={18} strokeWidth={2.5} />
                                                            </button>
                                                        </div>

                                                        {/* Task Grid Container */}
                                                        <div className="flex-1 space-y-6 px-1">
                                                            {colTasks.map((t, index) => (
                                                                <Draggable key={t.id} draggableId={t.id.toString()} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            onClick={() => { setSelectedTask(t); setShowDetailModal(true); }}
                                                                            className={`kanban-task-card group ${
                                                                                snapshot.isDragging ? 'shadow-[0_20px_50px_rgba(37,99,235,0.15)] border-blue-400 scale-[1.02] z-50' : ''
                                                                            }`}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-6">
                                                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${getPriorityStyle(t.priority)}`}>
                                                                                    {t.priority}
                                                                                </span>
                                                                                <div className="p-1 text-slate-200 group-hover:text-slate-400 transition-colors">
                                                                                    <MoreVertical size={16} />
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <h3 className={`text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-relaxed mb-8 transition-all group-hover:text-blue-600 ${
                                                                                t.statut === 'Done' ? 'opacity-40 line-through grayscale font-bold' : ''
                                                                            }`}>
                                                                                {t.nom}
                                                                            </h3>

                                                                            <div className="flex items-center justify-between pt-7 border-t border-slate-50 dark:border-slate-800 mt-auto">
                                                                                <div className="flex items-center gap-5 text-slate-300 dark:text-slate-600 text-[11px] font-extrabold uppercase tracking-widest">
                                                                                     <div className="flex items-center gap-1.5 group/meta hover:text-blue-500 transition-colors">
                                                                                         <MessageCircle size={15} /> 
                                                                                         <span>{t.comments?.length || 0}</span>
                                                                                     </div>
                                                                                     <div className="flex items-center gap-1.5 group/meta hover:text-blue-500 transition-colors">
                                                                                         <Paperclip size={15} /> 
                                                                                         <span>{t.attachments?.length || 0}</span>
                                                                                     </div>
                                                                                </div>
                                                                                
                                                                                {t.assignee_id && (
                                                                                    <div className="flex items-center gap-3">
                                                                                       <span className="text-[10px] font-extrabold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Assigné</span>
                                                                                       <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-inner border border-white dark:border-slate-800 group-hover:scale-110 transition-transform">
                                                                                           {getInitials(allUsers.find(u => u.id === t.assignee_id)?.nom)}
                                                                                       </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                            
                                                            {colTasks.length === 0 && (
                                                                <div className="h-40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-40">
                                                                    <CircleDashed size={32} className="mb-3 animate-shimmer" />
                                                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Flux Vide</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Droppable>
                                        );
                                    })}
                                </DragDropContext>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs shells */}
                {activeTab === 'timeline' && <div className="animate-in fade-in duration-700 px-4"><ProjectTimeline tasks={tasks} allUsers={allUsers} /></div>}
                {activeTab === 'chat' && <div className="card-premium h-[800px] overflow-hidden shadow-soft-lg animate-in fade-in duration-700"><ProjectChat projectId={projectId} /></div>}
                {activeTab === 'members' && <div className="animate-in fade-in duration-700 px-4"><ProjectMembers projectId={projectId} api={api} currentUser={user} /></div>}
            </div>

            {/* Premium Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#020617]/50">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Nouvelle Tâche</h2>
                                <p className="text-sm font-semibold text-slate-500 mt-1">Définissez les paramètres de la tâche.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateTask} className="p-8 space-y-8 bg-white dark:bg-[#0f172a]">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Désignation</label>
                                <input type="text" required value={newTask.nom} onChange={e => setNewTask({...newTask, nom: e.target.value})} className="input-field" placeholder="ex: Concevoir la base de données" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Intensité</label>
                                    <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="input-field cursor-pointer">
                                        <option value="Low">Basse (Low)</option>
                                        <option value="Medium">Moyenne (Medium)</option>
                                        <option value="High">Haute (High)</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
                                    <select value={newTask.assignee_id} onChange={e => setNewTask({...newTask, assignee_id: e.target.value})} className="input-field cursor-pointer">
                                        <option value="">Non assigné</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date limite (Deadline)</label>
                                <input type="date" value={newTask.deadline || ''} onChange={e => setNewTask({...newTask, deadline: e.target.value})} className="input-field cursor-pointer" />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 font-extrabold text-sm uppercase tracking-wider">Annuler</button>
                                <button type="submit" className="btn-primary flex-1 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20">Créer la tâche</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Modal */}
            {showAIModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Intelligence IA</h2>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Génération Assistée</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-blue-600 transition-all active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleGenerateAI} className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Votre requête</label>
                                <textarea 
                                    required 
                                    value={aiPrompt} 
                                    onChange={e => setAiPrompt(e.target.value)} 
                                    className="input-field min-h-[120px] py-4 resize-none" 
                                    placeholder="Ex: Génère 3 tâches pour la création d'un système de login..." 
                                />
                            </div>
                            <button type="submit" disabled={isGeneratingAI} className="btn-primary w-full h-14 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                {isGeneratingAI ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Sparkles size={18} />}
                                <span>{isGeneratingAI ? 'Analyse en cours...' : 'Soumettre à l\'IA'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${getPriorityStyle(selectedTask.priority)}`}>
                                        {selectedTask.priority}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {selectedTask.statut}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">{selectedTask.nom}</h2>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                            {/* Infos */}
                            <div className="grid grid-cols-2 gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-slate-800 shadow-inner">
                                <div>
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Responsable</span>
                                    {user?.role === 'admin' ? (
                                        <select 
                                            value={selectedTask.assignee_id || ''} 
                                            onChange={(e) => handleUpdateTaskDetail('assignee_id', e.target.value || null)}
                                            className="input-field cursor-pointer w-full"
                                        >
                                            <option value="">Non assigné</option>
                                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-600">
                                                {getInitials(allUsers.find(u => u.id === selectedTask.assignee_id)?.nom)}
                                            </div>
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{allUsers.find(u => u.id === selectedTask.assignee_id)?.nom || 'Non assigné'}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Intensité (Priorité)</span>
                                        {user?.role === 'admin' ? (
                                            <select 
                                                value={selectedTask.priority} 
                                                onChange={(e) => handleUpdateTaskDetail('priority', e.target.value)}
                                                className="input-field cursor-pointer w-full"
                                            >
                                                <option value="Low">Basse (Low)</option>
                                                <option value="Medium">Moyenne (Medium)</option>
                                                <option value="High">Haute (High)</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border inline-block ${getPriorityStyle(selectedTask.priority)}`}>
                                                {selectedTask.priority}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date limite</span>
                                        {user?.role === 'admin' ? (
                                            <input 
                                                type="date" 
                                                value={selectedTask.deadline ? selectedTask.deadline.split('T')[0] : ''} 
                                                onChange={(e) => handleUpdateTaskDetail('deadline', e.target.value || null)}
                                                className="input-field cursor-pointer w-full"
                                            />
                                        ) : (
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'Non définie'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Attachments */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Paperclip size={14} /> Fichiers joints
                                </h3>
                                <div className="space-y-3 mb-4">
                                    {selectedTask.attachments?.map(att => (
                                        <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-slate-100 dark:border-slate-800 group">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600"><Paperclip size={16} /></div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{att.file_name}</p>
                                                <p className="text-[10px] text-slate-400">Ajouté par {att.uploader?.nom}</p>
                                            </div>
                                            <Download size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                                <label className="h-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-[#020617]/50 relative">
                                    <input type="file" className="hidden" onChange={handleUploadAttachment} />
                                    <div className="flex items-center gap-2">
                                        <Plus size={18} />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Ajouter un fichier</span>
                                    </div>
                                </label>
                            </div>

                            {/* Comments */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <MessageCircle size={14} /> Commentaires
                                </h3>
                                <div className="space-y-4 mb-6">
                                    {selectedTask.comments?.map(c => (
                                        <div key={c.id} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-xs border border-slate-200 dark:border-slate-700">
                                                {getInitials(c.author?.nom)}
                                            </div>
                                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">{c.author?.nom}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(c.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-black text-xs">
                                        {getInitials(user?.nom)}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        <input 
                                            type="text" 
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Ajouter un commentaire..." 
                                            className="input-field h-12 py-0 text-sm" 
                                        />
                                        <button onClick={handleAddComment} className="h-12 px-6 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20">
                                            Envoyer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
