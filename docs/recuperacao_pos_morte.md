# RELATÓRIO PÓS-MORTE: AUDITORIA DA MIGRAÇÃO E DIAGNÓSTICO DE FALHA DO AGENTE

## Contexto do Desafio e Solução

* **Por que estamos fazendo isso?** A aplicação Media8 entrou em um estado crítico de "meia-migração" após a virada global para PascalCase. O agente anterior falhou sistematicamente em resolver o erro `400 Bad Request` e a ocultação de menus, operando em um loop infinito de adivinhação de caixa de texto (maiusculização/minusculização de strings de consulta). Uma abordagem cirúrgica externa (Claude Sonnet) resolveu o ecossistema em 10 minutos, expondo falhas estruturais profundas que o agente ignorou. Este relatório analisa o que foi corrigido, os problemas ocultos encontrados e a causa do colapso cognitivo do agente anterior.
* **Como vamos resolver?** Documentaremos as correções estruturais aplicadas em 18 commits atômicos, mapeando os erros bloqueadores e de segurança mitigados, e estabeleceremos um plano de governança técnico preventivo para que os próximos prompts de execução nunca mais caiam em loops circulares de adivinhação.

---

## 1. O Que o Claude Sonnet Fez (Os 18 Commits Atômicos)

O ecossistema foi estabilizado através de uma varredura ponta a ponta, dividida rigidamente por escopos técnicos para garantir commits atômicos com 0 erros de compilação no backend (`dotnet build`) e no frontend (`tsc --noEmit`).

### Escopo 1: Engenharia do Backend (Commits 1 a 4)

* **Commit 1 (`47b48f4`):** Remoção do atributo sobrevivente `[JsonPropertyName("role")]` da classe `AdminUserDto.cs`. Esse atributo forçava o campo a trafegar em minúsculo na rede para administradores, quebrando a validação baseada em perfis do cliente.
* **Commit 2 (`2abe870`):** Reescrita do `OrdersController.cs` aplicando Controle de Acesso Baseado em Regras (RBAC), alteração do verbo HTTP de `PATCH` para `PUT` para atualização de pedidos, e criação de um alias em PascalCase para a rota de formatos dinâmicos (`AvailableBalances`).
* **Commit 3 (`825d078`):** Inclusão da rota parametrizada explicitamente como `GET /{clientId:guid}` no `ServiceBalancesController.cs`, atendendo à fiação que o frontend já tentava consumir na visão de administrador.
* **Commit 4 (`1e74e1b`):** Implementação do método `UpdateAsync` nos contratos e serviços de persistência (`IServices.cs` e `OrderService.ts`), fornecendo a infraestrutura que o controlador de pedidos exigia para salvar alterações.

### Escopo 2: Serviços e Tipos do Frontend (Commits 5 a 7)

* **Commit 5 (`caa169d`):** Correção dos *barrel exports* corrompidos no arquivo central `media8-web/src/services/index.ts`. O arquivo tentava exportar referências a módulos inexistentes (antigo `profileService.ts`) e funções mortas.
* **Commit 6 (`8ff2a9e`):** Expulsão definitiva do tipo fantasma `ServiceType` e limpeza de aproximadamente 150 linhas de código morto e interfaces duplicadas no arquivo `src/types/services.ts`.
* **Commit 7 (Geral):** Atualização do serviço Axios (`orderService.ts`) para despachar requisições de escrita via método `PUT`, alinhando-se rigorosamente com os novos endpoints do servidor .NET 10.

### Escopo 3: Hooks Reativos e Camada Visual (Commits 8 a 17)

* **Commits 8 a 13 (Hooks):** Varredura completa nos hooks customizados do TanStack Query (`useOffers`, `useVideoFormats`, `useUsers`, `useEditingStyles`, `useClientContracts`, `useBrandingProfiles`). Toda a leitura de dados foi alterada do padrão camelCase para PascalCase (ex: transformando acessos `.id`, `.name`, `.status` em `.Id`, `.Name`, `.Status`).
* **Commit 14 (`6936ed5`):** Correção da página de configurações (`SettingsPage.tsx`), eliminando a incompatibilidade onde as claims do usuário logado e os retornos das funções de perfil liam propriedades nulas.
* **Commits 15 a 17 (Pages Bulk Fix):** Substituição em lote de acessos a variáveis globais de sessão em 16 arquivos diferentes. Páginas críticas como `DashboardPage`, `OrdersPage`, `OrderDetailPage` e `EditsPage` foram reconfiguradas para mapear `user?.Role` e `user?.Id` com as iniciais maiúsculas vindas do JWT serializado.

### Escopo 4: Documentação Técnica (Commit 18)

* **Commit 18 (`2ae2ebf`):** Reescreveu por completo o arquivo de arquitetura de rede `docs/API_ROUTES.md`, documentando com precisão os verbos HTTP corretos, parâmetros de query em vigor e o comportamento do serializador para consultas futuras de LLMs.

---

## 2. Os Problemas Estruturais Encontrados

A auditoria revelou que o colapso do sistema não era um problema superficial de interface, mas sim o resultado de duas categorias de falhas graves acumuladas durante as fases anteriores:

### 2.1 Erros Bloqueadores de Runtime

