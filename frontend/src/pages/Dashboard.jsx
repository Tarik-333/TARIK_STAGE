import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Briefcase, ListTodo, CheckCircle, Activity, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { api, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        progress: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch projects
                const projRes = await api.get('/projects');
                const projectsData = projRes.data;
                
                let allTasks = [];
                let enrichedProjects = [];

                for (const p of projectsData) {
                    const taskRes = await api.get(`/tasks/project/${p.id}`);
                    const projTasks = taskRes.data;
                    allTasks = [...allTasks, ...projTasks];

                    const completedProj = projTasks.filter(t => t.statut === 'Done').length;
                    const totalProj = projTasks.length;
                    const prog = totalProj === 0 ? 0 : Math.round((completedProj / totalProj) * 100);

                    // Add progress info for the table
                    enrichedProjects.push({
                        ...p,
                        tasksCount: totalProj,
                        completedCount: completedProj,
                        progress: prog
                    });
                }

                setProjects(enrichedProjects);

                const completed = allTasks.filter(t => t.statut === 'Done').length;
                const total = allTasks.length;
                const prog = total === 0 ? 0 : Math.round((completed / total) * 100);

                setStats({
                    totalProjects: projectsData.length,
                    totalTasks: total,
                    completedTasks: completed,
                    progress: prog
                });
            } catch (error) {
                console.error("Erreur lors de la récupération des statistiques:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [api]);

    // Helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getStatusStyle = (status) => {
        if (status === 'en cours') return 'text-green-600 bg-green-50';
        if (status === 'terminé') return 'text-blue-600 bg-blue-50';
        return 'text-gray-500 bg-gray-100';
    };

    const getProgressColor = (progress) => {
        if (progress >= 100) return 'bg-green-500';
        if (progress > 50) return 'bg-blue-500';
        if (progress > 0) return 'bg-orange-500';
        return 'bg-gray-200';
    };

    const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) {
        return <div className="animate-pulse flex space-x-4">Chargement...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Tableau de bord</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize transition-colors">{todayDate}</p>
            </div>

            {/* Stat Cards - Bento Style Linear Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                            <Briefcase className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">total</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{stats.totalProjects}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Projets</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                            <ListTodo className="text-blue-500 dark:text-blue-400 w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">actives</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{stats.totalTasks}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Tâches</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 flex items-center justify-center">
                            <CheckCircle className="text-green-500 dark:text-green-400 w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">terminées</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{stats.completedTasks}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Tâches done</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 flex items-center justify-center">
                            <Activity className="text-orange-500 dark:text-orange-400 w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">global</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{stats.progress}%</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Avancement</p>
                    </div>
                </div>
            </div>

            {/* Project List DataTable */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Liste des projets</h2>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 sm:w-64 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        />
                        {user?.role === 'admin' && (
                            <Link to="/projects" className="bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors whitespace-nowrap">
                                <Plus size={16} />
                                <span className="hidden sm:inline">Nouveau projet</span>
                            </Link>
                        )}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-700 transition-colors">
                                <th className="py-4 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-sans">Projet</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-sans">Statut</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-sans w-1/4">Progression</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-sans">Tâches</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider font-sans rounded-tr-2xl">Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 transition-colors">
                            {projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-400 text-sm">
                                        Aucun projet trouvé.
                                    </td>
                                </tr>
                            ) : (
                                projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).map((project) => (
                                    <tr 
                                        key={project.id} 
                                        onClick={() => navigate(`/projects/${project.id}/tasks`)}
                                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.nom}</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{project.description || "Aucune description"}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(project.statut)}`}>
                                                {project.statut.charAt(0).toUpperCase() + project.statut.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1.5 overflow-hidden transition-colors">
                                                <div 
                                                    className={`h-2 rounded-full ${getProgressColor(project.progress)}`} 
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">{project.progress}%</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors">
                                            {project.completedCount} / {project.tasksCount}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors">
                                            {formatDate(project.date_fin)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
