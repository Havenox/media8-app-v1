# RELATÓRIO DE PRESERVAÇÃO DE CONTEXTO (CONTEXT PRESERVATION REPORT)

Este documento registra de forma abrangente todas as alterações, correções e inovações arquiteturais implementadas no ecossistema **Media8** (Backend API em ASP.NET Core e Frontend Web em React/TypeScript/Vite) desde o commit `381777b9dee6eb28ff970c07403561769763ef27`. 

Ele serve como o ponto único de verdade para que futuros agentes ou desenvolvedores retomem o projeto sem perda de contexto ou loops cognitivos.

---

## 🎯 Contexto e Escopo Geral

O projeto passou por uma profunda reestruturação financeira, lógica e visual. O objetivo foi resolver gargalos graves de usabilidade na criação de pedidos, implementar o padrão ouro de UX nos cartões de saldo do dashboard, ressuscitar a página de listagem de serviços, automatizar a renovação de ciclos de assinatura recorrentes com segurança e introduzir um ecossistema completo de conciliação financeira de faturas (Invoices).

Os desenvolvimentos foram divididos em **8 Grandes Marcos de Entrega**:

1. **Correção de Novo Pedido (`/orders/new`)**: Desbloqueio do wizard e dropdowns reativos.
2. **Aprimoramento de UX de Saldos (`ServiceCard`)**: Nova interface visual sob a identidade da marca, barras de progresso, ordenação FIFO/Urgência, badges de fidelidade e prevenção do loop infinito.
3. **Ressurreição da Tela de Serviços (`/services`)**: Reestruturação com InfiniteScroll paged-by-10 e agregação compatível no frontend.
4. **Motor de Ciclos e Faturamento (`Invoices` & `RenewalWorker`)**: Introdução de faturas físicas no banco de dados Postgres, hosted service automatizado em background, conciliação manual por administradores e switch no painel admin.
5. **Correção de Datas por Calendário (`AddMonths`)**: Transição da matemática de dias fixos (30 dias) para meses de calendário completos, eliminando o desvio de calendário (drift) e espelhando gateways como Stripe/Asaas.
6. **Bloqueio de Saldos por Fatura Pendente**: Provisionamento de créditos imediatos vinculados a faturas na virada do ciclo, com bloqueio rígido e autoritativo no backend (Consume e Create Order) e alertas visuais / redirecionamentos premium no frontend.
7. **Exibição de Fim de Contrato & Opções de Renovação**: Adaptação visual dos rodapés para assinaturas no último mês de vigência ("Contrato Encerra dia X"), exclusão de gatilhos de auto-renovação de faturas e inclusão de botões e links diretos para renovação contratual (/contracts/:id/renew).
8. **Identificadores Sequenciais Amigáveis por Cliente (SequentialId)**: Numeração amigável sequencial (ex: `Contrato #0001`, `Pedido #0012`) escopada por cliente, implementada via tabela de contadores centralizadora e transações ACID no PostgreSQL para evitar colisões concorrentes, com formatação flexível e DRY no frontend.
9. **Histórico e Gerenciamento de Contratos (/contracts)**: Tela adaptativa e dedicada para clientes e administradores revisitarem o histórico de contratações (snapshots imutáveis), com suporte a abas de Ativos/Arquivados, busca reativa, visual grey-out para expirados e isolamento rígido de tenant (anti-IDOR) resolvido por tokens JWT no backend.

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

### 5. Lógica de Ciclos de Calendário, Exibição de Fidelidade e Visual de Expirados
* **Desafio**: 
  - O cálculo de vencimento somava múltiplos de 30 dias fixos, fazendo a data de cobrança do cliente sofrer deriva (drift) ao longo dos meses de 31 dias ou fevereiro.
  - A exibição do mês de fidelidade (ex: `Mês 3/6`) nos cartões de saldo no frontend era calculada comparando a data de início com a data atual (`today`), o que fazia com que todos os lotes (mesmo os remanescentes de meses passados) exibissem incorretamente o número do mês corrente da fidelidade.
  - Lotes expirados inativos apareciam com a mesma cor creme e vinho/amber dos lotes ativos, causando poluição visual. Além disso, a ordenação de urgência no frontend e backend colocava os expirados do mais antigo para o mais recente, contrariando a expectativa de colocar os expirados mais recentes no topo.
