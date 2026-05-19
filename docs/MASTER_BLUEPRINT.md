# 🗺️ MEDIA 8 — MASTER BLUEPRINT & GUIDELINES

> **Documento Central de Engenharia e Design**  
> Este documento é a **bússola absoluta** do projeto Media 8. Qualquer agente de IA ou desenvolvedor atuando neste repositório **DEVE** ler e aderir a estas diretrizes antes de modificar o código-fonte.
>
> **Última atualização:** 18/05/2026

---

## 1. Visão do Produto

O **Media 8** é uma plataforma SaaS B2B/B2C projetada para resolver a fricção na **venda, gestão e entrega de serviços de edição de vídeo** (curtos e longos). O sistema atua como uma "carteira digital de edições", onde:

- **Clientes** adquirem pacotes de serviços e consomem créditos à medida que solicitam demandas de edição.
- **Editores** gerenciam as entregas em uma esteira de produção fluida, com timeline de acompanhamento.
- **Admins** controlam o catálogo de pacotes, atribuem contratos, monitoram saldos e gerenciam toda a operação.

O sistema cobre o ciclo completo: **Compensação Financeira** (Gestão de Saldo e Créditos) → **Esteira de Produção** (Upload, Revisão e Entrega de Arquivos).

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Localização |
|--------|-----------|-------------|
| **Backend** | .NET 10 (Preview), C# 13, ASP.NET Core Web API, EF Core 10 | `media8-api/` |
| **Frontend** | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, shadcn/ui, Radix Primitives, React Hook Form + Zod | `media8-web/` |
| **Database** | PostgreSQL (Dockerizado) | `media8-infra/` |
| **Infra** | Docker, Docker Compose, Nginx Reverse Proxy | `media8-infra/` |

### Estrutura do Monorepo

```
media8-app-v1/
├── media8-api/                  # Backend .NET
│   ├── Media8.Api/              # Controllers, Program.cs
│   ├── Media8.Application/      # DTOs, Interfaces, Services
│   ├── Media8.Domain/           # Entities, Enums (→ sendo migrado para Data-Driven)
│   └── Media8.Infrastructure/   # EF Core, Repositories, Migrations, Auth
├── media8-web/                  # Frontend React
│   └── src/
│       ├── components/          # UI components (auth/, dashboard/, layout/, packages/, users/, ui/)
│       ├── contexts/            # AuthContext, NotificationsContext
│       ├── hooks/               # useOrders, usePackages, useUsers, useServiceBalances, etc.
│       ├── pages/               # Todas as páginas da aplicação
│       ├── services/            # Camada de API (orderService, packageService, userService, etc.)
│       ├── types/               # TypeScript types e interfaces
│       └── lib/                 # Utilitários (pagination, api client, etc.)
├── media8-infra/                # Docker Compose + scripts
└── docs/                        # Documentação técnica e de negócio
```

---

## 3. Padrões Arquiteturais de Backend (.NET 10 / C# 13)

> A integridade dos dados é **inegociável**. O backend opera sob as seguintes premissas:

### 3.1. Clean Architecture (Regra Absoluta)

Separação estrita em 4 camadas. A camada de Domínio **não conhece** o Banco de Dados:

```
Media8.Api           → Controllers, Middleware, Program.cs (Entry Point)
Media8.Application   → DTOs, Interfaces (IOrderService, etc.), Services
Media8.Domain        → Entities, Enums, Value Objects (Zero dependências externas)
Media8.Infrastructure→ EF Core DbContext, Repositories, Migrations, Auth
```

**Regra:** Dependências fluem apenas para dentro: `Api → Application → Domain ← Infrastructure`.

### 3.2. Data-Driven Domain — O Motor Dinâmico (TARGET)

> ⚠️ **REFATORAÇÃO PENDENTE — FASE 0 DO ROADMAP**

Regras de negócio mutáveis **nunca** devem ser fixadas no código como `Enums`. O estado atual usa um `enum ServiceType` estático (`ReelsStandard`, `ReelsPremium`, `YoutubeCurto`, etc.) — isto será substituído por:

