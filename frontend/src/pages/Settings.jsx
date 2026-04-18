import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, LogOut, Moon, Sun, Camera, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('profil'); // 'profil' or 'securite'

    const [profileData, setProfileData] = useState({
        nom: user?.nom || '',
        email: user?.email || '',
        photo: null
    });
    
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Init dark mode strictly based on HTML class or localstorage
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const handleThemeToggle = () => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        alert("Profil mis à jour avec succès ! (Simulation)");
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }
        alert("Mot de passe modifié avec succès ! (Simulation)");
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Paramètres</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez votre compte et vos préférences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Sidebar Navigation */}
                <div className="col-span-1 space-y-2">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 flex flex-col space-y-1 transition-colors">
                        <button 
                            onClick={() => setActiveTab('profil')}
                            className={`w-full px-4 py-2 font-medium rounded-lg flex items-center transition-colors text-left ${activeTab === 'profil' ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <User size={18} className={`mr-3 ${activeTab === 'profil' ? 'text-blue-600 dark:text-blue-400' : ''}`} /> Mon Profil
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('securite')}
                            className={`w-full px-4 py-2 font-medium rounded-lg flex items-center transition-colors text-left ${activeTab === 'securite' ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Lock size={18} className={`mr-3 ${activeTab === 'securite' ? 'text-blue-600 dark:text-blue-400' : ''}`} /> Sécurité
                        </button>
                        
                        <div 
                            onClick={handleThemeToggle}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <div className="flex items-center">
                                {isDarkMode ? <Sun size={18} className="mr-3 text-orange-400" /> : <Moon size={18} className="mr-3 text-indigo-500" />}
                                Apparence
                            </div>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                {isDarkMode ? 'Clair' : 'Sombre'}
                            </span>
                        </div>
                        
                        <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
                        
                        <button 
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg flex items-center cursor-pointer transition-colors text-left"
                        >
                            <LogOut size={18} className="mr-3" /> Déconnexion
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-2 space-y-8">
                    
                    {/* Profile Section */}
                    {activeTab === 'profil' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Informations Personnelles</h2>
                            
                            <form onSubmit={handleProfileSubmit}>
                                <div className="mb-6 flex items-center space-x-6">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-500 transition-colors">
                                            {profileData.photo ? (
                                                <img src={profileData.photo} alt="Profil" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <Camera size={24} />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-xs font-medium">Modifier</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Photo de profil</h3>
                                        <p className="text-sm text-gray-400 dark:text-gray-500">JPG, GIF ou PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                                        <input 
                                            type="text" 
                                            value={profileData.nom} 
                                            onChange={e => setProfileData({...profileData, nom: e.target.value})}
                                            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse E-mail</label>
                                        <input 
                                            type="email" 
                                            value={profileData.email} 
                                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                                            className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl p-2.5 outline-none transition-all cursor-not-allowed opacity-70"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">L'adresse email ne peut pas être modifiée directement.</p>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <button type="submit" className="flex items-center space-x-2 bg-black dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors">
                                        <Save size={18} />
                                        <span>Enregistrer les modifications</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Section */}
                    {activeTab === 'securite' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-700 transition-colors animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Sécurité et Mot de passe</h2>
                            
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.current}
                                        onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                                        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
                                        <input 
                                            type="password" 
                                            required
                                            value={passwordData.new}
                                            onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                                            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer mot de passe</label>
                                        <input 
                                            type="password" 
                                            required
                                            value={passwordData.confirm}
                                            onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                                            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                                        <Lock size={18} />
                                        <span>Mettre à jour le mot de passe</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
