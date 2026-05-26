# 02 - Lógica de Negócio e Domínio

> **Objetivo**: Documentar a "joia da coroa" do Media 8 — as regras de negócio complexas que diferenciam o sistema.

---

## 1. Visão Geral do Domínio

O Media 8 gerencia **dois ciclos de vida** principais:

1. **Ciclo de Vida do Cliente**: Compra → Atribuição → Edição → Entrega
2. **Ciclo de Vida Financeiro**: Depósito → Saldo → Contrato → Consumo

---

## 2. Entidades Core

### 2.1. User (Cliente/Editor/Admin)
```csharp
public class User {
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public ICollection<UserRole> Roles { get; set; } // N:N
    public ICollection<ClientContract> Contracts { get; set; }
}
```

**Regra de Negócio**: Um usuário pode ter **múltiplos roles** (Admin, Client, Editor), mas apenas **um role ativo** por vez.

### 2.2. Offer (Catálogo)
```csharp
public class Offer {
    public int Id { get; set; }
    public string Name { get; set; } // ex: "Reels Estendido"
    public int VideoQuantity { get; set; } // ex: 20 créditos
    public decimal Price { get; set; }
    public ContractType ContractType { get; set; } // Pacote vs Assinatura
    public ICollection<VideoFormat> Formats { get; set; } // N:N
    public bool IsActive { get; set; }
}
```

**Regra de Negócio**: Ofertas podem ser arquivadas (`IsActive = false`) mas **nunca excluídas** se possuirem contratos ativos.

### 2.3. ClientContract (Contrato de Cliente)
```csharp
public class ClientContract {
    public int Id { get; set; }
    public Guid ClientId { get; set; }
    public int OfferId { get; set; }
    
    // Snapshot Comercial
    public string SnapshotOfferName { get; set; }
    public int SnapshotVideoQuantity { get; set; }
    public ContractType ContractType { get; set; }
    
    // Snapshot Técnico
    public string SnapshotVideoFormatName { get; set; }
    public string SnapshotEditingStyleName { get; set; }
    public int SnapshotMaxDurationSeconds { get; set; }
    
    public DateTime AssignedAt { get; set; }
    public AssignmentStatus Status { get; set; }
}
```

**Regra de Negócio Crítica**: O contrato **preserva o estado exato** da offer no momento da venda. Mudanças futuras na offer **não afetam** contratos existentes.

### 2.4. ServiceBalanceLot (Lote de Saldo)
```csharp
public class ServiceBalanceLot {
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public int Quantity { get; set; } // ex: 20 créditos
    public int RemainingQuantity { get; set; }
    public ClientContract Contract { get; set; } // Vínculo com contrato
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}
```

**Regra de Negócio**: Múltiplos lotes podem coexistir para um mesmo usuário. O consumo segue **FIFO** (First-In-First-Out) por data de expiração.

### 2.5. VideoFormat (Catálogo Dinâmico)
```csharp
public class VideoFormat {
  public Guid Id { get; set; } = Guid.NewGuid();
  public string Name { get; set; } = string.Empty;      // ex: "Reels Estendido"
  public string Slug { get; set; } = string.Empty;      // ex: "reels-estendido"
  public int MaxDurationSeconds { get; set; }           // ex: 180 segundos
  public bool IsActive { get; set; } = true;
  public bool CanDeletePermanently { get; set; }        // Verifica dependências
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

**Regras de Negócio**:
- **Slug Único**: Slugs devem ser únicos em todo o catálogo
- **Duração Máxima**: Define limite superior para uploads de clientes
- **Soft Delete**: Formatos com ofertas ativas não podem ser excluídos permanentemente
- **Sem Navegação Reversa**: `VideoFormat` não conhece `Offer` nem `EditingStyle` (Lei da Navegação Mínima)
- **Referência**: [Case Study 069](implementations/069-remocao-campos-legados-videoformat.md), [Case Study 070](implementations/070-correcao-navegacao-reversa-editingstyle.md)

### 2.6. EditingStyle (Estilos de Edição)
```csharp
public class EditingStyle {
  public Guid Id { get; set; } = Guid.NewGuid();
  public string Name { get; set; } = string.Empty;      // ex: "Simples", "Profissional"
  public string Description { get; set; } = string.Empty;
  public bool IsActive { get; set; } = true;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
  // SEM navegação VideoFormats - evita FK indevida
}
```

**Regra de Negócio Crítica**:
- **Navegação Unidirecional**: `EditingStyle` não gerencia navegação para `VideoFormats`
- **Motivo**: Evita que EF Core crie FK `EditingStyleId` em `VideoFormats`
- **Exceção**: A relação `Offer.EditingStyle` é unidirecional (de `Offer` para `EditingStyle`)

### 2.7. Order (Pedido de Edição)
```csharp
public class Order {
  public int Id { get; set; }
  public Guid ClientId { get; set; }
  public Guid? EditorId { get; set; }
  public string Title { get; set; }
  public OrderStatus Status { get; set; } // Draft → Pending → InProgress → Approved
  public int VideoFormatId { get; set; }
  public DateTime Deadline { get; set; }
  public string RawFootageUrl { get; set; }
  public string FinalVideoUrl { get; set; }
}
```

**Regra de Negócio**: Pedidos podem ser cancelados pelo cliente dentro de uma **janela de cancelamento** configurável (ex: 24h).

---

## 3. Fluxos Complexos

### 3.1. Criação de Pedido com Consumo de Saldo

```
1. Cliente seleciona "Novo Pedido"
2. Sistema valida:
   - Client has active contracts? (ServiceBalanceLot)
   - Saldo disponível > 0?