- **Entidade `VideoFormat`** — Tabela dinâmica no PostgreSQL onde o Admin cadastra novos formatos (ex: "TikTok Trend", "Reels Premium") com `max_duration_seconds`, `slug` e `complexity`.
- **Cache em Memória (`IMemoryCache`)** — Os formatos são carregados na inicialização do backend e cacheados para consultas O(1), evitando round-trips ao banco.

**Impacto:** Esta mudança afeta `ServiceBalanceLot.ServiceType`, `Order.ServiceType`, `Package.ServiceTypes` e o schema SQL. Todas as referências ao enum devem migrar para FK de `VideoFormat`.

### 3.3. Snapshot Pattern (Imutabilidade de Contratos)

Quando um cliente adquire um pacote (`PackageAssignment`), o sistema copia os dados vitais para dentro do contrato:

```csharp
// PackageAssignment — Campos de Snapshot (Imutáveis após criação)
public string? SnapshotPackageName { get; set; }
public decimal? SnapshotPrice { get; set; }
public int? SnapshotVideoQuantity { get; set; }
public int? SnapshotValidityDays { get; set; }
```

**Regra:** Se o admin alterar o catálogo amanhã, o contrato do cliente permanece intacto. O Frontend lê **sempre** os campos `Snapshot*` e nunca faz JOIN direto com o catálogo para exibir dados do cliente.

### 3.4. Motor FIFO de Consumo de Créditos

O consumo de saldo (`ServiceBalanceLot`) obedece estritamente ao First-In, First-Out:

- Query ordenada por `ExpiresAt ASC` identifica o lote prioritário.
- `RemainingQuantity` é decrementado com **Row Lock transacional** para evitar Race Conditions.
- Se o consumo falha (sem saldo), o pedido **não** é criado — atomicidade garantida.

### 3.5. Anti Over-Posting (DTOs Estritos)

- Requisições HTTP jamais mapeiam diretamente para entidades de domínio.
- Cada endpoint tem DTOs específicos de entrada e saída (ex: `CreateOrderRequest`, `AdminUserDto`).
- Propriedades sensíveis (`PasswordHash`, `Role`, `Balance`) **não existem** nos DTOs de entrada.

### 3.6. Autenticação e Autorização

- **JWT** assinado com HMACSHA256, com Claims de `sub` (userId) e `role`.
- **RBAC** com 3 roles: `Client`, `Editor`, `Admin`.
- Roles ficam em tabela segregada (`user_roles`), não na tabela `users`.
- IDs de usuário no payload são ignorados — o sistema usa **sempre** o `sub` do token JWT.

---

## 4. Diretrizes de Design e Identidade Visual (Frontend)

> O frontend deve refletir uma marca **premium, moderna e confiável**. Desvios criativos ou cores aleatórias são proibidos.

### 4.1. Paleta de Cores Oficial

| Cor | Hex | Uso |
|-----|-----|-----|
| **Vinho Profundo** (Primária) | `#400404` | Botões primários, ações principais, TopBar mobile, destaques de autoridade |
| **Creme Suave** (Background) | `#FFFBED` | Fundos de página, quebra de blocos. Evitar branco puro `#FFFFFF` |
| **Vinho Quente** | `#5C1212` | Gradientes, hover states |
| **Vinho Vibrante** | `#7B0A0A` | Acentos visuais, badges |
| **Preto Puro** | `#000000` | Profundidade em assets visuais |
| **Modo Dark** | Vinho extremamente escuro | O "escuro" **não é cinza** — é vinho profundo, mantendo a identidade |

**Cores Semânticas:** Tons sóbrios e pastéis que conversem com a paleta Vinho (ex: tons de terra para alertas, verde musgo para sucesso). Proibido usar verde/vermelho/azul saturados genéricos.

### 4.2. Tipografia

