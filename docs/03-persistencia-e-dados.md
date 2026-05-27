# 03 - Persistência e Banco de Dados

> **Objetivo**: Documentar a estrutura de dados, migrations críticas e padrões de acesso ao banco.

---

## 1. Visão Geral do Schema

### 1.1. Entidades Principais

```
Users (1) ──── (N) UserRoles
    │
    ├── (N) ClientContracts ── (1) Offers
    │        │
    │        └── (1) VideoFormats
    │        └── (1) EditingStyles
    │
    ├── (N) ServiceBalanceLots
    │
    └── (N) Orders ── (N) OrderItems
```

### 1.2. Tabelas Core

| Tabela | Descrição | Soft Delete |
|--------|-----------|-------------|
| `Users` | Usuários do sistema | Sim (`IsActive`) |
| `UserRoles` | Roles de usuários (N:N) | Não |
| `Offers` | Catálogo de ofertas | Sim (`IsActive`) |
| `ClientContracts` | Contratos de clientes (snapshots) | Não |
| `ServiceBalanceLots` | Lotes de saldo | Sim (`IsActive`) |
| `Orders` | Pedidos de edição | Sim (`IsCancelled`) |
| `VideoFormats` | Formatos de vídeo | Sim (`IsActive`) |
| `EditingStyles` | Estilos de edição | Sim (`IsActive`) |
| `BrandingProfiles` | Perfis de marca (briefing) | Sim (`IsActive`) |
| `SystemSettings` | Configurações dinâmicas | Não |

**Nota**: `VideoFormats` e `EditingStyles` não possuem relação direta no banco. A conexão é feita via `Offer` (FK `VideoFormatId`, `EditingStyleId`).

---

## 2. Migrations Críticas

### 2.1. Migração de Packages → Offers (Épico 3)

**Problema**: A tabela `Packages` foi renomeada para `Offers` para melhor semântica.

**Solução**: Migration evolutiva que:
1. Criou nova tabela `Offers` com schema idêntico
2. Copiou dados de `Packages` → `Offers`
3. Atualizou FKs em `ClientContracts`
4. Manteve `Packages` como view legada (deprecada)

```csharp
// 20230520120000_MigratePackagesToOffers.cs
migrationBuilder.RenameTable("Packages", "Offers");
migrationBuilder.Sql("UPDATE Offers SET Name = 'Pacote ' + Name WHERE Name NOT LIKE 'Pacote %'");
```

### 2.2. Snapshot de Contratos

**Problema**: Contratos precisavam preservar estado histórico.

**Solução**: Adicionada coluna `SnapshotOfferName`, `SnapshotVideoQuantity`, etc., em `ClientContracts`.

```csharp
migrationBuilder.AddColumn<string>(
  name: "SnapshotOfferName",
  table: "ClientContracts",
  nullable: false,
  defaultValue: "");
```

### 2.3. Remoção de Campos Legados (VideoFormat)

**Problema**: `VideoFormat` possuía campos `Tier`, `EditingStyleId` e navegações reversas que não refletiam mais o domínio.

**Solução**: Migrations para remover colunas e constraints:

```csharp
// RemoveTierAndEditingStyleFromVideoFormat.cs
migrationBuilder.DropColumn(
    name: "Tier",
    table: "VideoFormats");

migrationBuilder.DropColumn(
    name: "EditingStyleId",
    table: "VideoFormats");

// FixOfferIdConstraint.cs - Remove FK indevida
migrationBuilder.Sql("ALTER TABLE VideoFormats DROP CONSTRAINT IF EXISTS FK_VideoFormats_Offers_OfferId");
```

**Referência**: [Case Study 069](implementations/069-remocao-campos-legados-videoformat.md), [Case Study 070](implementations/070-correcao-navegacao-reversa-editingstyle.md)

### 2.4. Lei da Navegação Mínima (EF Core Warning)

**Problema Crítico**: Navegações reversas no EF Core podem criar FKs indevidas automaticamente.

**Cenário**:
```csharp
// ❌ ERRADO - EditingStyle.cs
public class EditingStyle {
    public ICollection<VideoFormat> VideoFormats { get; set; }
}

// Isso faz EF Core tentar criar FK EditingStyleId em VideoFormats
// Erro: column "EditingStyleId" of relation "VideoFormats" does not exist
```

