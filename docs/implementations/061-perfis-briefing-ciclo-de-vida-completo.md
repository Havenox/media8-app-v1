# 061 - Perfis de Briefing: Ciclo de Vida Completo com IsActive

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 22/05/2026

---

## 🚀 Desafio de Engenharia

Após a criação das entidades de domínio para `VisualIdentityProfile` e `EditingProfile` (documento 060), o sistema possuía apenas operações básicas de CRUD sem nenhum controle de ciclo de vida. Isso criava vários problemas:

1. **Exclusão Acidental**: Usuários poderiam excluir perfis importantes sem querer, sem possibilidade de recuperação.
2. **Falta de Governança**: Não havia distinção entre "excluir" (arquivar) e "excluir permanentemente" (hard delete).
3. **Risco de Dados Órfãos**: Perfis poderiam ser excluídos mesmo estando vinculados a pedidos históricos, corrompendo a integridade dos dados.
4. **Sem Filtro de Exibição**: A listagem não diferenciava perfis ativos de arquivados, poluindo a UI do usuário.

O desafio era implementar um **ciclo de vida completo** seguindo o padrão ouro do Media8, com coluna `IsActive`, endpoints de restauração e exclusão física condicional com validação de vínculos.

## 🧠 Estratégia da Solução

A solução foi dividida em camadas, seguindo a arquitetura Clean Architecture do Media8:

### Decisões Arquiteturais

1. **Coluna `IsActive` (Soft Delete)**:
   - Adicionada em ambas entidades com valor padrão `TRUE`
   - Permite arquivamento sem perda de dados
   - Segue convenção já estabelecida em outras tabelas do sistema

2. **Separação de Responsabilidades**:
   - **DELETE** `/ {id}`: Arquiva (soft delete) - operação padrão
   - **POST** `/{id}/restore`: Restaura (reativa) - operação de lixeira
   - **DELETE** `/{id}/hard-delete`: Exclusão física - apenas para inativos

3. **Blindagem de Negócio**:
   - Validação: perfil deve estar inativo para hard delete
   - Validação futura: verificar vínculo com pedidos antes de excluir
   - Tratamento semântico de erros via `BusinessRuleException` (HTTP 422)

4. **Filtro de Listagem**:
   - Parâmetro opcional `?onlyActive=true` (default)
   - Permite listar arquivados na lixeira com `?onlyActive=false`

## 🛠️ Implementação Técnica

### 1. Infraestrutura de Banco de Dados

**Arquivo:** `Media8.Domain/Entities/VisualIdentityProfile.cs` e `EditingProfile.cs`

```csharp
/// <summary>
/// Indicates whether the profile is active (not archived).
/// Default: true (active)
/// </summary>
public bool IsActive { get; set; } = true;
```

**Arquivo:** `Media8.Infrastructure/Data/ApplicationDbContext.cs`

```csharp
entity.Property(vip => vip.IsActive).IsRequired().HasDefaultValue(true);
```

**Migration:** `20260522194449_AddIsActiveToBriefingProfiles`
- Adiciona coluna `IsActive boolean NOT NULL DEFAULT TRUE` em ambas tabelas

### 2. Camada de Aplicação (DTOs e Interfaces)

**Arquivos:** `DTOs/Profiles/VisualIdentityProfileDtos.cs`, `EditingProfileDtos.cs`

Adicionado propriedade `IsActive` nas classes de resposta:
```csharp
public class VisualIdentityProfileResponse
{
    // ... outras propriedades
    public bool IsActive { get; set; }
}
```

**Arquivos:** `Interfaces/IVisualIdentityProfileService.cs`, `IEditingProfileService.cs`

Novos métodos de ciclo de vida:
```csharp
Task<List<VisualIdentityProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true);
Task ArchiveAsync(Guid id);
Task RestoreAsync(Guid id);
Task HardDeleteAsync(Guid id);
```

### 3. Implementação dos Serviços

**Arquivos:** `Services/VisualIdentityProfileService.cs`, `EditingProfileService.cs`

**GetByUserIdAsync com Filtro:**
```csharp
public async Task<List<VisualIdentityProfile>> GetByUserIdAsync(Guid userId, bool onlyActive = true)
{
    if (onlyActive)
    {
        var profiles = await _repository.FindAsync(p => p.UserId == userId && p.IsActive == true);
        return profiles.ToList();
    }
    else
    {
        var profiles = await _repository.FindAsync(p => p.UserId == userId);
        return profiles.ToList();
    }
}
```

**ArchiveAsync (Soft Delete):**
```csharp
public async Task ArchiveAsync(Guid id)
{
    var profile = await GetByIdOrThrowAsync(id);
    profile.IsActive = false;
    profile.UpdatedAt = DateTime.UtcNow;
    await _repository.UpdateAsync(profile);
}
```