3. Se válido:
   - Cria Order em status "Draft"
   - Debita 1 crédito do lote mais antigo (FIFO)
   - Atualiza `RemainingQuantity` do lote
4. Se inválido:
   - Retorna 400 Bad Request com mensagem educativa
   - Redireciona para página de contratação
```

**Código de Validação**:
```csharp
// ServiceBalanceService.cs
public async Task<ConsumeResult> ConsumeService(Guid userId, int videoFormatId)
{
    var oldestLot = await GetOldestActiveLot(userId, videoFormatId);
    if (oldestLot == null || oldestLot.RemainingQuantity <= 0)
        return ConsumeResult.NoBalance;
    
    oldestLot.RemainingQuantity--;
    await _context.SaveChangesAsync();
    
    return ConsumeResult.Success;
}
```

### 3.2. Atribuição de Editor (Máquina de Estados)

```
Order.Draft → Order.Pending → Order.InProgress → Order.Approved
     ↓              ↓              ↓                ↓
  Rascunho   Aguardando    Sendo Editado    Concluído/Entregue
             Editor
```

**Transições Válidas**:
- `Draft → Pending`: Cliente submete pedido
- `Pending → InProgress`: Editor atribuído aceita
- `InProgress → Approved`: Editor envia versão final
- `Approved → Draft`: Cliente solicita revisão (loop)

### 3.3. Cancelamento de Pedido com Timer

```typescript
// Frontend: valdidateCancelOrder.ts
export const validateCancelOrder = (order: Order, settings: Settings) => {
  const deadline = new Date(order.Deadline);
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDeadline < settings.CancellationWindowHours) {
    throw new Error("Pedido muito próximo do prazo - cancelamento indisponível");
  }
  
  if (order.Status !== 'Pending' && order.Status !== 'Draft') {
    throw new Error("Apenas pedidos em rascunho ou pendentes podem ser cancelados");
  }
};
```

---

## 4. Configurações Dinâmicas (Settings)

O sistema possui uma tabela `SystemSettings` que armazena regras de negócio **ajustáveis sem deploy**:

| Chave | Tipo | Valor Exemplo | Descrição |
|-------|------|---------------|-----------|
| `CancellationWindowHours` | int | `24` | Horas mínimas antes do deadline para cancelamento |
| `MaxUploadSizeMB` | int | `500` | Tamanho máximo de upload de vídeo |
| `AllowedFileTypes` | string | `.mp4,.mov,.avi` | Extensões permitidas |

**Acesso via API**:
```csharp
[HttpGet("settings")]
public async Task<ActionResult<SystemSettings>> GetSettings()
{
    var settings = await _settingsService.GetAsync();
    return Ok(settings);
}
```

---

## 5. Regras de Negócio Críticas

### 5.1. FIFO de Saldos
- **Regra**: Sempre consumir do lote **mais antigo** primeiro
- **Motivo**: Evita que créditos expirem sem uso
- **Implementação**: `ORDER BY ExpiresAt ASC` na query

### 5.2. Blindagem de Contrato
- **Regra**: Contrato **nunca** muda após criação
- **Motivo**: Preserva termos acordados na venda
- **Implementação**: Snapshot completo no `ClientContract`

### 5.3. Exclusão Condicional
- **Regra**: Offers/Formats/Styles só podem ser excluídos se:
  - Não possuirem contratos ativos vinculados
  - Timer de 5 segundos tiver expirado (prevenção de clique acidental)
- **Implementação**: Validação em cascata antes de `DELETE`

---

## 6. Referências

- [Snapshot Pattern (Case #016)](implementations/016-arquitetura-snapshot-contratos.md)
- [Order Cancellation UX (Case #059)](implementations/059-ux-cancelamento-pedidos-com-timer-e-validacao.md)
- [Dynamic Settings (Case #058)](implementations/058-configuracoes-dinamicas-sistema-completo.md)
