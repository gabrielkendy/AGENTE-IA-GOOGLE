import React, { useState } from 'react';
import { Agent, DriveFile, AgentRole, GeneratedMedia } from './types';
import { DEFAULT_AGENTS } from './constants';
import { ChatWindow } from './components/ChatWindow';
import { AgentConfig } from './components/AgentConfig';
import { DriveConnect } from './components/DriveConnect';
import { MediaStudio } from './components/MediaStudio';
import { Icons } from './components/Icon';

enum View {
  CHAT = 'chat',
  CONFIG = 'config',
  DRIVE = 'drive',
  MEDIA = 'media',
}

// Virtual Agent for Team View (acts as a placeholder in state)
const TEAM_AGENT: Agent = {
    id: 'team-general',
    name: 'Time Completo',
    role: AgentRole.MANAGER, // Default role for team view is manager
    avatar: '', // Handled in UI
    model: 'gemini-3-pro-preview',
    systemInstruction: '',
    description: 'Canal geral para todo o time',
    files: []
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.CHAT);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  
  // Simulated Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([
    {
      id: 'demo-1',
      name: 'Tom_de_Voz_Marca.txt',
      type: 'text',
      source: 'gdrive',
      lastModified: new Date(),
      content: 'A marca "TechFlow" deve ter um tom inovador, otimista e acessível. Evite jargões excessivamente técnicos. Nosso público são empreendedores digitais entre 25-40 anos. Sempre termine os posts com uma pergunta para engajar.'
    }
  ]);

  // Media Gallery State
  const [mediaList, setMediaList] = useState<GeneratedMedia[]>([]);

  // Determine active agent. If ID is team, return TEAM_AGENT placeholder.
  const activeAgent = activeAgentId === 'team-general' 
      ? TEAM_AGENT 
      : (agents.find(a => a.id === activeAgentId) || agents[0]);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
              AI
            </div>
            <span className="ml-3 font-bold text-lg tracking-tight hidden lg:block">Content Team</span>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveView(View.CHAT)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === View.CHAT 
                  ? 'bg-primary-600/10 text-primary-400 font-medium' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icons.Chat />
              <span className="hidden lg:block">Chat com Time</span>
            </button>

            <button
              onClick={() => setActiveView(View.CONFIG)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === View.CONFIG
                  ? 'bg-primary-600/10 text-primary-400 font-medium' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icons.Users />
              <span className="hidden lg:block">Agentes</span>
            </button>

            <button
              onClick={() => setActiveView(View.DRIVE)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === View.DRIVE
                  ? 'bg-primary-600/10 text-primary-400 font-medium' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icons.Drive />
              <span className="hidden lg:block">Conhecimento</span>
            </button>

            <div className="pt-4 mt-4 border-t border-gray-800">
                <button
                onClick={() => setActiveView(View.MEDIA)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeView === View.MEDIA
                    ? 'bg-primary-600/10 text-primary-400 font-medium' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
                >
                <Icons.Wand />
                <span className="hidden lg:block">Estúdio Criativo</span>
                </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
             <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    USR
                </div>
                <div className="hidden lg:block">
                    <div className="text-xs font-medium text-gray-200">Usuário Pro</div>
                    <div className="text-[10px] text-gray-500">user@example.com</div>
                </div>
             </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        {activeView === View.CHAT && (
          <ChatWindow 
            activeAgent={activeAgent}
            allAgents={agents}
            onChangeAgent={setActiveAgentId}
            driveFiles={driveFiles}
          />
        )}
        
        {activeView === View.CONFIG && (
          <AgentConfig 
            agents={agents} 
            setAgents={setAgents} 
          />
        )}

        {activeView === View.DRIVE && (
          <DriveConnect 
            files={driveFiles}
            setFiles={setDriveFiles}
          />
        )}

        {activeView === View.MEDIA && (
          <MediaStudio 
            mediaList={mediaList}
            setMediaList={setMediaList}
          />
        )}
      </main>
    </div>
  );
};

export default App;
