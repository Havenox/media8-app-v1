# 028 - Arquitetura de Aplicações: Propagação Data-Driven para Application e Infrastructure

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 19/05/2026

---

## 🚀 Desafio de Engenharia

Após a refatoração inicial do Domínio (Estudo de Caso #027), que substituiu o enum estático `ServiceType` pela entidade dinâmica `VideoFormat`, as camadas superiores do sistema entraram em colapso controlado. A compilação falhou em 7 pontos críticos, expondo o acoplamento direto entre DTOs, serviços e repositórios com o enum removido.

**Os Problemas Específicos:**
1. **DTOs Quebrados:** `OrderDtos.cs`, `PackageDtos.cs` e `ServiceBalanceDtos.cs` ainda transportavam `ServiceType`, um tipo que não existia mais.
2. **Contratos de Serviço Inválidos:** A interface `IServiceBalanceService` e sua implementação exigiam `ServiceType` como parâmetro.
3. **Infraestrutura Cega:** O `ApplicationDbContext` (EF Core) não conhecia a nova entidade `VideoFormat` nem o relacionamento Muitos-para-Muitos entre `Package` e `VideoFormat`.
4. **Seeder Obsoleto:** O `DbSeeder` tentava popular dados de teste usando enums e métodos de hash inexistentes, impedindo a geração de migrations iniciais limpas.

**A Dor:** O sistema estava em um estado intermediário perigoso — o Domínio estava puro e correto, mas a aplicação não compilava, impedindo testes, migrations e a evolução da API.

## 🧠 Estratégia da Solução

A estratégia seguiu o princípio da **higiene de camadas**, respeitando a dependência descendente (API → Application → Domain ← Infrastructure):

1. **Application (DTOs e Interfaces):**
   - Substituição de todas as ocorrências de `ServiceType` por `Guid VideoFormatId`.
   - Em `PackageDtos.cs`, a lista `List<ServiceType>` virou `List<Guid> VideoFormatIds`.
   - A interface `IServiceBalanceService` alterou sua assinatura para `Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1)`.

2. **Infrastructure (EF Core):**
   - Adicionado `DbSet<VideoFormat> VideoFormats` no `ApplicationDbContext`.
   - Configurado o relacionamento Muitos-para-Muitos entre `Package` e `VideoFormat` usando a API fluente `.UsingEntity()`, criando a tabela de junção `package_video_formats`.
   - Adicionado mapeamento da enum `ComplexityLevel` no `OnModelCreating`.
   - Reescrita completa do `DbSeeder` para:
     - Popular a tabela `video_formats` antes de qualquer outra entidade (ordem de FK).
     - Usar `VideoFormatId` ao criar `Order` e `ServiceBalanceLot`.
     - Instanciar `PasswordHasher` corretamente (não estático).

3. **Injeção de Dependência:**
   - Atualizado `DependencyInjection.cs` para mapear a enum `ComplexityLevel` no Npgsql e remover a referência ao `ServiceType` obsoleto.

## 🛠️ Implementação Técnica

### Camada Application (`Media8.Application`)

**Arquivos Refatorados:**
- `DTOs/Orders/OrderDtos.cs`:
  ```csharp
  // Antes
  public ServiceType ServiceType { get; set; }
  // Depois
  public Guid VideoFormatId { get; set; }
  ```
- `DTOs/Packages/PackageDtos.cs`:
  ```csharp
  // Antes
  public List<ServiceType> ServiceTypes { get; set; }
  // Depois
  public List<Guid> VideoFormatIds { get; set; }
  ```
- `Interfaces/IServiceBalanceService.cs`:
  ```csharp
  // Antes
  Task<bool> ConsumeAsync(Guid userId, ServiceType serviceType, int quantity = 1);
  // Depois
  Task<bool> ConsumeAsync(Guid userId, Guid videoFormatId, int quantity = 1);
  ```

**Serviços Atualizados:**
- `Services/ServiceBalanceService.cs`: Lógica de consumo FIFO adaptada para filtrar por `VideoFormatId`.
- `Services/OrderService.cs`: Mapeamento de `CreateOrderRequest.VideoFormatId` para a entidade `Order`.

### Camada Infrastructure (`Media8.Infrastructure`)

**ApplicationDbContext.cs:**
```csharp
public DbSet<VideoFormat> VideoFormats => Set<VideoFormat>();

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... outros mapeamentos
    modelBuilder.Entity<VideoFormat>(entity =>
    {
        entity.ToTable("video_formats");
        entity.HasIndex(v => v.Slug).IsUnique();
        // ...
    });

    // Relacionamento N:N Package <-> VideoFormat
    modelBuilder.Entity<Package>()
        .HasMany(p => p.SupportedFormats)
        .WithMany(v => v.Packages)
        .UsingEntity(j => j.ToTable("package_video_formats"));
}
```

**DbSeeder.cs (Reescrito):**
- **Seed de VideoFormats:** Cria 7 formatos iniciais (Reels Standard, Reels Premium, YouTube Curto, etc.) antes de qualquer outra entidade.
- **Uso de IDs:** `CreateOrder` e `CreateLot` agora recebem `Guid videoFormatId`.
- **Correção de Hash:** Instanciação correta de `PasswordHasher` (não era estático).

**DependencyInjection.cs:**
```csharp
// Removido: dataSourceBuilder.MapEnum<ServiceType>();
// Adicionado: dataSourceBuilder.MapEnum<ComplexityLevel>();
```

### Commits Atômicos Realizados
1. `refactor(application): atualiza dtos e interfaces para utilizar VideoFormatId substituindo o enum`
2. `refactor(infra): adiciona mapeamento ef core para tabela video_formats e relacoes`
3. `fix(application-infra): atualiza servicos e injecao de dependencia para VideoFormatId`

## 🎯 Impacto e Resultado

* **Camadas Inferiores Estáveis:** `Domain`, `Application` e `Infrastructure` compilam 100% sem erros. A base do sistema está sólida e pronta para receber a migration.
* **Banco de Dados Preparado:** O `DbSeeder` agora popula `video_formats` primeiro, garantindo integridade referencial ao popular `Orders` e `ServiceBalanceLots`.
* **Contrato de Serviço Correto:** A assinatura de `ConsumeAsync` reflete a nova realidade orientada a dados, permitindo que o motor FIFO consuma saldos por `VideoFormatId`.
* **Pronto para Migration:** O `ApplicationDbContext` está configurado para gerar uma migration inicial limpa, criando as tabelas `video_formats` e `package_video_formats` do zero.
* **Fim da Dependência de Enum:** Nenhuma camada de negócio (Domain, Application, Infrastructure) depende mais de `ServiceType`. A próxima etapa é apenas propagar essa mudança para os Controladores da API (camada de entrada).

---

**Nota do Desenvolvedor:**
*"Refatorar em camadas é como fazer uma cirurgia vascular: você precisa isolar o fluxo sanguíneo (Domínio), depois reconectar as veias (Application) e finalmente as artérias (Infrastructure) antes de fechar a pele (API). Tentar fazer tudo de uma vez gera colapso. A decisão de quebrar a compilação em etapas controladas — primeiro Domain, depois Application+Infrastructure, finalmente API — permitiu isolar erros e garantir que cada camada estivesse 100% estável antes de avançar. O `DbSeeder` foi o grande herói anônimo: sem ele, a migration inicial seria suja ou incompleta. Agora, o sistema respira dados, não enums."*