**Solução**:
```csharp
// ✅ CERTO - EditingStyle.cs
public class EditingStyle {
    // Sem navegação reversa para VideoFormats
    // A relação é unidirecional: Offer -> EditingStyle
}
```

**Lição**: Navegações bidireacionais devem ser evitadas quando não há necessidade de negócio clara. O EF Core inferirá FKs indevidas.

### 2.5. SettingsService: Inicialização de Cache (Case #071)

**Problema Crítico**: `SystemSettings` armazena configurações dinâmicas (ex: `CancellationWindowHours`) que devem ser carregadas em memória para performance. O cache do `SettingsService` (Singleton) não estava sendo inicializado no startup, retornando dados vazios ou usando fallbacks perigosos.

**Cenário de Falha**:
```csharp
// Program.cs - ANTES (ERRADO)
using (var scope = app.Services.CreateScope())
{
  var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
  await seeder.SeedAsync();
  // ❌ SettingsService nunca carregado do banco
}

// Resultado: Cache vazio, API retorna {"Settings":{}}, fallback retorna 24h (errado)
```

**Solução**:
```csharp
// Program.cs - DEPOIS (CORRETO)
using (var scope = app.Services.CreateScope())
{
  var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
  await seeder.SeedAsync();
  
  // ✅ CRÍTICO: Carrega configurações do banco para memória
  var settingsService = scope.ServiceProvider.GetRequiredService<ISettingsService>();
  await settingsService.RefreshCacheAsync();
}

// SettingsService.cs - Remove fallback
public async Task<T> GetSettingAsync<T>(string key, T defaultValue)
{
  if (!_cache.TryGetValue(key, out var value))
  {
    // ✅ Lança exceção ao invés de retornar fallback
    throw new InvalidOperationException($"Setting '{key}' not found in cache...");
  }
  // ... conversão
}
```

**Lição**: Singletons com cache em memória devem ser inicializados explicitamente durante o startup. Fallbacks mascaram problemas de inicialização e devem ser eliminados em favor de fail-fast.

---

## 3. Padrões de Acesso a Dados

### 3.1. Repository Pattern com EF Core

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

// Implementação genérica com tracking controlado
public class Repository<T> : IRepository<T>
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<T> _dbSet;
    
    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }
}
```

### 3.2. Include Otimizado para N:N

```csharp
// Evitar Include em cadeia que gera JOINs cartesianos
var user = await _context.Users
    .Include(u => u.Profile)
    .Include(u => u.Roles)
    .Include(u => u.Contracts)
        .ThenInclude(c => c.Offer)
    .FirstOrDefaultAsync(u => u.Id == id);

// Alternativa: Split Queries para evitar cartesian explosion
var user = await _context.Users
    .AsSplitQuery()
    .Include(u => u.Contracts)
        .ThenInclude(c => c.Offer)
    .FirstOrDefaultAsync(u => u.Id == id);
```

### 3.3. Concorrência e Transações

```csharp
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // 1. Debita saldo
    balanceLot.RemainingQuantity--;
    await _context.SaveChangesAsync();
    
    // 2. Cria pedido
    var order = new Order { ... };
    _context.Orders.Add(order);
    await _context.SaveChangesAsync();
    
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

---

## 4. Índices e Performance

### 4.1. Índices Críticos

```sql
-- Users: busca por email (login)
CREATE INDEX IX_Users_Email ON "Users" ("Email");

-- Orders: filtro por status e cliente
CREATE INDEX IX_Orders_Status_ClientId ON "Orders" ("Status", "ClientId");

-- ClientContracts: filtro por cliente e status
CREATE INDEX IX_ClientContracts_ClientId_Status ON "ClientContracts" ("ClientId", "Status");
```

### 4.2. Queries Otimizadas

```csharp
// RUIM: N+1 query
var users = await _context.Users.ToListAsync();
foreach (var user in users)
{
    var contracts = await _context.ClientContracts
        .Where(c => c.ClientId == user.Id)
        .ToListAsync();
}

// BOM: Include único
var usersWithContracts = await _context.Users
    .Include(u => u.Contracts)
    .ToListAsync();
```

