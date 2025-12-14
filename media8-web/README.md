# Media 8 - Plataforma de Edição de Vídeo

## Tecnologias Utilizadas

### Frontend
- **React 18.3+** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui (Radix UI)** - UI Components
- **Lucide React** - Icons
- **TanStack Query** - Server State Management
- **React Hook Form + Zod** - Forms & Validation
- **Framer Motion** - Animations

### Backend
- **Docker & Docker Compose** - Orquestração
- **PostgreSQL (Alpine)** - Database em Docker
- **C# .NET 10** - Runtime
- **ASP.NET Core Web API** - Framework
- **Entity Framework Core** - ORM
- **JWT Bearer Authentication** - Auth

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- NPM ou Yarn

### Configuração
1.  **Clone o repositório** e acesse a pasta do frontend:
    ```sh
    cd media8-web
    ```

2.  **Instale as dependências**:
    ```sh
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**:
    Copie o arquivo de exemplo `.env.example` para `.env`:
    
    ```sh
    cp .env.example .env
    ```
    
    Edite o arquivo `.env` para apontar para sua API (se diferente do padrão):
    ```env
    # URL da API Backend (.NET)
    # Se estiver rodando via Docker, geralmente é http://localhost:5261/api/v1
    VITE_API_URL=http://localhost:5261/api/v1
    ```

4.  **Inicie o Servidor de Desenvolvimento**:
    ```sh
    npm run dev
    ```

Acesse [http://localhost:5173](http://localhost:5173) no seu navegador.
