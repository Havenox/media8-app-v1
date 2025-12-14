# Media 8 - Plataforma de Edição de Vídeo

Plataforma SaaS para gerenciamento de serviços de edição de vídeo, conectando clientes a editores profissionais.

## 📚 Documentação do Backend

A documentação completa para desenvolvimento e integração do backend está disponível na pasta `/docs`:

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Visão geral da arquitetura, stack tecnológico e padrões de integração |
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Esquema completo do banco de dados PostgreSQL, tabelas, índices e triggers |
| [API_ROUTES.md](./docs/API_ROUTES.md) | Todas as rotas da API REST, payloads e códigos de resposta |
| [SECURITY.md](./docs/SECURITY.md) | Políticas de segurança, RLS, RBAC e proteções contra ataques |

---

---

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

> **Nota:** Configuração do backend **estritamente** via Variáveis de Ambiente (`.env`). Nenhuma secret em arquivos JSON.