* **Solução**:
  - Modificado o `ServiceBalanceService.cs` para aplicar `.AddMonths(ciclo)` na expiração de lotes e vencimento de faturas de assinaturas, mantendo o dia de aniversário calendário constante (ex: 15/03, 15/04, 15/05), enquanto pacotes e avulsos mantêm contagem por dias de validade.
  - Ajustado o frontend em `ServiceCard.tsx` para cruzar a data de compra original (`PurchaseDate`) com a expiração individual de cada lote (`ExpiresAt`) em vez da data de hoje, assinalando com precisão o mês correto de cada cartão individualmente.
  - Aplicado visual acinzentado (`bg-[#F3F4F6]/70`, `border-l-[#9CA3AF]`, `opacity-75` e textos `text-neutral-500`) em cartões e itens de lista expirados em `ServiceCard.tsx`.
  - Corrigido o algoritmo de ordenação por urgência no frontend (`ServiceBalanceList.tsx` e `ServicesPage.tsx`) e backend (`ServiceBalanceRepository.cs`) para classificar lotes expirados de forma descendente (mais recentes no topo).

### 6. Bloqueio de Saldos por Fatura Pendente (Autoritativo no Backend)
* **Desafio**: Impedir que créditos gerados na virada de ciclo de assinaturas sejam usados antes de suas faturas estarem devidamente quitadas, assegurando validação autoritativa e inviolável no backend, enquanto o frontend sinaliza o bloqueio de forma premium e oferece atalhos simplificados de checkout.
* **Solução**:
  - **Mapeamento de Banco**: Introduzido relacionamento de chave estrangeira opcional `InvoiceId` nos lotes de saldos (`ServiceBalanceLots`).
  - **Autoridade no Servidor**: Modificados `ServiceBalanceService.ConsumeAsync` e `OrdersController.Create` para eager-load a fatura e recusar qualquer consumo se a fatura correspondente estiver em aberto (retornando exceção de regra de negócio com código `INVOICE_PENDING`).
  - **UX/Visual Premium**: Atualizado `ServiceCard.tsx` (modos grid e list) para pintar cartões bloqueados em tons amarelos/âmbar (`bg-[#FFFDF0] border-amber-200 border-l-amber-500`), ocultar/desabilitar botões de uso e renderizar atalhos contextualizados "Pagar Fatura" para `/admin/payments`.
  - **Validação de Formulários**: Atualizado `NewOrderPage.tsx` para desativar seleções de lotes bloqueados e alertar via toast em caso de pré-seleções inválidas por query params.

### 7. Exibição de Fim de Contrato & Opções de Renovação (Último Mês)
* **Desafio**: No último mês de fidelidade da assinatura (ex: Mês 6/6), a mensagem padrão "Renova em X dias" era enganosa, pois a vigência seria encerrada em definitivo na virada. O usuário também necessitava de atalhos explícitos e rápidos para fechar propostas de renovação contratual antes do fim da vigência ativa.
* **Solução**:
  - **Identificação do Fim da Fidelidade**: O helper `getExpirationInfo` no React agora cruza `currentMonth === totalMonths` para marcar o último mês ativo de fidelidade.
  - **Nomenclatura Correta**: Rodapés dinâmicos de expiração alterados para `"Contrato Encerra dia DD/MM/YYYY"`, `"Contrato Encerra hoje!"` e `"Contrato Encerrado em DD/MM/YYYY"` no caso de expirados, preservando a identidade visual em tons de vinho da marca para indicar vigência de assinatura ativa.
  - **Ações de Renovação Contextual**: Adicionada a opção "Renovar Contrato" no menu Radix (`DropdownMenu`) de cartões em grid e um botão físico "Renovar" contornado em linhas de lista (`ServiceListItem`), navegando o usuário diretamente a `/contracts/:id/renew` com a referência do identificador de contrato (`ContractId`) exposta do backend.

