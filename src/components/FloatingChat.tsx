import React, { useState } from 'react';
import { TeamMessage } from '../types';
import { Icons } from './Icon';

interface FloatingChatProps { messages: TeamMessage[]; setMessages: React.Dispatch<React.SetStateAction<TeamMessage[]>>; }

export const FloatingChat: React.FC<FloatingChatProps> = ({ messages, setMessages }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');

    const send = () => {
        if (!input.trim()) return;
        setMessages(p => [...p, { id: Date.now().toString(), senderId: 'user', senderName: 'Você', text: input, timestamp: new Date(), read: true }]);
        setInput('');
    };

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50"><Icons.MessageCircle /></button>;

    return (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col">
            <div className="p-3 border-b border-gray-800 flex justify-between bg-gray-800 rounded-t-xl"><span className="font-bold text-sm">Chat Equipe</span><button onClick={() => setIsOpen(false)}><Icons.X /></button></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.senderId === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-500">{m.senderName}</span>
                        <div className={`p-2 rounded text-sm ${m.senderId === 'user' ? 'bg-primary-600' : 'bg-gray-800'}`}>{m.text}</div>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-gray-800 flex gap-2">
                <input className="flex-1 bg-gray-800 rounded p-1 text-sm outline-none" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} className="text-primary-400"><Icons.Send /></button>
            </div>
        </div>
    );
};