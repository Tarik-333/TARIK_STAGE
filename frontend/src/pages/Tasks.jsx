import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, ArrowLeft, Clock, Trash2, MessageSquare, AlertCircle, User as UserIcon, Calendar, Paperclip, FileText, X, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectChat from '../components/ProjectChat';

const Tasks = () => {
    const { projectId } = useParams();
    const { api, user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'chat'
    
    // Filters
    const [searchTask, setSearchTask] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Create new task Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({ nom: '', statut: 'To Do', priority: 'Medium', deadline: '', assignee_id: '' });

    // Task Detail Modal
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // AI Task Generation Modal
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const [tasksRes, usersRes] = await Promise.all([
                api.get(`/tasks/project/${projectId}`),
                api.get('/auth/users').catch(() => ({data: []})) // Ignore if fails
            ]);
            setTasks(tasksRes.data);
            setAllUsers(usersRes.data);
        } catch (error) {
            console.error("Erreur récupération données", error);
        }
    };

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
            toast.success("Tâche créée avec succès !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création.");
        }
    };

    const handleGenerateAI = async (e) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        
        setIsGeneratingAI(true);
        try {
            const res = await api.post(`/tasks/project/${projectId}/generate-ai`, { prompt: aiPrompt });
            setShowAIModal(false);
            setAiPrompt('');
            fetchData();
            toast.success(res.data.message || "Tâches générées avec succès !");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Erreur de connexion avec l'IA.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const updateTask = async (taskId, updates) => {
        try {
            const res = await api.put(`/tasks/${taskId}`, updates);
            // Update local state
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
            if(selectedTask && selectedTask.id === taskId) {
                setSelectedTask(res.data);
            }
            toast.success("Tâche mise à jour");
        } catch (error) {
            console.error("Erreur mise à jour", error);
            toast.error("Non autorisé ou erreur serveur.");
        }
    };

    const deleteTask = async (id) => {
        if(window.confirm("Supprimer cette tâche ?")) {
            try {
                await api.delete(`/tasks/${id}`);
                setShowDetailModal(false);
                fetchData();
                toast.success("Tâche supprimée !");
            } catch (error) {
                toast.error("Erreur: Vous n'êtes pas autorisé à supprimer.");
            }
        }
    };

    const postComment = async (e) => {
        e.preventDefault();
        if(!commentText.trim() || !selectedTask) return;
        try {
            await api.post(`/tasks/${selectedTask.id}/comments`, { text: commentText });
            setCommentText('');
            // refresh tasks to get new comment
            await fetchData();
            // Re-select task to update comments
            const refreshTask = await api.get(`/tasks/project/${projectId}`);
            const updated = refreshTask.data.find(t => t.id === selectedTask.id);
            if(updated) setSelectedTask(updated);
            toast.success("Commentaire ajouté !");
        } catch (error) {
             console.error("Erreur commentaire", error);
             toast.error("Erreur lors de l'ajout du commentaire");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setIsUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/tasks/${selectedTask.id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchData();
            const refreshTask = await api.get(`/tasks/project/${projectId}`);
            const updated = refreshTask.data.find(t => t.id === selectedTask.id);
            if(updated) setSelectedTask(updated);
            toast.success("Fichier joint avec succès !");
        } catch(error) {
            console.error("Upload error", error);
            toast.error("Erreur d'upload. Vérifiez que les clés Cloudinary sont valides !");
        } finally {
            setIsUploadingFile(false);
            e.target.value = null;
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if(window.confirm("Supprimer ce fichier définitivement de Cloudinary ?")) {
            try {
                await api.delete(`/tasks/attachments/${attachmentId}`);
                await fetchData();
                const refreshTask = await api.get(`/tasks/project/${projectId}`);
                const updated = refreshTask.data.find(t => t.id === selectedTask.id);
                if(updated) setSelectedTask(updated);
                toast.success("Fichier supprimé !");
            } catch(error) {
                console.error("Delete error", error);
                toast.error("Non autorisé ou erreur serveur");
            }
        }
    };

    // Columns grouping
    const columns = [
        { id: 'To Do', title: 'À Faire', bg: 'bg-gray-50', dot: 'bg-gray-400' },
        { id: 'In Progress', title: 'En Cours', bg: 'bg-blue-50', dot: 'bg-blue-500' },
        { id: 'Blocked', title: 'Bloqué', bg: 'bg-red-50', dot: 'bg-red-500' },
        { id: 'Done', title: 'Terminé', bg: 'bg-green-50', dot: 'bg-green-500' }
    ];

    const getPriorityColor = (prio) => {
        if(prio === 'High') return 'text-red-700 bg-red-100 border-red-200';
        if(prio === 'Medium') return 'text-orange-700 bg-orange-100 border-orange-200';
        return 'text-gray-700 bg-gray-100 border-gray-200';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const TaskCard = ({ task }) => (
        <div 
            onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3"
        >
            <div className="flex justify-between items-start">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
                {task.comments?.length > 0 && (
                    <div className="flex items-center text-gray-400 text-xs">
                        <MessageSquare size={12} className="mr-1" /> {task.comments.length}
                    </div>
                )}
            </div>
            
            <h4 className={`font-semibold text-gray-800 leading-tight ${task.statut === 'Done' ? 'line-through text-gray-400' : ''}`}>
                {task.nom}
            </h4>

            <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                <div className="flex items-center text-xs text-gray-500 font-medium">
                    {task.deadline ? (
                        <div className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {new Date(task.deadline).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}
                        </div>
                    ) : <span>Pas de date</span>}
                </div>
                
                {task.assignee ? (
                    <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold" title={task.assignee.nom}>
                        {getInitials(task.assignee.nom)}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center" title="Non assigné">
                        <UserIcon size={12} />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-2">
                <div className="flex items-center space-x-4">
                    <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Détails du Projet</h2>
                        <div className="flex space-x-6 mt-3">
                            <button 
                                onClick={() => setActiveTab('kanban')}
                                className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${activeTab === 'kanban' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            >
                                <LayoutGrid size={16} />
                                <span>Tableau Kanban</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('chat')}
                                className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                            >
                                <MessageSquare size={16} />
                                <span>Messagerie Équipe</span>
                            </button>
                        </div>
                    </div>
                </div>
                {activeTab === 'kanban' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Rechercher une tâche..." 
                        value={searchTask}
                        onChange={(e) => setSearchTask(e.target.value)}
                        className="w-full sm:w-48 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    />
                    <select 
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full sm:w-40 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors"
                    >
                        <option value="All">Tous les statuts</option>
                        <option value="To Do">À Faire</option>
                        <option value="In Progress">En Cours</option>
                        <option value="Blocked">Bloqué</option>
                        <option value="Done">Terminé</option>
                    </select>

                    {user?.role === 'admin' && (
                        <div className="flex space-x-2 w-full sm:w-auto">
                            <button 
                                onClick={() => setShowAIModal(true)}
                                className="flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
                            >
                                <span className="text-base leading-none">✨</span>
                                <span className="hidden sm:inline">IA</span>
                            </button>
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center justify-center space-x-2 bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-medium text-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Nouvelle Tâche</span>
                            </button>
                        </div>
                    )}
                </div>
                )}
            </div>

            {activeTab === 'kanban' ? (
                <>
            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max h-full items-start">
                    {columns.filter(col => filterStatus === 'All' || col.id === filterStatus).map(col => {
                        const colTasks = tasks.filter(t => 
                            t.statut === col.id && 
                            t.nom.toLowerCase().includes(searchTask.toLowerCase())
                        );
                        return (
                            <div key={col.id} className={`w-80 rounded-2xl p-4 flex flex-col max-h-full border border-gray-100 ${col.bg}`}>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <h3 className="font-semibold text-gray-700 flex items-center text-sm">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${col.dot}`}></span>
                                        {col.title}
                                    </h3>
                                    <span className="bg-white/60 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">
                                        {colTasks.length}
                                    </span>
                                </div>
                                <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                    {colTasks.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-white/50">
                                            Aucune tâche
                                        </div>
                                    ) : (
                                        colTasks.map(t => <TaskCard key={t.id} task={t} />)
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 transition-colors">Créer une tâche</h3>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Nom de la tâche</label>
                                <input type="text" required value={newTask.nom} onChange={e => setNewTask({...newTask, nom: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors" placeholder="Ex: Intégrer l'API de paiement" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Priorité</label>
                                    <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none transition-colors">
                                        <option value="Low">Basse (Low)</option>
                                        <option value="Medium">Moyenne (Medium)</option>
                                        <option value="High">Haute (High)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Statut</label>
                                    <select value={newTask.statut} onChange={e => setNewTask({...newTask, statut: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none transition-colors">
                                        <option value="To Do">À faire</option>
                                        <option value="In Progress">En cours</option>
                                        <option value="Blocked">Bloqué</option>
                                        <option value="Done">Terminé</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Assigner à</label>
                                    <select value={newTask.assignee_id} onChange={e => setNewTask({...newTask, assignee_id: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none transition-colors">
                                        <option value="">Non assigné</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Deadline</label>
                                    <input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none transition-colors" />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-gray-50 dark:border-gray-700 transition-colors">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 px-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-sm transition-colors">Annuler</button>
                                <button type="submit" className="flex-1 py-2.5 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors shadow-sm">Créer la tâche</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl transition-colors border border-purple-100 dark:border-purple-900/50">
                        <div className="flex items-center space-x-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">
                                ✨
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assistant IA Gemini</h3>
                        </div>
                        <form onSubmit={handleGenerateAI} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Décrivez l'objectif global de votre projet. L'IA va le découper en tâches avec des priorités.
                                </label>
                                <textarea 
                                    required 
                                    value={aiPrompt} 
                                    onChange={e => setAiPrompt(e.target.value)} 
                                    disabled={isGeneratingAI}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors h-32 resize-none" 
                                    placeholder="Exemple: Créer une application mobile Uber Eat avec gestion des livreurs, interface client et dashboard restaurant..." 
                                />
                            </div>
                            
                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setShowAIModal(false)} disabled={isGeneratingAI} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">Annuler</button>
                                <button type="submit" disabled={isGeneratingAI || !aiPrompt.trim()} className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-md flex justify-center items-center disabled:opacity-70">
                                    {isGeneratingAI ? (
                                        <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></span> Analyse en cours...</>
                                    ) : 'Générer les tâches'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800 transition-colors">
                            <div className="pr-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(selectedTask.priority)}`}>
                                        {selectedTask.priority}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">Tâche #{selectedTask.id}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{selectedTask.nom}</h3>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex flex-1 overflow-hidden">
                            
                            {/* Main Content (Comments) */}
                            <div className="w-2/3 border-r border-gray-100 dark:border-gray-700 flex flex-col transition-colors">
                                <div className="p-6 flex-1 overflow-y-auto bg-white/50 dark:bg-gray-800/50 transition-colors">
                                    
                                    {/* Pièces jointes section */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center"><Paperclip size={16} className="mr-2"/> Pièces jointes</h4>
                                            <div>
                                                <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={isUploadingFile} />
                                                <label htmlFor="file-upload" className="cursor-pointer text-xs bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center">
                                                    {isUploadingFile ? (
                                                        <span className="flex items-center"><span className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-gray-800 dark:border-gray-500 dark:border-t-white rounded-full mr-2"></span> Envoi...</span>
                                                    ) : '+ Joindre un fichier'}
                                                </label>
                                            </div>
                                        </div>
                                        
                                        {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                {selectedTask.attachments.map(att => (
                                                    <div key={att.id} className="group relative border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex items-center bg-white dark:bg-gray-700 transition-colors hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm">
                                                        <FileText size={24} className="text-blue-500 mr-3 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-800 dark:text-white truncate block hover:text-blue-600 dark:hover:text-blue-400">
                                                                {att.file_name}
                                                            </a>
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">Ajouté par {att.uploader?.nom || 'Inconnu'}</span>
                                                        </div>
                                                        {(user?.role === 'admin' || user?.id === att.user_id) && (
                                                            <button onClick={() => handleDeleteAttachment(att.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg ml-2">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-6 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucune pièce jointe.</p>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center pt-2 border-t border-gray-100 dark:border-gray-700"><MessageSquare size={16} className="mr-2"/> Activité & Commentaires</h4>
                                    
                                    <div className="space-y-4">
                                        {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucun commentaire pour l'instant.</p>
                                        ) : (
                                            selectedTask.comments.map(c => (
                                                <div key={c.id} className="flex space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                                                        {getInitials(c.author?.nom)}
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-none p-3 w-full transition-colors">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{c.author?.nom}</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.text}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                
                                {/* Post Comment Input */}
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                                    <form onSubmit={postComment} className="flex space-x-2">
                                        <input 
                                            type="text" 
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Ajouter un commentaire..." 
                                            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        />
                                        <button type="submit" disabled={!commentText.trim()} className="bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Envoyer
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Sidebar Options */}
                            <div className="w-1/3 bg-gray-50/50 dark:bg-gray-800/80 p-6 space-y-5 overflow-y-auto transition-colors">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 transition-colors">Statut</label>
                                    <select 
                                        value={selectedTask.statut} 
                                        onChange={(e) => updateTask(selectedTask.id, { statut: e.target.value })}
                                        className="w-full border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors"
                                    >
                                        <option value="To Do">À faire</option>
                                        <option value="In Progress">En cours</option>
                                        <option value="Blocked">Bloqué</option>
                                        <option value="Done">Terminé</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 transition-colors">Assigné à</label>
                                    <select 
                                        value={selectedTask.assignee_id || ''} 
                                        onChange={(e) => updateTask(selectedTask.id, { assignee_id: e.target.value || null })}
                                        disabled={user?.role !== 'admin'}
                                        className="w-full border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 transition-colors"
                                    >
                                        <option value="">Non assigné</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 transition-colors">Priorité</label>
                                    <select 
                                        value={selectedTask.priority} 
                                        onChange={(e) => updateTask(selectedTask.id, { priority: e.target.value })}
                                        disabled={user?.role !== 'admin'}
                                        className="w-full border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 transition-colors"
                                    >
                                        <option value="Low">Basse (Low)</option>
                                        <option value="Medium">Moyenne (Medium)</option>
                                        <option value="High">Haute (High)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 flex items-center transition-colors"><Calendar size={12} className="mr-1"/> Deadline</label>
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-sm font-medium text-gray-700 dark:text-white transition-colors">
                                        {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'Aucune date'}
                                    </div>
                                </div>

                                {user?.role === 'admin' && (
                                    <div className="pt-6 border-t border-gray-200 mt-6 mt-auto">
                                        <button onClick={() => deleteTask(selectedTask.id)} className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors w-full justify-center py-2 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} className="mr-2" />
                                            Supprimer la tâche
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
            </>
            ) : (
                <div className="flex-1 min-h-0">
                    <ProjectChat projectId={projectId} />
                </div>
            )}
        </div>
    );
};

export default Tasks;
