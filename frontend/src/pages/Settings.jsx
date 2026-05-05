import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, LogOut, Moon, Sun, Save, Shield, Bell, Palette, Camera, Upload, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-600', 'bg-slate-700',
];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const TAB_ITEMS = [
  { id: 'profil', label: 'Identité Opérationnelle', icon: User },
  { id: 'securite', label: 'Cryptage & Accès', icon: Shield },
  { id: 'apparence', label: 'Interface & Design', icon: Palette },
];

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('profil');
  const [profileData, setProfileData] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
        toast.success('Asset visuel mis à jour');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 animate-fade-in">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter" style={{fontWeight:900}}>Paramètres du Compte</h1>
        <p className="text-[16px] text-slate-500 font-medium">Configuration des protocoles d'accès et de l'environnement visuel.</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* ===== Navigation Sidebar ===== */}
        <div className="lg:col-span-4">
          <div className="card p-5 space-y-2 shadow-soft-sm sticky top-6 border-slate-100 dark:border-slate-800">
            {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 font-extrabold translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <Icon size={18} className={activeTab === id ? 'text-white' : 'text-slate-400'} />
                {label}
              </button>
            ))}

            <div className="h-px bg-slate-50 dark:bg-slate-800 my-6 mx-3" />

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm text-rose-500 font-extrabold transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <LogOut size={18} />
              Terminer la session
            </button>
          </div>
        </div>

        {/* ===== Main Content ===== */}
        <div className="lg:col-span-8 space-y-8">
          
          {activeTab === 'profil' && (
            <div className="card-premium p-10 space-y-12 bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800">
               <div className="flex flex-col sm:flex-row items-center gap-10">
                  <div className="relative group">
                    <div className={`h-36 w-36 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center border-8 border-white dark:border-slate-800 transition-transform duration-500 group-hover:scale-105 ${!profilePhoto ? getAvatarColor(user?.nom) : ''}`}>
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-5xl font-black text-white">{getInitials(user?.nom)}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="absolute -bottom-2 -right-2 h-12 w-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-800"
                    >
                      <Camera size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user?.nom}</h2>
                       <Sparkles size={18} className="text-blue-500 opacity-60" />
                    </div>
                    <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-xs">{user?.email}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-5">
                      <span className="badge bg-blue-50 text-blue-600 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/30">
                        {user?.role === 'admin' ? 'STRATÈGE' : 'OPÉRATIONNEL'}
                      </span>
                      <span className="badge bg-teal-50 text-teal-600 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-900/30 font-black tracking-tighter">Verified_Core</span>
                    </div>
                  </div>
               </div>

               <div className="h-px bg-slate-50 dark:bg-slate-800" />

               <form className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-3">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du profil</label>
                       <input type="text" value={profileData.nom} className="input-field py-4 bg-slate-50 dark:bg-[#020617] border-slate-100 dark:border-slate-800 focus:bg-white font-bold" readOnly />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse système</label>
                       <input type="email" value={profileData.email} className="input-field py-4 bg-slate-100 dark:bg-slate-900/50 border-none cursor-not-allowed opacity-60 font-bold" disabled />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <button type="button" className="btn-primary py-4 px-10 rounded-2xl font-extrabold shadow-xl shadow-blue-500/20">Mettre à jour le profil</button>
                  </div>
               </form>
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="card-premium p-10 space-y-10 bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center shadow-soft-sm">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sécurité des Accès</h2>
                    <p className="text-sm text-slate-500 font-medium">Protection des flux et gestion des clés de sécurité.</p>
                  </div>
               </div>

               <div className="h-px bg-slate-50 dark:bg-slate-800" />

               <form className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe actuel</label>
                    <input type="password" placeholder="••••••••" className="input-field py-4 bg-slate-50 dark:bg-[#020617] border-slate-100 dark:border-slate-800 font-bold" />
                  </div>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-3">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau secret</label>
                       <input type="password" placeholder="••••••••" className="input-field py-4 bg-slate-50 dark:bg-[#020617] border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation</label>
                       <input type="password" placeholder="••••••••" className="input-field py-4 bg-slate-50 dark:bg-[#020617] border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <button type="button" className="btn-primary py-4 px-10 rounded-2xl font-extrabold shadow-xl shadow-blue-500/20">Sécuriser le compte</button>
                  </div>
               </form>
            </div>
          )}

          {activeTab === 'apparence' && (
            <div className="card-premium p-10 space-y-10 bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-soft-sm">
                    <Palette size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Expérience Visuelle</h2>
                    <p className="text-sm text-slate-500 font-medium">Optimisation de l'interface utilisateur.</p>
                  </div>
               </div>

               <div className="h-px bg-slate-50 dark:bg-slate-800" />

               <div className="grid grid-cols-2 gap-8">
                  <button onClick={() => setIsDarkMode(false)} className={`p-8 rounded-[2rem] border-4 transition-all duration-300 text-left space-y-4 ${!isDarkMode ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}>
                     <div className="h-24 bg-white rounded-2xl shadow-soft-md border border-slate-100" />
                     <div>
                        <p className="text-lg font-black text-slate-900">Mode Clair</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Light_Flux</p>
                     </div>
                  </button>
                  <button onClick={() => setIsDarkMode(true)} className={`p-8 rounded-[2rem] border-4 transition-all duration-300 text-left space-y-4 ${isDarkMode ? 'border-blue-600 bg-[#020617]' : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}>
                     <div className="h-24 bg-[#0f172a] rounded-2xl shadow-soft-md border border-slate-800" />
                     <div>
                        <p className="text-lg font-black text-white">Mode Sombre</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Dark_Flux</p>
                     </div>
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
