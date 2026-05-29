# RELATÓRIO DE PRESERVAÇÃO DE CONTEXTO (CONTEXT PRESERVATION REPORT)

Este documento registra de forma abrangente todas as alterações, correções e inovações arquiteturais implementadas no ecossistema **Media8** (Backend API em ASP.NET Core e Frontend Web em React/TypeScript/Vite) desde o commit `381777b9dee6eb28ff970c07403561769763ef27`. 

Ele serve como o ponto único de verdade para que futuros agentes ou desenvolvedores retomem o projeto sem perda de contexto ou loops cognitivos.

---

## 🎯 Contexto e Escopo Geral

O projeto passou por uma profunda reestruturação financeira, lógica e visual. O objetivo foi resolver gargalos graves de usabilidade na criação de pedidos, implementar o padrão ouro de UX nos cartões de saldo do dashboard, ressuscitar a página de listagem de serviços, automatizar a renovação de ciclos de assinatura recorrentes com segurança e introduzir um ecossistema completo de conciliação financeira de faturas (Invoices).

Os desenvolvimentos foram divididos em **5 Grandes Marcos de Entrega**:

1. **Correção de Novo Pedido (`/orders/new`)**: Desbloqueio do wizard e dropdowns reativos.
2. **Aprimoramento de UX de Saldos (`ServiceCard`)**: Nova interface visual sob a identidade da marca, barras de progresso, ordenação FIFO/Urgência, badges de fidelidade e prevenção do loop infinito.
3. **Ressurreição da Tela de Serviços (`/services`)**: Reestruturação com InfiniteScroll paged-by-10 e agregação compatível no frontend.
4. **Motor de Ciclos e Faturamento (`Invoices` & `RenewalWorker`)**: Introdução de faturas físicas no banco de dados Postgres, hosted service automatizado em background, conciliação manual por administradores e switch no painel admin.
5. **Correção de Datas por Calendário (`AddMonths`)**: Transição da matemática de dias fixos (30 dias) para meses de calendário completos, eliminando o desvio de calendário (drift) e espelhando gateways como Stripe/Asaas.

---

## 🛠️ Detalhamento Técnico das Alterações

### 1. Desbloqueio e Correções em Novo Pedido (/orders/new)
* **Desafio**: O formulário de novo pedido quebrava silenciosamente devido a conflitos no hook form e dropdowns com estado de seleção híbrido, além de todos os itens aparecerem com marcação de "✓".
* **Solução**: 
  - Corrigido o casing do DTO que lia `.id` em minúsculo do backend (que serializa em PascalCase `.Id`).
  - Sincronizados os inputs de seletor customizados com o `react-hook-form` via chamadas explícitas de `setValue` no formulário.
  - Convertidas strings vazias `''` em `undefined` para garantir que os placeholders fossem exibidos corretamente no primeiro carregamento.
  - Adicionado suporte a query params (`?lotId=...`) que pré-seleciona o lote de saldo do cartão e pula automaticamente o Wizard para a etapa de briefing.

### 2. Aprimoramento de UX de Saldos (ServiceCards)
* **Desafio**: Os cartões de créditos do cliente no dashboard exibiam "Sem validade" e não diferenciavam assinaturas de pacotes, induzindo o cliente ao erro sobre a expiração dos saldos.
* **Solução**:
  - **Eager Loading**: Adicionado `.ThenInclude(c => c.Offer)` no repositório de saldos para carregar o tipo comercial do contrato.
  - **Identidade da Marca**: Estilizados os cartões com Vinho Profundo (`#400404`) e Creme Suave (`#FFFBED`), adicionando badges para `Assinatura`, `Pacote` e `Avulso`.
  - **Contador HSL e Regressividade**: Texto dinâmico de vencimento ("Renova em X dias" / "Expira amanhã!"). Banners explícitos de alerta de rollover de cota ("Saldo não-acumulativo • Use seus créditos!").
  - **Barra de Consumo**: Renderização visual do percentual de cota consumida por lote de saldo.
  - **Uniformidade Visual**: Ajustados os cartões para a altura de `min-h-[220px] h-full` para eliminar disparidade de tamanho no grid decorrente de alertas e tamanhos de textos.
  - **Interatividade**: Menu dropdown Radix nativo ativado por hover e toque nos cartões para atalhos de "+ Novo Pedido" e "Contratar mais".

### 3. Ressurreição da Tela de Serviços (/services)
* **Desafio**: A tela `/services` quebrava ou ficava em branco porque o backend trafegava dados planos PascalCase, enquanto o frontend esperava a estrutura agregada legada camelCase.
* **Solução**:
  - Implementado o helper de mapeamento `aggregateBalances` no hook `useServiceBalances.ts` para estruturar em tempo de execução os lotes em agrupamentos por formato/estilo sem quebrar o layout.
  - Reestruturada a tela `/services` com o componente `<InfiniteScroll>` consumindo lotes planos diretos paged-by-10 sob demanda para buscas, filtros e ordenações em tempo de execução.
  - Adicionado o botão "Ver Todos" com redirecionamento no dashboard.