### 8. Identificadores Sequenciais Amigáveis por Cliente (SequentialId)
* **Desafio**: Expor GUIDs longos e opacos (`e3d7a8d5...`) como chaves de busca primárias na interface degradava gravemente a usabilidade comercial. No entanto, introduzir IDs auto-incrementados simples escopados por cliente pode desencadear severas colisões em ambientes com concorrência distribuída. Adicionalmente, introduzir novas colunas `NOT NULL` inteiras em tabelas com dados pré-existentes requer uma abordagem de backfill físico estruturado para evitar falhas imediatas de unicidade.
* **Solução**:
  - **Tabela de Contadores Concorrentes (`ClientSequences`)**: Criada tabela no banco centralizando contadores `LastValue` para cada combinação de `ClientId` e `EntityType`.
  - **Controle de Concorrência ACID**: Desenvolvido `SequenceGeneratorService` no backend. A busca, incremento e atualização ocorrem de forma atômica sob transações exclusivas de banco de dados, protegendo o sistema contra condições de corrida.
  - **Índices Físicos de Unicidade**: Configuradas chaves compostas únicas em nível de banco de dados (`ClientId`, `SequentialId`) para blindar as entidades `ClientContract`, `Order`, `Invoice`, `BrandingProfile` e `EditingProfile`.
  - **Script de Migração com Backfill Histórico**: Escrevemos a migração EF utilizando comandos analíticos `row_number() OVER (PARTITION BY ...)` para sequenciar retroativamente todo o histórico existente por cliente e preencher os contadores correspondentes antes de aplicar os índices físicos de unicidade, garantindo integridade absoluta dos dados históricos.
  - **DTOs & Controllers**: Atualizados mapeamentos de resposta nos controladores `ClientContracts`, `BrandingProfiles`, `EditingProfiles`, `Billing` e no serviço de pedidos para trafegar a nova coluna.
  - **Formatação DRY no React**: Criado o helper de visualização `formatSequentialId` em `src/lib/formatters.ts` que concatena dinamicamente o prefixo correspondente e adiciona preenchimento de zeros à esquerda (ex: `Contrato #0001`, `Pedido #0012`, `Fatura #0005`, `Marca #0002`, `Perfil #0003`), mantendo a lógica de visualização totalmente flexível e desacoplada do servidor.

### 9. Histórico e Gerenciamento de Contratos (/contracts)
* **Desafio**: Os clientes necessitavam de uma visualização clara, consolidada e histórica de todos os contratos adquiridos na plataforma, sem expor chaves GUID opacas e sem poluir a tela principal com contratos antigos, expirados ou cancelados. Além disso, os dados precisavam ser buscados de forma segura pelo próprio cliente, sem risco de vazamento de dados de terceiros (vulnerabilidades anti-IDOR).
* **Solução**:
  - **Propriedade de Arquivamento**: Adicionado o campo `IsArchived` na entidade `ClientContract` com migração física automática aplicada no Postgres.
  - **API Segura e Isolada**: Criado o endpoint seguro `GET api/v1/ClientContracts/my` no backend, resolvendo o `ClientId` do usuário autenticado a partir do token JWT e filtrando os resultados pelo status de arquivamento (`showArchived`).
  - **Ações Contextuais**: Adicionados endpoints em `ClientContractsController` para arquivar e desarquivar contratos de forma restrita e autoritativa.
  - **Interface Responsiva Premium**: Construída a tela `ContractsPage.tsx` com tabs reativas ("Ativos" e "Arquivados"), filtros textuais instantâneos, visual acinzentado (grey-out) para contratos expirados/cancelados e dropdown Radix contendo atalhos rápidos ("Novo Pedido", "Renovar", "Arquivar/Desarquivar").
  - **Navegação Sincronizada**: Registrada a rota `/contracts` no `App.tsx` e integrados os botões com ícone `FileText` nas sidebars e barras móveis do app.

---

## 🛠️ Histórico Completo de Commits Realizados

