import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Clock, ArrowRight, FolderKanban, CheckCircle2, BarChart3, Search, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

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
            toast.success("Projet créé avec succès !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la création du projet.");
        }
    };

    const deleteProject = async (id) => {
        if(window.confirm("Voulez-vous vraiment supprimer ce projet ? Tous les fichiers et tâches associés seront perdus.")) {
            try {
                await api.delete(`/projects/${id}`);
                fetchProjects();
                toast.success("Projet supprimé !");
            } catch (error) {
                toast.error("Erreur lors de la suppression.");
            }
        }
    };

    const filteredProjects = projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Balanced Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800/80 p-7 sm:p-8 rounded-3xl shadow-sm border border-blue-100/60 dark:border-gray-700 relative overflow-hidden">
                {/* Subtle decoration */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-blue-500 opacity-[0.04] dark:opacity-[0.02] blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                            <LayoutGrid size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Espace Projets</h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:ml-[60px] font-medium">
                        Concevez, gérez et suivez l'avancement de toutes vos initiatives.
                    </p>
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm shadow-sm"
                        />
                    </div>
                    
                    {user?.role === 'admin' && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-bold shadow-[0_4px_14px_0_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] transform hover:-translate-y-0.5 whitespace-nowrap text-sm"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>Créer un Projet</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FolderKanban size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">En cours</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{projects.filter(p => p.statut === 'en cours').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terminés</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{projects.filter(p => p.statut !== 'en cours').length}</p>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-gray-800/50 py-20 px-6 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FolderKanban size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun projet trouvé</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchQuery ? "Nous n'avons trouvé aucun projet correspondant à votre recherche." : "Vous n'avez pas encore de projet. Commencez par en créer un nouveau pour organiser votre travail."}
                        </p>
                    </div>
                ) : (
                    filteredProjects.map(project => {
                        const isDone = project.statut !== 'en cours';
                        const totalTasks = project.tasks?.length || 0;
                        const completedTasks = project.tasks?.filter(t => t.statut === 'Done').length || 0;
                        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                        return (
                            <div key={project.id} className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden">
                                {/* Top Color Bar indicating status */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${isDone ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
                                
                                <div className="flex justify-between items-start mb-5 pt-2">
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white truncate pr-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {project.nom}
                                    </h3>
                                    {user?.role === 'admin' && (
                                        <div className="relative">
                                            <button onClick={() => deleteProject(project.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                    {project.description || <span className="italic opacity-50">Aucune description fournie pour ce projet.</span>}
                                </p>

                                {/* Progress Section */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                                            <BarChart3 size={14} className="mr-1.5" /> Progression
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-1000 ${isDone ? 'bg-green-500' : 'bg-blue-600'}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-3 mb-6 font-medium text-sm mt-auto">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                                            <Clock size={16} className="mr-2 opacity-70" />
                                            <span>Statut</span>
                                        </div>
                                        {isDone ? 
                                            <span className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-lg font-bold text-xs flex items-center"><CheckCircle2 size={12} className="mr-1"/> Terminé</span> 
                                            : 
                                            <span className="text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-lg font-bold text-xs flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></span> En cours</span>
                                        }
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                                            <Calendar size={16} className="mr-2 opacity-70" />
                                            <span>Deadline</span>
                                        </div>
                                        <span className={`font-bold text-xs px-3 py-1 rounded-lg ${new Date(project.date_fin) < new Date() && !isDone ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200'}`}>
                                            {project.date_fin ? new Date(project.date_fin).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Non définie'}
                                        </span>
                                    </div>
                                </div>

                                <Link 
                                    to={`/projects/${project.id}/tasks`}
                                    className="mt-auto flex items-center justify-center w-full space-x-2 py-3 rounded-xl bg-gray-900 dark:bg-blue-600 text-white font-semibold hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors group-hover:shadow-lg"
                                >
                                    <span>Accéder au tableau</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Create Project Modal Premium */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl scale-100 transition-colors border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FolderKanban size={24} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Nouveau Projet</h3>
                        </div>
                        
                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom du projet <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.nom}
                                    onChange={e => setNewProject({...newProject, nom: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent outline-none transition-all font-medium"
                                    placeholder="Ex: Refonte complète du site web"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de livraison prévue</label>
                                <input
                                    type="date"
                                    value={newProject.date_fin}
                                    onChange={e => setNewProject({...newProject, date_fin: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl p-3.5 h-32 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent outline-none transition-all resize-none font-medium"
                                    placeholder="Décrivez les objectifs et le contexte de ce projet..."
                                />
                            </div>
                            <div className="flex space-x-4 pt-4 mt-8 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3.5 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-colors shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                                >
                                    Créer le projet
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
