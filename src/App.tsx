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

enum View { CHAT = 'chat', KANBAN = 'kanban', CONFIG = 'config', DRIVE = 'drive', MEDIA = 'media', TEAM_INBOX = 'team_inbox' }

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.CHAT);
  
  // Safely load Agents with error handling
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
        const saved = localStorage.getItem('agents');
        return saved ? JSON.parse(saved) : DEFAULT_AGENTS;
    } catch (e) {
        console.error("Erro ao carregar agentes do cache, resetando para padrão.", e);
        return DEFAULT_AGENTS;
    }
  });

  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  const [driveFiles, setFiles] = useState<DriveFile[]>([]);
  const [mediaList, setMediaList] = useState<GeneratedMedia[]>([]);
  
  // Safely load Tasks with error handling
  const [tasks, setTasks] = useState<Task[]>(() => {
      try {
          const saved = localStorage.getItem('tasks');
          if (saved) {
             const parsed = JSON.parse(saved);
             return parsed.map((t: any) => ({
                 ...t,
                 createdAt: new Date(t.createdAt),
                 scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined
             }));
          }
          return [];
      } catch (e) {
          console.error("Erro ao carregar tarefas do cache.", e);
          return [];
      }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);

  useEffect(() => { localStorage.setItem('agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('tasks', JSON.stringify(tasks)); }, [tasks]);

  const addNotification = (title: string, message: string, type: any) => setNotifications(p => [...p, { id: Date.now().toString(), title, message, type, read: false, timestamp: new Date() }]);
  
  const activeAgent = activeAgentId === 'team-general' ? { ...DEFAULT_AGENTS[0], id: 'team-general', name: 'Time Completo', role: AgentRole.MANAGER } : (agents.find(a => a.id === activeAgentId) || agents[0]);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      <aside className="w-20 lg:w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800 font-bold text-lg"><span className="text-primary-500 mr-2">AI</span> Team</div>
          <nav className="p-4 space-y-2">
            {[
              { id: View.CHAT, icon: Icons.Chat, label: 'Chat IA' },
              { id: View.KANBAN, icon: Icons.Board, label: 'Workflow' },
              { id: View.MEDIA, icon: Icons.Wand, label: 'Estúdio' },
              { id: View.DRIVE, icon: Icons.Drive, label: 'Arquivos' },
              { id: View.CONFIG, icon: Icons.Users, label: 'Agentes' },
              { id: View.TEAM_INBOX, icon: Icons.MessageCircle, label: 'Inbox' },
            ].map(item => (
                <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeView === item.id ? 'bg-primary-600/10 text-primary-400' : 'text-gray-400 hover:bg-gray-800'}`}>
                    <item.icon /> <span className="hidden lg:block">{item.label}</span>
                </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 h-full overflow-hidden relative">
        {activeView === View.CHAT && <ChatWindow activeAgent={activeAgent} allAgents={agents} onChangeAgent={setActiveAgentId} driveFiles={driveFiles} />}
        {activeView === View.KANBAN && <KanbanBoard tasks={tasks} setTasks={setTasks} agents={agents} notifications={notifications} setNotifications={setNotifications} addNotification={addNotification} />}
        {activeView === View.CONFIG && <AgentConfig agents={agents} setAgents={setAgents} />}
        {activeView === View.DRIVE && <DriveConnect files={driveFiles} setFiles={setFiles} />}
        {activeView === View.MEDIA && <MediaStudio mediaList={mediaList} setMediaList={setMediaList} onCreateTask={(m) => { setTasks(p => [...p, { id: Date.now().toString(), title: `Mídia: ${m.prompt}`, description: '', status: 'backlog', priority: 'medium', mediaUrl: m.url, createdAt: new Date() }]); setActiveView(View.KANBAN); }} />}
        {activeView === View.TEAM_INBOX && <TeamInbox messages={messages} setMessages={setMessages} />}
        {activeView !== View.TEAM_INBOX && <FloatingChat messages={messages} setMessages={setMessages} />}
      </main>
    </div>
  );
};
export default App;