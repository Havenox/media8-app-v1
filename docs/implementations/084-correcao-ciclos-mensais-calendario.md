# 084 - [Assinaturas]: Correção de Ciclos Mensais e Alinhamento por Calendário

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
Na modelagem original do motor de renovação e faturamento de assinaturas recorrentes, a expiração de lotes e vencimento de parcelas era calculada somando-se dias corridos fixos (múltiplos de 30 dias, via `ActivatedAt.AddDays(ciclo * 30)`). 

Isso gerava duas anomalias funcionais:
1. **Calendar Drift (Desvio de Calendário)**: Em meses com 31 dias (ex: Março, Maio), o vencimento do cliente recuava 1 dia por mês. Uma assinatura criada em 15/03 vencia em 14/04 no ciclo 2, e em 13/05 no ciclo 3. Com o passar do ano, o dia de faturamento do cliente se desregulava em relação à data original de contratação.
2. **Incoerência com Gateways de Pagamento**: Modelos de assinatura de mercado operam em dia de aniversário mensal calendário, não por cotas de dias fixos. Um plano contratado no dia 15 deve renovar sempre no dia 15 do mês seguinte, independentemente do mês possuir 28, 29, 30 ou 31 dias.

## 🧠 Estratégia da Solução
Diferenciamos as regras de cálculo de expiração baseadas no tipo de contrato:
- **Pacotes e Avulsos**: Mantêm a regra de expiração rígida baseada em dias corridos definidos comercialmente na oferta (`AddDays(offer.ValidityDays)`).
- **Assinaturas Recorrentes**: Adotam o ciclo de calendário completo com dia de aniversário mensal. Em vez de somar múltiplos de 30 dias, o motor agora utiliza o método `.AddMonths(ciclo)` nativo do C#.
  
O método `.AddMonths()` trata nativamente todas as complexidades de transição de meses com comprimentos variáveis e anos bissextos (por exemplo, uma assinatura iniciada em 31/08 renovará em 30/09, 31/10 e 30/11 de forma consistente, igualando-se ao comportamento dos principais gateways de faturamento do mercado).

## 🛠️ Implementação Técnica

### Backend (C# / .NET Core)
* **`ServiceBalanceService.cs`**:
  - `ProvisionContractBalanceAsync`: Identifica se o contrato é uma assinatura (`SnapshotContractType == ContractType.Assinatura`) e define a expiração do primeiro lote de saldo para exatamente 1 mês à frente (`contract.ActivatedAt.AddMonths(1)`), em vez de usar os dias de validade genéricos da oferta.
  - `RenewSubscriptionCycleAsync`: Substituiu a multiplicação matemática de 30 dias pela soma de meses de calendário baseada no número de lotes já gerados:
    - Próximo vencimento de fatura: `contract.ActivatedAt.AddMonths(generatedCount)`
    - Próxima expiração de lote de créditos: `contract.ActivatedAt.AddMonths(nextCycleNumber)`
* **`BillingController.cs`**:
  - `SeedTestData`: Atualizado o script de seeding idempotente para provisionar o lote de saldo do dia atual utilizando expiração mensal calendário (`now.AddMonths(1)`), harmonizando-se com o novo motor.

## 🎯 Impacto e Resultado
* **Pontualidade de Caixa**: A data de vencimento das faturas e a renovação de saldos passam a ocorrer exatamente no mesmo dia do mês (dia de aniversário da contratação), extinguindo a perda progressiva de dias.
* **Sincronismo Comercial**: O Media8 agora opera com a mesma lógica temporal utilizada por gateways como Stripe e Asaas, facilitando integrações de conciliação financeira assíncronas futuras sem a necessidade de reescrever lógica de expiração ou lidar com drifts.
