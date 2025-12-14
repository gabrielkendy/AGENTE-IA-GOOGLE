import React, { useState, useEffect, useRef } from 'react';
import { TeamMessage } from '../types';
import { Icons } from './Icon';

interface FloatingChatProps {
    messages: TeamMessage[];
    setMessages: React.Dispatch<React.SetStateAction<TeamMessage[]>>;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ messages, setMessages }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    const unreadCount = messages.filter(m => !m.read && m.senderId !== 'user').length;

    useEffect(() => {
        if (isOpen && !isMinimized) {
             endRef.current?.scrollIntoView({ behavior: 'smooth' });
             // Mark as read
             setMessages(prev => prev.map(m => ({...m, read: true})));
        }
    }, [isOpen, isMinimized, messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: TeamMessage = {
            id: Date.now().toString(),
            senderId: 'user',
            senderName: 'Você',
            text: input,
            timestamp: new Date(),
            read: true
        };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        
        // Simulating reply
        setTimeout(() => {
            const reply: TeamMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'designer',
                senderName: 'Carol (Designer)',
                senderAvatar: 'https://picsum.photos/seed/designer/50/50',
                text: 'Recebido! Vou começar a trabalhar nisso em breve.',
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, reply]);
        }, 3000);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-500 rounded-full shadow-2xl flex items-center justify-center text-white transition-all z-50 group"
            >
                <Icons.MessageCircle />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-gray-950">
                        {unreadCount}
                    </div>
                )}
                <span className="absolute right-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Chat Equipe
                </span>
            </button>
        );
    }

    if (isMinimized) {
        return (
             <div className="fixed bottom-0 right-6 w-72 bg-gray-900 border-x border-t border-gray-700 rounded-t-lg shadow-2xl z-50 flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800" onClick={() => setIsMinimized(false)}>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span className="font-bold text-sm">Chat da Equipe</span>
                     {unreadCount > 0 && <span className="text-xs bg-red-500 px-1.5 rounded-full">{unreadCount}</span>}
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-gray-400 hover:text-white"><Icons.X /></button>
             </div>
        );
    }

    return (
        <div className="fixed bottom-0 right-6 w-80 h-[450px] bg-gray-900 border border-gray-700 rounded-t-xl shadow-2xl z-50 flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-850 rounded-t-xl">
                <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span className="font-bold text-sm">Chat da Equipe</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"><Icons.Minus /></button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"><Icons.X /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95">
                {messages.length === 0 && <div className="text-center text-xs text-gray-500 mt-10">Nenhuma mensagem recente.</div>}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.senderId !== 'user' && (
                            <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.senderName}</span>
                        )}
                        <div className={`max-w-[85%] p-2 rounded-lg text-sm ${
                            msg.senderId === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-800 bg-gray-850">
                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-primary-500"
                        placeholder="Mensagem..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className="p-2 bg-primary-600 rounded hover:bg-primary-500 text-white"><Icons.Send /></button>
                </div>
            </div>
        </div>
    );
};