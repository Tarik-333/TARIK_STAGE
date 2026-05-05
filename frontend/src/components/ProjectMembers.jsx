import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Shield, User, Search, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProjectMembers = ({ projectId, api, currentUser }) => {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    const fetchMembers = useCallback(async () => {
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            setMembers(res.data);
        } catch (error) {
            console.error("Erreur membres", error);
            toast.error("Impossible de charger les membres");
        }
    }, [api, projectId]);

    const fetchAllUsers = useCallback(async () => {
        try {
            const res = await api.get('/auth/users');
            setAllUsers(res.data);
        } catch (error) {
            console.error("Erreur utilisateurs", error);
        }
    }, [api]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchMembers();
            if (isAdmin) await fetchAllUsers();
            setLoading(false);
        };
        init();
    }, [fetchMembers, fetchAllUsers, isAdmin]);

    const handleAddMember = async (userId) => {
        setIsSubmitting(true);
        try {
            await api.post(`/projects/${projectId}/members`, {
                user_id: userId,
                role: 'member'
            });
            toast.success("Membre ajouté avec succès");
            fetchMembers();
            setShowAddModal(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erreur lors de l'ajout");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Voulez-vous vraiment retirer ce membre du projet ?")) return;
        
        try {
            await api.delete(`/projects/${projectId}/members/${userId}`);
            toast.success("Membre retiré");
            fetchMembers();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                <p className="text-gray-500 font-medium">Chargement de l'équipe...</p>
            </div>
        );
    }

    // Filter users not already in the project
    const availableUsers = allUsers.filter(u => 
        !members.some(m => m.user_id === u.id) &&
        u.nom.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="flex items-center gap-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        <div className="rounded-lg bg-vf-soft p-2 text-vf dark:bg-vf/20 dark:text-vf/90">
                            <Shield size={22} strokeWidth={2} />
                        </div>
                        Membres de l'équipe
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {members.length} personne{members.length > 1 ? 's' : ''} collabore{members.length > 1 ? 'nt' : ''} sur ce projet.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                        <UserPlus size={20} strokeWidth={2.5} />
                        <span>Ajouter un membre</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                    <div 
                        key={member.id} 
                        className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-card transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                {getInitials(member.user?.nom)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                    {member.user?.nom}
                                </h4>
                                <div className="flex items-center mt-1">
                                    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${
                                        member.role === 'manager' || member.user?.role === 'admin'
                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-vf-soft text-vf dark:bg-vf/20 dark:text-vf/90'
                                    }`}>
                                        {member.user?.role === 'admin' ? 'Admin' : member.role}
                                    </span>
                                </div>
                            </div>
                            {isAdmin && member.user?.role !== 'admin' && (
                                <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        <div className="mt-4 flex items-center text-xs text-gray-400 font-medium">
                            <User size={14} className="mr-1.5 opacity-60" />
                            {member.user?.email}
                        </div>
                    </div>
                ))}
            </div>

            {members.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <User size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aucun membre</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Commencez par ajouter des personnes à ce projet.</p>
                </div>
            )}

            {/* Modal Ajouter Membre */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Inviter un membre</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recherchez parmi les utilisateurs.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nom ou email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white font-medium"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {availableUsers.map(u => (
                                    <div 
                                        key={u.id}
                                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all border border-transparent hover:border-violet-100 dark:hover:border-violet-800 group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                                                {getInitials(u.nom)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{u.nom}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{u.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleAddMember(u.id)}
                                            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
                                        >
                                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Ajouter"}
                                        </button>
                                    </div>
                                ))}
                                {availableUsers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                        <AlertCircle size={32} className="mb-2 opacity-20" />
                                        <p className="text-sm">Aucun utilisateur disponible.</p>
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

export default ProjectMembers;
