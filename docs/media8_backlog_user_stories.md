# 📋 BACKLOG DEFINITIVO E INTEGRADO: MEDIA 8

---

## 👥 ÉPICO 1: Autenticação e Controle de Acesso (RBAC)
*Responsável por isolar o acesso baseado em cargos (`Client`, `Editor`, `Admin`) tanto nas rotas da API quanto na renderização de telas no frontend.*

### US 1.1: Autenticação de Usuário (Login)
* **Descrição:** Como **Usuário Cadastrado**, quero informar meu e-mail e senha na tela de login para que eu receba um token de acesso seguro (JWT) e consiga acessar o painel do sistema.
* **Critérios de Aceite:**
    * O endpoint `/auth/login` deve validar se as credenciais batem com o hash criptografado no banco de dados.
    * O sistema deve retornar um token JWT contendo os *Claims* de ID e o papel do usuário (`Role`).
    * O frontend deve salvar o token de forma segura no `LocalStorage` e repassar no cabeçalho das requisições subsequentes como `Authorization: Bearer <token>`.

### US 1.2: Perfil de Usuário Autenticado (`/users/me`)
* **Descrição:** Como **Usuário Logado**, quero que o sistema carregue automaticamente meus dados básicos e de meu perfil (`Profile`) ao acessar o painel, para customizar minha experiência de uso.
* **Critérios de Aceite:**
    * A rota `/users/me` deve decodificar o token enviado e buscar os dados de credencial (`users`) e dados pessoais (`profiles`) de forma associada.

### US 1.3: Gestão de Usuários no Painel Administrativo
* **Descrição:** Como **Admin**, quero listar todos os usuários da aplicação de forma paginada e com barra de pesquisa para poder auditar e gerenciar quem utiliza o sistema.
* **Critérios de Aceite:**
    * O endpoint `GET /users?search=&page=` deve filtrar por nome ou e-mail na base do PostgreSQL.
    * A busca no frontend deve possuir um mecanismo de *Debounce* (atraso de digitação) para não disparar requisições à API a cada caractere digitado.

---

## ⚙️ ÉPICO 2: Gestão Dinâmica de Formatos de Vídeo (Data-Driven)
*Substitui o Enum estático `ServiceType` por uma estrutura onde novos tipos de vídeo são adicionados dinamicamente no banco de dados pelo Admin, evitando atualizações de código fonte.*

### US 2.1: Cadastro de Formatos de Vídeo (Catálogo Técnico)
* **Descrição:** Como **Admin**, quero cadastrar novos formatos de entrega (ex: "Reels Premium", "YouTube Longo", "TikTok Trend") informando o limite de tempo em segundos e a complexidade padrão, para expandir o portfólio da agência sem mexer no código.
* **Critérios de Aceite:**
    * Os formatos cadastrados devem ser salvos em uma tabela própria (`video_formats`), especificando o `max_duration_seconds` e um identificador único (*Slug*).
    * O sistema deve carregar essa lista na inicialização do backend dentro de um cache em memória RAM (`IMemoryCache`), garantindo que consultas operacionais não sobrecarreguem o PostgreSQL.

---

## 📦 ÉPICO 3: Catálogo de Pacotes e Contratos (Snapshot Pattern)
*Gerencia a vitrine de produtos e a criação de contratos comerciais blindados contra alterações retroativas de preços ou regras.*

### US 3.1: Criação de Pacotes Promocionais
* **Descrição:** Como **Admin**, quero criar pacotes de venda no sistema associando quais formatos dinâmicos de vídeo fazem parte daquele pacote e qual a quantidade permitida, para comercializar o produto para novos clientes.
* **Critérios de Aceite:**
    * O endpoint `POST /packages` deve aceitar a lista de IDs dos formatos de vídeo suportados.
    * O pacote deve armazenar propriedades de controle de exibição pública (`is_public`).

### US 3.2: Exibição da Landing Page / Catálogo
* **Descrição:** Como **Cliente ou Visitante**, quero visualizar os pacotes ativos na página inicial para escolher a melhor opção antes de realizar a compra.
* **Critérios de Aceite:**
    * A rota `GET /packages` deve retornar apenas os pacotes cujo campo de visibilidade esteja ativo.

### US 3.3: Atribuição de Pacote com Blindagem Histórica (Snapshot Pattern)
* **Descrição:** Como **Admin**, ao fechar um contrato com um cliente, quero associar um pacote à conta dele, salvando uma cópia estática das regras acordadas, para proteger a empresa e o cliente contra reajustes futuros de preços.
* **Critérios de Aceite:**
    * O endpoint `POST /assignments` deve gerar um registro na tabela de atribuições (`package_assignments`).
    * O sistema deve **copiar de forma imutável** o nome do pacote, o preço cobrado, e a quantidade de vídeos contratada para dentro das colunas de snapshot da tabela de atribuição.

