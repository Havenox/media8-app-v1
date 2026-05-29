# 091 - [Contratos]: Histórico Seguro de Contratos, Arquivamento Lógico e Isolamento de Tenant

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
Até o momento, a plataforma Media8 não possuía uma tela dedicada para que o cliente logado pudesse gerenciar o histórico de seus contratos ativos e finalizados. Isso gerava ruído visual quando múltiplos contratos antigos/expirados acumulavam-se na área de saldos. Além disso, existiam dois riscos fundamentais de segurança e usabilidade:
1. A ausência de suporte a arquivamento lógico de contratos permitia que contratos inativos poluissem as visualizações.
2. Risco de IDOR (Insecure Direct Object Reference) e problemas de autenticação: o frontend tentava buscar contratos de forma insegura baseando-se em IDs arbitrários ou sofria de erros de autorização (401 Unauthorized) porque o frontend usava o claim de identificação `"sub"` do token JWT, que não resolvia o ID correto do usuário na infraestrutura de claims do ASP.NET Core Identity, gerando deslogamentos automáticos do usuário.

## 🧠 Estratégia da Solução
A arquitetura foi desenhada para blindar o acesso aos contratos e organizar a exibição histórica de forma limpa e performática:
1. **Banco de Dados**: Criação de um campo lógico `IsArchived` na tabela de contratos (`ClientContracts`) para ocultar ou exibir contratos sob demanda do usuário.
2. **Segurança de Tenant (Prevenção de IDOR)**: Criação de uma rota isolada `GET api/v1/ClientContracts/my` exclusiva para o cliente. A API resolve o ID do cliente logado diretamente a partir do claim `ClaimTypes.NameIdentifier` decodificado do JWT do usuário, sem expor parâmetros vulneráveis na URL.
3. **Organização Visual**: Uma aba dedicada de "Meus Contratos" com navegação entre "Ativos" e "Arquivados", utilizando o design system premium da marca (tons Creme Suave `#FFFBED`, Vinho Profundo `#400404`).

## 🛠️ Implementação Técnica

### Backend (C# / .NET Core)
* **Domínio e Entidades**: Adicionada propriedade `IsArchived` (booleano) à entidade `ClientContract`.
* **Migração Física**: Gerada e executada a migração `AddIsArchivedToClientContracts` para adicionar o campo com valor padrão `false` no banco PostgreSQL.
* **Controlador (`ClientContractsController.cs`)**:
  - Implementada a ação `GetMyContracts` blindada por token JWT do usuário, extraindo o ID do claim `NameIdentifier`.
  - Criadas ações `ArchiveContract` e `UnarchiveContract` sob a rota `POST api/v1/ClientContracts/{id}/archive` e `/unarchive` para controle seguro de arquivamento.
* **Resolução do Claim**: Substituído o parser que usava `"sub"` para utilizar `System.Security.Claims.ClaimTypes.NameIdentifier`, corrigindo a falha crítica de 401 Unauthorized.

### Frontend (React / TypeScript)
* **Tipos & Modelos**: Atualizada a interface `ClientContract` para expor e trafegar `IsArchived`.
* **Camada de Serviço (`clientContractService.ts`)**: Implementados métodos seguros para chamadas aos endpoints `my`, `archive` e `unarchive`.
* **Mutations & Hooks (`useClientContracts.ts`)**: Implementadas Mutations do React Query para arquivar e restaurar contratos com invalidação automática de cache.
* **Interface Premium (`ContractsPage.tsx`)**: Criada a página de histórico de contratos com abas, filtros inteligentes, estilizações contextuais e menu contextual suspenso de ações (Radix Menu) de arquivamento.

## 🎯 Impacto e Resultado
* **Segurança Total (Zero IDOR)**: Contratos de um cliente tornaram-se totalmente inacessíveis para outros clientes, com validação de escopo baseada em JWT no lado do servidor.
* **UX Sem Ruídos**: O cliente agora pode ocultar contratos antigos arquivando-os, mantendo o painel de saldos limpo e focado no ciclo atual.
* **Estabilidade de Conexão**: Eliminados os erros inesperados de logout causados pelo mapeamento incorreto do claim de ID do usuário.

---
**Nota do Desenvolvedor:** *O isolamento estrito de tenant baseado em tokens decodificados no servidor (claims seguros) é o padrão ouro absoluto contra ataques de IDOR. Ao combinarmos isso com o arquivamento lógico, oferecemos segurança corporativa aliada a uma interface focada no controle do usuário.*
