import React, { useState } from 'react';
import {
  Briefcase, ListTodo, CheckCircle, TrendingUp, Calendar, ArrowUpRight,
  ArrowRight, Search, Plus, Activity, Zap, Layers, PieChart as PieChartIcon,
  AlertTriangle, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#2563eb', '#14b8a6', '#0ea5e9', '#94a3b8'];

const AdminDashboard = ({ stats, chartData, projects, blockedTasks, user, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const [showAlerts, setShowAlerts] = useState(false);
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <>
      {/* ===== Modal Alertes Goulots d'étranglement ===== */}
      {showAlerts && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-[#0f172a] rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shadow-inner">
                  <AlertTriangle size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Points de blocage</h3>
                  <p className="text-[14px] text-rose-500 font-bold mt-1">Intervention requise pour débloquer l'équipe</p>
                </div>
              </div>
              <button onClick={() => setShowAlerts(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold text-xl">
                ✕
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-[#0b1120]">
              {blockedTasks && blockedTasks.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {blockedTasks.map(task => (
                    <div key={task.id} className="p-6 rounded-[24px] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-md transition-all">
                      <div>
                        <h4 className="font-extrabold text-[16px] text-slate-800 dark:text-slate-200 mb-2">{task.nom}</h4>
                        <span className="inline-block px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 text-[10px] font-black uppercase tracking-widest">
                          Statut : Bloqué
                        </span>
                      </div>
                      <button onClick={() => { setShowAlerts(false); navigate(`/projects/${task.project_id}/tasks`); }} className="px-6 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-slate-600 dark:text-slate-300 font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center gap-2 justify-center">
                        Résoudre <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
                  <p className="text-slate-500 font-bold">Aucune tâche bloquée. Tout fonctionne parfaitement !</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-16 animate-fade-in">
      {/* ===== Header / Hero ===== */}
      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8 p-12 relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.1)] rounded-[32px] bg-gradient-to-br from-[#0a0f1d] via-[#0f172a] to-[#06142c]">
          {/* Formes géométriques d'arrière-plan */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-[11px] font-extrabold uppercase tracking-widest border border-blue-500/20 backdrop-blur-md">
                  Vue d'ensemble - Administrateur
                </span>
                <span className="text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.15em]">{todayDate}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-tight mb-4 tracking-tighter" style={{fontWeight:900, textShadow: '0 4px 20px rgba(0,0,0,0.2)'}}>
                {greeting}, {user?.nom?.split(' ')[0]}!
              </h1>
              <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed drop-shadow-sm">
                Vous pilotez actuellement <span className="text-white font-extrabold drop-shadow-md">{stats.totalProjects}</span> projets actifs avec un taux d'efficacité global de <span className="text-teal-400 font-extrabold drop-shadow-md">{stats.progress}%</span>.
              </p>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/projects" className="px-8 py-4 rounded-2xl font-extrabold text-[15px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 border border-blue-400/20">
                Explorer les Espaces
              </Link>
              {blockedTasks && blockedTasks.length > 0 && (
                <button 
                  onClick={() => setShowAlerts(true)}
                  className="px-8 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-2xl font-bold text-[15px] hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all duration-300 shadow-[0_4px_12px_rgba(225,29,72,0.1)] flex items-center gap-2"
                >
                  <AlertTriangle size={18} className="animate-pulse" /> 
                  <span>{blockedTasks.length} Alerte(s)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Vertical Stack */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="group bg-white dark:bg-[#0f172a] p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-center flex-1 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-500" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="w-16 h-16 rounded-[20px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-6 shadow-[0_8px_20px_rgba(37,99,235,0.15)] group-hover:scale-105 transition-transform">
              <CheckCircle size={28} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-2">Volume Traité</p>
              <div className="flex items-end gap-4">
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{stats.completedTasks}</h3>
                <span className="flex items-center text-[13px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl mb-2 shadow-sm">
                  <TrendingUp size={16} className="mr-1" /> +12%
                </span>
              </div>
            </div>
          </div>
          
          <div className="group bg-white dark:bg-[#0f172a] p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-center flex-1 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-teal-500" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors" />
            <div className="w-16 h-16 rounded-[20px] bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-6 shadow-[0_8px_20px_rgba(20,184,166,0.15)] group-hover:scale-105 transition-transform">
              <Activity size={28} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-2">Santé des Projets</p>
              <div className="flex items-end gap-4">
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{stats.progress}%</h3>
                <span className="flex items-center text-[13px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl mb-2 shadow-sm">
                  <ArrowUpRight size={16} className="mr-1" /> Stable
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* ===== Charts Section ===== */}
      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#0f172a] p-10 lg:p-12 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)]">
                <Layers size={26} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Distribution de l'Effort</h3>
                <p className="text-[15px] text-slate-500 font-bold mt-1">Charge de travail par collaborateur</p>
              </div>
            </div>
            <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800/50 shadow-[0_4px_12px_rgba(37,99,235,0.1)]">
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse mr-3 shadow-[0_0_12px_rgba(37,99,235,0.8)]" />
               <span className="text-[13px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Temps Réel</span>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px] mt-auto flex flex-col justify-end">
             {chartData.bar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.bar} margin={{ top: 40, right: 0, left: -25, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(226, 232, 240, 0.8)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 800 }} dy={10} height={40} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.04)', radius: 16 }}
                    contentStyle={{
                      borderRadius: '24px',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      fontSize: '15px',
                      boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15)',
                      background: 'rgba(255, 255, 255, 0.98)',
                      padding: '20px',
                      fontWeight: 800
                    }}
                  />
                  <Bar 
                    dataKey="taches" 
                    fill="#2563eb" 
                    radius={[16, 16, 16, 16]} 
                    maxBarSize={48} 
                    label={{ position: 'top', fill: '#0f172a', fontSize: 16, fontWeight: 900, dy: -10 }}
                    style={{ filter: 'drop-shadow(0px 8px 16px rgba(37,99,235,0.3))' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                Données insuffisantes pour l'analyse
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#0f172a] p-10 lg:p-12 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="pb-4 mb-6 text-center sm:text-left flex items-center justify-center sm:justify-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 shadow-[0_4px_12px_rgba(147,51,234,0.15)]">
              <PieChartIcon size={26} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cartographie des Flux</h3>
              <p className="text-[15px] text-slate-500 font-bold mt-1">Répartition de l'état d'avancement</p>
            </div>
          </div>
          
          <div className="relative flex-1 min-h-[220px] max-h-[260px] flex items-center justify-center mb-8 mt-auto">
            {chartData.pie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pie}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    style={{ filter: 'drop-shadow(0px 8px 20px rgba(0,0,0,0.12))' }}
                  >
                    {chartData.pie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '24px', border: '2px solid rgba(226, 232, 240, 0.8)', fontWeight: 800, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.98)', padding: '16px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center rounded-full w-48 h-48 bg-slate-50 dark:bg-slate-900/30 text-slate-400 font-bold">...</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-md">{stats.totalTasks}</span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Total Flux</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-auto">
            {chartData.pie.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-100 dark:bg-[#0f172a] dark:border-slate-800 transition-all duration-300 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[14px] font-extrabold text-slate-700 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Recent Projects Table ===== */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.04),inset_0_2px_0_rgba(255,255,255,0.8)] border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-10 lg:px-12 border-b-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900/20">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.15)]">
                <ListTodo size={26} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Registre Opérationnel</h3>
                <p className="text-[15px] text-slate-500 font-bold mt-1">Suivi macroscopique des espaces de travail</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative group w-full sm:w-80 shadow-[0_8px_24px_rgba(0,0,0,0.04)] rounded-[20px]">
                  <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    className="w-full py-4 pl-16 pr-6 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-100 dark:border-slate-700 rounded-[20px] focus:bg-white dark:focus:bg-[#0f172a] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all duration-300 outline-none text-[15px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400" 
                    placeholder="Rechercher un projet..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#0f172a]">
                  <th className="px-10 py-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/80">Désignation</th>
                  <th className="px-10 py-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/80">Statut</th>
                  <th className="px-10 py-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/80">Maturité</th>
                  <th className="px-10 py-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 text-right border-b border-slate-100 dark:border-slate-800/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0f172a]">
                {projects.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase())).map((project, index) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a] transition-all duration-300 group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:z-10 relative">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform duration-300">
                          {project.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[16px] font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors duration-300">{project.nom}</p>
                          <p className="text-[13px] font-bold text-slate-500 mt-1">{project.tasksCount} flux opérationnels</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <span className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[12px] font-extrabold tracking-widest uppercase shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${
                        project.statut === 'en cours' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-800/30' :
                        project.statut === 'terminé' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-2 border-emerald-100 dark:border-emerald-800/30' : 'bg-slate-50 text-slate-500 border-2 border-slate-200'
                      }`}>
                        {project.statut === 'en cours' && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                        {project.statut === 'terminé' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                        {project.statut === 'en cours' ? 'Actif' : 'Terminé'}
                      </span>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-4 w-32 sm:w-56 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700">
                          <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.8)]" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-[14px] font-black text-slate-700 dark:text-slate-300 w-12 flex items-center justify-center bg-white dark:bg-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border-2 border-slate-100 dark:border-slate-700 rounded-xl py-1.5">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-12 py-8 text-right">
                      <button onClick={() => navigate(`/projects/${project.id}/tasks`)} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 hover:bg-blue-600 hover:text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.4)] transition-all duration-300 border-2 border-slate-100 dark:border-slate-800 transform hover:-translate-y-1">
                        <ArrowRight size={24} strokeWidth={3} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
