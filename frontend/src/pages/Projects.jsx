import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Clock, ArrowRight, FolderKanban } from 'lucide-react';

const Projects = () => {
    const { api, user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ nom: '', description: '', statut: 'en cours', date_fin: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error("Erreur récupération projets", error);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ nom: '', description: '', statut: 'en cours', date_fin: '' });
            fetchProjects();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteProject = async (id) => {
        if(window.confirm("Voulez-vous vraiment supprimer ce projet ?")) {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 space-y-4 sm:space-y-0 transition-colors">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Mes Projets</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">Gérez vos projets et suivez leur avancement</p>
                </div>
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 sm:w-64 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {user?.role === 'admin' && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm whitespace-nowrap"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Nouveau Projet</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-700 border-dashed transition-colors">
                        <div className="text-gray-400 mb-4 flex justify-center"><FolderKanban size={48} /></div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun projet trouvé</h3>
                    </div>
                ) : (
                    projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).map(project => (
                        <div key={project.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-4">{project.nom}</h3>
                                <div className="relative group">
                                     <button onClick={() => deleteProject(project.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <MoreVertical size={18} />
                                     </button>
                                </div>
                            </div>
                            
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 h-10">
                                {project.description || "Aucune description"}
                            </p>

                            <div className="flex flex-col space-y-3 mb-6 font-medium text-sm">
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                    <Clock size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                                    <span>
                                        {project.statut === 'en cours' ? 
                                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full font-medium text-xs">En cours</span> 
                                            : 
                                            <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 rounded-full font-medium text-xs">Terminé</span>
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                    <Calendar size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                                    <span>Deadline: {new Date(project.date_fin).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 dark:border-gray-700/50 pt-4 flex justify-end">
                                <Link 
                                    to={`/projects/${project.id}/tasks`}
                                    className="flex items-center space-x-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 group-hover:translate-x-1 transition-transform"
                                >
                                    <span>Voir les tâches</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl scale-100 transition-colors">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 transition-colors">Nouveau Projet</h3>
                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Nom du projet</label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.nom}
                                    onChange={e => setNewProject({...newProject, nom: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                    placeholder="Ex: Refonte site web"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Date de livraison (Deadline)</label>
                                <input
                                    type="date"
                                    value={newProject.date_fin}
                                    onChange={e => setNewProject({...newProject, date_fin: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-3 h-28 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                                    placeholder="Description de votre projet..."
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors"
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

export default Projects;
