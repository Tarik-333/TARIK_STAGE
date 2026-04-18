import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, Settings, Bell, LogOut } from 'lucide-react';

const TopNav = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/projects', label: 'Projets' },
        { path: '/tasks', label: 'Tâches' }, // If we want a global tasks route, else just acts as visual
        { path: '/settings', label: 'Paramètres' },
    ];

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

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
                        if (item.path === '/tasks') {
                            // Dummy link for aesthetics as per mockup, or can be real global route
                            return (
                            <div key={item.path} className="px-4 py-1.5 text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                                    {item.label}
                                </div>
                            );
                        }
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
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Bell size={18} />
                </button>
                
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