### 4. Motor de Ciclos, Faturamento e Conciliação
* **Desafio**: Saldos eram provisionados sem qualquer rastro financeiro ou possibilidade de controle de inadimplência/atraso por parte do administrador.
* **Solução**:
  - **Entidade `Invoice`**: Nova tabela no Postgres conectada aos contratos e clientes, registrando valor, ciclo, vencimento, comprovante e status (`Pending`, `Paid`, `Overdue`, `Cancelled`).
  - **Background Worker**: `SubscriptionRenewalWorker` roda a cada hora monitorando lotes expirados. Se o switch de confirmação manual estiver ativado, gera a fatura do novo mês como `Pending` e bloqueia os créditos; caso contrário, gera como `Paid` e auto-provisiona.
  - **BillingController**: Endpoints `/admin/billing/invoices` e `/confirm-payment` para conciliação física.
  - **PaymentsPage**: Tela administrativa estilizada com busca, tabs por status e modal para inserção do Pix e código de transação para liberação de créditos imediata.

### 5. Lógica de Ciclos de Calendário (AddMonths)
* **Desafio**: O cálculo de vencimento somava múltiplos de 30 dias fixos, fazendo a data de cobrança do cliente sofrer deriva (drift) ao longo dos meses de 31 dias ou fevereiro.
* **Solução**:
  - Modificado o `ServiceBalanceService.cs` para aplicar `.AddMonths(ciclo)` na expiração de lotes e vencimento de faturas de assinaturas, mantendo o dia de aniversário calendário constante (ex: 15/03, 15/04, 15/05), enquanto pacotes e avulsos mantêm contagem por dias de validade.

---

## 🛠️ Histórico Completo de Commits Realizados

Abaixo está a trilha de commits atômicos gerados, agrupados por ordem cronológica reversa:

