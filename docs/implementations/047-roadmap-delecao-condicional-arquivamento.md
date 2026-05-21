# 047 - Backend/Frontend: Roadmap para Padrão Arquitetural de Deleção Condicional e Arquivamento

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema Estrutural:** O sistema de exclusão de entidades na Media 8 comportava-se de forma inconsistente: ofertas eram apenas desativadas (soft delete), acumulando registros desnecessários mesmo quando criadas por erro de digitação ou teste e não possuíam dependências. Simultaneamente, a exclusão física direta de registros que já geraram contratos quebraria a integridade relacional do banco de dados.

**Sintoma:** 
- Banco de dados poluído com registros "lixo" (testes, erros de digitação)
- Impossibilidade de limpar entidades órfãs sem risco de quebrar integridade
- UX inconsistente: cada tela lidava com exclusão de forma diferente

**Causa Raiz:** Ausência de um **padrão arquitetural unificado** para governança do ciclo de vida de entidades (criação, arquivamento, purga).

**Impacto no Negócio:**
- Dificuldade de administração em produção
- Risco de corrupção de dados históricos
- Experiência do administrador inconsistente e confusa

## 🧠 Estratégia da Solução

**Abordagem:** Implementar um **Padrão Arquitetural de Plataforma (Global UX/Domain Pattern)** que unifica o comportamento de exclusão em toda a aplicação, substituindo decisões ad-hoc por regras previsíveis e seguras.

**Premissas Imutáveis (Leis de Governança):**

1. **Governança de Dados Estrítica (Nível 1):**
   - Entidades críticas (`Users`, `ClientContracts`) **JAMAIS** aceitam `Hard Delete`
   - São patrimônio histórico e contábil da Media 8
   - Máximo permitido: `Soft Delete` (arquivamento via `IsActive = false` ou `Status = Cancelled`)

2. **Deleção Condicional Autônoma (Nível 2):**
   - Para demais entidades (`Offers`, `VideoFormats`, `EditingStyles`):
     - **Sem dependências:** `Hard Delete` (limpeza física do banco)
     - **Com dependências:** `Soft Delete` (blindagem, arquivamento)
   - Verificação automática de chaves estrangeiras antes de qualquer exclusão

**Decisões de Design:**
- **Padronização:** Mesma UX em todas as telas (Abas "Ativos" / "Arquivados")
- **Segurança:** Confirmação com timer de 5s para `Hard Delete` (previne cliques acidentais)
- **Transparência:** UI informa claramente por que entidade foi arquivada vs. deletada
- **Auditoria:** Logs de quem arquivou, quando, e se houve tentativa de purga

## 🛠️ Implementação Técnica

### Roadmap em Fases

#### **Fase 1: Ofertas Comerciais (Offers)**
**Entidade Piloto** - Implementação completa do padrão

**Backend:**
- [ ] `OffersController.cs`: Modificar `DeleteOffer` para:
  - Verificar se `ClientContracts` ou `ServiceBalanceLots` referenciam a oferta
  - Se sim: `Soft Delete` (arquivar via `IsPublic = false` ou `Status = Archived`)
  - Se não: `Hard Delete` (`_context.Offers.Remove()`)
  - Retornar status da operação com motivo

**Frontend:**
- [ ] `OffersPage.tsx`: Implementar abas:
  - **Aba "Ativos":** Ofertas com `IsPublic = true` ou `Status = Active`
  - **Aba "Arquivados":** Ofertas com `IsPublic = false` ou `Status = Archived`
- [ ] Dialog de Exclusão:
  - Se `canHardDelete`: Exibir botão "Excluir Definitivamente" com timer de 5s
  - Se `cannotHardDelete`: Exibir mensagem "Arquivada - Possui contratos vinculados"
- [ ] Timer visual: Progress bar ou countdown (5s) antes de liberar clique
- [ ] Confirmação: Modal "Tem certeza? Esta ação é irreversível."

**DTOs:**
- [ ] Adicionar `bool CanHardDelete` em `OfferResponse`
- [ ] Adicionar `string? ArchiveReason` para auditoria

#### **Fase 2: Replicação para Formatos e Estilos**
**Consistência de UX** - Mesmas regras de Fase 1

**Entidades:**
- `VideoFormats`
- `EditingStyles`

**Backend:**
- [ ] `VideoFormatsController`: Verificar `Offers` vinculados
- [ ] `EditingStylesController`: Verificar `Offers` vinculados

**Frontend:**
- [ ] `VideoFormatsPage.tsx`: Abas "Ativos" / "Arquivados"
- [ ] `EditingStylesPage.tsx`: Abas "Ativos" / "Arquivados"
- [ ] Reutilizar componente de Dialog com timer (criar `ConfirmDeleteDialog.tsx`)

#### **Fase 3: Usuários (Entidade Crítica)**
**Governança Estrita** - Sem `Hard Delete`, apenas arquivamento

**Entidades:**
- `Users` (Tabela crítica, sem exceções)

