import React, { useState } from 'react';
import { GeneratedMedia } from '../types';
import { generateImage, generateVideo } from '../services/geminiService';
import { Icons } from './Icon';

interface MediaStudioProps {
  mediaList: GeneratedMedia[];
  setMediaList: React.Dispatch<React.SetStateAction<GeneratedMedia[]>>;
  onCreateTask?: (media: GeneratedMedia) => void;
}

export const MediaStudio: React.FC<MediaStudioProps> = ({ mediaList, setMediaList, onCreateTask }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'image' | 'video'>('image');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
        const url = mode === 'image' 
            ? await generateImage(prompt, 'gemini-2.5-flash-image', '1:1') 
            : await generateVideo(prompt);
        
        setMediaList(prev => [{ id: Date.now().toString(), type: mode, url, prompt, timestamp: new Date(), modelUsed: 'gemini' }, ...prev]);
    } catch (e) { alert((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-200">
        <div className="w-1/3 border-r border-gray-800 bg-gray-900/50 p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Icons.Wand /> Estúdio Criativo</h2>
            <div className="flex gap-2">
                <button onClick={() => setMode('image')} className={`flex-1 py-2 rounded ${mode === 'image' ? 'bg-primary-600' : 'bg-gray-800'}`}>Imagem</button>
                <button onClick={() => setMode('video')} className={`flex-1 py-2 rounded ${mode === 'video' ? 'bg-primary-600' : 'bg-gray-800'}`}>Vídeo</button>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Descreva sua ideia..." className="w-full h-32 bg-gray-800 rounded p-3 text-sm resize-none outline-none" />
            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded font-bold">{loading ? 'Gerando...' : 'Gerar'}</button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto grid grid-cols-2 gap-6 content-start">
            {mediaList.map(media => (
                <div key={media.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
                    <div className="aspect-square bg-black flex items-center justify-center">
                        {media.type === 'image' ? <img src={media.url} className="h-full w-full object-contain" /> : <video src={media.url} controls className="h-full w-full" />}
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-xs truncate max-w-[150px]">{media.prompt}</span>
                        <div className="flex gap-2">
                             {onCreateTask && <button onClick={() => onCreateTask(media)} className="p-2 bg-blue-900/30 text-blue-400 rounded"><Icons.Board /></button>}
                             <a href={media.url} download className="p-2 bg-gray-800 text-gray-400 rounded"><Icons.Download /></a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};