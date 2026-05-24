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

## 5. Data Seeding

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
