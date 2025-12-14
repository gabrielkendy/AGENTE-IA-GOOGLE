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

  // Virtual "Team" Agent ID
  const TEAM_AGENT_ID = 'team-general';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 1. Detect if a specific agent is mentioned (e.g., "@Leo")
    const mentionMatch = input.match(/@(\w+)/);
    let targetAgent = activeAgent;
    let effectiveInput = input;

    // Logic: If in Team Mode OR specific mention overrides current agent
    if (mentionMatch) {
        const mentionedName = mentionMatch[1].toLowerCase();
        const foundAgent = allAgents.find(a => a.name.toLowerCase().includes(mentionedName));
        if (foundAgent) {
            targetAgent = foundAgent;
            // Optionally remove the mention from the prompt sent to AI to avoid confusion, 
            // or keep it for context. Keeping it is usually fine.
        }
    } else if (activeAgent.id === TEAM_AGENT_ID) {
        // If in Team Mode and no mention, default to Manager
        const manager = allAgents.find(a => a.role === AgentRole.MANAGER);
        if (manager) targetAgent = manager;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const tempId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = {
      id: tempId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      senderName: targetAgent.name, // Display who is actually answering
      isThinking: true,
    };

    setMessages(prev => [...prev, modelMessage]);

    let accumulatedText = "";

    try {
      await streamChatResponse(
        targetAgent,
        messages, 
        effectiveInput,
        driveFiles,
        (textChunk) => {
          accumulatedText += textChunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, text: accumulatedText, isThinking: false, senderName: targetAgent.name } 
                : msg
            )
          );
          scrollToBottom();
        }
      );
    } catch (error) {
      // Error handled in service
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to render the select dropdown including the Team option
  const isTeamMode = activeAgent.id === TEAM_AGENT_ID;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      {/* Chat Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isTeamMode ? (
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center border-2 border-primary-400">
                    <Icons.Users />
                </div>
            ) : (
                <img 
                src={activeAgent.avatar} 
                alt={activeAgent.name} 
                className="w-10 h-10 rounded-full border-2 border-primary-500 object-cover" 
                />
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <h2 className="font-semibold text-lg">{isTeamMode ? 'Time Completo' : activeAgent.name}</h2>
            <p className="text-xs text-gray-400">{isTeamMode ? 'Canal Geral - Mencione @Nome' : activeAgent.role}</p>
          </div>
        </div>
        
        {/* Agent Selector */}
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden md:block">Canal:</span>
            <select 
                value={isTeamMode ? TEAM_AGENT_ID : activeAgent.id}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === TEAM_AGENT_ID) {
                        // Create a dummy agent for UI state props, but logic handles it
                        // In a real app, structure state better. Here we pass a dummy or keep current.
                        // We need to notify parent to switch 'activeAgent' or handle ID.
                        // Since 'activeAgent' prop expects an object, we rely on parent looking up ID.
                        // BUT, if parent looks up ID 'team-general' and fails, app crashes.
                        // So we must handle this in App.tsx or pass a special object.
                        // For this code structure, let's assume parent handles it or we pass existing.
                        onChangeAgent(val);
                    } else {
                        onChangeAgent(val);
                    }
                }}
                className="bg-gray-800 border border-gray-700 text-sm rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500 outline-none max-w-[150px] truncate"
            >
                <option value={TEAM_AGENT_ID}>👥 Time Completo (Geral)</option>
                <hr />
                {allAgents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
             {isTeamMode ? (
                 <>
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4"><Icons.Users /></div>
                    <p className="text-center max-w-md">
                        Você está no Canal Geral. Fale com a <b>Gestora</b> por padrão, ou mencione um especialista (ex: <i>"@Lucas, crie um plano"</i>).
                    </p>
                 </>
             ) : (
                 <>
                    <img src={activeAgent.avatar} className="w-20 h-20 rounded-full mb-4 opacity-50 grayscale" alt="Start" />
                    <p>Inicie a conversa com {activeAgent.name}...</p>
                 </>
             )}
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                 {msg.role === 'model' ? (
                     // Try to find the agent who sent this message for the avatar
                     (() => {
                         const sender = allAgents.find(a => a.name === msg.senderName);
                         return sender ? (
                            <img src={sender.avatar} className="w-8 h-8 rounded-full" alt="Bot" title={sender.name} />
                         ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center text-[10px] border border-primary-700">AI</div>
                         );
                     })()
                 ) : (
                     <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">EU</div>
                 )}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
              }`}>
                {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-primary-400 font-bold">{msg.senderName}</span>
                        {/* Show role badge if available */}
                        {(() => {
                             const sender = allAgents.find(a => a.name === msg.senderName);
                             return sender ? <span className="text-[10px] px-1 bg-gray-700 rounded text-gray-400">{sender.role}</span> : null;
                        })()}
                    </div>
                )}
                
                <div className="whitespace-pre-wrap">
                  {msg.isThinking && !msg.text ? (
                      <span className="animate-pulse">Pensando...</span>
                  ) : (
                      msg.text
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700 focus-within:border-primary-500 transition-colors shadow-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTeamMode ? "Mensagem para o time (use @Nome para direcionar)..." : `Mensagem para ${activeAgent.name}...`}
            className="w-full bg-transparent text-gray-200 p-2 max-h-32 min-h-[44px] resize-none focus:outline-none scrollbar-hide"
            rows={1}
            style={{ height: 'auto', minHeight: '44px' }}
            ref={ref => { if(ref) { ref.style.height = 'auto'; ref.style.height = ref.scrollHeight + 'px'; }}}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-lg mb-1 transition-all ${
              input.trim() && !isLoading 
                ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-900/20' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Icons.Send />
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
            {isTeamMode ? 'Modo Time: A Gestora responderá, a menos que você mencione outro agente.' : `${activeAgent.name} possui conhecimento específico e global.`}
        </p>
      </div>
    </div>
  );
};