---

## 6. Migrations Recentes

### 6.1. Remoção de VideoFormatId de Orders (Case #073, #074)

**Problema Arquitetural**: A tabela `Orders` continha uma coluna `VideoFormatId` que violava o princípio do snapshot imutável. A entidade `Order` não deveria ter FK direta para `VideoFormats`, pois essa informação já está capturada no `ClientContract`.

**Problema Técnico (Case #074)**: Mesmo após remover a coluna e a propriedade `VideoFormatId` da entidade, o EF Core ainda inferia uma FK inexistente através da propriedade de navegação `public VideoFormat? VideoFormat { get; set; }` que permaneceu na entidade `Order`. Isso causava:
```
Npgsql.PostgresException (0x80004005): 42703: column o.VideoFormatId does not exist
```

**Solução em Duas Etapas**:

**Etapa 1 - Case #073 (Remoção da Coluna)**:
```csharp
// Migration: 20260527163356_RemoveVideoFormatIdFromOrders
migrationBuilder.DropColumn(
    name: "VideoFormatId",
    table: "Orders");
```

**Etapa 2 - Case #074 (Remoção da Navegação + Atualização do Snapshot)**:
```csharp
// OrderAggregate.cs - Removida propriedade de navegação
public class Order {
  // ... outras propriedades
  // ❌ REMOVIDO: public VideoFormat? VideoFormat { get; set; }
  public Guid? ServiceBalanceLotId { get; set; }
}

// Migration: 20260527200448_FixOrderSnapshot (No-Op)
// Apenas atualiza o snapshot do EF Core sem tentar remover colunas já inexistentes
protected override void Up(MigrationBuilder migrationBuilder) {
  // No-op: A coluna já foi removida anteriormente
  // Esta migration apenas atualiza o snapshot para refletir
  // que Order NÃO tem mais relação com VideoFormat
}
```

**Fluxo Correto**:
```
Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName
```

**Impacto**:
- 14 commits atômicos (domain, application, infra, frontend, tests)
- Erro 500 resolvido: tela de pedidos do cliente carrega sem erros
- Snapshot do EF Core sincronizado com o domínio
- Código mais limpo: entidade `Order` segue Lei da Navegação Mínima

**Lição Arquitetural**: Nunca adicione FKs duplicadas quando a informação já existe em snapshot imutável. **Propriedades de navegação no EF Core podem inferir FKs indesejadas** mesmo sem declaração explícita - sempre remover navegações junto com colunas do banco e atualizar o snapshot do EF Core.

---

## 7. Data Seeding

### 5.1. Seed de Configurações Iniciais

```csharp
// SystemSettingsSeeder.cs
if (!await _context.SystemSettings.AnyAsync())
{
    await _context.SystemSettings.AddRangeAsync(
        new SystemSettings { Key = "CancellationWindowHours", Value = "24" },
        new SystemSettings { Key = "MaxUploadSizeMB", Value = "500" }
    );
    await _context.SaveChangesAsync();
}
```

### 5.2. Seed de Offers Iniciais

```csharp
// OffersSeeder.cs
if (!await _context.Offers.AnyAsync())
{
    await _context.Offers.AddRangeAsync(
        new Offer { Name = "Reels Estendido", VideoQuantity = 20, Price = 199.90m },
        new Offer { Name = "Pacote Premium", VideoQuantity = 24, Price = 249.90m }
    );
    await _context.SaveChangesAsync();
}
```

---

## 6. Backup e Recuperação

### 6.1. Backup Automático (PostgreSQL)

```bash
# Cron diário às 3h
0 3 * * * pg_dump -U media8_user media8_db | gzip > /backups/media8_$(date +%Y%m%d).sql.gz
```

### 6.2. Restore de Emergência

```bash
# Restore completo
gunzip /backups/media8_20260524.sql.gz
psql -U media8_user -d media8_db -f /backups/media8_20260524.sql
```

---

## 7. Referências

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Schema completo
- [API_ROUTES.md](API_ROUTES.md) - Endpoints que persistem dados
- [SECURITY.md](SECURITY.md) - Políticas de segurança de dados
