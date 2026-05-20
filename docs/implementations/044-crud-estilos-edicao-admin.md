# 044 - Frontend: Implementação do CRUD de Estilos de Edição (Admin)

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema:** A sistema de ofertas estava sendo criado sem vínculo com formatos de vídeo e estilos de edição, resultando em contratos de clientes sem saldos provisionados. A causa raiz era a ausência de uma interface administrativa para gerenciar `EditingStyles`, complementando o CRUD de `VideoFormats` já existente.

**Sintoma:** Admin conseguia criar ofertas, mas estas chegavam ao banco com `videoFormatId` e `editingStyleId` nulos, fazendo a engine de provisionamento (`ServiceBalanceService.ProvisionContractBalanceAsync`) falhar silenciosamente.

**Impacto:** Clientes recebiam contratos "vazios" sem créditos de edição utilizáveis, quebrando o fluxo principal da plataforma.

## 🧠 Estratégia da Solução

**Abordagem:** Implementar a **Fase 1** do roadmap documentado no estudo de caso #043, criando infraestrutura completa de frontend para gerenciamento de Estilos de Edição, espelhando o padrão estabelecido por `VideoFormatsPage`.

**Decisões de Design:**
- **Espelhamento:** Seguir exatamente a mesma estrutura de `VideoFormatsPage` para consistência
- **Simplicidade:** CRUD básico (nome, descrição, status) sem complicações
- **Type-Safety:** Tipagem TypeScript estrita espelhando DTOs do backend
- **Padrão TanStack Query:** Query keys estruturadas, invalidação em mutações
- **Acesso Admin-Only:** Rota protegida sob `/admin/editing-styles`

## 🛠️ Implementação Técnica

### 1. Tipagem TypeScript (`src/types/services.ts`)

Adicionado interfaces paraEditingStyle:
```typescript
export interface EditingStyle {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEditingStyleRequest {
  name: string;
  description?: string;
}

export interface UpdateEditingStyleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
```

### 2. Serviço de API (`src/services/editingStyleService.ts`)

Implementado serviço REST completo:
- `getAll()` → GET `/api/v1/editing-styles`
- `getById(id)` → GET `/api/v1/editing-styles/{id}`
- `create(data)` → POST `/api/v1/editing-styles`
- `update(id, data)` → PUT `/api/v1/editing-styles/{id}`
- `delete(id)` → DELETE `/api/v1/editing-styles/{id}`

### 3. Hook TanStack Query (`src/hooks/useEditingStyles.ts`)

Criado hooks padronizados:
- `useEditingStyles()` - Query com `staleTime: 5min`
- `useCreateEditingStyle()` - Mutação com invalidação de cache
- `useUpdateEditingStyle()` - Mutação com invalidação de cache
- `useDeleteEditingStyle()` - Mutação com invalidação de cache

### 4. Página Administrativa (`src/pages/admin/EditingStylesPage.tsx`)

Implementado UI completa com:
- **Header:** Título "Estilos de Edição" + botão "Novo Estilo"
- **Tabela:** Listagem com colunas (Nome, Descrição, Status, Ações)
- **Dialog:** Modal de criação/edição com formulário React Hook Form + Zod
- **DropdownMenu:** Ações de Editar e Excluir
- **Badge:** Status (Ativo/Inativo) com ícones
- **Search:** Filtro por nome/descricao
- **Empty State:** Alerta quando sem estilos

### 5. Rotas e Navegação

**App.tsx:**
- Import: `import EditingStylesPage from "@/pages/admin/EditingStylesPage"`
- Rota: `/admin/editing-styles` protegida (Admin only)

**Sidebar.tsx:**
- Import: `Palette` icon do Lucide
- Link: "Estilos" → `/admin/editing-styles` (Admin only)

## 🎯 Impacto e Resultado

* **CRUD Completo:** Admin pode criar, editar, excluir estilos de edição
* **Base para Ofertas:** Infraestrutura pronta para vínculo em formulários de ofertas
* **Consistência:** Padrão idêntico a VideoFormats (mesma curva de aprendizado)
* **Type-Safety:** 0 erros TypeScript, 21 testes passando

---

**Nota do Desenvolvedor:**

*Esta implementação segue o princípio de "divergir apenas quando necessário". Ao espelhar VideoFormatsPage, garantimos consistência de UX, redução de carga cognitiva para admins, e código familiar para manutenção futura. A decisão de usar `staleTime: 5min` reflete a natureza de baixo volume de mudanças neste catálogo — estilos não mudam frequentemente, mas quando mudam, o admin precisa ver resultado imediato (daí a invalidação agressiva no onSuccess das mutações).*

**Próximo Passo:** Fase 2 — Adicionar seletores de `VideoFormat` e `EditingStyle` no formulário de criação de ofertas (`OffersPage.tsx`).
