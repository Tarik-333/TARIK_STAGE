import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Briefcase, ListTodo, CheckCircle, Activity, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

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
    const [chartData, setChartData] = useState({
        pie: [],
        bar: [],
        line: []
    });
    const [loading, setLoading] = useState(true);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch projects and users
                const [projRes, usersRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/auth/users')
                ]);
                
                const projectsData = projRes.data;
                const usersData = usersRes.data;
                
                const userMap = {};
                usersData.forEach(u => userMap[u.id] = u.nom);
                
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

                // --- Generate Analytics Data ---

                // 1. PieChart Data (Global Status)
                const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Blocked': 0, 'Done': 0 };
                allTasks.forEach(t => { 
                    if(statusCounts[t.statut] !== undefined) statusCounts[t.statut]++;
                });
                const pieData = Object.keys(statusCounts)
                    .filter(k => statusCounts[k] > 0)
                    .map(k => ({ name: k, value: statusCounts[k] }));

                // 2. BarChart Data (Workload per employee)
                const workload = {};
                allTasks.forEach(t => {
                    if (t.assignee_id && t.statut !== 'Done') {
                        workload[t.assignee_id] = (workload[t.assignee_id] || 0) + 1;
                    }
                });
                const barData = Object.keys(workload).map(uid => ({ 
                    name: userMap[uid] || 'Inconnu', 
                    taches: workload[uid] 
                })).sort((a, b) => b.taches - a.taches); // Sort by workload desc

                // 3. LineChart Data (Tasks created/completed over time based on creation/deadline approx)
                const dateCounts = {};
                allTasks.forEach(t => {
                    // Approximate completed over time using created_at for variance
                    const d = new Date(t.created_at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
                    if(!dateCounts[d]) dateCounts[d] = { date: d, Créées: 0, Terminées: 0 };
                    dateCounts[d].Créées++;
                    if(t.statut === 'Done') dateCounts[d].Terminées++;
                });
                // Sort dates
                const lineData = Object.values(dateCounts).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7); // Last 7 days

                setChartData({ pie: pieData, bar: barData, line: lineData });

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
        if (status === 'en cours') return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
        if (status === 'terminé') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    };

    const getProgressColor = (progress) => {
        if (progress >= 100) return 'bg-green-500';
        if (progress > 50) return 'bg-blue-500';
        if (progress > 0) return 'bg-orange-500';
        return 'bg-gray-200 dark:bg-gray-700';
    };

    const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Tableau de bord</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize transition-colors font-medium">{todayDate}</p>
            </div>

            {/* Stat Cards - Bento Style Linear Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                            <Briefcase className="text-gray-500 dark:text-gray-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">total</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">{stats.totalProjects}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Projets</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                            <ListTodo className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">actives</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">{stats.totalTasks}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Tâches</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 flex items-center justify-center">
                            <CheckCircle className="text-green-600 dark:text-green-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">terminées</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">{stats.completedTasks}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium">Tâches validées</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-sm border border-blue-500 hover:shadow-lg transition-all overflow-hidden text-white">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                    <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider bg-white/10 px-2 py-1 rounded backdrop-blur-sm">global</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-extrabold">{stats.progress}%</h3>
                        <p className="text-sm text-blue-100 mt-1 font-medium">Avancement général</p>
                    </div>
                </div>
            </div>

            {/* ANALYTICS CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Workload Bar Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Charge de travail par employé</h3>
                    <div className="h-64 w-full">
                        {chartData.bar.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.bar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                    <RechartsTooltip 
                                        cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Bar dataKey="taches" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Pas assez de données.</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Pie Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Statut des Tâches</h3>
                        <div className="h-52 w-full">
                            {chartData.pie.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.pie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.pie.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{borderRadius: '10px', border: 'none'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune tâche.</div>
                            )}
                        </div>
                        <div className="flex justify-center flex-wrap gap-2 text-xs">
                            {chartData.pie.map((entry, index) => (
                                <div key={entry.name} className="flex items-center text-gray-500 dark:text-gray-400 font-medium">
                                    <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                                    {entry.name} ({entry.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Line Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dynamique (7j)</h3>
                        <div className="flex-1 w-full min-h-[150px]">
                            {chartData.line.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.line} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} />
                                        <RechartsTooltip contentStyle={{borderRadius: '10px', border: 'none'}} />
                                        <Line type="monotone" dataKey="Créées" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="Terminées" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Pas d'activité récente.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project List DataTable */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Détails des projets</h2>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 sm:w-64 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white transition-colors"
                        />
                        {user?.role === 'admin' && (
                            <Link to="/projects" className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1 transition-all shadow-sm whitespace-nowrap">
                                <Plus size={16} strokeWidth={2.5} />
                                <span className="hidden sm:inline">Nouveau</span>
                            </Link>
                        )}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">Projet</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">Statut</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans w-1/4">Progression</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">Tâches</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 transition-colors">
                            {projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-500 text-sm font-medium">
                                        Aucun projet trouvé.
                                    </td>
                                </tr>
                            ) : (
                                projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).map((project) => (
                                    <tr 
                                        key={project.id} 
                                        onClick={() => navigate(`/projects/${project.id}/tasks`)}
                                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all cursor-pointer group"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.nom}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[250px]">{project.description || "Aucune description"}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusStyle(project.statut)}`}>
                                                {project.statut.charAt(0).toUpperCase() + project.statut.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden transition-colors">
                                                    <div 
                                                        className={`h-2 rounded-full ${getProgressColor(project.progress)} transition-all duration-1000`} 
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors min-w-[2.5rem]">{project.progress}%</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors">
                                            {project.completedCount} / {project.tasksCount}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors">
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
