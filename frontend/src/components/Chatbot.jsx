import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Chatbot = () => {
    const { api, user } = useContext(AuthContext);
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour ! Je suis l'assistant IA de ValaFlow. Posez-moi vos questions sur vos projets ou tâches !", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Don't render for non-logged in users OR if on the messagerie page
    if (!user || location.pathname.startsWith('/messagerie')) return null;

    const sendMessage = async (e) => {
        e.preventDefault();
        if(!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg.text });
            const aiMsg = { id: Date.now() + 1, text: res.data.response, sender: 'ai' };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            const errorMsg = { id: Date.now() + 1, text: "Désolé, je rencontre une erreur de connexion. Vérifiez votre clé API Gemini.", sender: 'ai' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Bubble Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="group fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all duration-500 hover:scale-110 hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] hover:-translate-y-2"
                    style={{ animation: 'float 3s ease-in-out infinite' }}
                >
                    <style>{`
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-8px); }
                            100% { transform: translateY(0px); }
                        }
                    `}</style>
                    <span className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" style={{ animationDuration: '3s' }}></span>
                    <Bot size={28} className="relative z-10 drop-shadow-md" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 z-50 flex h-[600px] max-h-[85vh] w-[380px] sm:w-[420px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)] ring-1 ring-slate-900/5 animate-in slide-in-from-bottom-8 fade-in duration-300">
                    <div className="flex items-center justify-between px-6 py-5 bg-slate-900 dark:bg-slate-950 text-white">
                        <div className="flex items-center gap-4">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white/10 text-white shadow-inner">
                                <Bot size={24} />
                                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-green-400"></span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-white">Intelligence IA</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Opérationnel</p>
                                </div>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pt-6 pb-28 bg-[#f8fafc] dark:bg-slate-800" style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.15) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${msg.sender === 'user' ? 'bg-slate-800 dark:bg-slate-600' : 'bg-blue-600'}`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`px-5 py-3.5 text-[14px] leading-relaxed font-medium shadow-sm ${msg.sender === 'user' ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl bg-blue-600 text-white' : 'rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-slate-100 bg-white text-slate-700 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-200'}`}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-end gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                                        <Bot size={14} />
                                    </div>
                                    <div className="flex items-center space-x-1.5 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-slate-100 bg-white px-5 py-4 dark:border-slate-700/50 dark:bg-slate-800">
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input (Floating Pill) */}
                    {/* Input (Floating Pill) */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                        <form onSubmit={sendMessage} className="relative flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-[1.5rem] pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-700/50">
                            <input 
                                type="text" 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Posez votre question..." 
                                disabled={isLoading}
                                className="w-full h-14 pl-5 pr-14 rounded-[1.5rem] bg-transparent text-[14px] font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send size={18} className="translate-x-[1px]" />
                            </button>
                        </form>
                    </div>

                </div>
            )}
        </>
    );
};

export default Chatbot;
