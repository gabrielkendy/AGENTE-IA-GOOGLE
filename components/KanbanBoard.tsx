import React, { useState, useRef } from 'react';
import { Task, TaskStatus, Agent, SocialChannel, Notification } from '../types';
import { Icons } from './Icon';
import { distributeBacklogTasks, enhanceBriefing } from '../services/geminiService';

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  agents: Agent[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'email') => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Pauta / Ideias', color: 'bg-gray-800' },
  { id: 'todo', title: 'Conteúdo (Em Produção)', color: 'bg-blue-900/10' },
  { id: 'review', title: 'Aprovação Interna', color: 'bg-yellow-900/10' },
  { id: 'scheduled', title: 'Aguardando Cliente', color: 'bg-orange-900/10' },
  { id: 'done', title: 'Aprovado / Publicado', color: 'bg-green-900/10' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    tasks, setTasks, agents, notifications, setNotifications, addNotification 
}) => {
  const [isDistributing, setIsDistributing] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Create Modal State (Wizard)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({
      channel: 'instagram',
      title: '',
      description: '',
      assignedAgentId: '',
      priority: 'medium',
      clientName: '',
      clientEmail: '',
      mediaUrl: ''
  });
  const [isEnhancingBrief, setIsEnhancingBrief] = useState(false);

  // Filters
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Task Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailTab, setDetailTab] = useState<'internal' | 'client_preview'>('internal');

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const getAgent = (id?: string) => agents.find(a => a.id === id);

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
      if (filterAgent !== 'all' && task.assignedAgentId !== filterAgent) return false;
      if (filterChannel !== 'all' && task.channel !== filterChannel) return false;
      return true;
  });

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      // Invisible drag image trick or styling could go here
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();
      setIsDragging(false);
      if (draggedTaskId) {
          const task = tasks.find(t => t.id === draggedTaskId);
          if (task && task.status !== targetStatus) {
              setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
              // Optional: Add notification for status change via drag
              // addNotification('Status Atualizado', `Demanda movida para ${COLUMNS.find(c => c.id === targetStatus)?.title}`, 'info');
          }
      }
      setDraggedTaskId(null);
  };

  // --- File Upload Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const base64 = event.target.result as string;
                  if (isEditMode && selectedTask) {
                      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, mediaUrl: base64 } : t));
                      setSelectedTask(prev => prev ? { ...prev, mediaUrl: base64 } : null);
                      addNotification('Mídia Atualizada', 'Nova imagem anexada à tarefa.', 'success');
                  } else {
                      setNewTaskData(prev => ({ ...prev, mediaUrl: base64 }));
                  }
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Task Operations ---
  const handleCreateTask = () => {
      if (!newTaskData.title) return;
      
      const newTask: Task = {
          id: Date.now().toString(),
          title: newTaskData.title!,
          description: newTaskData.description || '',
          status: 'backlog',
          priority: newTaskData.priority || 'medium',
          approvalStatus: 'pending',
          channel: newTaskData.channel,
          assignedAgentId: newTaskData.assignedAgentId,
          scheduledDate: newTaskData.scheduledDate,
          clientName: newTaskData.clientName || 'Cliente Padrão',
          clientEmail: newTaskData.clientEmail || 'aprovador@cliente.com',
          createdAt: new Date(),
          mediaUrl: newTaskData.mediaUrl
      };
      
      setTasks(prev => [...prev, newTask]);
      addNotification("Demanda Criada", `"${newTask.title}" adicionada para ${newTask.clientName}.`, 'success');
      
      // Reset
      setShowCreateModal(false);
      setCreateStep(1);
      setNewTaskData({ channel: 'instagram', priority: 'medium', clientName: '', clientEmail: '', mediaUrl: '' });
  };

  const handleApproval = (taskId: string, status: 'approved' | 'rejected') => {
      const task = tasks.find(t => t.id === taskId);
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              return {
                  ...t,
                  approvalStatus: status,
                  status: status === 'approved' ? 'done' : 'todo'
              };
          }
          return t;
      }));
      if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null); 
      }
      
      if (status === 'approved') {
          addNotification('Aprovado pelo Cliente', `A demanda "${task?.title}" foi aprovada e movida para publicação.`, 'success');
          addNotification('Email Enviado', `Confirmação de publicação enviada para ${task?.clientEmail}`, 'email');
      } else {
          addNotification('Ajustes Solicitados', `Cliente solicitou revisão na demanda "${task?.title}".`, 'warning');
          addNotification('Email Recebido', `Feedback detalhado de ${task?.clientName} recebido.`, 'email');
      }
  };

  const handleSmartDistribute = async () => {
      const backlogTasks = tasks.filter(t => t.status === 'backlog');
      if (backlogTasks.length === 0) return;

      setIsDistributing(true);
      try {
          const assignments = await distributeBacklogTasks(backlogTasks, agents);
          let count = 0;
          setTasks(prev => prev.map(task => {
              const match = assignments.find(a => a.taskId === task.id);
              if (match && task.status === 'backlog') {
                  count++;
                  return {
                      ...task,
                      assignedAgentId: match.agentId,
                      description: match.reason,
                      status: 'todo'
                  };
              }
              return task;
          }));
          addNotification('Distribuição Concluída', `${count} tarefas foram atribuídas aos agentes.`, 'success');
      } catch (error) {
          console.error(error);
          addNotification('Erro', 'Falha na distribuição automática.', 'warning');
      } finally {
          setIsDistributing(false);
      }
  };

  const handleEnhanceBrief = async () => {
      if (!newTaskData.description) return;
      setIsEnhancingBrief(true);
      try {
          const betterBrief = await enhanceBriefing(newTaskData.description);
          setNewTaskData(prev => ({ ...prev, description: betterBrief }));
      } finally {
          setIsEnhancingBrief(false);
      }
  };

  const generateApprovalLink = () => {
      if (!selectedTask) return;
      const token = Math.random().toString(36).substring(7);
      const url = `https://app.content-team.ai/approve/${selectedTask.id}?token=${token}&client=${encodeURIComponent(selectedTask.clientName || '')}`;
      
      alert(`LINK GERADO (Simulação):\n\n${url}\n\nEste link mostraria a tela de aprovação externa simplificada para o cliente.`);
      
      addNotification("Link Gerado", "Link de aprovação externo copiado.", "info");
      
      setTimeout(() => {
           addNotification("Email Enviado", `Solicitação de aprovação enviada para ${selectedTask.clientEmail}`, 'email');
      }, 1000);
  };

  const markNotificationsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setShowNotificationPanel(false);
  };

  const getChannelIcon = (channel?: SocialChannel) => {
      switch(channel) {
          case 'instagram': return <Icons.Instagram />;
          case 'linkedin': return <Icons.Linkedin />;
          default: return <span className="text-[10px] font-bold">WEB</span>;
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 overflow-hidden relative">
        {/* Header with Filters */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Icons.Board /> Workflow
                </h2>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{tasks.length} demandas</span>
                    <span>•</span>
                    <span className="text-green-400">{tasks.filter(t => t.approvalStatus === 'approved').length} aprovadas</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
                    <div className="px-2 text-gray-500"><Icons.Filter /></div>
                    <select 
                        className="bg-transparent text-xs text-gray-300 outline-none p-1"
                        value={filterChannel}
                        onChange={e => setFilterChannel(e.target.value)}
                    >
                        <option value="all">Todos Canais</option>
                        <option value="instagram">Instagram</option>
                        <option value="linkedin">LinkedIn</option>
                    </select>
                    <div className="w-px h-4 bg-gray-700"></div>
                    <select 
                        className="bg-transparent text-xs text-gray-300 outline-none p-1"
                        value={filterAgent}
                        onChange={e => setFilterAgent(e.target.value)}
                    >
                        <option value="all">Todos Agentes</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                <div className="h-6 w-px bg-gray-700 mx-1"></div>

                <div className="relative">
                    <button 
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                        className="p-2 hover:bg-gray-800 rounded-full text-gray-400 relative"
                    >
                        <Icons.Bell />
                        {notifications.some(n => !n.read) && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></div>
                        )}
                    </button>
                    
                    {showNotificationPanel && (
                        <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-850">
                                <span className="font-bold text-sm">Notificações</span>
                                <button onClick={markNotificationsRead} className="text-xs text-primary-400 hover:text-primary-300">Marcar lidas</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-500">Nenhuma notificação recente.</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 ${!notif.read ? 'bg-gray-800/50' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    {notif.type === 'email' && <span className="text-blue-400"><Icons.Mail /></span>}
                                                    <span className={`text-xs font-bold ${
                                                        notif.type === 'success' ? 'text-green-400' : 
                                                        notif.type === 'warning' ? 'text-yellow-400' : 
                                                        notif.type === 'email' ? 'text-blue-300' : 'text-gray-400'
                                                    }`}>{notif.title}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-600">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-xs text-gray-300 leading-snug ml-6">{notif.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary-900/20"
                >
                    <Icons.Plus /> Nova Demanda
                </button>
            </div>
        </div>

        {/* Board with Drag & Drop */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-gray-950">
             <div className="flex h-full gap-5 min-w-[1400px]">
                 {COLUMNS.map(col => {
                     const colTasks = filteredTasks.filter(t => t.status === col.id);
                     
                     return (
                         <div 
                            key={col.id} 
                            className="flex flex-col w-[300px] h-full"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                         >
                             <div className={`p-3 rounded-t-lg font-bold text-sm flex justify-between items-center border-b-2 border-gray-700/50 ${col.color.replace('/10', '/20')}`}>
                                 <span className="flex items-center gap-2">
                                     {col.title}
                                 </span>
                                 <span className="bg-gray-800/80 px-2 py-0.5 rounded-full text-[10px] text-gray-400">
                                     {colTasks.length}
                                 </span>
                             </div>

                             <div className={`flex-1 p-2 space-y-3 overflow-y-auto rounded-b-lg bg-gray-900/20 border-x border-b border-gray-800/50 scrollbar-thin transition-colors ${isDragging ? 'bg-gray-900/40 border-dashed border-gray-700' : ''}`}>
                                 {colTasks.map(task => {
                                     const agent = getAgent(task.assignedAgentId);
                                     
                                     return (
                                         <div 
                                            key={task.id} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            className={`group bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-50' : 'opacity-100'}`}
                                         >
                                             {/* Header */}
                                             <div className="flex justify-between items-center p-3 border-b border-gray-700/50 bg-gray-800/50">
                                                 <div className="flex items-center gap-2 text-gray-400">
                                                     {getChannelIcon(task.channel)}
                                                     <span className="text-[10px] font-medium uppercase tracking-wider truncate max-w-[80px]">{task.clientName || 'Cliente'}</span>
                                                 </div>
                                                 {task.scheduledDate && (
                                                     <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                         <Icons.Clock />
                                                         {new Date(task.scheduledDate).toLocaleDateString()}
                                                     </div>
                                                 )}
                                             </div>

                                             {/* Body */}
                                             <div className="p-3 cursor-pointer" onClick={() => { setSelectedTask(task); setDetailTab('internal'); }}>
                                                 {task.mediaUrl && (
                                                     <div className="mb-3 rounded-md overflow-hidden h-32 bg-gray-900 flex items-center justify-center relative">
                                                         {task.mediaUrl.startsWith('data:image') || task.mediaUrl.startsWith('http') ? (
                                                            <img src={task.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                                         ) : (
                                                             <span className="text-xs text-gray-600">Mídia Indisponível</span>
                                                         )}
                                                     </div>
                                                 )}
                                                 
                                                 <h3 className="font-semibold text-sm text-gray-200 leading-snug mb-1 hover:text-primary-400 transition-colors">
                                                     {task.title}
                                                 </h3>
                                                 
                                                 <div className="flex items-center justify-between mt-3">
                                                     <div className="flex items-center gap-1.5">
                                                         {agent ? (
                                                             <img src={agent.avatar} className="w-5 h-5 rounded-full border border-gray-600" title={agent.name} />
                                                         ) : (
                                                             <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[8px] text-gray-400">?</div>
                                                         )}
                                                         <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                                             {agent ? agent.name.split(' ')[0] : 'Sem Resp.'}
                                                         </span>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>

        {/* CREATE TASK MODAL */}
        {showCreateModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col h-[650px] overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-gray-800 bg-gray-850">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                             Nova Demanda - Passo {createStep}/3
                        </h2>
                        <div className="w-full bg-gray-800 h-1 mt-4 rounded-full">
                            <div className="bg-primary-500 h-1 rounded-full transition-all duration-300" style={{width: `${(createStep/3)*100}%`}}></div>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-8 overflow-y-auto">
                        {createStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">1. Dados do Cliente</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="text"
                                            className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none"
                                            placeholder="Nome da Marca/Cliente"
                                            value={newTaskData.clientName}
                                            onChange={e => setNewTaskData({...newTaskData, clientName: e.target.value})}
                                        />
                                        <input 
                                            type="email"
                                            className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none"
                                            placeholder="Email do Aprovador"
                                            value={newTaskData.clientEmail}
                                            onChange={e => setNewTaskData({...newTaskData, clientEmail: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">2. Título da Demanda</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-lg focus:border-primary-500 outline-none"
                                        placeholder="Ex: Carrossel sobre Dicas de IA"
                                        value={newTaskData.title}
                                        onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        {createStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">3. Canal</label>
                                    <div className="flex gap-4">
                                        {['instagram', 'linkedin', 'youtube', 'blog'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setNewTaskData({...newTaskData, channel: c as SocialChannel})}
                                                className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                                                    newTaskData.channel === c 
                                                    ? 'bg-primary-900/30 border-primary-500 text-primary-400' 
                                                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-750'
                                                }`}
                                            >
                                                {getChannelIcon(c as SocialChannel)}
                                                <span className="capitalize text-xs font-bold">{c}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Briefing Text */}
                                    <div className="col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-bold text-gray-400">4. Briefing / Descrição</label>
                                            <button 
                                                onClick={handleEnhanceBrief}
                                                disabled={isEnhancingBrief || !newTaskData.description}
                                                className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                            >
                                                <Icons.Sparkles /> {isEnhancingBrief ? 'Melhorando...' : 'Melhorar com IA'}
                                            </button>
                                        </div>
                                        <textarea 
                                            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm focus:border-primary-500 outline-none resize-none leading-relaxed"
                                            placeholder="Descreva o que precisa ser feito..."
                                            value={newTaskData.description}
                                            onChange={e => setNewTaskData({...newTaskData, description: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* Media Upload in Creation */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Anexos Visuais (Opcional)</label>
                                        <div 
                                            className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800 transition-colors cursor-pointer relative flex flex-col items-center justify-center gap-2 h-32"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {newTaskData.mediaUrl ? (
                                                <>
                                                    <img src={newTaskData.mediaUrl} className="h-full object-contain absolute inset-0 w-full opacity-50 hover:opacity-100 transition-opacity" />
                                                    <div className="z-10 bg-black/60 px-2 py-1 rounded text-xs text-white">Alterar Imagem</div>
                                                </>
                                            ) : (
                                                <>
                                                    <Icons.Attach />
                                                    <span className="text-xs text-gray-500">Clique para adicionar imagem/vídeo</span>
                                                </>
                                            )}
                                            <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*,video/*"
                                                onChange={(e) => handleFileUpload(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {createStep === 3 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">5. Atribuir Agente</label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {agents.map(agent => (
                                                <button
                                                    key={agent.id}
                                                    onClick={() => setNewTaskData({...newTaskData, assignedAgentId: agent.id})}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                        newTaskData.assignedAgentId === agent.id 
                                                        ? 'bg-primary-900/30 border-primary-500' 
                                                        : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                                                    }`}
                                                >
                                                    <img src={agent.avatar} className="w-8 h-8 rounded-full" />
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium">{agent.name}</div>
                                                        <div className="text-xs text-gray-500">{agent.role}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-2">6. Data de Publicação</label>
                                            <input 
                                                type="date" 
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none"
                                                onChange={e => setNewTaskData({...newTaskData, scheduledDate: e.target.valueAsDate || undefined})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-800 bg-gray-850 flex justify-between">
                        {createStep > 1 ? (
                            <button onClick={() => setCreateStep(s => s - 1)} className="text-gray-400 hover:text-white font-medium">Voltar</button>
                        ) : (
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white font-medium">Cancelar</button>
                        )}

                        {createStep < 3 ? (
                            <button 
                                onClick={() => setCreateStep(s => s + 1)} 
                                disabled={createStep === 1 && (!newTaskData.title || !newTaskData.clientName)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        ) : (
                            <button 
                                onClick={handleCreateTask}
                                className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary-900/20"
                            >
                                Criar Demanda
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* TASK DETAIL MODAL */}
        {selectedTask && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
                <div className="bg-gray-900 w-full max-w-4xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                    
                    {/* Modal Header */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-850">
                        <div className="flex gap-4 items-center">
                            <button 
                                onClick={() => setDetailTab('internal')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detailTab === 'internal' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                            >
                                Visão Interna
                            </button>
                            <button 
                                onClick={() => setDetailTab('client_preview')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${detailTab === 'client_preview' ? 'bg-orange-900/20 text-orange-400 border border-orange-500/30' : 'text-gray-500 hover:bg-gray-800'}`}
                            >
                                <Icons.Eye /> Visão do Cliente
                            </button>
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-white"><Icons.X /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
                        {/* INTERNAL VIEW */}
                        {detailTab === 'internal' && (
                            <div className="flex gap-8 h-full">
                                <div className="w-1/3 flex flex-col gap-4">
                                     <div 
                                        className="aspect-[9/16] bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden relative shadow-lg group cursor-pointer"
                                        onClick={() => editFileInputRef.current?.click()}
                                     >
                                        {selectedTask.mediaUrl ? (
                                            <>
                                                <img src={selectedTask.mediaUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <div className="text-white text-xs flex flex-col items-center gap-1">
                                                        <Icons.Photo /> Alterar Mídia
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-600 text-center group-hover:text-gray-400 transition-colors">
                                                <Icons.Photo /><br/>Adicionar Mídia
                                            </div>
                                        )}
                                        <input 
                                            ref={editFileInputRef}
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*,video/*"
                                            onChange={(e) => handleFileUpload(e, true)}
                                        />
                                     </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold mb-2">{selectedTask.title}</h1>
                                        <div className="flex gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Icons.Users /> {selectedTask.clientName}</span>
                                            <span>|</span>
                                            <span className="capitalize">{selectedTask.channel}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Legenda / Copy</h3>
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTask.description}</p>
                                    </div>

                                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Status Atual</h3>
                                            <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold border border-blue-900">
                                                {selectedTask.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Responsável</h3>
                                            <div className="flex items-center gap-2">
                                                {getAgent(selectedTask.assignedAgentId)?.avatar && <img src={getAgent(selectedTask.assignedAgentId)?.avatar} className="w-6 h-6 rounded-full" />}
                                                <span className="text-sm">{getAgent(selectedTask.assignedAgentId)?.name || 'Ninguém'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={generateApprovalLink}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Icons.Send /> Enviar para Aprovação Externa (Email)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CLIENT PREVIEW SIMULATION */}
                        {detailTab === 'client_preview' && (
                            <div className="h-full flex flex-col items-center justify-center">
                                <div className="bg-white text-gray-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">
                                    {/* Simulated Phone/Media View */}
                                    <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
                                         {selectedTask.mediaUrl ? (
                                            <img src={selectedTask.mediaUrl} className="max-h-full shadow-lg rounded" />
                                         ) : (
                                            <div className="text-gray-400">Mídia não carregada</div>
                                         )}
                                    </div>
                                    {/* Simulated Client Sidebar */}
                                    <div className="w-full md:w-1/2 p-8 flex flex-col">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 bg-gray-900 rounded-full"></div>
                                                <div>
                                                    <h3 className="font-bold text-sm">Agência Content Team</h3>
                                                    <p className="text-xs text-gray-500">Solicitação de Aprovação</p>
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-bold mb-4">{selectedTask.title}</h2>
                                            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-600 h-40 overflow-y-auto mb-4">
                                                {selectedTask.description}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Agendado para: {selectedTask.scheduledDate ? new Date(selectedTask.scheduledDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                            <button 
                                                onClick={() => handleApproval(selectedTask.id, 'rejected')}
                                                className="py-3 bg-red-50 text-red-600 font-bold rounded hover:bg-red-100 transition-colors"
                                            >
                                                Solicitar Ajuste
                                            </button>
                                            <button 
                                                onClick={() => handleApproval(selectedTask.id, 'approved')}
                                                className="py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors shadow-lg"
                                            >
                                                Aprovar
                                            </button>
                                        </div>
                                        <p className="text-center text-[10px] text-gray-400 mt-2">Simulação da tela que o cliente vê</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};