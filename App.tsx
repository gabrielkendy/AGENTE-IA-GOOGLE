import React, { useState, useEffect } from 'react';
import { Agent, DriveFile, AgentRole, GeneratedMedia, Task, Notification, TeamMessage } from './types';
import { DEFAULT_AGENTS } from './constants';
import { ChatWindow } from './components/ChatWindow';
import { AgentConfig } from './components/AgentConfig';
import { DriveConnect } from './components/DriveConnect';
import { MediaStudio } from './components/MediaStudio';
import { KanbanBoard } from './components/KanbanBoard';
import { TeamInbox } from './components/TeamInbox';
import { FloatingChat } from './components/FloatingChat';
import { Icons } from './components/Icon';

enum View {
  CHAT = 'chat',
  KANBAN = 'kanban',
  CONFIG = 'config',
  DRIVE = 'drive',
  MEDIA = 'media',
  TEAM_INBOX = 'team_inbox'
}

const TEAM_AGENT: Agent = {
    id: 'team-general',
    name: 'Time Completo',
    role: AgentRole.MANAGER,
    avatar: '',
    model: 'gemini-3-pro-preview',
    systemInstruction: '',
    description: 'Canal geral para todo o time',
    files: []
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.CHAT);

  // Load Agents
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('agents');
    return saved ? JSON.parse(saved) : DEFAULT_AGENTS;
  });

  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  
  // Simulated Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([
    {
      id: 'demo-1',
      name: 'Tom_de_Voz_Marca.txt',
      type: 'text',
      source: 'gdrive',
      lastModified: new Date(),
      content: 'A marca "TechFlow" deve ter um tom inovador, otimista e acessível.'
    }
  ]);

  // Media Gallery State
  const [mediaList, setMediaList] = useState<GeneratedMedia[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Team Chat Messages
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([
      {
          id: 'msg-1',
          senderId: 'designer',
          senderName: 'Carol (Designer)',
          text: 'Oi pessoal! Subi os assets da campanha de Natal no Drive.',
          timestamp: new Date(Date.now() - 3600000),
          read: true
      },
      {
          id: 'msg-2',
          senderId: 'user',
          senderName: 'Você',
          text: 'Ótimo, Carol. Vou pedir para o Leo criar os roteiros.',
          timestamp: new Date(Date.now() - 3500000),
          read: true
      }
  ]);

  // Task / Kanban State
  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem('tasks');
      if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return parsed.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt),
                scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined
            }));
          } catch (e) {
            console.error("Failed to parse tasks", e);
            return [];
          }
      }
      return [
        {
            id: 'task-1',
            title: 'Reels: Tendências de IA 2025',
            description: 'Roteiro dinâmico mostrando 3 ferramentas novas.',
            status: 'review',
            priority: 'high',
            assignedAgentId: 'agent-4',
            createdAt: new Date(),
            channel: 'instagram',
            scheduledDate: new Date(Date.now() + 86400000),
            mediaUrl: 'https://picsum.photos/seed/ai-reels/400/700',
            clientName: 'TechStart',
            clientEmail: 'ceo@techstart.com'
        }
      ];
  });

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('tasks', JSON.stringify(tasks)); }, [tasks]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'email' = 'info') => {
      setNotifications(prev => [{
          id: Date.now().toString(),
          title,
          message,
          type,
          read: false,
          timestamp: new Date()
      }, ...prev]);
  };

  const createTaskFromMedia = (media: GeneratedMedia) => {
      const newTask: Task = {
          id: Date.now().toString(),
          title: `Post Visual: ${media.prompt.substring(0, 30)}...`,
          description: `Criar conteúdo baseado na mídia gerada: ${media.prompt}`,
          status: 'backlog',
          priority: 'medium',
          channel: 'instagram',
          mediaUrl: media.url,
          createdAt: new Date(),
          clientName: 'Cliente Novo',
          clientEmail: 'contato@cliente.com'
      };
      setTasks(prev => [...prev, newTask]);
      setActiveView(View.KANBAN);
      addNotification('Demanda Criada', 'Nova demanda criada a partir do estúdio.', 'success');
  };

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
            <button onClick={() => setActiveView(View.CHAT)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.CHAT ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Icons.Chat /> <span className="hidden lg:block">Chat IA</span>
            </button>

            <button onClick={() => setActiveView(View.TEAM_INBOX)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.TEAM_INBOX ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Icons.MessageCircle /> <span className="hidden lg:block">Inbox Equipe</span>
            </button>

            <button onClick={() => setActiveView(View.KANBAN)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.KANBAN ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Icons.Board />
              <div className="flex-1 flex items-center justify-between">
                  <span className="hidden lg:block">Workflow</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                      <span className="bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{notifications.filter(n => !n.read).length}</span>
                  )}
              </div>
            </button>

            <button onClick={() => setActiveView(View.CONFIG)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.CONFIG ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Icons.Users /> <span className="hidden lg:block">Agentes</span>
            </button>

            <button onClick={() => setActiveView(View.DRIVE)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.DRIVE ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Icons.Drive /> <span className="hidden lg:block">Conhecimento</span>
            </button>

            <div className="pt-4 mt-4 border-t border-gray-800">
                <button onClick={() => setActiveView(View.MEDIA)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === View.MEDIA ? 'bg-primary-600/10 text-primary-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
                <Icons.Wand /> <span className="hidden lg:block">Estúdio Criativo</span>
                </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
             <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">USR</div>
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
          <ChatWindow activeAgent={activeAgent} allAgents={agents} onChangeAgent={setActiveAgentId} driveFiles={driveFiles} />
        )}
        
        {activeView === View.KANBAN && (
          <KanbanBoard tasks={tasks} setTasks={setTasks} agents={agents} notifications={notifications} setNotifications={setNotifications} addNotification={addNotification} />
        )}

        {activeView === View.CONFIG && (
          <AgentConfig agents={agents} setAgents={setAgents} />
        )}

        {activeView === View.DRIVE && (
          <DriveConnect files={driveFiles} setFiles={setDriveFiles} />
        )}

        {activeView === View.MEDIA && (
          <MediaStudio mediaList={mediaList} setMediaList={setMediaList} onCreateTask={createTaskFromMedia} />
        )}

        {activeView === View.TEAM_INBOX && (
            <TeamInbox messages={teamMessages} setMessages={setTeamMessages} />
        )}

        {/* Floating Chat Widget - Visible on all screens except full Inbox */}
        {activeView !== View.TEAM_INBOX && (
            <FloatingChat messages={teamMessages} setMessages={setTeamMessages} />
        )}
      </main>
    </div>
  );
};

export default App;