---

## 💰 ÉPICO 4: Carteira de Créditos e Motor de Consumo FIFO
*Controla de forma ultra-fiel o estoque de saldo utilizável do cliente, evitando perdas de prazos de expiração.*

### US 4.1: Geração Automática de Lotes de Saldo
* **Descrição:** Como **Sistema**, assim que uma atribuição de contrato for efetivada para um cliente, quero gerar automaticamente lotes de créditos específicos para cada formato de vídeo contido no pacote, para preencher a carteira do usuário.
* **Critérios de Aceite:**
    * O sistema deve inserir linhas na tabela `service_balance_lots`, preenchendo a quantidade inicial e definindo a data limite em `expires_at`.

### US 4.2: Consulta de Saldos Disponíveis
* **Descrição:** Como **Cliente**, quero acessar a tela inicial do meu painel para visualizar de forma clara e consolidada quantos vídeos de cada formato eu ainda posso solicitar antes do vencimento.
* **Critérios de Aceite:**
    * A rota `GET /service-balances/my-balances` deve retornar uma resposta otimizada que agrupa os lotes ativos, mostrando a soma de saldo restante (`remaining_quantity`) por formato de vídeo.

### US 4.3: Abatimento de Créditos Automático (Lógica FIFO)
* **Descrição:** Como **Sistema**, no exato momento em que um cliente solicitar a edição de um vídeo, quero rastrear seus lotes de saldo e descontar 1 unidade daquele que possuir a data de expiração mais próxima, protegendo o cliente de perder créditos antigos.
* **Critérios de Aceite:**
    * A lógica do motor de saldo deve executar uma query ordenada por `expires_at ASC` para identificar o lote prioritário.
    * O campo `remaining_quantity` deve ser decrementado de maneira transacional em banco de dados, aplicando um *Lock* na linha para evitar condições de corrida (Race Conditions).

---

## 🎨 ÉPICO 5: Perfis de Edição (Briefing de Marca Reutilizável)
*Evita o retrabalho do cliente ao criar pedidos, permitindo o armazenamento de perfis estéticos permanentes para diferentes verticais de sua marca.*

### US 5.1: Criação e Gerenciamento de Perfis de Briefing
* **Descrição:** Como **Cliente**, quero criar múltiplos Perfis de Edição (ex: "Perfil Vídeos de Autoridade", "Perfil Criativos de CTA", "Perfil Vídeo-Aulas") detalhando a identidade visual da minha marca, referências de estilo, fontes e cores fixas, para que eu não precise digitar essas informações repetidamente a cada novo pedido.
* **Critérios de Aceite:**
    * O sistema deve fornecer um CRUD completo associado à tabela `editing_profiles` vinculada ao ID do cliente.
    * Campos obrigatórios no formulário: Nome do Perfil, Diretrizes da Marca, Estilo de Legenda, Ritmo de Corte e Cores de Destaque.

### US 5.2: Vinculação Obrigatória de Perfil na Criação do Pedido (UI Dropdown)
* **Descrição:** Como **Cliente**, ao abrir a tela de solicitação de edição de vídeo, quero selecionar obrigatoriamente um dos meus Perfis de Edição existentes através de um menu de seleção, para aplicar as diretrizes da minha marca de forma automática naquele pedido.
* **Critérios de Aceite:**
    * O dropdown de seleção de perfil deve exibir obrigatoriamente a opção **"+ Novo Perfil"** fixada no topo da lista.
    * Caso o cliente selecione "+ Novo Perfil", um modal ou aba lateral deve se abrir imediatamente para o preenchimento do novo briefing sem perder os dados já inseridos na criação da ordem.
    * O envio do formulário de pedido (`Order`) deve ser bloqueado se nenhum perfil de briefing válido estiver selecionado.

---

## 🎬 ÉPICO 6: Produção Audiovisual e Linha do Tempo (Orders)
*O fluxo transacional de trabalho entre os Clientes que demandam os vídeos e os Editores que executam o trabalho operacional.*

### US 6.1: Abertura de Pedido de Edição
* **Descrição:** Como **Cliente**, quero preencher um pedido fornecendo o Título, o Briefing Detalhado (específico apenas para as minutagens e cortes daquele arquivo bruto), o link dos arquivos no Google Drive e a data de entrega desejada, para disparar a produção do material.
* **Critérios de Aceite:**
    * O formulário deve receber o ID do `EditingProfile` selecionado (conforme US 5.2) e o ID do formato de vídeo consumido.
    * O estado inicial do registro deve ser salvo com o status de `Pending` na tabela `orders`.