| Contexto | Fonte | Uso |
|----------|-------|-----|
| **Headlines/Capas** | `DREAM AVENUE` | Banners, Hero sections, destaques de identidade |
| **Interface (UI)** | `Inter` ou `Garet Regular` | Parágrafos, legendas, interfaces. Foco em legibilidade extrema |
| **Acentuação** | `CALLEM` | Assinaturas, "emotional words" |

**Hierarquia:** Clara entre `h1` (Títulos de página), `h2` (Seções/Tabelas), `h3` (Sub-blocos) e `p` (Dados corporativos).

### 4.3. Componentes UI (shadcn/ui)

| Aspecto | Diretriz |
|---------|----------|
| **Bordas** | Cantos suavemente arredondados (radius moderado). Nem quadrados secos, nem pílulas exageradas |
| **Sombras** | Soft drop-shadows leves, apenas para elevações (dropdowns, modais). Layout geral é "Flat Premium" |
| **Loading States** | **Obrigatório** em todos os formulários — spinners ou botões desabilitados para evitar duplo-clique |
| **Feedback** | Toasts (canto inferior) para sucesso/erro de ações. Skeleton loading para carregamento de dados |
| **Listas longas** | **Sempre** usar o componente `InfiniteScroll` genérico já existente no projeto |
| **Selects pesados** | Usar `InfiniteCombobox` com virtualização para dropdowns com muitos itens |
| **Inputs Mobile** | Altura mínima de `48px` (`h-12`) em mobile para touch targets acessíveis |

### 4.4. Responsividade

| Breakpoint | Comportamento |
|-----------|---------------|
| **Desktop (md+)** | Sidebar lateral fixa e visível. Padding confortável (`p-8`) |
| **Mobile (<md)** | Sidebar oculta → TopBar sticky (`#400404`) + Menu Hamburger → Sheet (gaveta shadcn/ui). Padding reduzido (`p-4`) |

---

## 5. Entidades de Domínio Atuais

Referência rápida das entities em `Media8.Domain/Entities/`:

| Entity | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| `User` | `UserAggregate.cs` | Credenciais (email, password_hash). Root do agregado de autenticação |
| `Profile` | `UserAggregate.cs` | Dados pessoais (nome, telefone, avatar, bio) |
| `UserRole` | `UserAggregate.cs` | Relação User→Role (tabela segregada para segurança RBAC) |
| `Package` | `PackageAggregate.cs` | Catálogo de produtos vendáveis |
| `PackageAssignment` | `PackageAggregate.cs` | Contrato imutável (Snapshot) entre pacote e cliente |
| `ServiceBalanceLot` | `ServiceBalanceLot.cs` | Lotes de crédito consumíveis (Motor FIFO) |
| `Order` | `OrderAggregate.cs` | Pedido de edição de vídeo |
| `OrderTimeline` | `OrderAggregate.cs` | Log de eventos do pedido (status, comentários, uploads) |
| `Notification` | `Notification.cs` | Alertas internos do sistema (info, success, warning, order) |

---

## 6. O Mapa da Documentação (`docs/`)

| Arquivo | Função |
|---------|--------|
| 📄 `MASTER_BLUEPRINT.md` | **Este arquivo.** As regras inquebráveis do projeto. Leia primeiro |
| 📄 `media8_backlog_user_stories.md` | O Backlog Oficial. User Stories com tags `[✅ DONE]` / `[🟡 PARTIAL]` / `[🔴 TODO]` |
| 📄 `ARCHITECTURE.md` | Visão geral da arquitetura, fluxos de dados, diagramas Mermaid |
| 📄 `DATABASE_SCHEMA.md` | Diagrama ER, tabelas, índices, triggers. **Atualizar a cada nova migration** |
| 📄 `API_ROUTES.md` | Contrato público da API RESTful. Endpoints, payloads, regras |
| 📄 `SECURITY.md` | Políticas de segurança, RBAC, proteções contra ataques |
| 📄 `Briefing da Marca - Diretrizes da Identidade Visual.md` | Paleta de cores, tipografia, essência da marca |
| 📄 `Responsividade.md` | Diretrizes de layout adaptativo (Desktop vs Mobile) |
| 📄 `fluxo-de-criacao-de-pedido-detalhado.md` | Passo-a-passo do fluxo de criação de pedido de edição |
| 📄 `fluxo-geral-do-usuario-gerenciador-de-edicao.md` | Fluxo completo: Cadastro → Pacote → Perfil → Pedido |
| 📁 `implementations/` | **25 case studies** de bugs resolvidos e refatorações. Todo problema complexo gera um log aqui |

