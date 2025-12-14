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

export type FileSource = 'upload' | 'gdrive' | 'gmail' | 'sheets' | 'docs';

export interface DriveFile {
  id: string;
  name: string;
  content: string; // Extracted text content
  type: 'text' | 'csv' | 'json' | 'pdf' | 'email' | 'doc' | 'sheet';
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
  files: DriveFile[]; // Knowledge base specific to this agent
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  senderName?: string; // If model, which agent sent it
  isThinking?: boolean;
}

// Media Studio Types
export type MediaType = 'image' | 'video';

export interface GeneratedMedia {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp: Date;
  aspectRatio?: string;
  modelUsed: string;
  refImage?: string; // Base64 of reference image if used
}
