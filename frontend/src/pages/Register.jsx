import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { ValaFlowLogo } from '../components/AppLayout';

const Register = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(nom, email, password);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#e0f2fe] px-6 py-12 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#0f172a]">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] opacity-50"></div>

      <div className="relative w-full max-w-[480px] animate-fade-in z-10">
        <div className="card p-10 sm:p-14 shadow-2xl rounded-[3rem] border border-white/60 bg-white dark:bg-[#0f172a] dark:border-slate-800">
          
          <div className="flex flex-col items-center text-center mb-10">
            <ValaFlowLogo className="w-16 h-16 mb-6" />
            <h1 className="text-3xl font-black tracking-tighter" style={{fontWeight:900}}>
               <span className="text-slate-900 dark:text-white">Rejoindre ValaFlow</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 dark:text-slate-400 font-medium text-[14px]">
               <ShieldCheck size={16} className="text-teal-500" />
               Espace de travail sécurisé
            </div>
          </div>

          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-sm text-red-600 dark:border-red-900/20 dark:bg-red-950/20 dark:text-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Adresse Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20"
                  placeholder="nom@entreprise.fr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Minimum 8 caractères"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4.5 mt-8 text-[15px] font-black rounded-2xl shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Déploiement...
                </div>
              ) : (
                <>
                  Démarrer l'aventure
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center pt-8">
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-black text-blue-600 hover:text-blue-700 transition-colors ml-1">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-extrabold opacity-70">
          &copy; 2026 ValaFlow &bull; Systèmes de Précision
        </p>
      </div>
    </div>
  );
};

export default Register;
