# 001 - Integridade Financeira: Consumo FIFO de Créditos de Serviço

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 13/12/2025

---

## 🚀 Desafio de Engenharia
O sistema precisava garantir que o consumo de créditos (saldos) dos clientes para criação de novos pedidos de vídeo seguisse uma lógica financeira estrita. O desafio principal era garantir a **atomicidade** e a ordem correta de consumo, onde créditos mais antigos ou próximos do vencimento devem ser consumidos primeiro (**FIFO - First-In, First-Out** based on Expiration), evitando prejuízo ao cliente e inconsistências no inventário de serviços.

## 🧠 Estratégia da Solução
Para resolver este problema de concorrência e integridade, a lógica de consumo foi centralizada no Backend, tornando o Frontend agnóstico à regra de negócio complexa.
*   **Decisão Arquitetural**: Implementar um endpoint transacional dedicado (`/consume`).
*   **Segurança**: O consumo é validado no servidor antes da criação do pedido. Se o consumo falha (sem saldo), o pedido não é criado, garantindo consistência.

## 🛠️ Implementação Técnica
A solução Full Stack envolveu:

### Backend (.NET Core)
*   **Algoritmo de Priorização**: Query LINQ ordenada por `ExpiresAt` (ascendente).
*   **Transação de Banco**: O débito nos lotes (`ServiceBalanceLot`) e a persistência do log de uso ocorrem na mesma transação.
*   **API Segura**: O endpoint valida a propriedade do saldo usando Claims do JWT, impedindo consumo cruzado não autorizado.

### Frontend (React + TypeScript)
*   **Feedback Antecipado**: A interface calcula o pré-saldo localmente para feedback visual imediato ("Reels: 3 disponíveis").
*   **Fluxo de 2 Passos**:
    1.  `await serviceBalanceService.consume(...)`
    2.  `if (success) await orderService.create(...)`

## 🎯 Impacto e Resultado
*   **Integridade de Dados**: Eliminação de "pedidos fantasmas" (criados sem saldo real).
*   **Justiça ao Cliente**: Garantia automática de que o cliente sempre usa o crédito que venceria primeiro, melhorando a percepção de valor do serviço.
*   **Manutenibilidade**: A lógica FIFO isolada no Backend permite alterar as regras de consumo (ex: mudar para LIFO ou priorizar tipos específicos) sem alterar uma linha de código no Frontend.

---
**Nota do Desenvolvedor:** *Esta implementação estabeleceu o padrão de transações "two-phase" leves no sistema, balanceando UX rápida com segurança de dados crítica.*
