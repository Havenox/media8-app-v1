# 074 - Domain: Remoção Completa da FK VideoFormatId da Tabela Orders

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 27/05/2026

---

## 🚀 Desafio de Engenharia

Após a implementação do Case Study #073 (remoção do `VideoFormatId` da entidade `Order`), o sistema ainda apresentava um erro crítico em produção:

```
Npgsql.PostgresException (0x80004005): 42703: column o.VideoFormatId does not exist
```

**Problema Raiz:** Mesmo removendo a propriedade `VideoFormatId` da classe `Order` e criar uma migration para remover a coluna do banco, o **EF Core ainda inferia uma FK inexistente** através da propriedade de navegação `public VideoFormat? VideoFormat { get; set; }` que permaneceu na entidade `Order`.

**Sintoma:**
- O `ApplicationDbContextModelSnapshot.cs` (linha 803) ainda continha: `b.HasOne("Media8.Domain.Entities.VideoFormat", "VideoFormat")` para a entidade `Order`
- Isso fazia o EF Core **inventar automaticamente** uma FK chamada `VideoFormatId` em TODAS as queries na tabela `Orders`
- Como a coluna foi removida do banco via migration anterior, o PostgreSQL retornava erro `42703: column o.VideoFormatId does not exist`
- A tela de pedidos do cliente `cliente@cliente.com` retornava erro 500 consistentemente

**Arquitetura Violada:** O princípio do **Snapshot Pattern** estabelece que `VideoFormat` só deve ser usado em dois momentos:
1. **Catálogo**: `Offer.VideoFormatId` (FK existe aqui)
2. **Criação de Contrato**: Copiar `VideoFormat.Name` para `ClientContract.SnapshotVideoFormatName`

Após o contrato ser criado, `VideoFormat` **nunca mais deve ser acessado** diretamente por `Order` ou `ServiceBalanceLot`.

## 🧠 Estratégia da Solução

Aplicação do princípio **"Zero FKs Desnecessárias em Ordens"**:

1. **Remoção da Navegação**: Eliminar `public VideoFormat? VideoFormat { get; set; }` da entidade `Order`
2. **Atualização do Snapshot do EF Core**: Gerar nova migration que sincroniza o snapshot com a realidade do domínio
3. **No-Op Migration**: Como a coluna já foi removida anteriormente, a migration deve ser um **no-op** (apenas atualiza o snapshot sem tentar remover colunas inexistentes)
4. **Fluxo Indireto Preservado**: Quando necessário obter informações de `VideoFormat`, o fluxo deve ser: `Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName`

**Decisão Arquitetural:** O snapshot do `ClientContract` já contém `SnapshotVideoFormatName` e `SnapshotMaxDurationSeconds` - informações imutáveis copiadas da `Offer` no momento da contratação. Não há necessidade de duplicar essa informação em `Order` via FK ou navegação.

## 🛠️ Implementação Técnica

### Backend (3 commits atômicos)

**Commit 1 — `ced6947` (Domain):**
- Removida propriedade de navegação `public VideoFormat? VideoFormat { get; set; }` da entidade `Order`
- Entidade `Order` agora possui apenas navegações estritamente necessárias:
  - `User? Client`, `User? Editor`
  - `ServiceBalanceLot? ServiceBalanceLot`
  - `ClientContract? Contract`
  - `BrandingProfile? BrandingProfile`, `EditingProfile? EditingProfile`
  - `ICollection<OrderTimeline> Timeline`

**Commit 2 — `70d4f07` (Infrastructure Migration):**
- Gerada migration `20260527200448_FixOrderSnapshot` via `dotnet ef migrations add`
- Migration é um **no-op**: não tenta remover colunas/FKs que já não existem
- Atualiza `ApplicationDbContextModelSnapshot.cs` para refletir que `Order` NÃO tem relação com `VideoFormat`
- Aplicada no banco via `dotnet ef database update`

**Commit 3 — `d5e1fe6` (Infrastructure Cleanup):**
- Removida migration antiga `20260527015432_RemoveVideoFormatIdFromOrders.cs` (continha efeitos colaterais)
- Mantida migration limpa `20260527163356_RemoveVideoFormatIdFromOrders.cs` com `DROP COLUMN` manual

### Correção de Testes

**Commit — `7854a72` (Integration Tests):**
- Removida referência ao `VideoFormatId` no teste `OrderCancellationTests.cs`
- Teste agora cria `Order` sem tentar atribuir `VideoFormatId` inexistente

## 🎯 Impacto e Resultado

* **✅ Erro 500 Resolvido**: Tela de pedidos do cliente carrega sem erros de coluna inexistente
* **✅ Snapshot do EF Core Sincronizado**: `ApplicationDbContextModelSnapshot.cs` reflete corretamente que `Order` não tem FK para `VideoFormat`
* **✅ Arquitetura Preservada**: Fluxo indireto `Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName` funciona corretamente
* **✅ Código Mais Limpo**: Entidade `Order` sem navegações desnecessárias, seguindo Lei da Navegação Mínima
* **✅ Migração Segura**: No-op migration previne tentativa de remover colunas já inexistentes

## 📋 Arquitetura Final do Fluxo VideoFormat

```
[Catálogo] Offer.VideoFormatId → VideoFormat (FK existe APENAS aqui)
     ↓
[Criação de Contrato] ClientContract.SnapshotVideoFormatName (copia o NOME, não o ID)
     ↓
[Lote de Saldo] ServiceBalanceLot.ContractId → ClientContract
     ↓
[Pedido] Order.ServiceBalanceLotId → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName
```

**VideoFormatId existe APENAS em:**
- ✅ `Offer.VideoFormatId` (FK do catálogo)
- ✅ `ClientContractsController.cs:171` (usa para buscar o nome e copiar para o snapshot)

**VideoFormatId NÃO existe mais em:**
- ❌ `Order` (entidade)
- ❌ `ServiceBalanceLot` (entidade)
- ❌ `ClientContract` (entidade)
- ❌ Tabela `Orders` (banco de dados)
- ❌ `ApplicationDbContextModelSnapshot` (configuração do EF Core)

---

**Nota do Desenvolvedor:** *Esta correção foi crítica para restaurar a integridade do Snapshot Pattern. A lição aprendida é: **propriedades de navegação no EF Core não são inofensivas** - mesmo sem uma FK explícita na classe, o EF Core pode inferir relações indesejadas e gerar queries quebradas. Sempre que remover uma FK do banco, verifique se TODAS as navegações correspondentes foram removidas das entidades e se o snapshot do EF Core foi atualizado. O fluxo atual segue o princípio de menor conhecimento: `Order` sabe apenas sobre `ServiceBalanceLot`, e este sabe sobre `ClientContract`, que por sua vez contém o snapshot completo. Isso torna o sistema mais coeso, menos propenso a inconsistências, e alinhado com o princípio de que `VideoFormat` é irrelevante após a criação do contrato.*