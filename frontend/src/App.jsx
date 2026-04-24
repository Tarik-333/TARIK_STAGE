import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Messagerie from './pages/Messagerie';
import ProtectedRoute from './components/ProtectedRoute';
import TopNav from './components/TopNav';
import Chatbot from './components/Chatbot';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors flex flex-col font-sans">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          style: {
            borderRadius: '10px',
            background: '#fff',
            color: '#333',
          },
        }} 
      />
      <Chatbot />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/projects" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Projects />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/projects/:projectId/tasks" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Tasks />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/messagerie" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Messagerie />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App;
