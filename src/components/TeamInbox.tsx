import React from 'react';
import { TeamMessage } from '../types';
import { Icons } from './Icon';

interface TeamInboxProps { messages: TeamMessage[]; setMessages: React.Dispatch<React.SetStateAction<TeamMessage[]>>; }

export const TeamInbox: React.FC<TeamInboxProps> = ({ messages, setMessages }) => {
    return (
        <div className="flex h-full bg-gray-950 text-gray-200">
            <div className="w-64 border-r border-gray-800 bg-gray-900/20 p-4"><h3 className="text-xs font-bold text-gray-500 uppercase">Canais</h3><div className="mt-2 text-sm text-gray-300 p-2 bg-gray-800 rounded"># geral</div></div>
            <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center font-bold">{msg.senderName[0]}</div>
                            <div><div className="flex items-baseline gap-2"><span className="font-bold text-sm">{msg.senderName}</span><span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString()}</span></div><p className="text-gray-300 text-sm">{msg.text}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};