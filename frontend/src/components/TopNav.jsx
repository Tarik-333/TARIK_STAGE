import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Bell, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const TopNav = () => {
    const { user, logout, api } = useContext(AuthContext);
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/projects', label: 'Projets' },
        { path: '/messagerie', label: 'Messagerie' }, 
        { path: '/settings', label: 'Paramètres' },
    ];

    useEffect(() => {
        if(user) {
            fetchNotifications();
            // Polling simple toutes les 30 secondes
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (error) {
            console.error("Erreur récupération notifications", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? {...n, is_read: true} : n));
        } catch (error) {
            console.error("Erreur", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put(`/notifications/read-all`);
            setNotifications(notifications.map(n => ({...n, is_read: true})));
            toast.success("Toutes les notifications ont été lues");
        } catch (error) {
            console.error("Erreur", error);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 transition-colors">
            {/* Logo area */}
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black dark:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                        <LayoutDashboard className="text-white w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white transition-colors">ProjectFlow</span>
                </div>

                {/* Main Navigation Tabs */}
                <nav className="hidden md:flex items-center space-x-1 ml-8">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-4">
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="font-bold text-sm text-gray-800 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Aucune notification.
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start space-x-3 cursor-pointer ${notif.is_read ? 'opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notif.is_read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-semibold'}`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-1 block">
                                                    {new Date(notif.created_at).toLocaleString('fr-FR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                
                <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold transition-colors">
                        {getInitials(user?.nom)}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block transition-colors">{user?.nom || 'Utilisateur'}</span>
                </div>
                
                <button 
                    onClick={logout}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Déconnexion"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default TopNav;
