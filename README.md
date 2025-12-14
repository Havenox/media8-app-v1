# Media 8 App

![Media 8 Banner](./docs/assets/Banner-1200x400.webp)

> **Plataforma para Vendas, Gestão e Entrega de Serviços de Edição de Vídeo.**

O **Media 8** é uma solução completa que conecta clientes a editores profissionais, gerenciando todo o ciclo de vida do serviço: desde a compra de créditos (pacotes) até a entrega final dos vídeos editados. Construído com foco em **escalabilidade**, **segurança** e **experiência do usuário (UX)**.

Este repositório adota a estrutura de **Monorepo**, centralizando Backend, Frontend e Infraestrutura para facilitar a orquestração e o versionamento unificado.

---

## 🚀 Tecnologias e Stack

O projeto utiliza as tecnologias mais modernas do mercado, focando em performance e tipagem estática.

### 🖥️ Frontend (`media8-web`)
Experiência reativa e fluida para o usuário final.
*   **Core**: React 18, TypeScript, Vite.
*   **UI/UX**: shadcn/ui (Radix Primitives), Tailwind CSS, Framer Motion.
*   **State**: TanStack Query (Server State), Context API (Auth).
*   **Forms**: React Hook Form + Zod (Validação robusta).

### ⚙️ Backend (`media8-api`)
API robusta e segura construída sobre a plataforma .NET.
*   **Core**: .NET 10 (Preview/Latest), C# 13.
*   **Framework**: ASP.NET Core Web API.
*   **Data**: Entity Framework Core, PostgreSQL.
*   **Auth**: JWT (JSON Web Tokens) com Refresh Tokens e Role-Based Access Control (RBAC).
*   **Architecture**: Clean Architecture principles, Repository Pattern, DTOs para contratos de dados.

### 🏗️ Infraestrutura (`media8-infra`)
Ambiente de desenvolvimento e produção containerizado.
*   **Containerização**: Docker & Docker Compose.
*   **Reverse Proxy**: Nginx (para servia da aplicação Web).
*   **Database**: PostgreSQL (Alpine).

---

## 📂 Estrutura do Repositório

Organização modular para separar responsabilidades mantendo a coesão do produto.

```bash
media8-app/
├── media8-api/        # Código fonte da API (.NET)
├── media8-web/        # Código fonte do Frontend (React)
├── media8-infra/      # Configurações de Docker, Nginx e Scripts de Deploy
└── docs/              # Documentação Arquitetural e de Implementação
```

---

## 🔥 Funcionalidades Chave

*   **Sistema de Créditos**: Lógica de saldo de serviços (Reels, Shorts) com expiração e consumo FIFO.
*   **Gestão de Pedidos**: Fluxo completo de solicitação, upload de assets e acompanhamento de status.
*   **Painel Administrativo**: Gestão de clientes, atribuição manual de pacotes e controle de entregas.
*   **Autenticação Segura**: Login "Smart" (detecção de duplicidade), recuperação de senha e proteção de rotas por claims.
*   **Performance**: Otimizações de query no EF Core e caching no Frontend.

---

## 🛠️ Como Rodar o Projeto

Pré-requisitos: [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/install/).

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Havenox/media8-app-v1.git
    cd media8-app-v1
    ```

2.  **Inicie o ambiente:**
    Acesse a pasta de infraestrutura e suba os containers.
    ```bash
    cd media8-infra
    docker-compose up -d --build
    ```
    *Ou utilize o script facilitador (Windows):*
    ```bash
    .\media8-infra\scripts\dev-up.bat
    ```

3.  **Acesse a aplicação:**
    *   **Frontend**: [http://localhost:5173](http://localhost:5173)
    *   **API (Swagger)**: [http://localhost:5261/swagger](http://localhost:5261/swagger)

---

## 📚 Documentação

Documentamos nossas decisões técnicas e implementações para manter o histórico e a qualidade do código.

*   [Decisões de Design (Frontend)](./media8-web/docs/implementations/)
*   [Implementações Técnicas (Backend)](./media8-api/docs/implementations/)

---

## 👨‍💻 Autor

Desenvolvido por **Havenox**.

*   Software Engineer | C# | .NET | React | SQL
*   Foco em: Full Stack Development, .NET Ecosystem, Modern Web Architectures.
*   [GitHub](https://github.com/Havenox)
*   [Linkedin](https://www.linkedin.com/in/havenox/)
*   [Substack](https://havenox.substack.com/)
*   [X](https://x.com/havenox)
*   [Portfolio](https://havenox.dev/)



---

> *"Gambiarra só é aceitável se \for pra manter o sistema respirando até o fix."* - Havenox