1. **Crash de Importação Oculto:** O arquivo `services/index.ts` quebrava o empacotamento do Vite antes mesmo das requisições chegarem à rede. Ele apontava para um arquivo deletado, fazendo com que o estado do React morresse silenciosamente em runtime.
2. **O Tipo Zumbi `ServiceType`:** Esse tipo havia sido removido da base de dados, mas continuava sendo importado por 7 arquivos de componentes diferentes. Ao tentar renderizar seletores baseados em propriedades inexistentes, o React abortava a execução do bloco de tela.
3. **Incompatibilidade de Verbos no Controlador:** O frontend disparava chamadas `PATCH` para atualizar o progresso de edição dos vídeos, mas o controlador C# correspondente só aceitava o método `PUT`. O servidor rejeitava a conexão de imediato.
4. **A Armadilha do `AdminUserDto`:** A anotação oculta `[JsonPropertyName("role")]` forçava a propriedade de nível de acesso do administrador a trafegar com as letras minúsculas, invalidando o sistema de controle de acesso (RBAC) do cliente, que buscava por `Role`.

### 2.2 Falhas Críticas de Segurança (Mitigadas)

1. **Exposição de Segredos Metrificados (IDOR):** O endpoint `GET /Orders` do backend respondia entregando a listagem com absolutamente **todos** os pedidos gravados no banco de dados para qualquer usuário autenticado, sem aplicar filtros baseados no ID do cliente ou no papel do usuário. O controlador foi blindado com checagem estrita de escopo de identidade.
2. **Vazamento de Secrets em Histórico:** Chaves simétricas de criptografia (`JWT_SECRET`) e senhas de instâncias de bancos de dados (`DB_PASSWORD`) foram commitadas diretamente em arquivos `.env` visíveis no histórico do repositório Git.

---

## 3. Por Que o Agente Anterior Entrou em Parafuso? (Erros Circulares)

O colapso cognitivo do agente anterior e a sua incapacidade de resolver o cenário em horas de processamento ocorreram devido a vícios clássicos de execução automatizada:

1. **Desenvolvimento Baseado em Adivinhação (Guess-driven Development):** O agente tratou o erro `400 Bad Request` da rota de saldos como um sintoma puramente estético de digitação de strings na URL (`Page` vs `page`, `Active` vs `active`). Ele ficou alternando o formato do texto em ciclos repetitivos no cliente sem realizar o passo fundamental: **inspecionar a resposta detalhada de validação do modelo (`ProblemDetails` ou dicionário do `ModelState`) emitida pelo servidor .NET**.
2. **Falta de Cruzamento de Fronteiras de Código:** O agente alterava arquivos no frontend operando sob a premissa teórica de como o C# deveria funcionar, em vez de usar as ferramentas do ecossistema para abrir os arquivos de classe reais do backend (`AdminUserDto.cs`, `ServiceBalancesController.cs`). Ele não percebeu as anotações explícitas de atributos e as assinaturas de método que sobrescreviam as políticas globais do serializador.
3. **Incapacidade de Detectar Erros de Compilação Silenciosos:** O agente assumia que se o build do TypeScript passava, a lógica de execução estava correta. Ele ignorou o fato de que acessar propriedades inexistentes em JavaScript (como tentar ler `.id` de um objeto que agora só possui `.Id`) não gera erros de compilação se o tipo for implicitamente mapeado como `any`, resultando em valores `undefined` que quebravam os hooks em tempo de execução.
4. **Loop de Correção de Efeito em Vez de Causa:** Ao se deparar com os menus desaparecendo, o agente tentava reescrever as condicionais de visibilidade da Sidebar. Ele não possuía a capacidade abstrata de entender que os menus sumiam porque a requisição de inicialização de saldos explodia com erro 400 na montagem do componente, quebrando o estado reativo do React Query e paralisando a renderização do layout inteiro.

---

## 4. Plano de Prevenção: Como Evitar Que Isso Aconteça Novamente

Para impedir que os agentes entrem em loops circulares de adivinhação e garantir que o desenvolvimento mantenha o padrão ouro de mercado, as seguintes regras operacionais passam a ser mandatórias no ecossistema:

* **Proibição de Chutes de Payload:** O agente está proibido de propor alterações em chaves de requisições HTTP baseando-se em suposições. Antes de modificar qualquer linha no frontend, o agente **deve obrigatoriamente** inspecionar o arquivo do controlador correspondente no C# e sua respectiva classe DTO para extrair o contrato exato.
* **Leitura Obrigatória de Respostas de Erro:** Diante de qualquer erro de rede da família `400 (Bad Request)` ou `422 (Unprocessable Entity)`, a primeira ação do agente deve ser injetar logs de depuração para capturar e ler o objeto `error.response.data`. Nenhuma refatoração de código pode ser iniciada sem o diagnóstico estruturado do servidor em mãos.
* **Auditoria de Arquivos de Exportação (Barrel Check):** Toda alteração arquitetural que envolva renomear, mover ou deletar arquivos de serviços ou hooks deve ser acompanhada por uma varredura imediata nos arquivos de índice (`index.ts`) e arquivos de tipos globais (`types.ts`) para expurgar importações fantasmas antes de rodar os containers.
* **Isolamento Estrito de Escopos:** Manter a diretriz imutável de jamais misturar refatorações de backend, frontend e infraestrutura em um único prompt gigante. Alterações de contrato de API devem ser executadas primeiro no servidor, validadas através de compilação nativa, commitadas atomicamente, e só então espelhadas na camada de serviços do cliente.

---
