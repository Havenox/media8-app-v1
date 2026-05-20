# Media 8 App - Platform for Creative Services

![Media 8 Banner](docs/assets/Banner-1200x400.webp)

> **Plataforma para Gestão, Venda e Entrega de Serviços de Edição de Vídeo.**

O **Media 8** não é apenas um dashboard; é um ecosistema completo que conecta Clientes a Editores Profissionais. O sistema gerencia todo o ciclo de vida do serviço criativo: desde a **Compensação Financeira** (Gestão de Saldo e Créditos) até a **Esteira de Produção** (Upload, Revisão e Entrega de Arquivos).

Construído com obsessão por **Performance**, **Segurança** e **Arquitetura Escalável**.

---

## 🚀 Destaques de Engenharia (Why this repo matters?)

Este projeto demonstra a aplicação prática de conceitos avançados de Engenharia de Software para resolver problemas reais de negócio.

### 🛡️ Arquitetura e Integridade
* **Snapshot Pattern**: Implementação de contratos imutáveis. O sistema preserva o estado histórico das vendas (preço, termos) independente de mudanças futuras no catálogo. [Ler Case Study](docs/implementations/016-arquitetura-snapshot-contratos.md).
* **Balance FIFO**: Algoritmo inteligente de consumo de saldo que prioriza créditos antigos para beneficiar o cliente.
* **Clean Architecture**: Backend segregado em camadas (Domain, Application, API, Infra) facilitando testes e manutenção.
* **Integration Testing Suite**: Suíte de testes E2E com WebApplicationFactory validando auth, RBAC e fluxos de negócio. [Ler Case Study](docs/implementations/035-testes-integracao-blindagem-backend.md).

### ⚡ Performance e UX
*   **Virtualização (Infinite Scroll)**: Componentes UI otimizados para listar milhares de registros sem travar o DOM. [Ler Case Study](docs/implementations/010-refatoracao-infinite-scroll-generico.md).
*   **Server-Side Logic**: Cálculos complexos (Agregações, Estatísticas) movidos para o banco de dados (SQL) para aliviar a memória da aplicação.

---

## 🛠️ Tech Stack Poderosa

Utilizamos o que há de mais moderno e robusto no mercado.

### Backend (`media8-api`)
*   **Core**: .NET 10 (Preview) / C# 13
*   **Framework**: ASP.NET Core Web API
*   **Data**: Entity Framework Core 10, PostgreSQL
*   **Patterns**: Repository, Unit of Work, DTOs, CQRS (Simplificado)

### Frontend (`media8-web`)
*   **Core**: React 18, TypeScript, Vite
*   **State Management**: TanStack Query (Server State)
*   **Design System**: Tailwind CSS, shadcn/ui, Radix Primitives
*   **Form**: React Hook Form + Zod

### Infraestrutura (`media8-infra`)
*   **Container**: Docker & Docker Compose
*   **Proxy**: Nginx
*   **CI/CD**: GitHub Actions (exemplo)

---

## 📚 Documentação e Portfólio

Este repositório contém uma documentação técnica detalhada que serve como **Estudo de Caso**. Recomendamos a leitura para entender a profundidade técnica do projeto.

### Arquitetura
*   [Visão Geral da Arquitetura](docs/ARCHITECTURE.md)
*   [Esquema de Banco de Dados](docs/DATABASE_SCHEMA.md)
*   [Rotas da API](docs/API_ROUTES.md)

### Estudos de Caso (Challenges & Solutions)
Uma coleção de documentos explicando **problemas reais** e como foram resolvidos:
*   [007 - Arquitetura Segura e DTOs](docs/implementations/007-gestao-usuarios.md)
*   [009 - Otimização de Performance O(n) para O(1)](docs/implementations/009-json-user-seeder.md)
*   [021 - Resiliência a CORS e Proxies](docs/implementations/021-investigacao-infinite-scroll.md)
*   *(Veja a pasta `docs/implementations` para a lista completa)*

---

## ⚙️ Como Rodar (Localhost)

Pré-requisitos: Docker e Docker Compose instalados.

1.  **Clone o projeto**
    ```bash
    git clone https://github.com/Havenox/media8-app-v1.git
    cd media8-app-v1
    ```

2.  **Inicie a Infraestrutura**
    ```bash
    cd media8-infra
    # Windows
    .\scripts\dev-up.bat
    # Linux/Mac
    docker-compose up -d --build
    ```

3.  **Acesse**
    *   Frontend: http://localhost:5173
    *   Swagger API: http://localhost:5261/swagger

---

## 👨‍💻 Sobre o Desenvolvedor

Desenvolvido por **Eduardo Nascimento (Havenox)**.


*   Software Engineer | C# | .NET | React | SQL
*   Foco em: Full Stack Development, .NET Ecosystem, Modern Web Architectures.
*   **Links**: [GitHub](https://github.com/Havenox) | [LinkedIn](https://www.linkedin.com/in/havenox/) | [Portfolio](https://havenox.dev/) | [Substack](https://havenox.substack.com/)
---

> *"Gambiarra só é aceitável se \for pra manter o sistema respirando até o fix."* - Havenox