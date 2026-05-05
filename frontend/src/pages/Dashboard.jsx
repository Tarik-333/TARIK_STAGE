import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';

const Dashboard = () => {
  const { api, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, completedTasks: 0, progress: 0 });
  const [chartData, setChartData] = useState({ pie: [], bar: [] });
  const [myTasks, setMyTasks] = useState([]);
  const [blockedTasks, setBlockedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        const data = res.data;
        setProjects(
          data.recentProjects.map((p) => ({
            ...p,
            tasksCount: p.tasks?.length || 0,
            progress: p.tasks?.length
              ? Math.round((p.tasks.filter((t) => t.statut === 'Done').length / p.tasks.length) * 100)
              : 0,
          }))
        );
        setStats({
          totalProjects: data.stats.totalProjects,
          totalTasks: data.stats.totalTasks,
          completedTasks: data.stats.completedTasks,
          progress: data.stats.progress,
        });
        setChartData({ pie: data.distribution, bar: data.workload });
        setMyTasks(data.myTasks || []);
        setBlockedTasks(data.blockedTasks || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [api]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Chargement des données stratégiques…</p>
        </div>
      </div>
    );
  }

  const commonProps = {
    stats,
    chartData,
    projects,
    user,
    searchQuery,
    setSearchQuery,
  };

  if (user?.role === 'admin') {
    return <AdminDashboard {...commonProps} blockedTasks={blockedTasks} />;
  }

  return <EmployeeDashboard {...commonProps} myTasks={myTasks} />;
};

export default Dashboard;
