# 054 - Correção Completa: Governança de Usuários com IsActive, ShowInactive e Reativação Reativa

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 21/05/2026

---

## 🚀 Desafio de Engenharia

O sistema de governança de usuários estava com falhas críticas que impediam o uso operacional:

1. **Coluna `IsActive` existia no banco, mas não era exposta na API** - O DTO `AdminUserDto` não continha a propriedade `IsActive`, tornando a API cega para o status real das contas.
2. **Parâmetro `showInactive` era ignorado** - O frontend alternava o estado local, mas a query string `?showInactive=true` nunca chegava na backend, fazendo com que usuários inativos nunca aparecessem.
3. **Confirmação dupla no arquivamento** - O modal de confirmação abria duas vezes devido a propagação de eventos (event bubbling) entre componentes pais e filhos.
4. **Reload brutal da página na reativação** - Uso de `window.location.reload()` destruía o estado da SPA, causando piscar e perda de contexto.
5. **Sombreamento de variável (Temporal Dead Zone)** - Redeclaração de `const user` dentro de `onClick` causava erro de referência antes da declaração.

## 🧠 Estratégia da Solução

### 1. Sincronia de Contrato (DTO)
Adicionar `IsActive` no `AdminUserDto` e garantir o mapeamento correto no `UsersController` para expor o status real vindo do banco.

### 2. Fiação Completa do Parâmetro
Garantir que `showInactive` flua sem bloqueios:
- **Backend:** Repositório filtra `.Where(u => u.IsActive == !showInactive)`
- **Frontend Service:** `getAll()` repassa parâmetro sem omitir
- **Frontend Hook:** `queryKey` inclui `showInactive` para invalidação correta

### 3. Reatividade sem Reload
Substituir `window.location.reload()` por `queryClient.invalidateQueries({ queryKey: ['users'] })` para atualização em background.

### 4. Eliminação de Event Bubbling
- Remover AlertDialog de dentro do `UserDetailsSheet`
- Centralizar estado do modal na `UsersPage`
- Usar `e.stopPropagation()` em botões de ação

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**Arquivos Modificados:**
- `Media8.Application/DTOs/Users/AdminUserDto.cs`
- `Media8.Api/Controllers/UsersController.cs`
- `Media8.Application/Interfaces/IUserRepository.cs`
- `Media8.Infrastructure/Repositories/UserRepository.cs`

**Mudanças Chave:**

```csharp
// AdminUserDto.cs - Adicionado propriedade
public class AdminUserDto
{
  public bool IsActive { get; set; } // ✅ Novo
}

// UsersController.cs - Mapeamento
private static AdminUserDto MapToAdminDto(User user)
{
  return new AdminUserDto
  {
    IsActive = user.IsActive, // ✅ Mapeado
    // ...
  };
}

// UserRepository.cs - Filtro
public async Task<(IEnumerable<User>, int)> GetPagedAsync(
  string? search, string? role, int page, int pageSize, bool showInactive = false)
{
  var query = _dbSet.Where(u => u.IsActive == !showInactive); // ✅ Filtra
  // ...
}

// UsersController.cs - Endpoint de reativação
[HttpPut("{id:guid}/reactivate")]
public async Task<ActionResult> ReactivateUser(Guid id)
{
  var user = await _userRepository.GetByIdWithProfileAsync(id);
  user.IsActive = true;
  await _userRepository.UpdateAsync(user);
  return Ok(new { success = true, message = "Usuário reativado" });
}
```

### Frontend (React 18 / TypeScript)

**Arquivos Modificados:**
- `media8-web/src/services/userService.ts`
- `media8-web/src/hooks/useUsers.ts`
- `media8-web/src/pages/UsersPage.tsx`
- `media8-web/src/components/users/UserDetailsSheet.tsx`
- `media8-web/src/types/api.ts`

**Mudanças Chave:**

```typescript
// userService.ts - Repassa showInactive
export const userService = {
  async getAll(page = 1, pageSize = 20, role?: UserRole, search?: string, showInactive = false) {
    return getAllAPI(page, pageSize, role, search, showInactive);
  }
}

// useUsers.ts - QueryKey inclui showInactive
export const useInfiniteUsers = (role, pageSize, search, showInactive = false) => {
  return useInfiniteQuery({
    queryKey: userKeys.infinite({ role, pageSize, search, showInactive }),
    queryFn: ({ pageParam }) => userService.getAll(pageParam, pageSize, role, search, showInactive)
  });
}

// UsersPage.tsx - Invalidação reativa
const queryClient = useQueryClient();
const reactivateUserMutation = useMutation({
  mutationFn: (id) => userService.reactivate(id),
  onSuccess: () => {
    toast.success('Usuário reativado!');
    queryClient.invalidateQueries({ queryKey: ['users'] }); // ✅ Sem reload
  }
});

// UserDetailsSheet.tsx - Sem estado local, apenas callback
<Button
  onClick={(e) => {
    e.stopPropagation(); // ✅ Previne bubbling
    onDelete(user.id);    // ✅ Apenas emite evento
  }}
>
  Arquivar
</Button>

// UsersPage.tsx - Centraliza estado
<UserDetailsSheet
  onDelete={(userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToArchive(user);
      setIsArchiveDialogOpen(true); // ✅ Controla modal
    }
  }}
/>
```

### Correção de Temporal Dead Zone

**Antes (❌ Quebrado):**
```typescript
onClick={(e) => {
  e.stopPropagation();
  const user = users.find(u => u.id === user.id); // ❌ ReferenceError
  if (user) {
    setUserToRestore(user);
  }
}}
```

**Depois (✅ Correto):**
```typescript
onClick={(e) => {
  e.stopPropagation();
  setUserToRestore(user); // ✅ Usa escopo do .map()
  setIsRestoreDialogOpen(true);
}}
```

## 🎯 Impacto e Resultado

### Backend
- ✅ DTO expõe `IsActive` para todos os endpoints
- ✅ Filtro SQL correto via `showInactive`
- ✅ Endpoint de reativação (`PUT /users/{id}/reactivate`) implementado

### Frontend
- ✅ Query string `?showInactive=true` é enviada corretamente
- ✅ Lista de inativos carrega quando alterna estado
- ✅ Reativação ocorre sem reload (cache invalidation)
- ✅ Modal de confirmação abre apenas 1 vez
- ✅ Sem erros de Temporal Dead Zone

### UX
- ✅ Transições suaves em background
- ✅ Feedback visual imediato via toast
- ✅ Sem piscar ou perda de estado da SPA
- ✅ Fluxo de arquivamento/reativação intuitivo

---

**Nota do Desenvolvedor:**
*A correção do fluxo de governança de usuários demonstrou a importância de seguir o ciclo completo de dados: Banco → Repositório → Controller → DTO → Service → Hook → Componente. Qualquer elo quebrado (como omitir parâmetro no service ou não invalidar cache) resulta em comportamento inconsistente. A centralização de estado na `UsersPage` e eliminação de AlertDialogs aninhados seguiu o princípio React de "single source of truth", prevenindo condições de corrida e duplo disparo de eventos. A substituição de `window.location.reload()` por invalidação de query é um padrão fundamental de React Query que preserva a experiência SPA.**