| Hash | Componente | Descrição |
|---|---|---|
| `6d11d98` | Documentação | Adiciona estudo de caso 084 sobre ciclos mensais de calendário para assinaturas |
| `0ba9fab` | Backend (Services) | Implementa ciclos mensais por calendário para assinaturas usando AddMonths |
| `5decc65` | Frontend (Comp) | Uniformiza altura dos cards para `min-h-[220px]` e `h-full` para evitar desalinhamento visual |
| `751de19` | Backend (DTO/API) | Mapeia data de ativação do contrato no `PurchaseDate` para cálculo de ciclo no frontend |
| `9ff16fe` | Backend (API) | Adiciona endpoint POST `seed-test-data` para geração idempotente de dados de teste de assinaturas |
| `c29e17c` | Documentação | Adiciona estudo de caso 083 e guia técnico de faturamento |
| `0ed9258` | Frontend (Pages) | Cria tela de Gestão de Pagamentos e conciliação manual Pix/Boleto |
| `199a6e4` | Backend (API) | Implementa endpoints administrativos do BillingController |
| `5367b3c` | Backend (Services) | Implementa regras de negócio de faturamento no service e provisionamento condicional |
| `2dc6232` | Backend (Domain) | Mapeia entidade Invoice no banco e aplica migração do Entity Framework |
| `90cf116` | Frontend (UI) | Adiciona switch para confirmação de pagamento manual em settings de admin |
| `153d576` | Backend (Workers) | Adiciona worker hosted service de renovação automática e controle de faturamento |
| `cce84c8` | Documentação | Adiciona estudo de caso 082 sobre abstração DRY e refinamentos visuais de saldos |
| `6c163ba` | Frontend (Comp) | Abstrai ServiceCard em arquivo DRY e adiciona alertas de vencimento e fidelidade |
| `8bd8e5c` | Backend (Repo) | Mapeia a propriedade de fidelidade no endpoint de saldos unificados |
| `4eb21a4` | Frontend (Pages) | Reestrutura a página de serviços com scroll infinito sob demanda de 10 lotes |
| `f24eda1` | Frontend (UI) | Adiciona botão Ver Todos no dashboard e remove duplicado do dropdown |
| `1132870` | Documentação | Adiciona estudo de caso 081 sobre interatividade e compatibilidade de saldos |
| `7c8449e` | Frontend (Hooks) | Implementa helper aggregateBalances e ressuscita a página de listagem de serviços |
| `71009db` | Frontend (Pages) | Implementa pré-seleção automática de lote na tela de novo pedido via URL |
| `e52024f` | Frontend (UI) | Elimina loop infinito de scroll e adiciona dropdown nos cards do dashboard |
| `4002a07` | Documentação | Adiciona estudo de caso 080 sobre ordenação no backend, responsividade e limite de cards |
| `c5a8873` | Frontend (Style) | Limita largura de ServiceCards apenas no PC, aumenta fontes e limita dashboard a 4 cards |
| `9e556c9` | Backend (Repo) | Implementa status dashboard e prioridade de ordenação no ServiceBalanceRepository |
| `8e6419d` | Documentação | Adiciona estudo de caso 079 sobre ordenação, badges e redimensionamento dos ServiceCards |
| `7743569` | Frontend (Style) | Ordena ServiceCards por vencimento, adiciona badges de categoria e reajusta tamanho |
| `9159209` | Documentação | Adiciona estudo de caso 078 sobre SnapshotContractType e migração com backfill |
| `01d89cb` | Frontend (Types) | Adiciona a propriedade SnapshotContractType à interface ClientContract |
| `2c2e4c0` | Backend (Domain) | Adiciona SnapshotContractType a ClientContract com migração e backfill SQL |
| `8a58b84` | Documentação | Adiciona estudo de caso 077 sobre ajuste e enfileiramento dos ServiceCards |
| `7f9827c` | Frontend (Style) | Refatora grid de ServiceCards para flexbox auto-enfileirado |
| `e492628` | Frontend (Style) | Limita largura máxima dos ServiceCard no grid do dashboard |
| `d5870c0` | Frontend (Style) | Reduz tamanho dos ServiceCards e alinha à identidade visual da marca |
| `f517e9b` | Frontend (Comp) | Redesenha ServiceCards de assinatura com badges, barras de consumo, contadores HSL e alertas |
| `26a0c37` | Backend (Repo) | Eager load Offer.ContractType em ServiceBalanceRepository usando ThenInclude |
| `745f976` | Documentação | Atualiza pilares arquiteturais com cases #075 e #076 |
| `0946796` | Documentação | Atualiza documentação do novo pedido (/orders/new) e refatora case 076 |
| `f5fb82b` | Frontend (Pages) | Corrige dropdowns e submissão do NewOrderPage (lot.Id, profile.Id e controlled Select) |
| `c91362d` | Documentação | Adiciona estudo de caso 076 sobre correções críticas na página /orders/new |
| `795030e` | Documentação | Adiciona documentação técnica detalhada dos problemas na página /orders/new |
| `dd33db5` | Frontend (Pages) | Remove conflito entre react-hook-form e estado local dos Selects |
| `1a49563` | Frontend (Pages) | Converte explicitamente string vazia '' para undefined nos Selects |
| `2a4c1d8` | Frontend (Pages) | Corrige seleção múltipla dos dropdowns (estado híbrido de checkbox) |

---

## 🎯 Status Atual do Sistema e Verificação

* **Compilação do Backend (`dotnet build`)**: 100% de êxito no .NET 10.0 (sem erros de sintaxe ou referências nulas).
* **Compilação do Frontend (`npx tsc --noEmit`)**: 100% de êxito no TypeScript/Vite.
* **Integridade de Banco**: Tabela `Invoices` persistindo e mapeada corretamente com migrações EF e backfill de dados aplicados no banco Postgres.
* **API Ativa**: O servidor backend está ativamente rodando localmente na porta `5261` (`http://localhost:5261`) como processo de segundo plano do sistema, rodando o worker de fidelidade em background e ouvindo requisições HTTP normalmente.
* **Seeding de Dados**: Executado com total sucesso, limpando históricos de teste do cliente `cliente@cliente.com` e reinserindo os dados de teste alinhados por calendário.

---

## 🧠 Diretrizes para Próximos Desenvolvedores / Agentes

1. **Uso de Casing nos DTOs**: Sempre respeite o PascalCase do backend ao consumir as propriedades no frontend (ex: usar `.Id`, `.Name`, `.Status`, `.ExpiresAt`, `.PurchaseDate` em objetos do tipo `UnifiedServiceBalance`).
2. **Uso do Switch de Conciliação**: Para testar a aprovação manual de pagamentos de assinaturas, certifique-se de que a configuração `RequireManualPaymentConfirmation` esteja ativa (`true`) no banco ou no painel administrativo antes de simular o vencimento de contratos.
3. **Preservação de Snapshots**: Contratos criam snapshots imutáveis das ofertas. Qualquer adição de campos comerciais na entidade `Offer` deve ser espelhada como snapshot em `ClientContract` para garantir que alterações de preço/quantidade futuras não afetem contratos ativos antigos.
4. **Respeito às Categorias e Prazos**: Nunca altere a matemática de expiração por `AddMonths` em pacotes e avulsos, pois estes continuam governados de forma estrita pelo prazo comercial de validade em dias corridos (`AddDays`).
