# 063 - Sistema Completo de Perfis de Briefing: Do Backend ao Frontend em Cascata

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 23/05/2026

---

## 🚀 Desafio de Engenharia

O Media8 possuía um modelo de briefing estático onde clientes precisavam reinformar dados imutáveis da marca (cores, fontes, logos) e preferências artísticas (estilo de edição, trilha, hooks) a cada novo pedido. Isso gerava três problemas críticos:

1. **Retrabalho do Cliente**: Elementos estáticos da marca precisavam ser digitados repetidamente, mesmo que o cliente já tivesse um perfil de marca cadastrado.
2. **Poluição de Dados**: A tabela de `Orders` acumulava dados repetitivos e imutáveis, misturando o transitório (pedido específico) com o perene (identidade da marca).
3. **Falta de Governança**: Não havia distinção entre o que é **Identidade Visual** (a marca do cliente) e o que é **Perfil de Edição** (o estilo cinematográfico do vídeo), dificultando a reutilização de preferências artísticas.

Além disso, o sistema precisava garantir:
- **Ciclo de vida completo** com arquivação, restauração e exclusão física condicional
- **Trava de segurança** impedindo exclusão de perfis vinculados a pedidos históricos
- **Fluxo em cascata** na criação de pedidos, reutilizando os mesmos formulários de briefing
- **Atomicidade** nas operações de criação de pedidos (débito de saldo + criação do pedido)

## 🧠 Estratégia da Solução

A solução foi dividida em camadas, seguindo a arquitetura Clean Architecture do Media8:

### Decisões Arquiteturais

1. **Separação de Responsabilidades por Domínio**:
   - `BrandingProfile` (antigo `VisualIdentityProfile`): Elementos estáticos da marca (cores, fontes, redes sociais, público-alvo, assets)
   - `EditingProfile`: Dinâmica artística e técnica da edição (referências, cortes, thumbnails, hooks, notas)

2. **Nomenclatura de Mercado**:
   - `VisualIdentityProfile` → `BrandingProfile` (mais alinhado ao mercado de agências)
   - Endpoints PascalCase: `/BrandingProfiles`, `/EditingProfiles`

3. **Ciclo de Vida com `IsActive`**:
   - Soft delete como padrão (arquivação)
   - Hard delete apenas para perfis inativos e não vinculados
   - Validação de vínculos com pedidos antes de exclusão física

4. **Fluxo em Cascata no Frontend**:
   - Passo 1: Seleção de lote de saldo (obrigatório)
   - Passo 2: Seleção ou criação de perfil de branding
   - Passo 3: Seleção ou criação de perfil de edição
   - Passo 4: Dados específicos do vídeo (título, briefing, arquivos)

5. **Atomicidade via Transação**:
   - Abstração `ITransaction` na camada de Application
   - Implementação concreta `Transaction` wrapper do EF Core na Infrastructure
   - Rollback automático em caso de falha (FK, unique constraint, timeout)

## 🛠️ Implementação Técnica

### 1. Domínio e Entidades

**Arquivos:** `Media8.Domain/Entities/BrandingProfile.cs`, `EditingProfile.cs`

```csharp
public class BrandingProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; }
    public string SocialHandles { get; set; }
    public string BrandColors { get; set; }
    public string BrandFonts { get; set; }
    public string TargetAudience { get; set; }
    public string BrandAssetsUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Migration:** `AddIsActiveToBriefingProfiles` - Adiciona coluna `IsActive boolean NOT NULL DEFAULT TRUE`

### 2. Camada de Aplicação (DTOs, Interfaces, Serviços)

**DTOs:** `CreateBrandingProfileRequest`, `UpdateBrandingProfileRequest`, `BrandingProfileResponse`

**Interfaces:** `IBrandingProfileService`, `IEditingProfileService` com métodos:
- `GetByUserIdAsync(Guid userId, bool onlyActive = true)`
- `CreateAsync(Guid userId, request)`
- `UpdateAsync(Guid id, request)`
- `ArchiveAsync(Guid id)`
- `RestoreAsync(Guid id)`
- `HardDeleteAsync(Guid id)`

**Serviços:** Implementação com validações de negócio:
```csharp
public async Task HardDeleteAsync(Guid id)
{
    var profile = await GetByIdOrThrowAsync(id);
    
    // Validação 1: deve estar inativo
    if (profile.IsActive)
        throw new BusinessRuleException("PROFILE_MUST_BE_INACTIVE");
    
    // Validação 2: não pode estar vinculado a pedido
    if (await _orderRepository.AnyAsync(o => o.BrandingProfileId == id))
        throw new BusinessRuleException("PROFILE_IN_USE");
    
    await _repository.DeleteAsync(id);
}
```

### 3. API REST com Endpoints PascalCase

**Controllers:** `BrandingProfilesController`, `EditingProfilesController`

**Endpoints:**
- `GET /api/v1/BrandingProfiles?onlyActive=true` - Lista ativos
- `GET /api/v1/BrandingProfiles/{id}` - Busca por ID
- `POST /api/v1/BrandingProfiles` - Cria novo
- `PUT /api/v1/BrandingProfiles/{id}` - Atualiza
- `DELETE /api/v1/BrandingProfiles/{id}` - Arquiva (soft delete)
- `POST /api/v1/BrandingProfiles/{id}/restore` - Restaura
- `DELETE /api/v1/BrandingProfiles/{id}/hard-delete` - Exclusão física

### 4. Frontend: Tipos, Serviços e Hooks

**Tipos TypeScript:** `BrandingProfile`, `CreateBrandingProfileRequest`, etc.

**Serviços:** `brandingProfileService.ts` com endpoints PascalCase:
```typescript
const BRANDING_BASE = '/BrandingProfiles'; // PascalCase
```

**Hooks TanStack Query:**
- `useBrandingProfiles(onlyActive)` - Query com cache de 5min
- `useCreateBrandingProfile()` - Mutation com invalidação
- `useArchiveBrandingProfile()` - Mutation com invalidação
- `useRestoreBrandingProfile()` - Mutation com invalidação
- `useHardDeleteBrandingProfile()` - Mutation com tratamento de 422

### 5. UI: Páginas Separadas e Formulários Reutilizados

**Páginas:**
- `BrandingProfilesPage.tsx` - Gerencia perfis de marca
- `EditingProfilesPage.tsx` - Gerencia perfis de edição
- Toggle sutil "Exibir/Ocultar arquivados" (padrão UsersPage)

**Formulários:**
- `BrandingProfileForm.tsx` - Modal com campos literais do briefing
- `EditingProfileForm.tsx` - Modal com lista dinâmica de múltiplos links

**Reutilização Inteligente:**
- Mesmos componentes de formulário usados em listagem e criação de pedidos
- Zero duplicação de código
- Callbacks de sucesso com auto-advance de cascata

### 6. Fluxo em Cascata de Pedidos

**NovaOrderPage.tsx:**
```typescript
// Passo 1: Seleção de lote de saldo
const handleLotSelect = (lotId) => {
  setSelectedLotId(lotId);
  setStep(2); // Libera próximo passo
};

