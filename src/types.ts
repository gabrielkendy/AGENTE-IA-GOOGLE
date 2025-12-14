export enum AgentRole {
  MANAGER = 'Gestor',
  PLANNER = 'Planejador',
  CAROUSEL = 'Criador de Carrossel',
  SCRIPT = 'Roteirista',
  POST = 'Criador de Post',
  CAPTION = 'Criador de Legenda',
  SPREADSHEET = 'Editor de Planilha',
}

export type GeminiModelType = 
  | 'gemini-2.5-flash' 
  | 'gemini-2.5-flash-lite-latest' 
  | 'gemini-3-pro-preview';

export type FileSource = 'upload' | 'gdrive' | 'gmail' | 'sheets' | 'docs' | 'github';

export interface DriveFile {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'csv' | 'json' | 'pdf' | 'email' | 'doc' | 'sheet' | 'md';
  source: FileSource;
  lastModified: Date;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  model: GeminiModelType;
  systemInstruction: string;
  description: string;
  files: DriveFile[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  senderName?: string;
  isThinking?: boolean;
}

export interface TeamMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    timestamp: Date;
    read: boolean;
}

export type MediaType = 'image' | 'video';

export interface GeneratedMedia {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp: Date;
  aspectRatio?: string;
  modelUsed: string;
  refImage?: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'scheduled' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SocialChannel = 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'blog';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string; 
  channel?: SocialChannel;
  mediaUrl?: string; 
  scheduledDate?: Date;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  clientName?: string;
  clientEmail?: string;
  createdAt: Date;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'email';
    read: boolean;
    timestamp: Date;
}