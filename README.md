# 🚀 AI Content Team Workspace

Uma plataforma "Enterprise" simulada para gestão de agências de marketing utilizando Agentes de IA. O projeto integra Chat com LLMs, Workflow Kanban, Criação de Demanda (Wizard), Aprovação Externa e Geração de Mídia.

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Gemini%20API-blue)

## ✨ Funcionalidades Principais

### 1. 🤖 Squad de IA
- **Agentes Especialistas**: Gestora, Planejador, Roteirista, Designer, etc.
- **Contexto Dinâmico**: Injeção de conhecimento (PDFs, TXT) via RAG simulado.
- **Chat Interativo**: Interface estilo chat com suporte a menções (@Agente).

### 2. 📋 Workflow Kanban Profissional
- **Drag & Drop**: Arraste cards entre colunas (Backlog -> Produção -> Aprovação -> Cliente).
- **Wizard de Criação**: Processo passo-a-passo para criar demandas ricas.
- **Preview do Cliente**: Simulação da visão que o cliente terá ao receber o link.
- **Link de Aprovação**: Geração de tokens únicos para aprovação externa.

### 3. 🎨 Estúdio Criativo
- **Geração de Imagens**: Integração com Gemini Flash/Pro Vision.
- **Geração de Vídeos**: Integração com Google Veo.
- **Integração Fluida**: Envie mídias criadas diretamente para o Kanban.

### 4. 💬 Comunicação de Equipe
- **Inbox Interno**: Chat "Humano x Humano" para alinhar detalhes.
- **Widget Flutuante**: Chat rápido acessível de qualquer tela.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS.
- **Build Tool**: Vite.
- **AI Core**: Google Gemini API (`@google/genai` SDK).
- **State Management**: React State + LocalStorage (Persistência).
- **Icons**: SVG Icons customizados.

## 🚀 Como Rodar Localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/ai-content-team.git
   cd ai-content-team
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   API_KEY=sua_chave_do_google_ai_studio_aqui
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

## ☁️ Deploy na Vercel

O projeto está pronto para deploy contínuo.

1. Faça o push do código para o seu GitHub.
2. Crie um novo projeto na Vercel importando este repositório.
3. Nas configurações do projeto na Vercel, adicione a Environment Variable: `API_KEY`.
4. Deploy!

## 🧪 Testes e Simulação

O projeto utiliza `localStorage` para simular um banco de dados persistente. 
- Vá em **Configurações > Administração** para fazer Backup (JSON) ou Resetar o banco de dados.
- O envio de e-mails é simulado via sistema de notificações interno.

---

Desenvolvido com ❤️ e IA.
