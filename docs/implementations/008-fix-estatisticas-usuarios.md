# Implementação de Estatísticas de Usuários (Backend-Side)

## Contexto e Problema
Atualmente, a página de Gestão de Usuários exibe contadores (Total, Admins, Clientes, Editores) baseados na lista de usuários carregada no Frontend.
Como implementamos paginação (Infinite Scroll), a lista inicial contém apenas o tamanho da página (ex: 20 registros). Isso faz com que os contadores exibam incorretamente o número "20", mesmo que existam milhares de usuários no banco de dados.

## Solução Proposta
Para resolver isso sem comprometer a performance (evitando carregar todos os usuários para o navegador), implementaremos um endpoint dedicado para calcular essas estatísticas diretamente no banco de dados.

### 1. Alterações no Backend (`Media8.Api`)

#### Novo DTO
Criação de `UserStatsDto.cs` para transportar os dados:
```csharp
public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalAdmins { get; set; }
    public int TotalClients { get; set; }
    public int TotalEditors { get; set; }
}
```

#### Atualização no Controller (`UsersController.cs`)
Adição do endpoint `GET /api/v1/users/stats` que executa consultas de contagem otimizadas:
- Count total de usuários.
- Count agrupado por Role (Admin, Client, Editor).

### 2. Alterações no Frontend (`media8-web`)

#### Hooks e Serviços
- Atualização em `userService.ts` para consumir o novo endpoint.
- Criação do hook `useUserStats` em `useUsers.ts`.

#### Interface (`UsersPage.tsx`)
- Substituição da lógica de cálculo local (`users.length`) pelo consumo do dado retornado pelo hook `useUserStats`.
- Adição de "Skeletons" (placeholders de carregamento) nos cards de estatística enquanto os dados são buscados.

## Benefícios
- **Precisão**: Os números refletirão o estado real do banco de dados.
- **Performance**: A query de `COUNT` no banco é extremamente leve comparada à transferência de dados de entidades completas.
### 3. Segurança
Todos os novos endpoints, incluindo o de estatísticas, seguirão rigorosamente as políticas de segurança:
- **`GET /api/v1/users/stats`**: Será protegido pelo atributo `[Authorize(Roles = "Admin")]`.
    - Isso garante que apenas administradores autenticados possam visualizar os totais do sistema.
    - Clientes e Editores receberão erro 403 (Forbidden) se tentarem acessar essa rota.
- O endpoint não expõe dados sensíveis (apenas contagens numéricas).