---

## 7. Roadmap de Execução (Prioridade Definida)

> Ordem otimizada para minimizar retrabalho e maximizar entrega de valor:

### Fase 0 — Refatoração Dinâmica (Desengessar o Core)
**Ação:** Substituir o `enum ServiceType` pela entidade dinâmica `VideoFormat` com `IMemoryCache`.  
**Por quê:** Altera a raiz do banco e do consumo FIFO. Tudo construído depois já nasce na arquitetura correta.  
**Épico:** 2 do Backlog.

### Fase 1 — O Coração do Negócio
**Ação:** Implementar CRUD completo de **Perfis de Edição** (`EditingProfile`) e torná-lo obrigatório na abertura de pedidos. Completar os endpoints de Orders (PATCH status, Timeline).  
**Por quê:** Sem isso, clientes não usam o app de forma autônoma. É o que falta para o MVP gerar valor real.  
**Épicos:** 5 e 6 do Backlog.

### Fase 2 — Consolidação e Qualidade
**Ação:** Testes automatizados (FIFO, Snapshot, Auth), Refresh Token com rotação, jobs de expiração de lotes.  
**Por quê:** A base de dados e lógica de negócio estarão seladas. Testes não quebrarão por mudanças arquiteturais.  
**Épicos:** Transversal.

### Fase 3 — Automação e Integração
**Ação:** Webhooks (Fire-and-Forget para n8n/Zapier), Email transacional, CI/CD com GitHub Actions.  
**Épicos:** 8 do Backlog.

### Fase 4 — Growth e Self-Service
**Ação:** Gateway de pagamento (Stripe/Mercado Pago), fluxo de compra self-service, Landing Page com catálogo interativo.  
**Épico:** Novo.

---

## 8. Regras de Engajamento para Agentes de Código

> **Atenção, Agente Desenvolvedor.** Ao receber um prompt de execução, seu comportamento **obrigatório** é:

### Antes de Codar
1. **Leia este Blueprint** e identifique quais seções se aplicam à sua tarefa.
2. **Leia o Backlog** (`media8_backlog_user_stories.md`) para entender o contexto de negócio.
3. **Consulte o Schema** (`DATABASE_SCHEMA.md`) e as **Rotas** (`API_ROUTES.md`) se for alterar backend.

### Durante o Desenvolvimento
4. **Respeite o Data-Driven Domain.** Se for criar algo que envolva tipos de vídeo, **use a entidade `VideoFormat`** (ou o enum `ServiceType` temporariamente, documentando a migração futura). Nunca crie novos Enums para dados dinâmicos.
5. **Consistência Visual.** Toda nova tela usa componentes `shadcn/ui` já instalados. Botões primários na cor Vinho (`#400404`). Listas longas usam `InfiniteScroll`. Selects pesados usam `InfiniteCombobox`.
6. **Proteção Transacional.** Nunca faça `.Update()` direto em saldos. Use as funções transacionais do motor FIFO que aplicam Row Lock.
7. **DTOs Sempre.** Nunca retorne entities de domínio direto na API. Crie DTOs específicos de request/response.

### Após Concluir
8. **Atualize o Backlog.** Mude a tag da US correspondente para `[✅ DONE]` ou `[🟡 PARTIAL]`.
9. **Atualize o Schema.** Se criou migrations, atualize `DATABASE_SCHEMA.md` com as novas tabelas/colunas.
10. **Documente bugs complexos.** Se resolveu um problema não-trivial, crie um arquivo `NNN-descricao.md` em `docs/implementations/`.

---

> *"Gambiarra só é aceitável se for pra manter o sistema respirando até o fix."* — Havenox