### US 6.2: Fluxo de Status de Edição e Entrega do Arquivo Final
* **Descrição:** Como **Editor ou Admin**, quero alterar o status do pedido à medida que avanço no trabalho e anexar o link do vídeo finalizado, para que o cliente acompanhe o progresso e possa revisar o resultado.
* **Critérios de Aceite:**
    * O status da ordem deve transicionar entre os estados definidos no domínio: `Pending`, `InProgress`, `InReview`, `ChangesRequested` e `Approved`.
    * Ao mudar o estado para `InReview`, o preenchimento do campo `final_video_url` torna-se obrigatório.

### US 6.3: Linha do Tempo e Trilha de Auditoria do Pedido
* **Descrição:** Como **Qualquer Usuário Vinculado ao Pedido**, quero visualizar um histórico cronológico de todas as modificações e comentários inseridos no vídeo, para entender o fluxo de alterações sem gerar ruídos de comunicação.
* **Critérios de Aceite:**
    * Toda alteração de status ou comentário enviado deve gerar um registro automático na tabela `order_timelines`.
    * O registro deve conter o ID do usuário executor, o tipo de ação (`StatusChange`, `Comment`, `VersionUpload`) e a data exata em UTC.

---

## 🔔 ÉPICO 7: Ecossistema de Notificações Internas e Rolagem Infinita
*Rastreia eventos chave do sistema e entrega as atualizações de forma performática na interface do usuário através de paginação em memória.*

### US 7.1: Disparo e Persistência de Notificações de Eventos
* **Descrição:** Como **Sistema**, quero que cada mudança crítica no ciclo de vida de um pedido (ex: vídeo entregue para revisão, alteração solicitada) gere uma notificação no banco de dados para o usuário correspondente, mantendo o controle do status de leitura.
* **Critérios de Aceite:**
    * O sistema deve salvar os alertas na tabela `notifications` contendo campos como `user_id`, `title`, `content`, `type` (`Info`, `Success`, `Warning`, `Order`) e um booleano `is_read` com padrão `false`.
    * Deve ser criado um índice composto no banco de dados PostgreSQL sob as colunas `(user_id, is_read, created_at DESC)` para otimizar a velocidade de carregamento da interface.

### US 7.2: Menu de Pré-visualização do Sininho (Mini Popup)
* **Descrição:** Como **Usuário Logado**, quero clicar no ícone de sininho no cabeçalho do sistema e visualizar um menu flutuante compacto com as atualizações recentes, para me atualizar rapidamente sem sair da página atual.
* **Critérios de Aceite:**
    * O mini-menu popup deve renderizar estritamente **as últimas 5 notificações não lidas** (`is_read = false`) ordenadas pela data mais recente.
    * Caso todas as notificações do usuário estejam marcadas como lidas, o menu deve exibir explicitamente uma mensagem amigável informando que não há novas notificações.

### US 7.3: Tela de Histórico Completo com Rolagem Infinita (Infinite Scroll)
* **Descrição:** Como **Usuário Logado**, quero acessar a página completa de notificações ("Ver Todas") e rolar a página para baixo de forma contínua para ler meu histórico completo de alertas de forma fluida e sem travar a navegação.
* **Critérios de Aceite:**
    * A listagem completa na página deve implementar paginação por cursor ou offset com o **limite estrito de 20 registros por carregamento**.
    * Ao atingir a base do container de rolagem no frontend, o componente de interface `InfiniteScroll` deve disparar automaticamente uma nova chamada de API requisitando mais 20 registros dinamicamente (`+20`, `+20`), anexando-os à lista visível sem recarregar a tela inteira.
    * A interface deve permitir ações em massa para "Marcar Todas como Lidas", atualizando o campo `is_read = true` de forma eficiente no banco.

---

## 🔗 ÉPICO 8: Integrações Externas e Automação (Webhooks)
*Garante o desacoplamento de serviços de marketing e CRM disparando eventos para plataformas externas de automação.*

### US 8.1: Barramento de Eventos Externos via Webhook
* **Descrição:** Como **Sistema**, toda vez que uma notificação crítica for gerada internamente, quero disparar simultaneamente um gatilho HTTP "Fire-and-Forget" para uma URL externa configurada, para que ferramentas de automação como n8n ou Zapier enviem e-mails ou mensagens de WhatsApp externas para o cliente.
* **Critérios de Aceite:**
    * O barramento de integração deve ler a variável de ambiente `WEBHOOK_NOTIFICATION_URL`.
    * O disparo HTTP deve rodar de forma assíncrona em segundo plano (*Background Service*), garantindo que se o n8n estiver fora do ar, a resposta da API do sistema principal para o usuário não sofra atraso ou lentidão.
