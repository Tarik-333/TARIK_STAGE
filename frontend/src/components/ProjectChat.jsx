import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Send, User, MessageSquare } from 'lucide-react';

const ProjectChat = ({ projectId }) => {
    const { api, user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load History
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

    // WebSocket Connection
    useEffect(() => {
        // Build WebSocket URL
        // If api base url is http://localhost:8000, ws url is ws://localhost:8000
        const baseURL = api.defaults.baseURL || 'http://localhost:8000';
        const wsURL = baseURL.replace('http://', 'ws://').replace('https://', 'wss://');
        
        ws.current = new WebSocket(`${wsURL}/chat/ws/${projectId}?user_id=${user.id}`);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
            const newMsg = JSON.parse(event.data);
            setMessages(prev => [...prev, newMsg]);
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [api, projectId, user.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        // Send raw text to WS, backend will save it and broadcast JSON
        ws.current.send(input);
        setInput('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[600px] flex flex-col overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800/80 p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <MessageSquare size={18} className="text-gray-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Discussion d'équipe</h3>
                </div>
                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    En direct
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <MessageSquare className="w-10 h-10 opacity-20" />
                        <p className="text-sm font-medium">Soyez le premier à envoyer un message !</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.author.id === user.id;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end space-x-2 max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm ${isMe ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>
                                        <User size={12} />
                                    </div>
                                    <div>
                                        {!isMe && <p className="text-[10px] text-gray-500 dark:text-gray-400 ml-1 mb-0.5 font-medium">{msg.author.nom}</p>}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-sm shadow-[0_2px_10px_-3px_rgba(37,99,235,0.3)]' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600 shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={sendMessage} className="flex space-x-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Écrivez un message..." 
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm flex items-center justify-center w-12"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProjectChat;