// Passo 2: Seleção de branding (ou +Novo)
const handleBrandingSelect = (value) => {
  if (value === '+new') {
    setIsBrandingModalOpen(true); // Abre modal reutilizado
    return;
  }
  setSelectedBrandingId(value);
  setStep(3); // Auto-advance
};
```

### 7. Vínculo com Pedidos e Trava de Exclusão

**Entidade Order:**
```csharp
public Guid? BrandingProfileId { get; set; }
public Guid? EditingProfileId { get; set; }
public BrandingProfile? BrandingProfile { get; set; }
public EditingProfile? EditingProfile { get; set; }
```

**Fluent API:**
```csharp
modelBuilder.Entity<Order>()
  .HasOne(o => o.BrandingProfile)
  .WithMany()
  .HasForeignKey(o => o.BrandingProfileId)
  .OnDelete(DeleteBehavior.Restrict); // Impede exclusão em cascata
```

### 8. Atomicidade via Transação

**Interface ITransaction:**
```csharp
public interface ITransaction : IDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
```

**Implementação Concreta:**
```csharp
public class Transaction : ITransaction
{
    private readonly IDbContextTransaction _transaction;
    
    public async Task CommitAsync(...) => await _transaction.CommitAsync(...);
    public async Task RollbackAsync(...) => await _transaction.RollbackAsync(...);
}
```

**OrderService com Transação:**
```csharp
using var transaction = await _balanceRepository.BeginTransactionAsync();
try
{
    balanceLot.RemainingQuantity -= 1;
    await _balanceRepository.UpdateAsync(balanceLot);
    
    var order = new Order
    {
        VideoFormatId = balanceLot.VideoFormatId, // Herda do lote
        BrandingProfileId = request.BrandingProfileId,
        EditingProfileId = request.EditingProfileId,
        // ...
    };
    
    await _orderRepository.AddAsync(order);
    await transaction.CommitAsync();
    
    return MapToResponse(order);
}
catch (Exception ex)
{
    await transaction.RollbackAsync();
    _logger.LogError(ex, "Rollback executado");
    throw;
}
```

## 🎯 Impacto e Resultado

* **Redução de Atrito**: Clientes reutilizam perfis salvos, eliminando a necessidade de redigitar informações imutáveis.
* **Dados Estruturados**: Separação clara entre o que é "Marca" (BrandingProfile) e o que é "Estilo" (EditingProfile).
* **Governança Completa**: Ciclo de vida com arquivação, restauração e exclusão física condicional com validação de vínculos.
* **Segurança de Dados**: Trava impede exclusão de perfis vinculados a pedidos históricos.
* **Atomicidade Garantida**: Transação explícita previne débito sem criação de pedido (rollback em caso de erro).
* **Fluxo Guiado**: Criação de pedidos em cascata com 4 passos lógicos e reutilização inteligente de formulários.
* **Consistência Visual**: Toggle de arquivados padronizado em todas as páginas (padrão UsersPage).
* **Nomenclatura de Mercado**: `BrandingProfile` ao invés de `VisualIdentityProfile` (mais alinhado a agências).

---

**Nota do Desenvolvedor:**

*A implementação do sistema de perfis de briefing reflete um princípio fundamental de design de sistemas enterprise: **separação de responsabilidades por domínio**. Ao invés de misturar dados transitórios (pedido específico) com dados perenes (identidade da marca), criamos entidades dedicadas que podem ser reutilizadas em N pedidos. A decisão de usar `BrandingProfile` ao invés de `VisualIdentityProfile` foi intencional - reflete a terminologia do mercado de agências e facilita a comunicação com clientes. A implementação de transação via abstração (`ITransaction`) seguiu a Clean Architecture à risca: a camada de Application não depende do EF Core, apenas de uma interface neutra. Isso permite testabilidade (mock de `ITransaction`) e mantém as camadas desacopladas. O fluxo em cascata no frontend foi desenhado para guiar o usuário passo-a-passo, evitando sobrecarga cognitiva e garantindo que dados contextuais (lote de saldo) sejam selecionados antes de dados específicos (título do vídeo). A reutilização dos mesmos componentes de formulário (`BrandingProfileForm`, `EditingProfileForm`) em listagem e criação de pedidos elimina duplicação e garante consistência de UX.**