**Backend:**
- [ ] `UsersController`: Bloquear `Hard Delete` explicitamente
- [ ] Implementar `Soft Delete` via:
  - `IsActive = false`
  - `UserRoles` removidos ou marcados
  - `ClientContracts` mantidos (integridade)
- [ ] Mover para aba "Arquivados" na listagem

**Frontend:**
- [ ] `UsersPage.tsx`: Abas "Ativos" / "Arquivados"
- [ ] Botão "Desativar Usuário" (nunca "Excluir")
- [ ] Mensagem clara: "Usuários arquivados não podem ser excluídos (histórico preservado)"

### Regras de Verificação de Dependências

**Para cada entidade, verificar:**

| Entidade | Dependências Críticas | Ação se Houver Dependência |
|----------|----------------------|----------------------------|
| `Offer` | `ClientContracts`, `ServiceBalanceLots` | `Soft Delete` (arquivar) |
| `VideoFormat` | `Offers`, `ServiceBalanceLots` | `Soft Delete` (arquivar) |
| `EditingStyle` | `Offers` | `Soft Delete` (arquivar) |
| `User` | `ClientContracts`, `Orders`, `ServiceBalanceLots` | `Soft Delete` (obrigatório) |
| `ClientContract` | `ServiceBalanceLots`, `Orders` | `Soft Delete` (obrigatório) |

### Componentes de UI (Frontend)

**Criar componentes reutilizáveis:**
- [ ] `ConfirmDeleteDialog.tsx`: Dialog com timer de 5s
- [ ] `ArchivedItemsTab.tsx`: Aba de arquivados com lista e ações
- [ ] `EntityStatusBadge.tsx`: Badge com status (Ativo, Arquivado, Excluído)

**Padrão de Abas:**
```
[Ativos (X)] [Arquivados (Y)]
```
- Contadores dinâmicos
- Filtro automático por status

## 🎯 Impacto e Resultado

* **Consistência de UX:** Todas as telas seguem mesmo padrão de arquivamento/exclusão
* **Segurança de Dados:** Impossível deletar entidades críticas acidentalmente
* **Limpeza Automática:** Entidades sem dependências são removidas fisicamente (banco mais leve)
* **Auditoria Completa:** Logs de quem arquivou, quando, e motivo
* **Governança:** Políticas claras de ciclo de vida de dados

---

**Nota do Desenvolvedor:**

*Este padrão representa a maturidade da plataforma Media 8. Em vez de tratar cada entidade como um caso especial, estabelecemos leis de governança que se aplicam uniformemente. A regra de ouro é: "Dados históricos são sagrados; dados de configuração são descartáveis se não houver dependências". A implementação em fases (Ofertas → Formatos/Estilos → Usuários) permite validação incremental e ajuste de UX antes de aplicar a entidades críticas. O timer de 5s é intencional: cria atrito cognitivo para prevenir erros, mas não é longo o suficiente para frustrar admins experientes.*

**Próximos Passos:**
1. Implementar Fase 1 (Ofertas) com commits atômicos
2. Criar testes de integração para verificação de dependências
3. Documentar UX em guia de padrões (docs/PATTERNS.md)
4. Replicar para Formatos e Estilos
5. Implementar Fase 3 (Usuários) com blindagem máxima

---

## 📋 Checklist de Implementação

### Fase 1: Ofertas (Piloto)
- [ ] Backend: `OffersController.Delete` com verificação de dependências
- [ ] Backend: Retornar `CanHardDelete` no response
- [ ] Frontend: `OffersPage` com abas "Ativos" / "Arquivados"
- [ ] Frontend: Dialog com timer de 5s
- [ ] Testes: Criar oferta → Atribuir → Tentar deletar (deve arquivar)
- [ ] Testes: Criar oferta → Não atribuir → Deletar (deve remover fisicamente)

### Fase 2: Formatos e Estilos
- [ ] Backend: `VideoFormatsController` com verificação
- [ ] Backend: `EditingStylesController` com verificação
- [ ] Frontend: `VideoFormatsPage` com abas
- [ ] Frontend: `EditingStylesPage` com abas
- [ ] Componente: `ConfirmDeleteDialog` reutilizável

### Fase 3: Usuários
- [ ] Backend: `UsersController` bloqueia `Hard Delete` explicitamente
- [ ] Backend: `Soft Delete` via `IsActive = false`
- [ ] Frontend: `UsersPage` com abas
- [ ] Frontend: Mensagem "Usuários não podem ser excluídos"
- [ ] Testes: Tentar deletar usuário com contratos (deve falhar)

### Documentação
- [ ] Atualizar `docs/ARCHITECTURE.md` com seção "Governança de Dados"
- [ ] Criar `docs/PATTERNS.md` com padrão de arquivamento
- [ ] Atualizar `docs/DATABASE_SCHEMA.md` com regras de integridade

---

**Status:** Documentação gerada. Aguardando início da implementação da Fase 1.