Abaixo está a trilha de commits atômicos gerados, agrupados por ordem cronológica reversa:

| Hash | Componente | Descrição |
|---|---|---|
| `05ae7d9` | Frontend (UI) | feat(web/ui): cria a tela de histórico e gestão de contratos com design system premium |
| `5be3bbc` | Frontend (Nav) | feat(web/navigation): registra a rota /contracts e insere o item de menu nas sidebars e nav bars |
| `2a5cfd3` | Frontend (API) | feat(web/api): integra tipos, serviços e hooks de React Query para gerenciamento e arquivamento de contratos |
| `06b23f3` | Backend (API) | feat(api/controller): expõe IsArchived nos DTOs e cria endpoints de tenant e arquivamento seguro |
| `401e7c1` | Backend (Domain) | feat(api/domain): adiciona campo IsArchived à entidade de contratos e gera migração física |
| `7d0040a` | Frontend (Style) | style(web): move a badge do contrato do card de serviços para um subtexto sutil |
| `e43b525` | Documentação | docs(preservation): atualiza relatorio de preservacao de contexto com os novos hashes e sessao do SequentialId |
| `e1dd3ce` | Documentação | docs: adiciona estudo de caso 090 sobre identificadores sequenciais amigaveis |
| `3e2ff90` | Frontend (UI) | feat(web/ui): renderiza badges estilizadas com os identificadores sequenciais na interface do cliente |
| `664ad42` | Frontend (Types) | feat(web/types): estende interfaces com campo SequentialId e cria helper utilitário de formatação DRY |
| `7eb6b77` | Backend (API) | feat(api/dto): expõe campo SequentialId nos DTOs de resposta e mapeamentos dos controladores |
| `154c0ef` | Backend (Services) | feat(api/services): implementa serviço SequenceGeneratorService e integra controle atômico nas criações |
| `e52da63` | Backend (Domain) | feat(api/domain): adiciona entidade ClientSequence, mapeamentos no DbContext e migrações com índices compostos únicos |
| `17e6c48` | Documentação | docs: adicionar caso de estudo 089 e atualizar relatorio de preservacao de contexto |
| `cdfbd82` | Frontend/Backend | feat(web/api): exibir 'Contrato Encerra' no último mês e adicionar opção de renovação de contrato |
| `74fd82b` | Frontend (Style) | Altera texto sob a barra de progresso para exibir "X% dos créditos disponíveis" |
| `b8065bb` | Documentação | Atualiza o relatório de preservação de contexto com o hash do commit do estudo de caso 088 |
| `aa0ac7e` | Documentação | Adiciona o estudo de caso 088 sobre faturamento antecipado |
| `ad13258` | Documentação | Atualiza o relatório de preservação com o hash do commit de inversão da barra de progresso |
| `968a737` | Frontend (Style) | Inverte a lógica da largura da barra de progresso para exibir o restante e decrescer conforme consumo |
| `62479e8` | Frontend (UI) | Adiciona o input de dias de antecedência de faturamento no painel de configurações do admin |
| `f37b746` | Backend (Services) | Implementa controle e seed de `BillingAntecipationDays`, pré-geração de faturas antecipadas e restrição de segurança de `CancellationWindowHours` para 1h |
| `a0745ee` | Documentação | Sincroniza hashes finais de commits de documentação do caso de estudo 087 no relatório de preservação |
| `88ea3c8` | Documentação | Atualiza caso de estudo 087 para cobrir gatilho manual e refinamento da barra de progresso |
| `4072082` | Documentação | Adiciona commits do disparador manual e de barras de progresso ocultadas no relatório |
| `84053c6` | Frontend/Backend | Oculta barra de progresso em cards expirados e adiciona botão no admin settings para disparar manualmente a verificação de ciclos |
| `c9452fd` | Documentação | Atualização da tabela de commits com as últimas alterações visuais de cartões bloqueados |
| `c617b45` | Frontend (Comp) | Restaura cor laranja/âmbar original do botão de pagamento nos cards por harmonia visual |
| `b285414` | Frontend (Comp) | Oculta reticências (ellipsis) nos cards de saldo bloqueados para evitar sobreposição |
| `b5e37a5` | Documentação | Atualiza hash de commit no relatório de preservação de contexto após correções de integridade |
| `97b381f` | Documentação | Documenta bloqueio de saldos no caso de estudo 087 |
| `ba84ad4` | Frontend/Backend | Implementa bloqueio autoritativo de saldos por faturas pendentes e visual âmbar |
| `4ea2c54` | Documentação | Atualização do relatório de preservação com os hashes de commits de estilo e ordenação de expirados |
| `e496c45` | Documentação | Adiciona estudo de caso 086 sobre ordenação de expirados e cards cinza |
| `1993e75` | Frontend/Backend | Corrige ordenação por urgência colocando expirados mais recentes no topo |
| `e8376c3` | Frontend (Comp) | Aplica visual acinzentado (grey-out) a cartões de saldo expirados |
| `ac9f281` | Documentação | Adiciona log do commit correspondente ao ajuste de cálculo de fidelidade ao relatório |
| `f9f5589` | Documentação | Adiciona estudo de caso 085 sobre exibição do mês de fidelidade no dashboard |
| `c04b859` | Frontend (Comp) | Cruza PurchaseDate com ExpiresAt para exibir corretamente o mês da fidelidade nos cards |
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

