import React from 'react';
import { TeamMessage } from '../types';
import { Icons } from './Icon';

interface TeamInboxProps {
    messages: TeamMessage[];
    setMessages: React.Dispatch<React.SetStateAction<TeamMessage[]>>;
}

export const TeamInbox: React.FC<TeamInboxProps> = ({ messages, setMessages }) => {
    const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem('msg') as HTMLInputElement;
        if (!input.value.trim()) return;

        const newMsg: TeamMessage = {
            id: Date.now().toString(),
            senderId: 'user',
            senderName: 'Você',
            text: input.value,
            timestamp: new Date(),
            read: true
        };
        setMessages(prev => [...prev, newMsg]);
        input.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 text-gray-200">
            <div className="p-6 border-b border-gray-800 bg-gray-900/50">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Icons.MessageCircle /> Inbox da Equipe
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Comunicação interna direta entre gestores e criativos (Human-to-Human).
                </p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Channel List (Sidebar) */}
                <div className="w-64 border-r border-gray-800 bg-gray-900/20 p-4 hidden md:flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2">Canais</h3>
                        <button className="w-full text-left px-3 py-2 rounded bg-gray-800 text-white font-medium mb-1"># geral</button>
                        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-400 mb-1"># aprovações</button>
                        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 text-gray-400 mb-1"># duvidas</button>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2">Mensagens Diretas</h3>
                        <div className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-gray-800/50 rounded cursor-pointer">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div> Carol (Designer)
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-gray-800/50 rounded cursor-pointer">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div> Roberto (Copy)
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-950 relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-center my-4">
                            <span className="bg-gray-800 text-gray-500 text-xs px-3 py-1 rounded-full">Hoje</span>
                        </div>
                        
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-4 ${msg.senderId === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0">
                                    {msg.senderAvatar ? (
                                        <img src={msg.senderAvatar} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center font-bold">
                                            {msg.senderName.substring(0,2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[60%] ${msg.senderId === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-bold text-sm">{msg.senderName}</span>
                                        <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                                        msg.senderId === 'user' ? 'bg-primary-900/40 border border-primary-700 text-white rounded-tr-none' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-gray-800">
                        <form onSubmit={handleSend} className="relative">
                            <input 
                                name="msg"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 pr-14 text-gray-200 focus:border-primary-500 outline-none"
                                placeholder="Enviar mensagem para #geral..."
                                autoComplete="off"
                            />
                            <button type="submit" className="absolute right-2 top-2 p-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white">
                                <Icons.Send />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};