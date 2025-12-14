import React, { useState } from 'react';
import { GeneratedMedia, MediaType } from '../types';
import { generateImage, generateVideo } from '../services/geminiService';
import { Icons } from './Icon';

interface MediaStudioProps {
  mediaList: GeneratedMedia[];
  setMediaList: React.Dispatch<React.SetStateAction<GeneratedMedia[]>>;
}

type StudioTab = 'image' | 'video' | 'gallery';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const MediaStudio: React.FC<MediaStudioProps> = ({ mediaList, setMediaList }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('image');
  
  // Image Gen State
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgModel, setImgModel] = useState<'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'>('gemini-2.5-flash-image');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Video Gen State
  const [vidPrompt, setVidPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGeneratingVid, setIsGeneratingVid] = useState(false);
  const [veoKeyStatus, setVeoKeyStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked');

  // Helper: File to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imgPrompt) return;
    setIsGeneratingImg(true);
    try {
        const url = await generateImage(imgPrompt, imgModel, aspectRatio, refImage || undefined);
        const newMedia: GeneratedMedia = {
            id: Date.now().toString(),
            type: 'image',
            url,
            prompt: imgPrompt,
            timestamp: new Date(),
            aspectRatio,
            modelUsed: imgModel,
            refImage: refImage || undefined
        };
        setMediaList(prev => [newMedia, ...prev]);
        setActiveTab('gallery');
    } catch (error) {
        alert("Erro ao gerar imagem: " + (error as Error).message);
    } finally {
        setIsGeneratingImg(false);
    }
  };

  const checkVeoKey = async () => {
    try {
        // @ts-ignore
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            // @ts-ignore
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                 // @ts-ignore
                 await window.aistudio.openSelectKey();
            }
            setVeoKeyStatus('valid');
        } else {
            // Fallback for environments where window.aistudio might not be injected but process.env is used
            setVeoKeyStatus('valid');
        }
    } catch (e) {
        console.error("Erro verificando chave Veo", e);
    }
  };

  const handleGenerateVideo = async () => {
    if (!vidPrompt) return;
    
    // Ensure key check
    if (veoKeyStatus === 'unchecked') {
        await checkVeoKey();
    }

    setIsGeneratingVid(true);
    try {
        const url = await generateVideo(vidPrompt, sourceImage || undefined);
        const newMedia: GeneratedMedia = {
            id: Date.now().toString(),
            type: 'video',
            url,
            prompt: vidPrompt,
            timestamp: new Date(),
            modelUsed: 'veo-3.1-fast-generate-preview',
            refImage: sourceImage || undefined
        };
        setMediaList(prev => [newMedia, ...prev]);
        setActiveTab('gallery');
    } catch (error) {
        alert("Erro ao gerar vídeo: " + (error as Error).message);
    } finally {
        setIsGeneratingVid(false);
    }
  };

  const sendToVideo = (imgUrl: string) => {
      setSourceImage(imgUrl);
      setActiveTab('video');
  };

  return (
    <div className="flex h-full bg-gray-950 text-gray-200">
        {/* Sidebar Controls */}
        <div className="w-1/3 lg:w-1/4 border-r border-gray-800 bg-gray-900/50 flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Icons.Wand /> Estúdio Criativo
                </h2>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => setActiveTab('image')}
                        className={`p-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'image' ? 'bg-primary-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <Icons.Photo /> Gerar Imagem (Gemini)
                    </button>
                    <button 
                        onClick={() => setActiveTab('video')}
                        className={`p-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'video' ? 'bg-primary-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <Icons.Film /> Gerar Vídeo (Veo)
                    </button>
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`p-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'gallery' ? 'bg-primary-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <Icons.Drive /> Galeria ({mediaList.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* IMAGE CONFIG */}
                {activeTab === 'image' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modelo</label>
                            <select 
                                value={imgModel}
                                onChange={(e) => setImgModel(e.target.value as any)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                            >
                                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Rápido)</option>
                                <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro (Alta Qualidade)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prompt (Descrição)</label>
                            <textarea 
                                value={imgPrompt}
                                onChange={(e) => setImgPrompt(e.target.value)}
                                placeholder="Descreva a imagem que você quer criar..."
                                className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Referência Visual (Opcional)</label>
                            <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800 transition-colors relative">
                                <input type="file" onChange={(e) => handleFileUpload(e, setRefImage)} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                {refImage ? (
                                    <img src={refImage} alt="Ref" className="h-20 mx-auto rounded object-cover" />
                                ) : (
                                    <div className="text-gray-500 text-xs">
                                        <Icons.Attach /> 
                                        <span className="block mt-1">Upload imagem de referência</span>
                                    </div>
                                )}
                            </div>
                            {refImage && <button onClick={() => setRefImage(null)} className="text-xs text-red-400 mt-1 hover:underline">Remover</button>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Formato (Aspect Ratio)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar) => (
                                    <button
                                        key={ar}
                                        onClick={() => setAspectRatio(ar as AspectRatio)}
                                        className={`p-2 text-xs rounded border ${aspectRatio === ar ? 'bg-primary-900/30 border-primary-500 text-primary-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {ar}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateImage}
                            disabled={!imgPrompt || isGeneratingImg}
                            className={`w-full py-3 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${isGeneratingImg ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white'}`}
                        >
                            {isGeneratingImg ? 'Criando...' : <><Icons.Wand /> Gerar Imagem</>}
                        </button>
                    </div>
                )}

                {/* VIDEO CONFIG */}
                {activeTab === 'video' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                            <h3 className="text-purple-400 font-bold text-sm flex items-center gap-2 mb-1"><Icons.Film /> Veo Video Gen</h3>
                            <p className="text-xs text-gray-400">Geração de vídeo de alta qualidade. Pode levar alguns minutos.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagem de Origem (Opcional)</label>
                            <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800 transition-colors relative">
                                <input type="file" onChange={(e) => handleFileUpload(e, setSourceImage)} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                {sourceImage ? (
                                    <img src={sourceImage} alt="Ref" className="h-32 mx-auto rounded object-contain" />
                                ) : (
                                    <div className="text-gray-500 text-xs py-4">
                                        <span className="block mb-1">Dê vida a uma imagem estática</span>
                                        <span className="text-[10px] text-gray-600">(Arraste ou clique)</span>
                                    </div>
                                )}
                            </div>
                            {sourceImage && <button onClick={() => setSourceImage(null)} className="text-xs text-red-400 mt-1 hover:underline">Remover</button>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prompt do Vídeo</label>
                            <textarea 
                                value={vidPrompt}
                                onChange={(e) => setVidPrompt(e.target.value)}
                                placeholder="O que acontece no vídeo? (Ex: Câmera lenta, zoom in, personagem sorrindo)"
                                className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-primary-500 outline-none resize-none"
                            />
                        </div>

                        <button
                            onClick={handleGenerateVideo}
                            disabled={!vidPrompt || isGeneratingVid}
                            className={`w-full py-3 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${isGeneratingVid ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'}`}
                        >
                            {isGeneratingVid ? 'Renderizando (aguarde)...' : <><Icons.Film /> Gerar Vídeo</>}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Preview Area / Gallery */}
        <div className="flex-1 bg-gray-950 p-8 overflow-y-auto">
            {activeTab === 'gallery' || mediaList.length > 0 ? (
                <div>
                     <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        {activeTab === 'gallery' ? 'Galeria de Mídia' : 'Resultado Recente'}
                     </h2>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Always show latest first */}
                        {mediaList.map((media) => (
                            <div key={media.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-600 transition-all shadow-lg">
                                <div className="aspect-video bg-gray-800 relative flex items-center justify-center overflow-hidden">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt="Generated" className="w-full h-full object-contain" />
                                    ) : (
                                        <video src={media.url} controls className="w-full h-full object-contain" />
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-gray-300">
                                        {media.type.toUpperCase()}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-300 line-clamp-2 mb-3" title={media.prompt}>
                                        {media.prompt}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-gray-500">{media.modelUsed}</span>
                                        <div className="flex gap-2">
                                            {media.type === 'image' && (
                                                <button 
                                                    onClick={() => sendToVideo(media.url)}
                                                    className="p-1.5 bg-purple-900/30 text-purple-400 rounded hover:bg-purple-900/50"
                                                    title="Transformar em Vídeo"
                                                >
                                                    <Icons.Film />
                                                </button>
                                            )}
                                            <a 
                                                href={media.url} 
                                                download={`generated-${media.id}.${media.type === 'image' ? 'png' : 'mp4'}`}
                                                className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
                                                title="Download"
                                            >
                                                <Icons.Download />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                    <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6">
                        <Icons.Wand />
                    </div>
                    <p className="text-lg">Sua tela de criação está vazia.</p>
                    <p className="text-sm">Use o painel lateral para gerar imagens ou vídeos incríveis.</p>
                </div>
            )}
        </div>
    </div>
  );
};
