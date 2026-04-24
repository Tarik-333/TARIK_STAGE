import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Chatbot = () => {
    const { api, user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour ! Je suis l'assistant IA de ProjectFlow. Posez-moi vos questions sur vos projets ou tâches !", sender: 'ai' }
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

    // Don't render for non-logged in users
    if (!user) return null;

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
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:-translate-y-1 transition-all z-50 group"
                >
                    <MessageSquare size={26} className="group-hover:scale-110 transition-transform" />
                    {/* Pulsing indicator */}
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[340px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">ProjectFlow AI</h3>
                                <p className="text-[10px] text-blue-200">En ligne</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-800/50 custom-scrollbar">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-gray-800 text-white dark:bg-gray-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]'}`}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-end space-x-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                                        <Bot size={14} />
                                    </div>
                                    <div className="px-4 py-3.5 bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-600 shadow-sm flex space-x-1.5">
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <form onSubmit={sendMessage} className="flex items-center space-x-2 relative">
                            <input 
                                type="text" 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Demandez un résumé, vos tâches urgentes..." 
                                disabled={isLoading}
                                className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                </div>
            )}
        </>
    );
};

export default Chatbot;
