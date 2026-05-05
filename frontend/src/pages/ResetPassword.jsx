import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { ValaFlowLogo } from '../components/AppLayout';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Le lien de réinitialisation est invalide ou manquant.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Une erreur est survenue');
      }

      setMessage(data.message || 'Mot de passe mis à jour avec succès');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Une erreur de connexion est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#e0f2fe] px-6 py-12 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#0f172a]">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] opacity-50"></div>

      <div className="relative w-full max-w-[440px] animate-fade-in z-10">
        <div className="card p-10 sm:p-14 shadow-2xl rounded-[3rem] border border-white/60 bg-white dark:bg-[#0f172a] dark:border-slate-800">
          
          <div className="flex flex-col items-center text-center mb-10">
            <ValaFlowLogo className="w-20 h-20 mb-6" />
            <h1 className="text-[28px] font-black tracking-tighter leading-tight text-slate-900 dark:text-white mb-3">
               Nouveau mot de passe
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-[14px]">
               <ShieldCheck size={16} className="text-teal-500" />
               Veuillez sécuriser votre accès
            </div>
          </div>

          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-sm text-red-600 dark:border-red-900/20 dark:bg-red-950/20 dark:text-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/50 px-5 py-4 text-sm text-green-600 dark:border-green-900/20 dark:bg-green-950/20 dark:text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="font-bold">{message}</p>
                <p className="text-xs opacity-80 mt-1">Redirection vers la connexion...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  id="password"
                  type="password"
                  required
                  disabled={!token}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  disabled={!token}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4.5 mt-8 text-[15px] font-black rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Mise à jour...
                </div>
              ) : (
                <>
                  Réinitialiser
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {!token && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
