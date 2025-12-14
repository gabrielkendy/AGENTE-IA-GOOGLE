import React, { useState } from 'react';
import { DriveFile, FileSource } from '../types';
import { Icons } from './Icon';

interface DriveConnectProps {
  files: DriveFile[];
  setFiles: React.Dispatch<React.SetStateAction<DriveFile[]>>;
}

type Tab = 'upload' | 'integrations';

export const DriveConnect: React.FC<DriveConnectProps> = ({ files, setFiles }) => {
  const [activeTab, setActiveTab] = useState<Tab>('integrations');
  const [dragActive, setDragActive] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // GitHub State
  const [githubRepo, setGithubRepo] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const file = e.dataTransfer.files[0];
       const fileType = file.name.split('.').pop()?.toLowerCase();
       
       if (['txt', 'md', 'csv', 'json'].includes(fileType || '')) {
           const reader = new FileReader();
           reader.onload = (event) => {
               if (event.target?.result) {
                   addFile(file.name, event.target.result as string, 'text', 'upload');
               }
           };
           reader.readAsText(file);
       } else if (fileType === 'pdf') {
           setTimeout(() => {
                addFile(file.name, `[SIMULAÇÃO: Conteúdo extraído do arquivo PDF '${file.name}'.]`, 'pdf', 'upload');
           }, 1000);
       } else {
           alert("Formato não suportado diretamente. Tente .txt, .md, .csv, .json ou .pdf");
       }
    }
  };
  
  const addFile = (name: string, content: string, type: DriveFile['type'], source: FileSource) => {
      const newFile: DriveFile = {
          id: Date.now().toString(),
          name,
          content,
          type,
          source,
          lastModified: new Date()
      };
      setFiles(prev => [...prev, newFile]);
      setTextContent('');
      setFileName('');
  };

  // Função auxiliar para decodificar Base64 com suporte a UTF-8 (Acentos)
  const decodeBase64UTF8 = (str: string) => {
      try {
        return new TextDecoder('utf-8').decode(
            Uint8Array.from(atob(str), c => c.charCodeAt(0))
        );
      } catch (e) {
          console.error("Erro decodificando UTF-8", e);
          return atob(str); // Fallback
      }
  };

  const connectGithub = async () => {
      // Limpeza da URL para aceitar "https://github.com/user/repo" ou "user/repo"
      let cleanRepo = githubRepo.trim();
      cleanRepo = cleanRepo.replace('https://github.com/', '').replace('http://github.com/', '');
      if (cleanRepo.endsWith('.git')) cleanRepo = cleanRepo.slice(0, -4);
      if (cleanRepo.endsWith('/')) cleanRepo = cleanRepo.slice(0, -1);

      if (!cleanRepo.includes('/')) {
          alert("Formato inválido. Use usuario/repositorio (ex: gabrielkendy/AGENTE-IA-GOOGLE)");
          return;
      }

      setIsConnecting('github');
      const [owner, repo] = cleanRepo.split('/');

      try {
          // 1. Fetch README
          const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
          if (readmeRes.ok) {
              const data = await readmeRes.json();
              if (data.content) {
                  const content = decodeBase64UTF8(data.content);
                  addFile(`${repo}_README.md`, content, 'md', 'github');
              }
          } else {
              console.warn("README não encontrado ou repositório privado.");
          }

          // 2. Fetch Issues (Limitado a 5 recentes)
          const issuesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=5`);
          if (issuesRes.ok) {
              const issues = await issuesRes.json();
              const issuesText = issues.map((i: any) => `- #${i.number} ${i.title}: ${i.body?.substring(0, 200)}...`).join('\n');
              addFile(`${repo}_Issues_Recent.txt`, `Principais Issues Abertas:\n${issuesText}`, 'text', 'github');
          }

          setGithubRepo('');
          alert(`Repositório ${repo} conectado! Vá ao chat para conversar sobre ele.`);
      } catch (error) {
          alert("Erro ao conectar GitHub. Verifique se o repositório é público e o nome está correto.");
          console.error(error);
      } finally {
          setIsConnecting(null);
      }
  };

  const simulateIntegration = (service: string, mockFiles: DriveFile[]) => {
      setIsConnecting(service);
      setTimeout(() => {
          setFiles(prev => [...prev, ...mockFiles]);
          setIsConnecting(null);
      }, 1500);
  };

  const removeFile = (id: string) => {
      setFiles(prev => prev.filter(f => f.id !== id));
  };

  const renderFileIcon = (type: string, source: string) => {
      if (source === 'github') return <Icons.Github />;
      if (source === 'gmail') return <Icons.Gmail />;
      if (source === 'gdrive') return <Icons.GoogleDrive />;
      if (type === 'pdf') return <Icons.Pdf />;
      if (type === 'sheet') return <Icons.Sheet />;
      if (type === 'doc') return <Icons.Doc />;
      return <Icons.Drive />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-800 bg-gray-900/50">
             <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    <Icons.Drive /> Central de Conhecimento
                </h2>
                <p className="text-gray-400 text-lg">
                    Conecte o cérebro da sua empresa. Adicione documentos, repositórios e planilhas.
                </p>
                
                <div className="flex gap-4 mt-8 border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('integrations')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'integrations' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Integrações & Apps
                        {activeTab === 'integrations' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'upload' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Upload de Arquivos
                        {activeTab === 'upload' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
                
                {/* INTEGRATIONS TAB */}
                {activeTab === 'integrations' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        
                        {/* GitHub Card (REAL) */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all shadow-lg group">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                                <div className="w-8 h-8"><Icons.Github /></div>
                            </div>
                            <h3 className="text-lg font-bold mb-1">GitHub</h3>
                            <p className="text-gray-500 text-sm mb-4">Importe README e Issues de repositórios públicos.</p>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    placeholder="user/repo (ex: gabrielkendy/projeto)"
                                    value={githubRepo}
                                    onChange={(e) => setGithubRepo(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs focus:border-primary-500 outline-none"
                                />
                                <button 
                                    onClick={connectGithub}
                                    disabled={!!isConnecting || !githubRepo}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isConnecting === 'github' ? 'Baixando...' : 'Conectar Repo'}
                                </button>
                            </div>
                        </div>

                        {/* Google Drive Card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all shadow-lg group">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                                <div className="w-8 h-8"><Icons.GoogleDrive /></div>
                            </div>
                            <h3 className="text-lg font-bold mb-1">Google Drive</h3>
                            <p className="text-gray-500 text-sm mb-6 min-h-[40px]">Conecte pastas inteiras, Docs e PDFs.</p>
                            <button 
                                onClick={() => simulateIntegration('drive', [
                                    { id: 'drive-1', name: 'Brand_Book_2025.pdf', type: 'pdf', source: 'gdrive', content: 'Brand guidelines...', lastModified: new Date() }
                                ])}
                                disabled={!!isConnecting}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isConnecting === 'drive' ? 'Conectando...' : 'Conectar Drive'}
                            </button>
                        </div>

                        {/* Gmail Card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all shadow-lg group">
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                                <div className="w-8 h-8"><Icons.Gmail /></div>
                            </div>
                            <h3 className="text-lg font-bold mb-1">Gmail / Outlook</h3>
                            <p className="text-gray-500 text-sm mb-6 min-h-[40px]">Permita que agentes leiam emails.</p>
                            <button 
                                onClick={() => simulateIntegration('gmail', [
                                    { id: 'mail-1', name: 'Feedback_Cliente.eml', type: 'email', source: 'gmail', content: 'Email body...', lastModified: new Date() }
                                ])}
                                disabled={!!isConnecting}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                {isConnecting === 'gmail' ? 'Autenticando...' : 'Conectar Email'}
                            </button>
                        </div>
                    </div>
                )}

                {/* UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <div className="space-y-8 animate-fade-in">
                        <div 
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                                dragActive ? 'border-primary-500 bg-primary-900/10' : 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-gray-800 rounded-full text-primary-400 shadow-lg">
                                    <Icons.Attach />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-xl mb-1">Arraste arquivos aqui</h3>
                                    <p className="text-sm text-gray-500">Suporta PDF, CSV, JSON, TXT, MD</p>
                                </div>
                            </div>
                        </div>

                        {/* Manual Entry */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Icons.Plus /> Adicionar Texto Manualmente</h3>
                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Nome (ex: Notas.txt)" 
                                    className="w-1/3 bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-primary-500 outline-none"
                                    value={fileName}
                                    onChange={e => setFileName(e.target.value)}
                                />
                                <input 
                                    type="text"
                                    placeholder="Cole o conteúdo do texto aqui..." 
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-primary-500 outline-none"
                                    value={textContent}
                                    onChange={e => setTextContent(e.target.value)}
                                />
                                <button 
                                    onClick={() => addFile(fileName, textContent, 'text', 'upload')}
                                    disabled={!fileName || !textContent}
                                    className="bg-primary-600 hover:bg-primary-500 text-white px-6 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* File List (Always Visible) */}
                <div className="mt-12">
                    <h3 className="font-semibold mb-4 text-gray-400 text-sm uppercase tracking-wider border-b border-gray-800 pb-2">
                        Arquivos Ativos na Base ({files.length})
                    </h3>
                    {files.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 italic">
                            Sua base de conhecimento está vazia. Adicione arquivos ou conecte serviços.
                        </div>
                    ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            {files.map(file => (
                                <div key={file.id} className="p-4 border-b border-gray-800 last:border-0 flex items-center justify-between group hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${
                                            file.source === 'github' ? 'bg-gray-800 text-white' :
                                            file.source === 'gdrive' ? 'bg-blue-900/20 text-blue-400' :
                                            file.source === 'gmail' ? 'bg-red-900/20 text-red-400' :
                                            'bg-gray-700 text-gray-300'
                                        }`}>
                                            {renderFileIcon(file.type, file.source)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-200">{file.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span className="uppercase">{file.type}</span>
                                                <span>•</span>
                                                <span className="capitalize">{file.source === 'gdrive' ? 'Google Drive' : file.source}</span>
                                                <span>•</span>
                                                <span>{file.lastModified.toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFile(file.id)}
                                        className="text-gray-600 hover:text-red-400 p-2 rounded-full hover:bg-red-900/10 transition-colors"
                                        title="Remover arquivo"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};