import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Clock, ArrowRight, FolderKanban } from 'lucide-react';

const Projects = () => {
    const { api } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ nom: '', description: '', statut: 'en cours' });

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
            setNewProject({ nom: '', description: '', statut: 'en cours' });
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
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mes Projets</h2>
                    <p className="text-gray-500 text-sm mt-1">Gérez vos projets et suivez leur avancement</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nouveau Projet</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 border-dashed">
                        <div className="text-gray-400 mb-4 flex justify-center"><FolderKanban size={48} /></div>
                        <h3 className="text-lg font-medium text-gray-900">Aucun projet</h3>
                        <p className="text-gray-500 mt-1">Créez votre premier projet pour commencer.</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800 truncate pr-4">{project.nom}</h3>
                                <div className="relative group">
                                     <button onClick={() => deleteProject(project.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <MoreVertical size={18} />
                                     </button>
                                </div>
                            </div>
                            
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">
                                {project.description || "Aucune description"}
                            </p>

                            <div className="flex items-center justify-between text-sm mb-6">
                                <div className="flex items-center text-gray-500 space-x-1.5">
                                    <Clock size={16} />
                                    <span>
                                        {project.statut === 'en cours' ? 
                                            <span className="text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium text-xs">En cours</span> 
                                            : 
                                            <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full font-medium text-xs">Terminé</span>
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-4 flex justify-end">
                                <Link 
                                    to={`/projects/${project.id}/tasks`}
                                    className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800 group-hover:translate-x-1 transition-transform"
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
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl scale-100 transition-transform">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Nouveau Projet</h3>
                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.nom}
                                    onChange={e => setNewProject({...newProject, nom: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Refonte site web"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl p-3 h-28 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Description de votre projet..."
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

export default Projects;
