# 087 - [Saldos/Pedidos]: Bloqueio de Saldos por Fatura Pendente (Autoritativo)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia

Para evitar inadimplência e garantir que os créditos de novos ciclos de assinatura não sejam consumidos sem a devida compensação financeira, foi necessário implementar um mecanismo de **bloqueio de saldos** na virada de ciclo. 

Os requisitos fundamentais eram:
1. **Provisionamento Imediato**: O lote de saldo do novo ciclo deve ser gerado imediatamente na virada (para visualização do cliente), mas deve permanecer bloqueado se a respectiva fatura estiver pendente de pagamento.
2. **Autoridade no Backend**: O backend deve ser o validador supremo. Mesmo que o cliente mantenha uma aba aberta com o formulário de pedido por meses, a submissão deve ser recusada de forma estrita no servidor se o saldo estiver bloqueado financeiramente.
3. **Padrão Ouro de UX**: Exibir o lote bloqueado de forma visível e elegante (usando tons amarelos/âmbar para diferenciar de expirados cinzas), desativando o botão de uso ("Usar") e oferecendo um atalho direto ("Pagar Fatura") com redirecionamento de pagamento.

---

## 🧠 Estratégia da Solução

1. **Modelagem de Relacionamento no Banco**:
   * Adicionamos `InvoiceId` (FK opcional) e a respectiva propriedade de navegação `Invoice` na entidade `ServiceBalanceLot`.
   * Mapeamos a relação no `OnModelCreating` do `ApplicationDbContext` com comportamento `OnDelete(DeleteBehavior.SetNull)`.

2. **Bloqueio Autoritativo no Backend**:
   * **Consumo de Saldo**: Em `ServiceBalanceService.ConsumeAsync`, restringimos a query de lotes ativos de forma que apenas lotes com `InvoiceId == null` (créditos avulsos, promocionais ou legados) ou associados a faturas com status `Paid` sejam elegíveis para consumo.
   * **Criação de Pedidos**: Em `OrdersController.Create`, realizamos um eager load da fatura vinculada ao lote (`.Include(x => x.Invoice)`) e arremessamos uma exceção de regra de negócio (`BusinessRuleException` com código `INVOICE_PENDING`) caso a fatura esteja pendente ou atrasada.

3. **Indicação Visual e Ações no Frontend**:
   * **Tipagens**: Atualizamos o tipo `UnifiedServiceBalance` em `types/services.ts` e `ServiceBalanceLot` em `types/api.ts` para mapear `InvoiceId` e `InvoiceStatus` serializados pelo DTO da API.
   * **Estilização de Bloqueio**: Em `ServiceCard.tsx` (modos grid e list row), caso o lote esteja bloqueado (`!!lot.InvoiceId && lot.InvoiceStatus !== 'Paid'`), aplicamos um design premium amarelado/âmbar (`bg-[#FFFDF0] border-amber-200 border-l-amber-500`), barra de progresso cinza neutra, ícone de alerta `AlertTriangle` e descrição em banner contextual.
   * **Atalho Direct-to-Checkout**: Inserimos o botão "Pagar Fatura" no card e no item da lista, redirecionando o cliente para a tela administrativa de conciliação e histórico financeiro `/admin/payments`.
   * **Bloqueio de Formulário**: Em `NewOrderPage.tsx`, desativamos itens bloqueados no dropdown de seleção e exibimos aviso via `toast.error` se o usuário tentar acessar a URL diretamente fornecendo um `lotId` bloqueado via query parameters.

---

## 🛠️ Implementação Técnica

### Backend (ASP.NET Core / Entity Framework Core)
* **`ServiceBalanceLot.cs`**:
  * Inserção das propriedades `InvoiceId` e `Invoice`.
* **`ApplicationDbContext.cs`**:
  * Configuração da relação fluida com `OnDelete(DeleteBehavior.SetNull)`.
* **`ServiceBalanceService.cs`**:
  * Modificação do método `ConsumeAsync` para ignorar lotes com faturas não pagas.
  * Ajuste do fluxo de renovação para vincular imediatamente os lotes criados às respectivas faturas do novo ciclo.
* **`OrdersController.cs`**:
  * Validação explícita no endpoint de criação de pedidos lançando `INVOICE_PENDING` se `Invoice.Status != InvoiceStatus.Paid`.
* **`ServiceBalancesController.cs`**:
  * Eager loading do relacionamento de `Invoice` e mapeamento nos DTOs de retorno.

### Frontend (React / TypeScript)
* **`services.ts` e `api.ts`**:
  * Adição de `InvoiceId` e `InvoiceStatus` nos tipos.
* **`ServiceCard.tsx`**:
  * Implementação da lógica `isBlocked` e `isOverdue`.
  * Criação do visual premium âmbar para diferenciar de expirados acinzentados.
  * Exibição do botão e atalho de dropdown "Pagar Fatura" vinculados à navegação.
* **`NewOrderPage.tsx`**:
  * Desativação de lotes bloqueados no dropdown do formulário e validação com `toast` no pre-select.

---

## 🎯 Impacto e Resultado

* **Proteção de Caixa**: A API se tornou 100% blindada contra consumo de saldos de clientes inadimplentes.
* **Redução de Fricção de Cobrança**: Atalhos visuais no dashboard e na listagem de serviços tornam imediato o fluxo de pagamento pelo cliente, melhorando a saúde financeira do negócio.
* **Experiência de Uso Premium**: A diferenciação elegante por cores (ativos em vinho, pendentes em âmbar e expirados em cinza) fornece clareza visual instantânea.
