import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, ArrowLeft, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';

const Tasks = () => {
    const { projectId } = useParams();
    const { api } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ nom: '', statut: 'To Do', deadline: '' });

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/tasks/project/${projectId}`);
            setTasks(res.data);
        } catch (error) {
            console.error("Erreur récupération tâches", error);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTask };
            if (!payload.deadline) delete payload.deadline;
            await api.post(`/tasks/project/${projectId}`, payload);
            setShowModal(false);
            setNewTask({ nom: '', statut: 'To Do', deadline: '' });
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleTaskStatus = async (task) => {
        const newStatus = task.statut === 'To Do' ? 'Done' : 'To Do';
        try {
            await api.put(`/tasks/${task.id}`, { statut: newStatus });
            fetchTasks();
        } catch (error) {
            console.error("Erreur mise à jour tâche", error);
        }
    };

    const deleteTask = async (id) => {
        if(window.confirm("Supprimer cette tâche ?")) {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        }
    };

    const todoTasks = tasks.filter(t => t.statut === 'To Do');
    const doneTasks = tasks.filter(t => t.statut === 'Done');

    const TaskCard = ({ task }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 max-w-[85%]">
                    <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={`mt-0.5 shrink-0 ${task.statut === 'Done' ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'} transition-colors`}
                    >
                        {task.statut === 'Done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div>
                        <h4 className={`font-medium text-sm md:text-base ${task.statut === 'Done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {task.nom}
                        </h4>
                        {task.deadline && (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>Échéance: {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Tâches du Projet</h2>
                        <p className="text-gray-500 text-sm mt-1">Gérez votre Todo et l'avancement</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Nouvelle Tâche</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* TO DO Column */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 min-h-[500px]">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>À faire</span>
                        </h3>
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                            {todoTasks.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {todoTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                Aucune tâche
                            </div>
                        ) : (
                            todoTasks.map(t => <TaskCard key={t.id} task={t} />)
                        )}
                    </div>
                </div>

                {/* DONE Column */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 min-h-[500px]">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Terminé</span>
                        </h3>
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                            {doneTasks.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                         {doneTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                Aucune tâche
                            </div>
                        ) : (
                            doneTasks.map(t => <TaskCard key={t.id} task={t} />)
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle Tâche</h3>
                        <form onSubmit={handleCreateTask} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la tâche</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.nom}
                                    onChange={e => setNewTask({...newTask, nom: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Rédiger le cahier des charges"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date limite (Optionnel)</label>
                                <input
                                    type="datetime-local"
                                    value={newTask.deadline}
                                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors shadow-sm"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
