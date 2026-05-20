# 043 - Backend/Frontend: Roadmap para Correção de Criação de Ofertas e Vínculo com Estilos de Edição

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema Crítico:** O sistema de criação de ofertas comerciais (`Offers`) está incomplete, resultando em **ofertas sem vínculo com formatos de vídeo e estilos de edição**. Quando o administrador tenta atribuir uma oferta a um cliente, o `ClientContract` é criado, mas a provisão automática de saldos (`ServiceBalanceLot`) falha silenciosamente porque `videoFormatId` é nulo ou `Guid.Empty`.

**Sintoma:** Cliente recebe contrato, mas não visualiza créditos disponíveis em `/services` ou `/dashboard`.

**Causa Raiz Identificada:**
1. **Formulário Incompleto:** A UI de criação de ofertas (`OffersPage.tsx`) não possui seletores para `VideoFormatId` e `EditingStyleId`
2. **CRUD Ausente:** Não existe interface administrativa para gerenciar `EditingStyles` (apenas `VideoFormats` existe)
3. **Regra de Negócio Bloqueante:** `ServiceBalanceService.ProvisionContractBalanceAsync` retorna sem criar saldo se `videoFormatId == Guid.Empty`

**Impacto no Negócio:**
- Platforma incapaz de entregar valor ao cliente final
- Contratos criados são "papel em branco" sem créditos provisionados
- Queue de edição não é acionada por falta de saldos consumíveis

## 🧠 Estratégia da Solução

**Abordagem em Camadas (3 Passos):**

**Camada 1: Fundação (Editing Styles CRUD)**
- Criar interface administrativa para `EditingStyles` espelhando `VideoFormatsPage`
- Permitir que admins cadastrem, editem e excluam estilos (ex: "Dinâmico", "Corporativo", "Minimalista")
- Endpoint: `/admin/editing-styles`

**Camada 2: Evolução do Formulário (Offers Form)**
- Adicionar dois `<Select>` dinâmicos no dialog de criação de ofertas:
  - Seletor de Formato de Vídeo (via `useVideoFormats()`)
  - Seletor de Estilo de Edição (via `useEditingStyles()`)
- Garantir que `videoFormatId` e `editingStyleId` sejam mapeados no `CreateOfferRequest`

**Camada 3: Validação e Consistência**
- Backend: Validar se `videoFormatId` existe antes de criar oferta
- Frontend: Impedir submissão se formato não selecionado
- Manter `editingStyleId` opcional (pode ser nulo), mas `videoFormatId` obrigatório

**Decisões de Design:**
- **Ordem Cronológica:** EditingStyles CRUD → Formulário de Ofertas → Validação
- **Consistência:** Mesmos padrões de `VideoFormatsPage` (shadcn/ui, TanStack Query)
- **Segurança:** Validação em backend e frontend (defesa em profundidade)

## 🛠️ Implementação Técnica

### Passo 1: CRUD de Editing Styles (`/admin/editing-styles`)

**Backend:**
- [ ] Criar `EditingStylesController.cs` com CRUD completo (GET, POST, PUT, DELETE)
- [ ] Adicionar endpoints em `/api/v1/editing-styles`
- [ ] Incluir validações (Nome obrigatório, Slug único)

**Frontend:**
- [ ] Criar `EditingStylesPage.tsx` em `media8-web/src/pages/admin/`
- [ ] Implementar hooks `useEditingStyles()`, `useCreateEditingStyle()`, `useUpdateEditingStyle()`
- [ ] Componentes: Tabela, Dialog de Criação/Edição, Confirmação de Exclusão
- [ ] Rota: `/admin/editing-styles`

### Passo 2: Evolução do Formulário de Ofertas

**Frontend (`OffersPage.tsx`):**
- [ ] Adicionar imports: `useVideoFormats()`, `useEditingStyles()`
- [ ] Incluir campos no formulário:
  ```typescript
  {
    videoFormatId: string | undefined,
    editingStyleId: string | undefined
  }
  ```
- [ ] Adicionar componentes `<Select>` para:
  - Formato de Vídeo (obrigatório)
  - Estilo de Edição (opcional)
- [ ] Validação: Impedir submit se `videoFormatId` não selecionado

**Backend (`OffersController.cs`):**
- [ ] Validação: `ModelState` deve exigir `VideoFormatId`
- [ ] Manter `EditingStyleId` como nullable (opcional)

### Passo 3: Validação e Consistência

**Backend (`ServiceBalanceService.cs`):**
- [ ] Manter regra: `if (videoFormatId == Guid.Empty) return;`
- [ ] Adicionar log de aviso se provisionamento for pulado

**Frontend:**
- [ ] Toast de erro se backend rejeitar oferta
- [ ] Mensagem clara: "Selecione um formato de vídeo"

## 🎯 Impacto e Resultado

* **Ofertas Completas:** Admin cria ofertas com formato e estilo definidos
* **Saldos Provisionados:** `ServiceBalanceLot` criado corretamente para clientes
* **Experiência do Cliente:** Créditos aparecem em `/dashboard` e `/services`
* **Consistência:** CRUDs padronizados (VideoFormats ↔ EditingStyles)

---

**Nota do Desenvolvedor:**

*Esta correção expõe uma vulnerabilidade comum em sistemas data-driven: a dependência de FKs (Foreign Keys) sem UI adequada para preenchê-las. Quando migrado de enums estáticos para entidades dinâmicas (Fase 0), o sistema passou a depender de `videoFormatId` e `editingStyleId`, mas a UI não acompanhou a mudança. Resultado: dados órfãos no banco. A lição é que migrations de schema devem ser acompanhadas de auditoria imediata em CRUDs de UI. O padrão "se não pode ver, não pode usar" deve ser aplicado: se o admin não consegue selecionar no formulário, o campo não pode ser obrigatório no backend.**

**Risco de Regressão:** Se `editingStyleId` for tornado obrigatório no backend sem UI correspondente, todas as criações de oferta falharão. Manter opcional até que a UI esteja estável.

**Próximo Passo:** Implementar Passo 1 (CRUD de Editing Styles) antes de qualquer modificação em `OffersPage`.

---

## 📋 Checklist de Implementação

### Fase 1: Editing Styles CRUD
- [ ] Backend: `EditingStylesController.cs`
- [ ] Frontend: `useEditingStyles()` hook
- [ ] Frontend: `EditingStylesPage.tsx`
- [ ] Frontend: Rota `/admin/editing-styles`

### Fase 2: Formulário de Ofertas
- [ ] Frontend: Adicionar selects no dialog de ofertas
- [ ] Frontend: Validação de `videoFormatId` obrigatório
- [ ] Backend: Validação de `ModelState`

### Fase 3: Validação
- [ ] Backend: Log de aviso em `ProvisionContractBalanceAsync`
- [ ] Frontend: Toast de erro claro
- [ ] Testes: Criar oferta → atribuir → verificar saldo

---

**Status:** Documentação gerada. Aguardando início da implementação.