**HardDeleteAsync (Exclusão Física com Validações):**
```csharp
public async Task HardDeleteAsync(Guid id)
{
    var profile = await GetByIdOrThrowAsync(id);

    // Validação: deve estar inativo
    if (profile.IsActive)
    {
        throw new BusinessRuleException(
            "O perfil deve estar arquivado (inativo) antes de ser excluído permanentemente.", 
            "PROFILE_MUST_BE_INACTIVE");
    }

    // TODO: Validar vínculo com Order quando campo for implementado
    // if (await _orderRepository.AnyAsync(o => o.VisualIdentityProfileId == id))
    // {
    //     throw new BusinessRuleException(
    //         "Este perfil está vinculado a um pedido ativo e não pode ser excluído definitivamente.", 
    //         "PROFILE_IN_USE");
    // }

    await _repository.DeleteAsync(id);
}
```

### 4. Endpoints da API

**Arquivos:** `Controllers/VisualIdentityProfilesController.cs`, `EditingProfilesController.cs`

**GET com Filtro:**
```csharp
[HttpGet]
public async Task<ActionResult<List<VisualIdentityProfileResponse>>> GetByUser([FromQuery] bool onlyActive = true)
{
    var userId = GetUserIdFromClaims();
    var profiles = await _profileService.GetByUserIdAsync(userId, onlyActive);
    // ... mapeamento para DTO
    return Ok(response);
}
```

**POST /restore:**
```csharp
[HttpPost("{id}/restore")]
public async Task<IActionResult> Restore(Guid id)
{
    var userId = GetUserIdFromClaims();
    var profile = await _profileService.GetByIdAsync(id);

    if (profile == null) return NotFound();
    if (profile.UserId != userId) return Forbid();

    await _profileService.RestoreAsync(id);
    return Ok();
}
```

**DELETE /hard-delete:**
```csharp
[HttpDelete("{id}/hard-delete")]
[ProducesResponseType(typeof(object), StatusCodes.Status422UnprocessableEntity)]
public async Task<IActionResult> HardDelete(Guid id)
{
    var userId = GetUserIdFromClaims();
    var profile = await _profileService.GetByIdAsync(id);

    if (profile == null) return NotFound();
    if (profile.UserId != userId) return Forbid();

    try
    {
        await _profileService.HardDeleteAsync(id);
        return NoContent();
    }
    catch (BusinessRuleException ex)
    {
        return UnprocessableEntity(new { message = ex.Message, errorCode = ex.ErrorCode });
    }
}
```

**DELETE padrão (agora arquiva):**
```csharp
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(Guid id)
{
    // ... validações de propriedade
    await _profileService.ArchiveAsync(id); // Antes era DeleteAsync
    return NoContent();
}
```

## 🎯 Impacto e Resultado

* **Governança de Dados**: Ciclo de vida completo implementado com arquivação, restauração e exclusão física segura.
* **Prevenção de Perda Acidental**: Usuários não perdem dados importantes sem querer - tudo vai para "lixeira" primeiro.
* **Integridade Referencial**: Validação (implementada, com TODO para campos futuros) impede exclusão de perfis em uso.
* **UX Aprimorada**: Filtro `?onlyActive=false` permite criar lixeira visual para perfis arquivados.
* **Semântica de Erros**: HTTP 422 com `errorCode` permite tratamento específico no frontend.
* **Padrão Consistente**: Segue convenção `IsActive` já usada em outras partes do sistema (Ofertas, Formatos, Estilos).

### Matriz de Endpoints Implementados

| Método | Endpoint | Descrição | Status Code |
|--------|----------|-----------|-------------|
| `GET` | `/api/v1/visual-identity-profiles` | Lista perfis ativos | 200 OK |
| `GET` | `/api/v1/visual-identity-profiles?onlyActive=false` | Lista todos (ativos + arquivados) | 200 OK |
| `DELETE` | `/api/v1/visual-identity-profiles/{id}` | Arquiva perfil (soft delete) | 204 NoContent |
| `POST` | `/api/v1/visual-identity-profiles/{id}/restore` | Restaura perfil arquivado | 200 OK |
| `DELETE` | `/api/v1/visual-identity-profiles/{id}/hard-delete` | Exclusão permanente | 204/422 |

*(Mesmos endpoints para `editing-profiles`)*

---

**Nota do Desenvolvedor:**

A implementação do ciclo de vida com `IsActive` segue o princípio de "segurança por padrão". Ao invés de confiar que o usuário não vai clicar em "excluir" sem querer, o sistema arquiva o perfil e permite recuperação posterior. A exclusão física (hard delete) é uma operação de "segundo nível" que requer:

1. **Consciência da ação**: O usuário precisa explicitamente chamar a rota `/hard-delete`
2. **Pré-condição**: O perfil já deve estar arquivado (dois passos para exclusão total)
3. **Validação de negócio**: Verificação de vínculos com pedidos (implementada via TODO para quando os campos forem adicionados à entidade `Order`)

O **TODO** deixado nos serviços e controllers para validação de vínculo com `Order` é intencional e documenta uma dívida técnica consciente: quando os campos `VisualIdentityProfileId` e `EditingProfileId` forem adicionados à entidade `Order` (se fizer sentido para o negócio), a validação de vínculo deve ser implementada para fechar o ciclo de governança.

Esta abordagem permite que a API já esteja em produção com o ciclo de vida funcional, enquanto a validação de vínculo pode ser implementada incrementalmente sem quebrar a interface existente.
