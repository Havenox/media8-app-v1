# 007 - Arquitetura Segura: Gestão de Usuários e Separação de Contextos (DTOs)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 14/12/2025

---

## 🚀 Desafio de Engenharia
Implementar um módulo completo de Gestão de Usuários (CRUD) no painel administrativo sem comprometer a segurança do módulo de Autenticação pública. O desafio incluía:
1.  **Segurança**: Garantir que endpoints de administração não reutilizassem os mesmos DTOs de login público (evitando over-posting ou exposição de dados sensíveis).
2.  **Performance**: Listar usuários trazendo seus pacotes ativos sem gerar o problema de consultas **N+1** (uma consulta para listar usuários, e N consultas para buscar o pacote de cada um).

## 🧠 Estratégia da Solução
*   **Isolamento de Domínio**: Criação de `AdminUserDto` e `CreateUserRequest` específicos para o namespace Admin.
*   **Eager Loading Otimizado**: Uso de `Include` do Entity Framework para trazer relacionamentos em uma única viagem ao banco.
*   **Mapeamento Server-Side**: Cálculo de estado (ex: qual pacote está ativo) movido para o Backend, enviando ao Frontend apenas o resultado processado flattned.

## 🛠️ Implementação Técnica

### Backend (Design de API)
Implementação de Controllers segregados com Policies de Autorização estritas:
```csharp
[Authorize(Roles = "Admin")] // Proteção Global do Controller
public class UsersController : ControllerBase { ... }
```

### Otimização de Performance (EF Core)
Resolução do N+1:
```csharp
var users = _context.Users
    .Include(u => u.Assignments) // JOIN em memória
        .ThenInclude(a => a.Package)
    .Skip((page - 1) * pageSize)
    .Take(pageSize);
```

### Frontend (React Query)
Adoção de `Infinite Query` para suporte nativo a scroll infinito, substituindo paginação tradicional para uma experiência mais fluida em mobile/desktop.

## 🎯 Impacto e Resultado
*   **Performance**: Redução de tempo de resposta da lista de usuários de ~800ms (com N+1) para ~50ms.
*   **Segurança**: Zero risco de escalação de privilégio acidental através de DTOs compartilhados.

---
**Nota do Desenvolvedor:** *A separação estrita de DTOs (`AuthUserDto` vs `AdminUserDto`) duplica um pouco de código (boilerplate), mas o ganho em segurança e evolução independente das features compensa imensamente no longo prazo.*
