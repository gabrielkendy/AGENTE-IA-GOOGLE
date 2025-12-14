import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Agent, ChatMessage, DriveFile, Task } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const formatHistory = (history: ChatMessage[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.senderName ? `[${msg.senderName}]: ${msg.text}` : msg.text }],
  }));
};

const buildContext = (agent: Agent, globalFiles: DriveFile[]) => {
  let context = `${agent.systemInstruction}\n\n`;
  if (agent.files && agent.files.length > 0) {
    context += `=== BASE DE CONHECIMENTO ESPECIALIZADA (PRIORIDADE ALTA) ===\n`;
    agent.files.forEach(file => {
      context += `--- ARQUIVO: ${file.name} (${file.type}) ---\n${file.content}\n\n`;
    });
    context += `=== FIM DA BASE ESPECIALIZADA ===\n\n`;
  }
  if (globalFiles.length > 0) {
    context += `=== BASE DE CONHECIMENTO DA EMPRESA (GLOBAL) ===\n`;
    globalFiles.forEach(file => {
      context += `--- FONTE: ${file.name} (Tipo: ${file.type} | Origem: ${file.source}) ---\n${file.content}\n\n`;
    });
    context += `=== FIM DA BASE GLOBAL ===\n`;
  }
  return context;
};

export const streamChatResponse = async (
  agent: Agent,
  history: ChatMessage[],
  newMessage: string,
  globalDriveFiles: DriveFile[],
  onChunk: (text: string) => void
) => {
  try {
    const ai = getClient();
    const chat: Chat = ai.chats.create({
      model: agent.model,
      config: {
        systemInstruction: buildContext(agent, globalDriveFiles),
        temperature: 0.7, 
      },
      history: formatHistory(history),
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    for await (const chunk of result) {
       const c = chunk as GenerateContentResponse;
       if (c.text) onChunk(c.text);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk(`\n\n[ERRO: Falha ao processar com o modelo. Verifique a API Key.]`);
    throw error;
  }
};

export const enhanceBriefing = async (currentBrief: string): Promise<string> => {
    if (!currentBrief.trim()) return "";
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Melhore o seguinte briefing de tarefa para que fique mais claro, acionável e profissional: "${currentBrief}"`,
    });
    return response.text || currentBrief;
};

export const generateImage = async (
  prompt: string,
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
  aspectRatio: string,
  referenceImageBase64?: string
): Promise<string> => {
    const ai = getClient();
    const parts: any[] = [];
    if (referenceImageBase64) {
        const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
        parts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
    }
    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any,
                imageSize: model === 'gemini-3-pro-image-preview' ? '1K' : undefined
            }
        }
    });
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Nenhuma imagem foi gerada.");
};

export const generateVideo = async (prompt: string, imageInputBase64?: string): Promise<string> => {
    const ai = getClient();
    let operation;
    const model = 'veo-3.1-fast-generate-preview';
    const config = { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' };

    if (imageInputBase64) {
        const cleanBase64 = imageInputBase64.split(',')[1] || imageInputBase64;
        operation = await ai.models.generateVideos({
            model: model, prompt: prompt,
            image: { imageBytes: cleanBase64, mimeType: 'image/png' },
            config: config as any
        });
    } else {
        operation = await ai.models.generateVideos({ model: model, prompt: prompt, config: config as any });
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Falha ao gerar vídeo.");
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
};

export const distributeBacklogTasks = async (tasks: Task[], agents: Agent[]): Promise<{ taskId: string, agentId: string, reason: string }[]> => {
    const ai = getClient();
    const prompt = `Distribua estas tarefas (${JSON.stringify(tasks.map(t => ({id: t.id, title: t.title})))} para estes agentes (${JSON.stringify(agents.map(a => ({id: a.id, role: a.role})))}. Retorne JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        taskId: { type: Type.STRING },
                        agentId: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    }
                }
            }
        }
    });
    try {
        return JSON.parse(response.text || "[]");
    } catch (e) { return []; }
}