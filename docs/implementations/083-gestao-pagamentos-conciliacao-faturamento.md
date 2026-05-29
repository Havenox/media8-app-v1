# 083 - [Financeiro/Faturamento]: Gestão de Pagamentos e Conciliação de Faturas

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
No modelo comercial de assinaturas recorrentes e provisionamento de créditos, havia duas limitações arquiteturais:
1. **Acoplamento Financeiro-Operacional**: O ciclo de créditos era provisionado automaticamente sem qualquer registro ou validação física do pagamento do cliente, inviabilizando conciliações fiscais, histórico de fluxo de caixa e o controle do administrador em caso de atraso ou inadimplência.
2. **Falta de Preparação para Webhooks de Gateway**: O motor original não possuía o conceito de "Fatura" (Invoice), tornando complexa e arriscada qualquer integração futura com APIs de pagamentos automatizados (como Stripe ou Asaas), que notificam faturamento de parcelas de forma assíncrona.

## 🧠 Estratégia da Solução
Implementamos a separação clássica de responsabilidades (desacoplamento financeiro) baseada em uma máquina de estados robusta:
* **Entidade de Cobrança (`Invoice`)**: Introduzimos uma nova entidade física no banco de dados para representar as transações financeiras (mensalidades, pacotes ou contratações). A fatura possui status (`Pending`, `Paid`, `Overdue`, `Cancelled`) e detalhes do pagamento (método, código de transação/comprovante e data do pagamento).
* **Bloqueio de Saldo por Faturamento**: O motor de renovação do `ServiceBalanceService` passa a condicionar o provisionamento dos créditos de vídeo à liquidação da fatura do ciclo mensal.
* **Governança Unificada**:
  - **Modo Automático**: Se o switch de confirmação manual estiver desativado, o ciclo vence, gera a fatura como `Paid` de forma automática e libera o saldo.
  - **Modo Conciliação**: Se ativado, o ciclo gera a fatura como `Pending`. O administrador recebe o comprovante do cliente (Ex: Pix, boleto) e clica em "Confirmar Recebimento" na nova tela administrativa, atualizando a fatura para `Paid` e disparando a liberação dos saldos de imediato.
  - **Integração com Webhooks**: Estruturamos as colunas `GatewayInvoiceId` e `TransactionId` para conciliação automática via chamadas de API assíncronas no futuro, sem alterar o frontend ou as regras de provisionamento.

## 🛠️ Implementação Técnica

### Backend (C# / .NET Core)
* **`Invoice.cs` & `SharedEnums.cs`**: Criada a entidade com relacionamentos seguros (`DeleteBehavior.Restrict` para clientes e `DeleteBehavior.SetNull` para contratos) e o enum `InvoiceStatus`.
* **`ApplicationDbContext.cs` & `DependencyInjection.cs`**: Mapeada a tabela `"Invoices"` e os respectivos enums na infraestrutura do Postgres.
* **`ServiceBalanceService.cs`**:
  - `ProvisionContractBalanceAsync`: Gera automaticamente a fatura inicial (`Paid`, `Mês 1`) na criação de contratos (Assinatura, Pacote, Avulso) para manter o caixa íntegro.
  - `RenewSubscriptionCycleAsync`: Busca faturas do ciclo. Se não existirem, cria-as como `Pending` ou `Paid` (conforme configurações do switch). Vincula o provisionamento de novos lotes de saldos de vídeo estritamente ao pagamento da fatura correspondente.
* **`BillingController.cs`**: Adicionados endpoints administrativos `/admin/billing/invoices` (listagem paginada e filtros) e `/confirm-payment` (comprovantes e liquidação manual de transações).

### Frontend (Vite + React)
* **`billing.ts` & `useBilling.ts`**: Definidas tipagens e hooks de consulta paginada e mutações de confirmação de pagamento.
* **`PaymentsPage.tsx`**: Página administrativa estilizada em grid/tabela responsiva de faturamento, com tabs interativas para status, busca textual, badges coloridos e modal para inserção do método e comprovante Pix.
* **`App.tsx`, `Sidebar.tsx`, `MobileNav.tsx`, `Header.tsx`**: Registrada a rota administrativa e adicionados os links visuais integrados no menu lateral, celular e suporte a breadcrumbs no cabeçalho do sistema.

## 🎯 Impacto e Resultado
* **Rastreabilidade de Caixa**: Cada concessão de saldo na plataforma agora possui uma fatura no banco de dados correspondente, fornecendo histórico financeiro completo mesmo se contratos forem arquivados.
* **Flexibilidade Operacional**: O administrador ganha controle absoluto sobre a inadimplência, escolhendo auditar pagamentos Pix individualmente antes de liberar créditos.
* **Preparado para Gateways (Golden Standard)**: A integração com Stripe ou Asaas agora exige apenas um endpoint de webhook simples para marcar faturas como `Paid`, reutilizando toda a lógica de saldos e visualizações do frontend intactas.

---
**Nota do Desenvolvedor:** *O desacoplamento de responsabilidades é a marca registrada de softwares profissionais voltados a escala. Vincular o saldo a faturas nos dá a flexibilidade de mudar de gateway de pagamento ou até mesmo adotar um modelo híbrido (Pix + Cartão) no futuro sem mexer em uma única linha de código do motor de pedidos ou entrega de vídeos.*
