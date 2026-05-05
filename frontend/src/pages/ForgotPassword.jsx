import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { ValaFlowLogo } from '../components/AppLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Une erreur est survenue');
      }

      setMessage(data.message || 'Si l\'adresse email existe, un lien de réinitialisation a été envoyé.');
      setEmail('');
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
            <h1 className="text-[32px] font-black tracking-tighter leading-tight text-slate-900 dark:text-white mb-3">
               Mot de passe oublié ?
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-[14px]">
               <ShieldCheck size={16} className="text-teal-500" />
               Récupération sécurisée
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
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Adresse Email</label>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3 ml-1">Entrez l'adresse email associée à votre compte pour recevoir un lien de réinitialisation.</p>
              <div className="relative group mt-2">
                <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-[#eff6ff]/50 dark:bg-slate-900/50 border-none rounded-2xl px-5 py-4 pl-14 transition-all duration-300 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-[#eff6ff] focus:ring-2 focus:ring-blue-500/20"
                  placeholder="nom@entreprise.fr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4.5 mt-8 text-[15px] font-black rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Envoi en cours...
                </div>
              ) : (
                <>
                  Envoyer le lien
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link to="/login" className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold transition-colors">
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
