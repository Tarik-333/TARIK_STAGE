import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Messagerie from './pages/Messagerie';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import TopNavLayout from './components/TopNavLayout';
import Chatbot from './components/Chatbot';
import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
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
    </Router>
  )
}

export default App;
