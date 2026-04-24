import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProjectChat from '../components/ProjectChat';
import { MessageSquare, Hash } from 'lucide-react';

const Messagerie = () => {
    const { api } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects/');
                setProjects(res.data);
                if (res.data.length > 0) {
                    setSelectedProjectId(res.data[0].id);
                }
            } catch (error) {
                console.error("Erreur récupération projets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [api]);

    return (
        <div className="h-[calc(100vh-6rem)] flex bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in">
            {/* Sidebar (Channels) */}
            <div className="w-64 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                        <MessageSquare size={18} className="mr-2 text-blue-600" />
                        Canaux d'équipe
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>)}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center p-4 text-gray-500 text-sm">
                            Vous n'avez aucun projet pour le moment.
                        </div>
                    ) : (
                        projects.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all ${selectedProjectId === p.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <Hash size={16} className={selectedProjectId === p.id ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400'} />
                                <span className="truncate">{p.nom}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
                {!selectedProjectId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 dark:bg-gray-900/30">
                        <MessageSquare size={48} className="opacity-20 mb-4" />
                        <p className="font-medium text-gray-500">Sélectionnez un canal pour discuter</p>
                    </div>
                ) : (
                    // On modifie l'apparence du ProjectChat interne pour qu'il prenne 100% sans bordures redondantes
                    <div className="h-full flex flex-col [&>div]:border-0 [&>div]:rounded-none [&>div]:shadow-none [&>div]:h-full">
                        <ProjectChat projectId={selectedProjectId} key={selectedProjectId} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messagerie;
