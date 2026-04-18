import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, ArrowLeft, Clock, Trash2, MessageSquare, AlertCircle, User as UserIcon, Calendar } from 'lucide-react';

const Tasks = () => {
    const { projectId } = useParams();
    const { api, user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [project, setProject] = useState(null);
    
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
        } catch (error) {
            console.error(error);
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
        } catch (error) {
            console.error("Erreur mise à jour", error);
            alert("Non autorisé ou erreur serveur.");
        }
    };

    const deleteTask = async (id) => {
        if(window.confirm("Supprimer cette tâche ?")) {
            try {
                await api.delete(`/tasks/${id}`);
                setShowDetailModal(false);
                fetchData();
            } catch (error) {
                alert("Erreur: Vous n'êtes pas autorisé à supprimer.");
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
        } catch (error) {
             console.error("Erreur commentaire", error);
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
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tableau de bord Kanban</h2>
                        <p className="text-gray-500 text-sm mt-0.5">Gérez l'avancement et assignez les rôles</p>
                    </div>
                </div>
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
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center w-full sm:w-auto space-x-2 bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Nouvelle Tâche</span>
                        </button>
                    )}
                </div>
            </div>

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
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center"><MessageSquare size={16} className="mr-2"/> Activité & Commentaires</h4>
                                    
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
        </div>
    );
};

export default Tasks;