* **Compilação do Backend (`dotnet build`)**: 100% de êxito no .NET 10.0 (sem erros de sintaxe ou referências nulas) após adicionar `SequentialId` e mapeá-lo nos DTOs de Contrato, Pedido, Marca, Perfil de Edição e Faturas.
* **Compilação do Frontend (`npx tsc --noEmit`)**: 100% de êxito no TypeScript/Vite após estender as interfaces e integrar as badges visuais de numeração.
* **Integridade de Banco**: Tabela `ClientSequences` mapeada e migrada. Índices físicos de unicidade estrita aplicados com sucesso. Backfill retroativo executado de forma limpa.
* **API Ativa**: O servidor backend está ativamente rodando localmente na porta `5261` (`http://localhost:5261`) como processo de segundo plano do sistema, rodando o worker de fidelidade em background e ouvindo requisições HTTP normalmente.
* **Seeding de Dados**: Executado com total sucesso, limpando históricos de teste do cliente `cliente@cliente.com` e reinserindo os dados de teste alinhados por calendário.

---

## 🧠 Diretrizes para Próximos Desenvolvedores / Agentes

1. **Uso de Casing nos DTOs**: Sempre respeite o PascalCase do backend ao consumir as propriedades no frontend (ex: usar `.Id`, `.Name`, `.Status`, `.ExpiresAt`, `.PurchaseDate` em objetos do tipo `UnifiedServiceBalance`).
2. **Uso do Switch de Conciliação**: Para testar a aprovação manual de pagamentos de assinaturas, certifique-se de que a configuração `RequireManualPaymentConfirmation` esteja ativa (`true`) no banco ou no painel administrativo antes de simular o vencimento de contratos.
3. **Preservação de Snapshots**: Contratos criam snapshots imutáveis das ofertas. Qualquer adição de campos comerciais na entidade `Offer` deve ser espelhada como snapshot in `ClientContract` para garantir que alterações de preço/quantidade futuras não afetem contratos ativos antigos.
4. **Respeito às Categorias e Prazos**: Nunca altere a matemática de expiração por `AddMonths` em pacotes e avulsos, pois estes continuam governados de forma estrita pelo prazo comercial de validade em dias corridos (`AddDays`).
5. **Uso de Identificadores Sequenciais Amigáveis**: Ao exibir qualquer contrato, pedido, fatura, perfil de branding ou perfil de edição, sempre prefira renderizar o `SequentialId` formatado via helper utilitário `formatSequentialId(id, prefix)` ao invés de expor chaves GUID primárias diretamente. GUIDs são estritamente para consumo interno de APIs e chaves de rotas, e sequenciais são para interação visual amigável do cliente.
