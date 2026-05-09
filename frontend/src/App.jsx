import React, { Suspense, lazy, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import TopNavLayout from './components/TopNavLayout';
import Chatbot from './components/Chatbot';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Lazy loading the pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Settings = lazy(() => import('./pages/Settings'));
const Messagerie = lazy(() => import('./pages/Messagerie'));
const Users = lazy(() => import('./pages/Users'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
        <div className="h-6 w-6 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse"></div>
      </div>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Chargement de l'espace...</p>
    </div>
  </div>
);

import { Settings as SettingsIcon } from 'lucide-react';

function App() {
  const { user } = useContext(AuthContext);
  // Toggle between Layout A (Sidebar) and Layout B (TopNav)
  // In a real app, this could be a user preference
  const [layoutType, setLayoutType] = useState('A'); 

  const Layout = layoutType === 'A' ? AppLayout : TopNavLayout;

  return (
    <Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'rounded-2xl border border-slate-100 bg-white text-sm font-semibold text-slate-800 shadow-soft-lg dark:bg-slate-900 dark:text-zinc-100 dark:border-slate-800',
          style: { borderRadius: '1rem', background: 'var(--vf-surface)', border: '1px solid var(--vf-border)' },
        }}
      />
      <Chatbot />
      
      {/* Layout Switcher (Temporary for demonstration/choice) */}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
        <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Projects /></Layout></ProtectedRoute>} />
        <Route path="/projects/:projectId/tasks" element={<ProtectedRoute><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Tasks /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Settings /></Layout></ProtectedRoute>} />
        <Route path="/messagerie" element={<ProtectedRoute><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Messagerie /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute adminOnly><Layout toggleLayout={() => setLayoutType(layoutType === 'A' ? 'B' : 'A')}><Users /></Layout></ProtectedRoute>} />
        
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App;
