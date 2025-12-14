import React, { useState } from 'react';
import { Agent, DriveFile } from '../types';
import { Icons } from './Icon';

interface AgentConfigProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({ agents, setAgents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0].id);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const [isInjecting, setIsInjecting] = useState(false);

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
                const newFile: DriveFile = { id: Date.now().toString(), name: file.name, content: event.target.result as string, type: 'text', source: 'upload', lastModified: new Date() };
                setTimeout(() => { handleUpdate('files', [...(selectedAgent.files || []), newFile]); setIsInjecting(false); }, 1000);
            }
        };
        reader.readAsText(file);
    }
  };

  const handleReset = () => {
      if (confirm("Isso apagará todas as configurações locais e restaurará os agentes originais. Continuar?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-200">
      <div className="w-1/3 border-r border-gray-800 bg-gray-900/30 overflow-y-auto flex flex-col justify-between">
        <div className="p-4 space-y-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Icons.Users /> Agentes</h2>
            {agents.map(agent => (
                <button key={agent.id} onClick={() => setSelectedAgentId(agent.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${selectedAgentId === agent.id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50'}`}>
                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full" />
                <div><div className="font-medium text-sm">{agent.name}</div><div className="text-xs text-gray-500">{agent.role}</div></div>
                </button>
            ))}
        </div>
        <div className="p-4 border-t border-gray-800">
            <button onClick={handleReset} className="w-full py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded flex items-center justify-center gap-2 hover:bg-red-900/50"><Icons.Trash /> Resetar Fábrica</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        {selectedAgent && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
               <img src={selectedAgent.avatar} className="w-20 h-20 rounded-full border-4 border-gray-800 shadow-xl" />
               <div><h1 className="text-2xl font-bold">{selectedAgent.name}</h1><p className="text-gray-400 text-sm">{selectedAgent.description}</p></div>
            </div>
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary-400 flex items-center gap-2"><Icons.Attach /> Conhecimento</h3>
                    <label className="cursor-pointer bg-primary-600 px-3 py-1 rounded text-sm font-bold text-white hover:bg-primary-500">
                        {isInjecting ? 'Carregando...' : 'Adicionar Arquivo'}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isInjecting} />
                    </label>
                </div>
                <div className="space-y-2">
                    {selectedAgent.files?.map(f => (
                        <div key={f.id} className="bg-gray-800 p-2 rounded flex justify-between items-center border border-gray-700">
                            <span className="text-sm">{f.name}</span>
                            <button onClick={() => handleUpdate('files', selectedAgent.files.filter(x => x.id !== f.id))}><Icons.Trash /></button>
                        </div>
                    ))}
                    {(!selectedAgent.files || selectedAgent.files.length === 0) && <p className="text-gray-500 text-sm italic">Nenhum conhecimento injetado.</p>}
                </div>
            </div>
            <textarea value={selectedAgent.systemInstruction} onChange={(e) => handleUpdate('systemInstruction', e.target.value)} className="w-full h-64 bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm font-mono focus:border-primary-500 outline-none" placeholder="Instruções do sistema..." />
          </div>
        )}
      </div>
    </div>
  );
};