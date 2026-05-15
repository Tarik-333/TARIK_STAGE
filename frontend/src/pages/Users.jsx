import React, { useState, useEffect, useContext } from 'react';
import {
  Users as UsersIcon, Trash2, Shield, User,
  Search, UserCheck, UserX, Mail, Crown, ChevronRight, ChevronDown, UserPlus, Sparkles
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-teal-500', 'bg-cyan-600', 'bg-indigo-500', 'bg-slate-700',
];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const RoleDropdown = ({ currentRole, onUpdate, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const roles = [
    { value: 'admin', label: 'ADMINISTRATEUR', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50' },
    { value: 'manager', label: 'MANAGER', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50' },
    { value: 'employe', label: 'EMPLOYÉ', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700' }
  ];

  const selected = roles.find(r => r.value === currentRole) || roles[2];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black outline-none border transition-colors ${selected.color} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selected.label}
        {!disabled && <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1.5 flex flex-col gap-1">
              {roles.map(r => (
                <button
                  key={r.value}
                  onClick={() => {
                    onUpdate(r.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between ${
                    currentRole === r.value 
                    ? 'bg-slate-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r.label}
                  {currentRole === r.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Users = () => {
  const { api, user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (e) {
      toast.error('Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role?new_role=${newRole}`);
      toast.success('Niveau d\'accès mis à jour');
      fetchUsers();
    } catch (e) {
      toast.error('Action non autorisée');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Confirmer la révocation définitive de ce membre ?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('Accès révoqué avec succès');
      fetchUsers();
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronisation des membres…</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white">
                <UsersIcon size={28} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter" style={{fontWeight:900}}>Gestion de l'Équipe</h1>
                <p className="text-[16px] text-slate-500 font-medium mt-1">Administrez les comptes, gérez les rôles et sécurisez l'accès à la plateforme.</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Filtrer les collaborateurs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field py-3 pl-12 pr-4 bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800 shadow-soft-sm min-w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* ===== Core Stats ===== */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="card p-8 flex items-center gap-6 hover:border-blue-200 transition-all group">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 transition-transform group-hover:scale-110">
            <UsersIcon size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Effectif Total</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{users.length}</p>
          </div>
        </div>
        <div className="card p-8 flex items-center gap-6 hover:border-teal-200 transition-all group">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 transition-transform group-hover:scale-110">
            <Crown size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Directeurs</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
        <div className="card p-8 flex items-center gap-6 hover:border-purple-200 transition-all group">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 transition-transform group-hover:scale-110">
            <Shield size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Managers</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{users.filter(u => u.role === 'manager').length}</p>
          </div>
        </div>
        <div className="card p-8 flex items-center gap-6 hover:border-slate-300 transition-all group">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 transition-transform group-hover:scale-110">
            <User size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Employés</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{users.filter(u => u.role === 'employe').length}</p>
          </div>
        </div>
      </div>

      {/* ===== Members Network ===== */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filteredUsers.map((u) => (
          <div key={u.id} className="card-premium group flex flex-col p-8 hover:shadow-soft-lg transition-all duration-500 relative overflow-hidden bg-white dark:bg-[#0f172a]">
            {u.role === 'admin' && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full flex items-center justify-center pl-8 pb-8">
                 <Sparkles size={16} className="text-blue-200" />
              </div>
            )}
            
            <div className="flex items-start gap-5 mb-8">
                <div className={`h-16 w-16 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-lg group-hover:scale-105 transition-transform duration-500 ${getAvatarColor(u.nom)}`}>
                  {getInitials(u.nom)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate pr-2">{u.nom}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Mail size={13} className="text-slate-300" />
                    <span className="text-[13px] font-medium text-slate-500 truncate max-w-[150px]">{u.email}</span>
                  </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
               <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Niveau d'accès</span>
               <RoleDropdown 
                  currentRole={u.role}
                  onUpdate={(newRole) => handleUpdateRole(u.id, newRole)}
                  disabled={u.id === currentUser.id}
               />
            </div>

            <div className="flex gap-3 mt-auto">
              <div className="flex-1"></div>
              <button
                onClick={() => handleDeleteUser(u.id)}
                disabled={u.id === currentUser.id}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white disabled:opacity-20 transition-all shadow-sm active:scale-90"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
            <div className="col-span-full py-32 text-center card bg-slate-50/50 border-dashed border-2">
                <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-soft-md flex items-center justify-center mx-auto mb-8 border border-slate-100">
                    <User className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Collaborateur non identifié</h3>
                <p className="mt-2 text-slate-500 font-medium">Ajustez vos filtres de recherche opérationnelle.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Users;
