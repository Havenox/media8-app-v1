# Guia de Uso: Gestão de Pagamentos e Conciliação Financeira (Invoices)

Este documento atua como manual operacional para administradores e guia técnico de integração para desenvolvedores. Ele detalha o funcionamento do motor de faturamento (`Invoices`) do Media8, que separa fisicamente o faturamento financeiro do provisionamento de créditos de vídeo.

---

## 1. Visão Geral da Arquitetura (Padrão Ouro de Mercado)

Para garantir flexibilidade de expansão e prevenção a fraudes de saldo, o sistema implementa a separação de responsabilidades:
* **Faturamento (Invoice)**: Controla a geração de cobranças (Mensalidades, Pacotes ou Avulsos) com vencimentos, valores e status (`Pending`, `Paid`, `Overdue`, `Cancelled`).
* **Provisionamento (ServiceBalanceLot)**: Controla o direito de uso dos créditos de vídeo. **O saldo de um ciclo só é liberado para o cliente se a fatura correspondente estiver marcada como `Paid` (Paga).**

```
[Contrato de Assinatura]
        │
        ├──► [Mês 1: Invoice Paga]  ──────► [Provisiona Lote de Saldo Mês 1]
        │
        ├──► [Mês 2: Invoice Pendente] ───► (Sem saldo liberado - Aguarda Pagamento)
        │                                             │
        │                                  [Admin Confirma Pix/Boleto]
        │                                             ▼
        └──► [Mês 2: Invoice Paga]  ──────► [Provisiona Lote de Saldo Mês 2]
```

---

## 2. Manual Operacional do Administrador

O fluxo de conciliação financeira e liberação de créditos pode ser operado em dois modos distintos através do switch na tela **Configurações do Sistema**:

### A. Modo Automatizado (`Confirmação de Pagamento Manual = Desativado`)
* **Fluxo**: Ao expirar um lote de créditos de assinatura, o `BackgroundService` em segundo plano gera uma fatura com status `Paid` e **libera automaticamente** o novo lote de créditos de vídeo correspondente.
* **Uso Indicado**: Ideal quando os clientes pagam via cartão de crédito recorrente ou quando não há necessidade de auditoria prévia do faturamento.

### B. Modo Manual (`Confirmação de Pagamento Manual = Ativado`)
* **Fluxo**: Ao expirar um lote de créditos:
  1. O `BackgroundService` gera uma fatura com status `Pending` (Pendente) na tela **Gestão de Pagamentos**.
  2. Nenhum crédito de vídeo é provisionado para o cliente (bloqueando a criação de novos pedidos se ele não possuir saldos anteriores).
  3. O cliente envia o comprovante de pagamento Pix, Boleto ou Transferência diretamente para o suporte.
  4. O Administrador acessa a aba **Gestão de Pagamentos** no menu lateral, localiza a fatura do cliente, clica em **"Confirmar"**, escolhe o método de pagamento e insere o ID de transação/comprovante.
  5. O status da fatura é atualizado para `Paid` (Pago), e os créditos de vídeo do novo ciclo são injetados na conta do cliente instantaneamente.

---

## 3. Guia de Integração para Desenvolvedores (Gateways de Pagamento)

O sistema foi blindado para permitir a conexão síncrona ou assíncrona (via Webhooks) de qualquer gateway de faturamento (Stripe, Asaas, Mercado Pago, etc.) sem alterar regras de domínio ou layouts frontend.

### Estrutura de Tabelas (Postgres)
A tabela `Invoices` possui chaves estrangeiras com comportamento seguro:
* `ClientId` (FK para `Users` - `DeleteBehavior.Restrict`): Impede a deleção de clientes com faturamento ativo.
* `ContractId` (FK para `ClientContracts` - `DeleteBehavior.SetNull`): Preserva o histórico financeiro mesmo que o contrato seja excluído/cancelado.

### Endpoints da API Administrativa (`BillingController`)

#### 1. Listar Faturas
* **Rota**: `GET /api/v1/admin/billing/invoices`
* **Permissão**: `Admin`
* **Query Params**:
  - `page` (int - padrão 1)
  - `pageSize` (int - padrão 10)
  - `status` (Enum - Pending, Paid, Overdue, Cancelled)
  - `search` (string - busca por email, nome de cliente ou descrição)

#### 2. Confirmar Pagamento Manual / Via Gateway
* **Rota**: `POST /api/v1/admin/billing/invoices/{id}/confirm-payment`
* **Permissão**: `Admin` (ou endpoint público de webhook se devidamente assinado com JWT/Secret)
* **Payload**:
  ```json
  {
    "PaymentMethod": "Pix",
    "TransactionId": "E1234567890202605282200000abc"
  }
  ```

### Como implementar a Integração com Gateway no Futuro:
1. **Associação de IDs**: Ao criar um contrato ou iniciar um plano, envie os dados do cliente ao gateway e guarde o ID retornado na coluna `GatewayInvoiceId`.
2. **Endpoint de Webhook**: Crie um controller público `WebhooksController.cs` sem autenticação JWT (mas validando a assinatura do gateway por chave secreta).
3. **Tratamento de Evento**:
   - Ao receber o evento `invoice.paid` ou `billing.payment_received`:
     ```csharp
     // 1. Busca a fatura pelo ID do Gateway
     var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.GatewayInvoiceId == event.InvoiceId);
     
     // 2. Chama a confirmação de pagamento
     invoice.Status = InvoiceStatus.Paid;
     invoice.PaidAt = DateTime.UtcNow;
     invoice.PaymentMethod = event.PaymentMethod; // "CreditCard", "Pix"
     invoice.TransactionId = event.TransactionId;
     await _context.SaveChangesAsync();
     
     // 3. Dispara a concessão automática de créditos
     if (invoice.ContractId.HasValue)
     {
         await _serviceBalanceService.RenewSubscriptionCycleAsync(invoice.ContractId.Value, isManualAdminAction: true);
     }
     ```
4. Essa arquitetura desacoplada garante que **zero linhas** de lógica de saldo de vídeos precisem ser reescritas para plugar novos meios de faturamento automatizados.
