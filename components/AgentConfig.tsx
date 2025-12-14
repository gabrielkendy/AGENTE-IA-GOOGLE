import React, { useState } from 'react';
import { Agent, AgentRole, GeminiModelType, DriveFile } from '../types';
import { Icons } from './Icon';

interface AgentConfigProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({ agents, setAgents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0].id);
  const [isInjecting, setIsInjecting] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleUpdate = (field: keyof Agent, value: any) => {
    setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, [field]: value } : a));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedAgent) {
        setIsInjecting(true);
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newFile: DriveFile = {
                    id: Date.now().toString(),
                    name: file.name,
                    content: event.target.result as string,
                    type: file.name.endsWith('.pdf') ? 'pdf' : 'text', // Simplification
                    source: 'upload',
                    lastModified: new Date()
                };
                
                // Simulate injection time
                setTimeout(() => {
                    const updatedFiles = [...(selectedAgent.files || []), newFile];
                    handleUpdate('files', updatedFiles);
                    setIsInjecting(false);
                }, 1500);
            }
        };
        reader.readAsText(file);
    }
  };

  const removeFile = (fileId: string) => {
      if (selectedAgent) {
          const updatedFiles = selectedAgent.files.filter(f => f.id !== fileId);
          handleUpdate('files', updatedFiles);
      }
  };
  
  // --- DATABASE ADMIN FUNCTIONS ---
  const handleDatabaseReset = () => {
      if (confirm("ATENÇÃO: Isso apagará todas as tarefas, histórico de chat e configurações salvas no navegador. Deseja continuar?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleExportBackup = () => {
      const backup = {
          timestamp: new Date(),
          agents: JSON.parse(localStorage.getItem('agents') || '[]'),
          tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "ai_workspace_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const MAX_CHARS = 5000;

  return (
    <div className="flex h-full bg-gray-950 text-gray-200">
      {/* Left List */}
      <div className="w-1/3 border-r border-gray-800 bg-gray-900/30 overflow-y-auto flex flex-col justify-between">
        <div>
            <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Icons.Users /> Time de Agentes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure o comportamento e a IA de cada especialista.</p>
            </div>
            <div className="p-2 space-y-1">
            {agents.map(agent => (
                <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedAgentId === agent.id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50 border border-transparent'
                }`}
                >
                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full" />
                <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{agent.role}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            agent.model.includes('pro') ? 'bg-purple-500' : 
                            agent.model.includes('lite') ? 'bg-green-500' : 'bg-blue-500'
                        }`}></span>
                    </div>
                </div>
                </button>
            ))}
            </div>
        </div>
        
        {/* DATABASE ADMIN PANEL */}
        <div className="p-4 border-t border-gray-800 bg-red-900/10">
            <h3 className="text-xs font-bold text-red-400 uppercase mb-3 flex items-center gap-2">
                <Icons.Settings /> Administração de Dados
            </h3>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={handleExportBackup}
                    className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-medium border border-gray-700 flex items-center justify-center gap-2"
                >
                    <Icons.Download /> Backup JSON (Download)
                </button>
                <button 
                    onClick={handleDatabaseReset}
                    className="w-full py-2 px-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs font-medium border border-red-900/50 flex items-center justify-center gap-2"
                >
                    <Icons.Trash /> Resetar Fábrica
                </button>
            </div>
        </div>
      </div>

      {/* Right Config Form */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedAgent && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
               <div className="relative">
                 <img src={selectedAgent.avatar} className="w-20 h-20 rounded-full border-4 border-gray-800 shadow-xl" alt="Avatar" />
                 <div className="absolute -bottom-1 -right-1 bg-gray-800 p-1.5 rounded-full border border-gray-700">
                    <Icons.Settings />
                 </div>
               </div>
               <div className="flex-1">
                 <h1 className="text-2xl font-bold">{selectedAgent.name}</h1>
                 <p className="text-gray-400 text-sm mb-2">{selectedAgent.description}</p>
                 <div className="flex gap-2">
                    <span className="px-2 py-1 bg-primary-900/30 text-primary-400 text-xs rounded border border-primary-900/50 font-medium">
                        {selectedAgent.role}
                    </span>
                 </div>
               </div>
            </div>

            <div className="space-y-6">
              {/* Training Files Section - ENHANCED UI */}
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-lg font-bold text-primary-400 mb-1 flex items-center gap-2">
                              <Icons.Attach /> Injeção de Conhecimento
                          </h3>
                          <p className="text-xs text-gray-500">
                              Arquivos carregados aqui treinam este agente especificamente. Use para guias de marca, personas ou dados brutos.
                          </p>
                      </div>
                      <label className={`inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 rounded-lg cursor-pointer text-sm font-bold shadow-lg transition-all ${isInjecting ? 'opacity-50 cursor-wait' : ''}`}>
                          <span className="flex items-center gap-2 text-white">
                            {isInjecting ? 'Injetando...' : 'Carregar Conhecimento'}
                          </span>
                          <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.csv,.json,.pdf" disabled={isInjecting} />
                      </label>
                  </div>
                  
                  {isInjecting && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                          <div className="h-full bg-primary-500 animate-pulse w-full"></div>
                      </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-3 mb-2">
                      {selectedAgent.files?.length === 0 && (
                          <div className="p-8 border-2 border-dashed border-gray-800 rounded-lg text-center text-gray-600">
                              Nenhum conhecimento injetado ainda.
                          </div>
                      )}
                      {selectedAgent.files?.map(file => (
                          <div key={file.id} className="bg-gray-800 p-3 rounded flex items-center justify-between border border-gray-700 hover:border-gray-600 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gray-700 rounded text-gray-400">
                                      <Icons.Doc />
                                  </div>
                                  <div>
                                      <div className="text-sm text-gray-200 font-medium">{file.name}</div>
                                      <div className="text-[10px] text-gray-500 uppercase">{file.type} • {file.content.length} chars</div>
                                  </div>
                              </div>
                              <button onClick={() => removeFile(file.id)} className="text-gray-500 hover:text-red-400 p-2">
                                  <Icons.Trash />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nome de Exibição</label>
                    <input 
                        type="text" 
                        value={selectedAgent.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Modelo de IA</label>
                    <select
                        value={selectedAgent.model}
                        onChange={(e) => handleUpdate('model', e.target.value as GeminiModelType)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none"
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-flash-lite-latest">Gemini 2.0 Flash Lite</option>
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                    </select>
                </div>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-primary-400">
                        Prompt do Sistema (Persona)
                    </label>
                    <span className={`text-xs ${selectedAgent.systemInstruction.length > MAX_CHARS ? 'text-red-400' : 'text-gray-500'}`}>
                        {selectedAgent.systemInstruction.length} / {MAX_CHARS}
                    </span>
                </div>
                
                <textarea 
                    value={selectedAgent.systemInstruction}
                    maxLength={MAX_CHARS}
                    onChange={(e) => handleUpdate('systemInstruction', e.target.value)}
                    className="w-full h-64 bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm font-mono focus:border-primary-500 outline-none resize-y"
                    placeholder="Instruções..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};