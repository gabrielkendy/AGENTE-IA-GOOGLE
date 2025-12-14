import React, { useState, useRef, useEffect } from 'react';
import { Agent, ChatMessage, DriveFile, AgentRole } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { Icons } from './Icon';

interface ChatWindowProps {
  activeAgent: Agent;
  allAgents: Agent[];
  onChangeAgent: (agentId: string) => void;
  driveFiles: DriveFile[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ activeAgent, allAgents, onChangeAgent, driveFiles }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const TEAM_AGENT_ID = 'team-general';

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let targetAgent = activeAgent;
    const mentionMatch = input.match(/@(\w+)/);
    if (mentionMatch) {
        const mentioned = allAgents.find(a => a.name.toLowerCase().includes(mentionMatch[1].toLowerCase()));
        if (mentioned) targetAgent = mentioned;
    } else if (activeAgent.id === TEAM_AGENT_ID) {
        const manager = allAgents.find(a => a.role === AgentRole.MANAGER);
        if (manager) targetAgent = manager;
    }

    const tempId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: tempId, role: 'model', text: '', timestamp: new Date(), senderName: targetAgent.name, isThinking: true }]);
    let accumulatedText = "";
    try {
      await streamChatResponse(targetAgent, messages, input, driveFiles, (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, text: accumulatedText, isThinking: false, senderName: targetAgent.name } : msg));
      });
    } catch { } finally { setIsLoading(false); }
  };

  const isTeamMode = activeAgent.id === TEAM_AGENT_ID;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isTeamMode ? <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center border-2 border-primary-400"><Icons.Users /></div> : <img src={activeAgent.avatar} className="w-10 h-10 rounded-full border-2 border-primary-500 object-cover" />}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <h2 className="font-semibold text-lg">{isTeamMode ? 'Time Completo' : activeAgent.name}</h2>
            <p className="text-xs text-gray-400">{isTeamMode ? 'Canal Geral' : activeAgent.role}</p>
          </div>
        </div>
        <select value={isTeamMode ? TEAM_AGENT_ID : activeAgent.id} onChange={(e) => onChangeAgent(e.target.value)} className="bg-gray-800 border border-gray-700 text-sm rounded-lg p-2 outline-none max-w-[150px]">
            <option value={TEAM_AGENT_ID}>👥 Time Completo</option>
            {allAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                 {msg.role === 'model' ? <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center text-[10px] border border-primary-700">AI</div> : <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">EU</div>}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'}`}>
                {msg.role === 'model' && <div className="flex items-center gap-2 mb-1"><span className="text-xs text-primary-400 font-bold">{msg.senderName}</span></div>}
                <div className="whitespace-pre-wrap">{msg.isThinking && !msg.text ? <span className="animate-pulse">Pensando...</span> : msg.text}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Mensagem..." className="w-full bg-transparent text-gray-200 p-2 max-h-32 min-h-[44px] resize-none focus:outline-none" rows={1} />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500"><Icons.Send /></button>
        </div>
      </div>
    </div>
  );
};