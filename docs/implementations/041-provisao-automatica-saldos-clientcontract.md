# 041 - Backend: Provisão Automática de Saldos na Criação de ClientContract

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Após a migração completa para a arquitetura `Offers/ClientContracts`, identificou-se uma quebra crítica no fluxo de negócio: a criação de um `ClientContract` (tabela `ClientContracts`) **não estava disparando a criação automática dos lotes de saldo** (tabela `ServiceBalanceLots`).

**Problema:** O cliente logado não visualizava seus serviços na página `/services` porque o inventário de balanço permanecia vazio, mesmo após a atribuição de um contrato pelo admin. A regra de negócio que traduz as propriedades da `Offer` (quantidade de vídeos, validade, etc.) para entradas em `ServiceBalanceLots` estava ausente ou desconectada.

**Impacto:** Usuários com contratos ativos não conseguiam consumir seus créditos de edição, tornando a plataforma inútil para o propósito principal de consumo de serviços.

## 🧠 Estratégia da Solução

A solução adotada foi implementar um **método de provisão** (`ProvisionContractBalance`) no `ServiceBalanceService`, chamado imediatamente após a persistência do contrato, dentro da mesma unidade de trabalho (transação).

**Decisões de Design:**
- **Atomicidade:** Se a criação do saldo falhar, o contrato é removido (rollback manual)
- **Separação de Responsabilidades:** `ClientContractsController` gerencia contratos; `ServiceBalanceService` gerencia saldos
- **Rastreabilidade:** Cada `ServiceBalanceLot` referencia o `ClientContract` via `AssignmentId`
- **Edge Cases:** Se a oferta não tiver `VideoFormatId`, não cria saldo (evita dados órfãos)
- **Validade Automática:** Data de expiração calculada com base no `ValidityDays` da oferta

## 🛠️ Implementação Técnica

### Backend (`media8-api`)

**1. `IServiceBalanceService.cs` (Interface)**
- Adicionado método `Task ProvisionContractBalanceAsync(ClientContract contract, Offer offer)`
- Documentação XML para clareza do propósito

**2. `ServiceBalanceService.cs` (Implementação)**
- Implementado método `ProvisionContractBalanceAsync`:
  - Calcula data de expiração baseada em `offer.ValidityDays`
  - Verifica se `VideoFormatId` existe (caso contrário, retorna sem criar)
  - Cria `ServiceBalanceLot` com:
    - `UserId = contract.ClientId`
    - `VideoFormatId = offer.VideoFormatId`
    - `Quantity = offer.VideoQuantity`
    - `ExpiresAt = contract.ActivatedAt + offer.ValidityDays`
    - `AssignmentId = contract.Id` (FK para ClientContract)
    - `Source = LotSource.Purchase`

**3. `ClientContractsController.cs`**
- Adicionada injeção de dependência de `IServiceBalanceService`
- Método `CreateContract` agora chama `ProvisionContractBalanceAsync` após salvar contrato
- Tratamento de erro: se provisionar falhar, remove contrato e retorna `500 Internal Server Error`

### Entidades Envolvidas
- `ClientContract`: Ganhou navegação `ServiceBalanceLots` (ICollection)
- `ServiceBalanceLot`: FK `AssignmentId` referencia `ClientContract.Id`
- `Offer`: Fonte dos dados para snapshot e cálculo de validade

### Validações
- **Build:** 0 erros, 11 warnings (MSB3277 - unificação de assemblies, não crítico)
- **Testes de Integração:** 3/3 passando (ClientContractsControllerTests)
- **TypeScript:** N/A (backend only)

## 🎯 Impacto e Resultado

* **Fluxo Completo:** Criação de contrato agora popula automaticamente `ServiceBalanceLots`
* **Experiência do Cliente:** Usuário final visualiza créditos imediatamente após atribuição
* **Integridade de Dados:** FK entre `ServiceBalanceLot.AssignmentId` e `ClientContract.Id` garante rastreabilidade
* **Resiliência:** Se provisionar falhar, contrato é removido (atomicidade)
* **Edge Case Handling:** Validação de `VideoFormatId` previne dados corrompidos

---

**Nota do Desenvolvedor:**

*A separação entre `ClientContract` (direito contratual) e `ServiceBalanceLot` (inventário consumível) é intencional e segue o princípio de responsabilidades únicas. O contrato é imutável e histórico; o saldo é dinâmico e consumível. Esta divisão permite que múltiplos contratos gerem múltiplos lotes de saldo, e que o consumo FIFO funcione corretamente. A validação de `VideoFormatId` é crítica: sem ela, a plataforma alocaria créditos sem formato de vídeo associado, quebrando o fluxo de consumo no frontend.**

**Próximo Passo Sugerido:** Implementar endpoint de "reparação" para recriar saldos de contratos que porventura não tenham sido provisionados corretamente durante migrações ou falhas pontuais.
