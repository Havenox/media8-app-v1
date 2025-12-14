# Implementação: Busca Server-Side Otimizada (Debounce & Pagination)

## Contexto
A busca de usuários apresentava problemas de performance e escalabilidade. O método antigo carregava toda a base de dados em memória (`IEnumerable` vs `IQueryable`) e filtrava no cliente. Além disso, a busca disparava requisições excessivas por falta de *debounce*.

## Solução Técnica

### 1. Refatoração Backend (C# .NET)

#### Novo Método no Repositório
Foi abandonado o uso de `GetAllWithProfilesAsync()` em favor de uma abordagem `IQueryable`.

**Assinatura:**
```csharp
Task<PagedResult<User>> GetPagedAsync(string? search, string? role, int page, int pageSize);
```

**Lógica (SQL Eficiente):**
1.  Inicia query `_dbSet.AsQueryable()`.
2.  Aplica `Include` (Profile, Roles, Packages).
3.  **Search Term:** Aplica `Where(u => u.Email.Contains(search) || u.Profile.Name.Contains(search))` se houver termo.
4.  **Role Filter:** Aplica `Where(u => u.Roles.Any(...))` se houver filtro.
5.  **Ordenação:** `OrderBy(u => u.Profile.Name)`.
6.  **Paginação:** `Skip((page - 1) * pageSize).Take(pageSize)`.
7.  **Execução:** `ToListAsync()`.

### 2. Otimização Frontend (React)

#### Hook `useDebounce`
Introduzido para evitar "batimento de tecla" = "requisição".
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  // ... retorna valor com delay
}
```

#### React Query Keys
A chave de cache mudou para incluir o termo de busca:
```typescript
queryKey: ['users', 'list', 'infinite', { role, search: debouncedSearch }]
```
Isso garante que ao digitar "Ana", o React Query cacheie especificamente essa busca. Ao apagar, ele retorna ao cache da lista completa instantaneamente, sem nova requisição.

## Análise de Segurança (Security Assessment)

### 1. Prevenção de SQL Injection (EF Core)
A implementação utiliza **Entity Framework Core** com LINQ e `IQueryable`.
*   **Mecanismo de Defesa**: O EF Core utiliza nativamente *Parameterized Queries* (Consultas Parametrizadas) ao traduzir LINQ para SQL.
*   **Como funciona**: O valor do input `search` é enviado como um parâmetro SQL isolado (`@p0`), e nunca concatenado na string de comando. O motor do banco de dados trata esse valor estritamente como dado, tornando matematicamente impossível que um input como `'; DROP TABLE Users;--` seja executado como comando.
*   **Garantia**: **Não utilizaremos** `FromSqlRaw` ou concatenação de strings na camada de dados.

### 2. Controle de Acesso (RBAC & Segregação)
A reutilização de código (hooks/repositórios) não implica em compartilhamento de permissões. A segurança é aplicada na camada de **Controller (API Endpoint)**.

*   **Problema Detectado**: O controller atual possui apenas `[Authorize]`, permitindo que *qualquer* usuário autenticado (mesmo Clientes) liste todos os usuários.
*   **Correção de Segurança**: Adicionaremos o atributo explícito `[Authorize(Roles = "Admin")]` no endpoint `GetAll`.
*   **Isolamento**:
    *   **Admin**: Acessa `GET /api/v1/users` -> pode ver tudo.
    *   **Cliente**: Se tentar acessar esse endpoint, receberá `403 Forbidden`. O Cliente utilizará outros endpoints (ex: `GET /api/v1/packages/my-packages`) que filtram os dados pelo ID do usuário logado (`User.Identity.Name`).
    *   **Reuso Seguro**: O mecanismo de "buscar no banco" é genérico, mas **quem** pode chamar e **quais** dados são retornados é restrito pelo contexto da chamada (Controller).

## Guia de Reuso (Padrão Industrial)

Para implementar buscas similares em outras telas (ex: Pacotes):

1.  **Backend:** Sempre crie métodos que aceitem `search` e retornem dados paginados via `IQueryable`. Nunca use `IEnumerable` para filtrar listas grandes.
2.  **Frontend:**
    *   Use o hook `useDebounce` no valor do Input.
    *   Passe o valor `debounced` para o seu hook de data fetching.
    *   O hook de data fetching deve incluir o termo `search` na `queryKey`.
