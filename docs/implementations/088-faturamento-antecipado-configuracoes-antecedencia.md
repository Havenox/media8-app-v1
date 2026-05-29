# 088 - Faturamento: Faturamento Antecipado e Configurações de Antecedência

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
O faturamento reativo de assinaturas (geração de cobranças apenas no momento exato do vencimento do ciclo atual) impedia o negócio de realizar campanhas preventivas de cobrança (ex: envio de alertas Pix/boleto 10 a 15 dias antes da virada do ciclo). Isso aumentava o risco de atrasos de faturamento. 

Além disso, a janela padrão de cancelamento automático de pedidos pelo cliente (`CancellationWindowHours`) inicializava como 24 horas, o que representava um alto risco operacional de estorno de trabalho de edição já iniciado.

## 🧠 Estratégia da Solução
Para solucionar o faturamento reativo, dividimos a lógica de renovação em duas etapas independentes:
1. **Pré-Geração de Faturas:** Criação de um processo que roda em segundo plano e gera apenas a fatura (`Invoice`) com status `Pending` com base no parâmetro de antecedência (`BillingAntecipationDays`). O lote de saldo não é provisionado neste momento.
2. **Rollover de Ciclo:** Ao vencer de fato o lote antigo, o motor localiza a fatura pré-gerada e provisiona o novo lote de saldo (bloqueado se a fatura continuar aberta, ou ativo se já estiver quitada).

Para resolver a segurança do cancelamento, configuramos a janela padrão no seeder de banco para `1` hora, e ajustamos a inicialização e fallbacks no backend para impedir limites excessivos.

## 🛠️ Implementação Técnica

### Backend (Cobrança Antecipada & Segurança)
* **Método `PreGenerateNextCycleInvoicesAsync`:** Adicionado a [IServiceBalanceService.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/Interfaces/IServiceBalanceService.cs) e implementado em [ServiceBalanceService.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/Services/ServiceBalanceService.cs) para consultar contratos ativos próximos do vencimento e gerar as faturas correspondentes.
* **Worker & Controller:** O worker automático [SubscriptionRenewalWorker.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Workers/SubscriptionRenewalWorker.cs) e o endpoint administrativo de trigger manual [BillingController.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Controllers/BillingController.cs) agora acionam a pré-geração no início do fluxo.
* **Segurança do Cancelamento:** Atualizados os fallbacks e seeds de banco em [DbSeeder.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Infrastructure/Data/DbSeeder.cs), [OrderService.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/Services/OrderService.cs) e [OrdersController.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Controllers/OrdersController.cs) restringindo a janela inicial para `1` hora.

### Frontend (Configuração e Visual)
* **Input de Antecedência:** Inserido input numérico associado ao parâmetro `BillingAntecipationDays` no painel administrativo [AdminSettingsSection.tsx](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/admin/AdminSettingsSection.tsx).
* **Inversão da Barra de Progresso:** Atualizado o preenchimento da barra em [ServiceCard.tsx](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/dashboard/ServiceCard.tsx) para `100 - percentConsumed`. Agora a barra começa cheia e decresce conforme o uso dos créditos pelo cliente.

## 🎯 Impacto e Resultado
* **Cobrança Antecipada Ativa**: Invoices são pré-geradas no banco até 15 dias antes, viabilizando e-mails e alertas prévios de cobrança sem expor créditos indevidamente.
* **Redução de Risco de Cancelamento**: Bloqueio operacional de cancelamento rebaixado de 24 horas para 1 hora padrão, protegendo o trabalho dos editores.
* **UI Padrão Restante**: Visual de créditos mais intuitivo, onde a barra cheia representa a abundância e decresce conforme o uso.

---
**Nota do Desenvolvedor:** *A segregação do faturamento antecipado em duas etapas (fatura prévia -> saldo posterior na data de rollover) manteve a idempotência absoluta do motor de assinaturas, impedindo o provisionamento duplo de créditos em reinicializações do servidor e mantendo o histórico intacto.*
