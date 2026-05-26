# 072 - Orders: Correção de Renderização e Padronização PascalCase

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 26/05/2026

---

## 🚀 Desafio de Engenharia

A tela de `/orders` apresentava inconsistências de renderização devido a acessos incorretos às propriedades dos objetos em PascalCase. O frontend estava acessando propriedades em camelCase (`order.status`, `order.editor?.name`, `order.serviceType`) enquanto o backend retorna estritamente PascalCase (`Status`, `Editor`, `ServiceBalanceLotId`).

**Problemas específicos identificados:**
1. `OrderDetailPage.tsx:93`: Comparação `order?.status` (undefined) falhava silenciosamente
2. `OrderDetailPage.tsx:398`: `order.editor?.name` não exibia nome do editor
3. `OrderDetailPage.tsx:411`: Campo `serviceType` referenciado mas não existe no DTO `OrderResponse`
4. `orderService.ts:125`: Fallback `?? 24` no `getCancellationWindow` violava política Zero Fallback (Case #071)

## 🧠 Estratégia da Solução

Aplicação rigorosa do princípio **"Backend é a Lei"** (Case #064, #065):

1. **Auditoria de Código**: Varredura sistemática em `OrdersPage.tsx`, `OrderDetailPage.tsx`, `orderService.ts` e `useOrders.ts`
2. **Correção Cirúrgica**: Substituição de todos os acessos camelCase para PascalCase
3. **Remoção de Código Morto**: Eliminação de referências a campos inexistentes (`serviceType`)
4. **Fail-Fast**: Remoção de fallback perigoso no `getCancellationWindow()` para falhar explicitamente se cache falhar

## 🛠️ Implementação Técnica

### Frontend — Componentes

**`OrderDetailPage.tsx` (3 correções):**
- Linha 93: `order?.status` → `order?.Status`
- Linha 398: `order.editor?.name` → `order.Editor?.Name`
- Linha 411-424: Removido bloco inteiro que referenciava `order.serviceType` (campo não existe no backend)

### Frontend — Serviços

**`orderService.ts` (1 correção):**
- Linha 125: Removido fallback `?? 24` do `getCancellationWindow()`, retornando estritamente `response.data`

### Backend (Nenhuma alteração)

- `OrderResponse.cs`: DTO já estava correto em PascalCase
- `OrdersController.cs`: Endpoints já retornavam PascalCase
- `OrderAggregate.cs`: Entity com propriedades PascalCase

## 🎯 Impacto e Resultado

* **Renderização Correta**: Nome do editor agora exibe corretamente (`order.Editor?.Name`)
* **Zero Erros Silenciosos**: Comparações de `Status` funcionam corretamente
* **Consistência de Contrato**: Frontend espelha exatamente `OrderResponse` do backend
* **Fail-Fast**: Sistema falha explicitamente se `CancellationWindowHours` não estiver em cache
* **Código Mais Limpo**: Removido 13 linhas de código morto/ineficiente

## 📋 Contrato Backend Atualizado

**`OrderResponse` (.NET):**
```csharp
public class OrderResponse 
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid? EditorId { get; set; }
    public string Title { get; set; }
    public string Briefing { get; set; }
    public string SourceFilesUrl { get; set; }
    public string? FinalVideoUrl { get; set; }
    public OrderStatus Status { get; set; }
    public Guid VideoFormatId { get; set; }
    public DateOnly Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**`Order` (TypeScript):**
```typescript
export interface Order {
  Id: string;
  ClientId: string;
  EditorId?: string;
  Editor?: User;
  Title: string;
  Briefing: string;
  SourceFilesUrl: string;
  FinalVideoUrl?: string;
  Status: OrderStatus;
  Deadline: string;
  CreatedAt: string;
  UpdatedAt: string;
  VideoFormatId: string;
  ServiceBalanceLotId?: string;
  AssignmentId?: string;
}
```

---

**Nota do Desenvolvedor:** *Esta correção reforça o princípio de que "PascalCase não é negociável" no ecossistema Media8. Cada propriedade em camelCase é uma oportunidade de bug silencioso. A remoção do fallback `?? 24` no `getCancellationWindow()` segue estritamente a política Zero Fallback do Case #071: é preferível que a aplicação falhe explicitamente do que opere com dados incorretos. O campo `serviceType` foi removido pois não existe no contrato atual do backend — se necessário no futuro, deve ser adicionado primeiro no DTO .NET, depois refletido no TypeScript.*
