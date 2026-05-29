# 092 - [Contratos]: Paginação de Alta Performance, Rolagem Infinita e Segregação de Roles

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
À medida que a base de dados de contratos crescia, carregar a listagem completa de contratos de uma só vez tornou-se inviável, ameaçando a performance de rede e a renderização do frontend. Além disso, a aplicação apresentava dois problemas críticos de fluxo de requisições:
1. **Falta de Paginação**: A listagem de contratos não seguia o padrão global de carregamento sob demanda por scroll infinito.
2. **Loops de Requisição e Conflito de Roles**: Quando o usuário era do tipo Cliente, a página de contratos insistia em tentar buscar os endpoints reservados para a role Admin (gerando loops e erros `403 Forbidden` insistentes no console), e vice-versa quando o Admin estava logado (chamando o endpoint `my` inapropriadamente).

## 🧠 Estratégia da Solução
Para garantir alto desempenho e uma navegação fluida, implementamos um padrão robusto de paginação estrita ponta a ponta:
1. **Banco de Dados (API)**: Adicionamos paginação real usando operadores `.Skip()` e `.Take()` do EF Core nas consultas do banco de dados, transmitindo a contagem total de itens no cabeçalho customizado `X-Total-Count` para calcular dinamicamente o fim das listas.
2. **Interface do Usuário**: Substituição da paginação tradicional por carregamento incremental dinâmico, acionando o hook customizado com `<InfiniteScroll />` integrado no React.
3. **Isolamento de Requisições por Perfil**: Condicionamos o disparo de requisições para a API usando flags estritas baseadas no papel do usuário (`isAdmin` vs `!isAdmin`), silenciando completamente erros desnecessários no console do navegador.

## 🛠️ Implementação Técnica

### Backend (C# / .NET Core)
* **Ajuste de Assinatura nos Métodos**: Atualizados os métodos `GetAllContracts` e `GetMyContracts` no `ClientContractsController.cs` para receber `[FromQuery] int page = 1` e `[FromQuery] int pageSize = 10`.
* **Cálculo Físico**:
  - Salva o valor absoluto de `total = await query.CountAsync()` antes de paginar.
  - Aplica o fatiamento real `.Skip((page - 1) * pageSize).Take(pageSize)`.
  - Retorna a contagem total anexada aos cabeçalhos HTTP: `Response.Headers.Append("X-Total-Count", total.ToString());`.

### Frontend (React / TypeScript)
* **API Service (`clientContractService.ts`)**: Modificados os serviços para passar dinamicamente os parâmetros de `page` e `pageSize`.
* **Hooks Customizados (`useClientContracts.ts`)**:
  - Criados os hooks baseados em paginação infinita: `useInfiniteClientContracts` (para administradores) e `useInfiniteMyClientContracts` (para clientes).
  - Utilizada a API `useInfiniteQuery` do React Query com a lógica `getNextPageParam` calculada a partir do cabeçalho `x-total-count` decodificado na resposta do backend.
* **Refatoração da Página (`ContractsPage.tsx`)**:
  - Integração visual com o componente global de Scroll Infinito da aplicação: `<InfiniteScroll next={fetchNextPage} hasMore={!!hasNextPage} ... />`.
  - **Segregação de Roles**: Configuração da diretiva `enabled: isAdmin` para a query administrativa e `enabled: !isAdmin` para a query de cliente logado.

## 🎯 Impacto e Resultado
* **Consumo de Banda Otimizado**: A página de contratos agora carrega instantaneamente carregando de 10 em 10 itens apenas quando necessário na rolagem.
* **Console Limpo (Zero 403 Forbidden)**: Eliminados por completo os disparos redundantes e indevidos de requisições baseados em papéis de autenticação, garantindo integridade arquitetural.
* **Experiência de Uso Fluida**: Transições de rolagem imperceptíveis e perfeitamente adequadas ao padrão global estabelecido no ecossistema Media8.

---
**Nota do Desenvolvedor:** *A paginação não é apenas uma boa prática de performance; é uma necessidade de escalabilidade. Ao silenciar requisições indevidas usando hooks ativados por escopo de perfil (`enabled`), respeitamos a segurança de acesso e poupamos chamadas inúteis ao servidor de produção.*
