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
  addNotification: (t: string, m: string, tp: 'info' | 'success' | 'warning' | 'email') => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Pauta / Ideias', color: 'bg-gray-800' },
  { id: 'todo', title: 'Em Produção', color: 'bg-blue-900/10' },
  { id: 'review', title: 'Aprovação Interna', color: 'bg-yellow-900/10' },
  { id: 'scheduled', title: 'Aguardando Cliente', color: 'bg-orange-900/10' },
  { id: 'done', title: 'Concluído', color: 'bg-green-900/10' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    tasks, setTasks, agents, notifications, setNotifications, addNotification 
}) => {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();
      if (draggedTaskId) {
          setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
      }
      setDraggedTaskId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setNewTaskData(prev => ({ ...prev, mediaUrl: event.target?.result as string }));
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

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
      addNotification("Demanda Criada", `"${newTask.title}" adicionada.`, 'success');
      setShowCreateModal(false);
      setNewTaskData({ channel: 'instagram', priority: 'medium', clientName: '', clientEmail: '', mediaUrl: '' });
      setCreateStep(1);
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

  const handleDistribute = async () => {
      const backlogTasks = tasks.filter(t => t.status === 'backlog');
      if (backlogTasks.length === 0) return;
      try {
          const assignments = await distributeBacklogTasks(backlogTasks, agents);
          setTasks(prev => prev.map(task => {
              const match = assignments.find(a => a.taskId === task.id);
              return match ? { ...task, assignedAgentId: match.agentId, description: match.reason || task.description, status: 'todo' } : task;
          }));
          addNotification('Distribuição Concluída', `${assignments.length} tarefas atribuídas.`, 'success');
      } catch (error) {
          addNotification('Erro', 'Falha na distribuição automática.', 'warning');
      }
  };

  const getAgent = (id?: string) => agents.find(a => a.id === id);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 shadow-sm flex justify-between items-center z-10">
            <h2 className="text-xl font-bold flex items-center gap-2"><Icons.Board /> Workflow</h2>
            <div className="flex items-center gap-3">
                <button onClick={handleDistribute} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 border border-gray-700">IA Distribuir</button>
                <div className="relative">
                    <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 relative">
                        <Icons.Bell />
                        {notifications.some(n => !n.read) && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                    </button>
                    {showNotificationPanel && (
                        <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-850"><span className="font-bold text-sm">Notificações</span><button onClick={() => setNotifications(p => p.map(n => ({...n, read: true})))} className="text-xs text-primary-400">Marcar lidas</button></div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b border-gray-800 ${!n.read ? 'bg-gray-800/50' : ''}`}>
                                        <div className="text-xs font-bold mb-1">{n.title}</div><div className="text-xs text-gray-300">{n.message}</div>
                                    </div>
                                ))}
                                {notifications.length === 0 && <div className="p-4 text-center text-xs text-gray-500">Vazio.</div>}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium shadow-lg"><Icons.Plus /> Nova Demanda</button>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto p-6 flex gap-5 min-w-[1200px]">
             {COLUMNS.map(col => (
                 <div key={col.id} className="flex-none w-72 h-full flex flex-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                     <div className={`p-3 rounded-t-lg font-bold text-sm flex justify-between items-center border-b-2 border-gray-700/50 ${col.color.replace('/10', '/20')}`}>
                         <span>{col.title}</span><span className="bg-gray-800/80 px-2 py-0.5 rounded-full text-[10px] text-gray-400">{tasks.filter(t => t.status === col.id).length}</span>
                     </div>
                     <div className="flex-1 p-2 space-y-3 overflow-y-auto rounded-b-lg bg-gray-900/20 border-x border-b border-gray-800/50">
                         {tasks.filter(t => t.status === col.id).map(task => (
                             <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)} className={`bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm cursor-grab hover:border-gray-500 group ${draggedTaskId === task.id ? 'opacity-50' : ''}`}>
                                 {task.mediaUrl && <div className="mb-2 h-24 bg-black rounded flex items-center justify-center overflow-hidden"><img src={task.mediaUrl} className="h-full w-full object-cover" /></div>}
                                 <h3 className="font-semibold text-sm text-gray-200 leading-snug mb-1">{task.title}</h3>
                                 <div className="flex items-center gap-2 mt-2">
                                     {task.assignedAgentId && <img src={getAgent(task.assignedAgentId)?.avatar} className="w-5 h-5 rounded-full" title={getAgent(task.assignedAgentId)?.name} />}
                                     <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded capitalize">{task.channel}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}
        </div>

        {showCreateModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col h-[600px] overflow-hidden">
                    <div className="p-6 border-b border-gray-800 bg-gray-850"><h2 className="text-xl font-bold">Nova Demanda - Passo {createStep}/3</h2></div>
                    <div className="flex-1 p-8 overflow-y-auto space-y-6">
                        {createStep === 1 && (
                            <>
                                <div><label className="block text-sm font-bold text-gray-400 mb-2">Cliente</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm outline-none" placeholder="Nome do Cliente" value={newTaskData.clientName} onChange={e => setNewTaskData({...newTaskData, clientName: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-400 mb-2">Título</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-3 outline-none" placeholder="Título da Tarefa" value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} /></div>
                            </>
                        )}
                        {createStep === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Canal</label>
                                    <div className="flex gap-2">
                                        {['instagram', 'linkedin', 'youtube'].map(c => (<button key={c} onClick={() => setNewTaskData({...newTaskData, channel: c as SocialChannel})} className={`flex-1 p-2 rounded border ${newTaskData.channel === c ? 'bg-primary-900/50 border-primary-500' : 'bg-gray-800 border-gray-700'}`}>{c}</button>))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between"><label className="block text-sm font-bold text-gray-400 mb-2">Descrição</label><button onClick={handleEnhanceBrief} disabled={isEnhancingBrief || !newTaskData.description} className="text-xs text-purple-400">{isEnhancingBrief ? 'Melhorando...' : 'Melhorar com IA'}</button></div>
                                    <textarea className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-3 text-sm outline-none" value={newTaskData.description} onChange={e => setNewTaskData({...newTaskData, description: e.target.value})} />
                                </div>
                                <div><label className="block text-sm font-bold text-gray-400 mb-2">Mídia (Opcional)</label><div className="border border-dashed border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-800" onClick={() => fileInputRef.current?.click()}>{newTaskData.mediaUrl ? 'Imagem Selecionada' : 'Clique para adicionar imagem'}</div><input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} /></div>
                            </>
                        )}
                        {createStep === 3 && (
                            <div className="grid grid-cols-2 gap-4">
                                {agents.map(agent => (
                                    <button key={agent.id} onClick={() => setNewTaskData({...newTaskData, assignedAgentId: agent.id})} className={`flex items-center gap-3 p-3 rounded border text-left ${newTaskData.assignedAgentId === agent.id ? 'bg-primary-900/30 border-primary-500' : 'bg-gray-800 border-gray-700'}`}>
                                        <img src={agent.avatar} className="w-8 h-8 rounded-full" /><div><div className="text-sm font-medium">{agent.name}</div><div className="text-xs text-gray-500">{agent.role}</div></div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-800 flex justify-between">
                        <button onClick={() => createStep > 1 ? setCreateStep(s => s-1) : setShowCreateModal(false)} className="text-gray-400">Voltar</button>
                        <button onClick={() => createStep < 3 ? setCreateStep(s => s+1) : handleCreateTask()} disabled={createStep === 1 && !newTaskData.title} className="bg-primary-600 px-6 py-2 rounded text-white font-bold disabled:opacity-50">{createStep === 3 ? 'Criar' : 'Próximo'}</button>
                    </div>
                </div>
            </div>
        )}
        
        {selectedTask && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
                <div className="bg-gray-900 p-6 rounded-xl w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
                    <p className="text-gray-400 text-sm mb-4 whitespace-pre-wrap">{selectedTask.description}</p>
                    {selectedTask.mediaUrl && <img src={selectedTask.mediaUrl} className="w-full rounded mb-4 max-h-60 object-contain bg-black" />}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedTask(null)} className="px-4 py-2 bg-gray-800 rounded">Fechar</button>
                        <button className="px-4 py-2 bg-blue-600 rounded text-white">Aprovar (Simulação)</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};