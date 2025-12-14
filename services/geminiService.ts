import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Agent, ChatMessage, DriveFile } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// Map history to the format Gemini expects (skipping 'id' and handling formatting)
const formatHistory = (history: ChatMessage[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.senderName ? `[${msg.senderName}]: ${msg.text}` : msg.text }],
  }));
};

// Build the system instruction by combining Agent persona + Global Drive Knowledge + Agent Specific Files
const buildContext = (agent: Agent, globalFiles: DriveFile[]) => {
  let context = `${agent.systemInstruction}\n\n`;
  
  // 1. Agent Specific Knowledge (Higher Priority)
  if (agent.files && agent.files.length > 0) {
    context += `=== BASE DE CONHECIMENTO ESPECIALIZADA (PRIORIDADE ALTA) ===\n`;
    context += `Estes arquivos são específicos para o seu treinamento e função. Use-os como referência principal:\n\n`;
    agent.files.forEach(file => {
      context += `--- ARQUIVO: ${file.name} (${file.type}) ---\n${file.content}\n\n`;
    });
    context += `=== FIM DA BASE ESPECIALIZADA ===\n\n`;
  }

  // 2. Global Knowledge Base
  if (globalFiles.length > 0) {
    context += `=== BASE DE CONHECIMENTO DA EMPRESA (GLOBAL) ===\n`;
    context += `Informações gerais da empresa disponíveis para todo o time:\n\n`;
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
    
    // Create a chat session using the AGENT'S SPECIFIC MODEL
    const chat: Chat = ai.chats.create({
      model: agent.model, // Uses the model selected in configuration
      config: {
        systemInstruction: buildContext(agent, globalDriveFiles),
        temperature: 0.7, 
      },
      history: formatHistory(history),
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
       const c = chunk as GenerateContentResponse;
       if (c.text) {
         onChunk(c.text);
       }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk(`\n\n[ERRO: Falha ao processar com o modelo ${agent.model}. Verifique a API Key.]`);
    throw error;
  }
};

/**
 * Generate Image using Gemini 2.5 Flash Image or 3 Pro Image
 */
export const generateImage = async (
  prompt: string,
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
  aspectRatio: string,
  referenceImageBase64?: string
): Promise<string> => {
    const ai = getClient();
    
    const parts: any[] = [];
    
    // Add reference image if exists
    if (referenceImageBase64) {
        // Strip data:image/png;base64, prefix if present
        const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
        parts.push({
            inlineData: {
                mimeType: 'image/png', // Assuming PNG/JPEG for simplicity
                data: cleanBase64
            }
        });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any, // "1:1", "16:9", etc.
                imageSize: model === 'gemini-3-pro-image-preview' ? '1K' : undefined
            }
        }
    });

    // Extract image from parts
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("Nenhuma imagem foi gerada. O modelo retornou apenas texto ou falhou.");
};

/**
 * Generate Video using Veo
 */
export const generateVideo = async (
    prompt: string,
    imageInputBase64?: string
): Promise<string> => {
    // Note: Veo requires the user to select their own key via window.aistudio.openSelectKey() in a real environment.
    // We assume the key is passed via process.env.API_KEY for this logic, but in browser context, check instructions.
    
    const ai = getClient();
    let operation;

    const model = 'veo-3.1-fast-generate-preview';

    if (imageInputBase64) {
        // Image-to-Video
        const cleanBase64 = imageInputBase64.split(',')[1] || imageInputBase64;
        operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/png'
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9' // Defaulting for simplicity
            }
        });
    } else {
        // Text-to-Video
        operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });
    }

    // Polling loop
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
        throw new Error("Falha ao gerar vídeo: URI não encontrado.");
    }

    // We need to fetch the bytes because the URI requires auth usually, 
    // or specifically for the SDK, we might need to proxy or use the key.
    // The instructions say: fetch(`${downloadLink}&key=${process.env.API_KEY}`)
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
};
