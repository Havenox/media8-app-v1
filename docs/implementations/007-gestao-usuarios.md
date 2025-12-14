# Implementação: Gestão de Usuários (Admin) - Final

**Data:** 14/12/2025
**Responsável:** Havenox
**Status:** Planejado

## Resumo
Implementação das funcionalidades de gestão de usuários no painel administrativo, focando em performance (correção N+1) e separação de segurança (DTOs isolados).

## Diretrizes Críticas
1.  **Segurança Auth**: **PROIBIDO** alterar `AuthDtos.cs` ou fluxo de Login/Register.
2.  **Role**: Todas as rotas de escrita restritas a `[Authorize(Roles = "Admin")]`.
3.  **Deleção**: Funcionalidade de excluir usuário **não está no escopo** atual.

## Escopo Técnico

### 1. Novos DTOs de Gestão (`Media8.Application/DTOs/Users/`)
Criar DTOs específicos para o contexto administrativo, evitando acoplamento com a autenticação pública.

*   **`AdminUserDto.cs`**:
    *   Campos: Id, Name, Email, Phone, Role, `ActivePackage` (Objeto simplificado: { Name, VideoQuantity, Expiry }).
*   **`CreateUserRequest.cs`**:
    *   Campos: Name, Email, Password, Role.
*   **`AdminUpdateUserRequest.cs`**:
    *   Campos: Name, Email, Phone, Role.

### 2. Backend: UsersController
Alterar `UsersController.cs` para suportar as novas operações:

*   **`GET /api/v1/users` (Otimizado)**:
    *   **Paginação**: Adicionar parâmetros `int page = 1`, `int pageSize = 20`.
    *   **Eager Loading**: Incluir `Assignments` e `Package` na query do EF Core.
    *   **Mapeamento**: Preencher `AdminUserDto.ActivePackage` no backend (eliminando N+1 no front).
*   **`POST /api/v1/users`**:
    *   Validar duplicidade de Email.
    *   Gerar Hash da senha (`IPasswordHasher`).
    *   Criar User + Profile + UserRole.
*   **`PUT /api/v1/users/{id}`**:
    *   Validar Roles permitidas.
    *   Atualizar dados de perfil e tabela `AspNetUserRoles` se houver mudança de cargo.

### 3. Frontend: UsersPage e Hooks
*   **Performance**:
    *   Substituir `useUsers` simples por `useInfiniteQuery` (Paginação Infinita).
    *   Remover chamadas individuais de `useClientAssignments` na lista. Ler direto de `user.activePackage`.
*   **Funcionalidades**:
    *   **Novo Usuário**: Conectar modal existente ao novo endpoint POST.
    *   **Editar Usuário**: Implementar chamada ao endpoint PUT.
    *   **Atribuir Pacote**: Manter funcionalidade existente (já operante).

## Passo a Passo de Execução
1.  **Backend**: Criar arquivos DTO (`AdminUserDto`, `CreateUserRequest`, `AdminUpdateUserRequest`).
2.  **Backend**: Implementar lógica no `UsersController` (Get Otimizado, Create, Update).
3.  **Frontend**: Atualizar tipos (`types/api.ts`) e `userService.ts` para suportar paginação.
4.  **Frontend**: Refatorar `UsersPage.tsx` para usar scroll infinito e dados otimizados.

## Verificação
1.  Acessar lista: garantir que carregue 20 usuários e não dispare requests de `assignments`.
2.  Criar usuário: verificar se loga com a senha criada.
3.  Editar usuário: alterar Role para Admin e verificar acesso.
