# 093 - [Contratos]: Governança de Faturamento, Bloqueio por Inadimplência e Saldos Esgotados

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
A relação contratual no Media8 demandava regras rígidas de faturamento e governança comercial para evitar o consumo de créditos por inadimplentes. Tínhamos os seguintes desafios críticos de negócio e arquitetura:
1. **Falta de Bloqueio**: Clientes com faturas em aberto (`Pending` ou `Overdue`) podiam abrir novos pedidos livremente.
2. **Estilização Errada de Saldo**: Contratos com créditos esgotados mas com prazo restante continuavam ativos na tela, confundindo o cliente ao invés de aparecerem acinzentados como `(Esgotado)`.
3. **Cálculo Falso de Vigência**: Assinaturas exibiam incorretamente a data de vencimento como "Sem Prazo", quando na verdade deveriam computar o encerramento do período de fidelidade comercial.
4. **Falta de Pré-Seleção de Lote**: Ao clicar em realizar novo pedido, o usuário era levado ao formulário em branco, sem pré-selecionar o saldo e lote de origem.
5. **Problema Crítico de Paginação e Ordenação**: Contratos com faturas vencidas deveriam aparecer no topo absoluto da lista, ordenados da fatura mais antiga para a mais recente. No entanto, por virem em posições aleatórias da API baseada em paginação, contratos inadimplentes antigos acabavam sendo empurrados para a página 2 da API, inviabilizando a priorização imediata na tela do usuário.

## 🧠 Estratégia da Solução
Construímos um pipeline unificado de governança comercial no backend e no frontend:
1. **Regras de Negócio no DTO**: Adicionamos propriedades ao DTO `ClientContractResponse` para rastrear o ID do lote ativo (`ActiveLotId`), saldo remanescente (`ActiveLotRemainingQuantity`), a existência de faturas pendentes (`HasPendingInvoice`) e a data da fatura em aberto mais antiga (`OldestUnpaidInvoiceDueDate`).
2. **Priorização na API Paginada**: Reescrevemos a ordenação do EF Core diretamente nos endpoints de listagem paginada (`GetAllContracts` e `GetMyContracts`) para forçar com que contratos com faturas em aberto sejam ordenados primeiro na base de dados, garantindo que apareçam na página 1.
3. **Bloqueio e Rótulos Customizados**: Estilização visual premium para esmaecer contratos esgotados (depleted), exibir avisos animados de cobrança, bloquear o fluxo de novo pedido e automatizar a pré-seleção de lotes através de parâmetros de query.

## 🛠️ Implementação Técnica

### Backend (C# / .NET Core / EF Core)
* **DTO e Mapeamento (`ClientContractResponse`)**:
  - `ActiveLotId`: Captura por projeção (FIFO) o primeiro lote de saldo ativo não expirado ou o mais recente como fallback.
  - `ActiveLotRemainingQuantity`: Soma a quantidade restante de todos os lotes ativos não expirados.
  - `HasPendingInvoice`: Verifica a existência de alguma fatura vinculada com status `Pending` ou `Overdue`.
  - `OldestUnpaidInvoiceDueDate`: Computa o menor `DueDate` das faturas abertas do contrato.
* **Ordenação Complexa na Query Paginada**:
  ```csharp
  query = query
      .OrderByDescending(cc => _context.Invoices.Any(i => i.ContractId == cc.Id && (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.Overdue)))
      .ThenBy(cc => _context.Invoices
          .Where(i => i.ContractId == cc.Id && (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.Overdue))
          .Min(i => (DateTime?)i.DueDate))
      .ThenByDescending(cc => cc.AssignedAt);
  ```

### Frontend (React / TypeScript)
* **Interface `ClientContract` (`offers.ts`)**: Tipados os novos campos originados do DTO do backend.
* **Cálculo Dinâmico de Expiração**:
  - Estima o encerramento do contrato somando os meses correspondentes a `SnapshotWarrantyDays` (fidelidade) à data `AssignedAt`.
  - Diferenciação de rótulo para planos recorrentes: exibe "Encerra:"/"Encerrou em:" ao invés de "Expira:"/"Expirou em:".
* **Visualização de Esgotamento**: Se `ActiveLotRemainingQuantity === 0` e o contrato está vigente, renderiza o sufixo `(Esgotado)` no rodapé e aplica o visual acinzentado (grey-out).
* **Bloqueio por Inadimplência**: Se `HasPendingInvoice` for verdadeiro:
  - Exibe a mensagem pulsante em vermelho `"Fatura Pendente: Aguardando pagamento"`.
  - Desabilita (`disabled`) e bloqueia visualmente o botão "Novo Pedido".
* **Parâmetro de Link**: O botão "Novo Pedido" agora aponta para `/orders/new?lotId=${contract.ActiveLotId}`, pré-selecionando o lote e o respectivo saldo na tela de checkout.
* **Ordenação Unificada**: Implementado pós-processamento robusto de ordenação no frontend para organizar os contratos e saldos de serviços colocando os inadimplentes no topo absoluto, seguidos pelos ativos, e deixando os esgotados/expirados por último.

## 🎯 Impacto e Resultado
* **Segurança Financeira Integrada**: Clientes com faturas em atraso ficam impossibilitados de consumir edições adicionais imediatamente, forçando a regularização financeira.
* **Navegação Inteligente**: Ao clicar em novo pedido a partir do contrato, a pré-seleção poupa cliques e elimina erros humanos de escolha de saldo.
* **Integridade de Paginação**: A API paginada garante que os casos urgentes (inadimplência) apareçam no topo mesmo com milhares de registros salvos no banco.
* **Comunicação Transparente**: Indicação clara de prazos de fidelidade ("Encerra:") e prazos restantes, elevando a experiência do usuário (UX) a um patamar premium.

---
**Nota do Desenvolvedor:** *A governança comercial não deve ser um atrito chato para o usuário, mas sim uma sinalização transparente. Ao mesclarmos bloqueio de checkout, avisos informativos sutis e priorização automatizada na API paginada, garantimos a integridade do caixa do negócio mantendo o sistema limpo, reativo e intuitivo.*
