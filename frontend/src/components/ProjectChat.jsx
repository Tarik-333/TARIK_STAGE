import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Send, MessageSquare, Paperclip, Smile, Users, Hash, MoreHorizontal } from 'lucide-react';

const ProjectChat = ({ projectId }) => {
    const { api, user, token } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPopoverRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/project/${projectId}/messages`);
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, [api, projectId]);

    useEffect(() => {
        const baseURL = api.defaults.baseURL || 'http://localhost:8000';
        const wsURL = baseURL.replace('http://', 'ws://').replace('https://', 'wss://');

        const t = encodeURIComponent(token || '');
        ws.current = new WebSocket(`${wsURL}/chat/ws/${projectId}?token=${t}`);

        ws.current.onmessage = (event) => {
            const newMsg = JSON.parse(event.data);
            setMessages(prev => [...prev, newMsg]);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [api, projectId, token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (!showEmoji) return;
        const onDown = (e) => {
            if (!emojiPopoverRef.current) return;
            if (!emojiPopoverRef.current.contains(e.target)) setShowEmoji(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [showEmoji]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        ws.current.send(input);
        setInput('');
    };

    const EMOJIS = ['😀', '😂', '😍', '👍', '👏', '🔥', '🎉', '✅', '🤝', '🙏', '💡', '🚀', '❤️', '😅', '😎', '🤔'];

    return (
        <div className="flex h-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">

            <div className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vf-soft text-vf dark:bg-vf/20 dark:text-vf/90">
                        <Hash size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Discussion</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-zinc-500">En direct</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800">
                        <Users size={18} />
                    </button>
                    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-400">
                        <MessageSquare size={28} className="mb-2 opacity-50" />
                        <p className="text-sm">Aucun message pour l’instant</p>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.author?.id === user?.id;
                            const prev = messages[idx - 1];
                            const showMeta = !isMe && prev?.author?.id !== msg.author?.id;
                            
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`flex items-start max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-4 group`}>

                                        {/* Premium Avatar */}
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[11px] font-black text-white shadow-md transition-transform group-hover:scale-110 ${
                                            isMe ? 'bg-slate-900 dark:bg-white dark:text-[#020617]' : 'bg-blue-600'
                                        }`}>
                                            {msg.author?.nom ? msg.author.nom[0].toUpperCase() : '?'}
                                        </div>

                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {showMeta && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                                    {msg.author?.nom || 'Collaborateur'}
                                                </span>
                                            )}

                                            <div className={`relative rounded-3xl px-5 py-3 text-[14px] font-medium leading-relaxed shadow-soft-sm ${
                                                isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {new Date(msg.created_at || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Premium Bento */}
            <div className="relative z-20 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
                <form onSubmit={sendMessage} className="mx-auto flex max-w-5xl items-center gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 transition-colors focus-within:border-vf/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-vf/10 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:bg-zinc-800">
                        <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                            <Paperclip size={18} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Écrire un message…"
                            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-zinc-900 focus:ring-0 dark:text-zinc-100"
                        />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowEmoji(v => !v)}
                                className="text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                <Smile size={20} />
                            </button>
                            {showEmoji && (
                                <div
                                    ref={emojiPopoverRef}
                                    className="absolute bottom-14 right-0 w-[220px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                    <div className="grid grid-cols-4 gap-2">
                                        {EMOJIS.map((e) => (
                                            <button
                                                key={e}
                                                type="button"
                                                onClick={() => { setInput(prev => `${prev}${e}`); setShowEmoji(false); }}
                                                className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-lg flex items-center justify-center"
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vf text-white shadow-md shadow-vf/25 transition-colors hover:bg-vf-hover disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProjectChat;
