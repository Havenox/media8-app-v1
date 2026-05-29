using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Media8.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<ServiceBalanceLot> ServiceBalanceLots { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderTimeline> OrderTimelines { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<ClientSequence> ClientSequences { get; set; }

    /// <summary>
    /// Entidade VideoFormat para catálogo dinâmico de formatos de vídeo
    /// </summary>
    public DbSet<VideoFormat> VideoFormats => Set<VideoFormat>();

    /// <summary>
    /// Entidade EditingStyle para estilos de edição dinâmicos
    /// </summary>
    public DbSet<EditingStyle> EditingStyles => Set<EditingStyle>();

    /// <summary>
    /// Entidade Offer para ofertas comerciais
    /// </summary>
public DbSet<Offer> Offers => Set<Offer>();

/// <summary>
/// Entidade ClientContract para contratos de clientes
/// </summary>
public DbSet<ClientContract> ClientContracts => Set<ClientContract>();

  /// <summary>
  /// Entidade SystemSetting para configurações dinâmicas do sistema
  /// </summary>
  public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

/// <summary>
/// Entidade BrandingProfile para perfis de branding dos clientes
/// </summary>
public DbSet<BrandingProfile> BrandingProfiles => Set<BrandingProfile>();

  /// <summary>
  /// Entidade EditingProfile para perfis de edição de vídeo dos clientes
  /// </summary>
  public DbSet<EditingProfile> EditingProfiles => Set<EditingProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map Enums to PostgreSQL Enums
        modelBuilder.HasPostgresEnum<AppRole>();
        modelBuilder.HasPostgresEnum<PackageCategory>();
        modelBuilder.HasPostgresEnum<OrderStatus>();
        modelBuilder.HasPostgresEnum<TimelineActionType>();
        modelBuilder.HasPostgresEnum<AssignmentStatus>();
        modelBuilder.HasPostgresEnum<LotSource>();
        modelBuilder.HasPostgresEnum<NotificationType>();
        modelBuilder.HasPostgresEnum<ContractType>();
        modelBuilder.HasPostgresEnum<InvoiceStatus>();

        // ==========================================
        // PASCALCASE TABLE MAPPING (Strict Standard)
        // ==========================================
        
        // User & Auth
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Profile>().ToTable("Profiles");
        modelBuilder.Entity<UserRole>().ToTable("UserRoles");

        // Offers & Contracts
        modelBuilder.Entity<Offer>().ToTable("Offers");
        modelBuilder.Entity<ClientContract>().ToTable("ClientContracts");

        // Video & Editing
        modelBuilder.Entity<VideoFormat>().ToTable("VideoFormats");
        modelBuilder.Entity<EditingStyle>().ToTable("EditingStyles");

        // Orders & Timeline
        modelBuilder.Entity<Order>().ToTable("Orders");
        modelBuilder.Entity<OrderTimeline>().ToTable("OrderTimelines");

        // Other
        modelBuilder.Entity<ServiceBalanceLot>().ToTable("ServiceBalanceLots");
        modelBuilder.Entity<Notification>().ToTable("Notifications");
        modelBuilder.Entity<Invoice>().ToTable("Invoices");
        modelBuilder.Entity<ClientSequence>().ToTable("ClientSequences");

        // Configurations

        // ServiceBalanceLot relationship with Invoice
        modelBuilder.Entity<ServiceBalanceLot>()
            .HasOne(x => x.Invoice)
            .WithMany()
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        // User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Profile (1:1 with User)
        modelBuilder.Entity<Profile>()
        .HasOne(p => p.User)
        .WithOne(u => u.Profile)
        .HasForeignKey<Profile>(p => p.UserId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Profile>()
        .HasIndex(p => p.Phone)
        .IsUnique();

        // UserRole (1:N)
        modelBuilder.Entity<UserRole>()
        .HasIndex(ur => new { ur.UserId, ur.Role })
        .IsUnique();

        // Order relationships
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Client)
            .WithMany(u => u.ClientOrders)
            .HasForeignKey(o => o.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Order>()
.HasOne(o => o.Editor)
.WithMany(u => u.EditorOrders)
.HasForeignKey(o => o.EditorId)
.OnDelete(DeleteBehavior.SetNull);

// Order Profile Links (Restrict to prevent orphaned orders)
modelBuilder.Entity<Order>()
.HasOne(o => o.BrandingProfile)
.WithMany()
.HasForeignKey(o => o.BrandingProfileId)
.OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Order>()
.HasOne(o => o.EditingProfile)
.WithMany()
.HasForeignKey(o => o.EditingProfileId)
.OnDelete(DeleteBehavior.Restrict);

// Service Balance Lot (Entidade Numérica - Sem FKs para VideoFormat/EditingStyle)
modelBuilder.Entity<ServiceBalanceLot>(entity =>
{
entity.ToTable("ServiceBalanceLots");
entity.HasKey(sl => sl.Id);

// FK para Contract (obrigatória)
entity.HasOne(sl => sl.Contract)
.WithMany(cc => cc.ServiceBalanceLots)
.HasForeignKey(sl => sl.ContractId)
.OnDelete(DeleteBehavior.Restrict);

// FK para User (obrigatória)
entity.HasOne(sl => sl.User)
.WithMany(u => u.ServiceBalanceLots)
.HasForeignKey(sl => sl.UserId)
.OnDelete(DeleteBehavior.Restrict);

// Índice para consumo FIFO (por ContractId e UserId)
entity.HasIndex(sl => new { sl.ContractId, sl.UserId, sl.CreatedAt });
});

// VideoFormat Configuration
modelBuilder.Entity<VideoFormat>(entity =>
{
entity.ToTable("VideoFormats");
entity.HasKey(v => v.Id);
entity.HasIndex(v => v.Slug).IsUnique();
entity.Property(v => v.Name).IsRequired().HasMaxLength(100);
entity.Property(v => v.MaxDurationSeconds).IsRequired();
entity.Property(v => v.IsActive).HasDefaultValue(true);
// No FK to Offer - VideoFormat does not need OfferId
});

// Offer Configuration - configure VideoFormatId FK without reverse navigation
modelBuilder.Entity<Offer>(entity =>
{
entity.ToTable("Offers");
entity.HasKey(o => o.Id);
entity.HasIndex(o => o.Slug).IsUnique();
entity.Property(o => o.Name).IsRequired().HasMaxLength(100);
entity.Property(o => o.Slug).IsRequired().HasMaxLength(100);
entity.Property(o => o.ContractType).IsRequired();
entity.Property(o => o.Price).IsRequired();
entity.Property(o => o.VideoQuantity).IsRequired();
entity.Property(o => o.MaxDurationSeconds).IsRequired();
entity.Property(o => o.IsPublic).HasDefaultValue(true);

// Configure VideoFormatId FK without creating reverse navigation
entity.HasOne<VideoFormat>()
.WithMany()
.HasForeignKey(o => o.VideoFormatId)
.OnDelete(DeleteBehavior.SetNull);

entity.HasOne(o => o.EditingStyle)
.WithMany()
.HasForeignKey(o => o.EditingStyleId)
.OnDelete(DeleteBehavior.SetNull);
});

        // EditingStyle Configuration
        modelBuilder.Entity<EditingStyle>(entity =>
        {
            entity.ToTable("EditingStyles");
            entity.HasKey(es => es.Id);
            entity.Property(es => es.Name).IsRequired().HasMaxLength(100);
            entity.Property(es => es.Description).HasMaxLength(500);
            entity.Property(es => es.IsActive).HasDefaultValue(true);
        });

        // Offer Configuration
        modelBuilder.Entity<Offer>(entity =>
        {
            entity.ToTable("Offers");
            entity.HasKey(o => o.Id);
            entity.HasIndex(o => o.Slug).IsUnique();
            entity.Property(o => o.Name).IsRequired().HasMaxLength(100);
            entity.Property(o => o.Slug).IsRequired().HasMaxLength(100);
            entity.Property(o => o.ContractType).IsRequired();
            entity.Property(o => o.Price).IsRequired();
            entity.Property(o => o.VideoQuantity).IsRequired();
            entity.Property(o => o.MaxDurationSeconds).IsRequired();
entity.Property(o => o.IsPublic).HasDefaultValue(true);

// VideoFormat navigation removed - FK VideoFormatId exists but no navigation property
// entity.HasOne(o => o.VideoFormat) ... removed

entity.HasOne(o => o.EditingStyle)
.WithMany()
.HasForeignKey(o => o.EditingStyleId)
.OnDelete(DeleteBehavior.SetNull);
});

// ClientContract Configuration (Snapshot Pattern - Sem FKs para VideoFormat/EditingStyle)
modelBuilder.Entity<ClientContract>(entity =>
{
entity.ToTable("ClientContracts");
entity.HasKey(cc => cc.Id);

// Foreign Keys (apenas Offer, Client, Assigner)
entity.Property(cc => cc.OfferId).IsRequired();
entity.Property(cc => cc.ClientId).IsRequired();
entity.Property(cc => cc.AssignedBy).IsRequired();
entity.Property(cc => cc.Status).HasDefaultValue(AssignmentStatus.Active);

// Snapshot Comercial
entity.Property(cc => cc.SnapshotOfferName).HasMaxLength(255).IsRequired();
entity.Property(cc => cc.SnapshotVideoQuantity).IsRequired();
entity.Property(cc => cc.SnapshotPrice).IsRequired();
entity.Property(cc => cc.SnapshotValidityDays);
entity.Property(cc => cc.SnapshotContractType).IsRequired().HasDefaultValue(ContractType.Avulso);

// Snapshot Técnico (obrigatórios)
entity.Property(cc => cc.SnapshotVideoFormatName).HasMaxLength(100).IsRequired();
entity.Property(cc => cc.SnapshotEditingStyleName).HasMaxLength(100).IsRequired();
entity.Property(cc => cc.SnapshotMaxDurationSeconds).IsRequired();

// Navegação
entity.HasOne(cc => cc.Offer)
.WithMany(o => o.Contracts)
.HasForeignKey(cc => cc.OfferId)
.OnDelete(DeleteBehavior.Restrict);

entity.HasOne(cc => cc.Client)
.WithMany(u => u.Contracts)
.HasForeignKey(cc => cc.ClientId)
.OnDelete(DeleteBehavior.Restrict);

entity.HasOne(cc => cc.Assigner)
.WithMany()
.HasForeignKey(cc => cc.AssignedBy)
.OnDelete(DeleteBehavior.Restrict);
});

  // SystemSetting Configuration
  modelBuilder.Entity<SystemSetting>(entity =>
  {
      entity.ToTable("SystemSettings");
      entity.HasKey(ss => ss.Id);
      entity.HasIndex(ss => ss.Key).IsUnique();
      entity.Property(ss => ss.Key).IsRequired().HasMaxLength(100);
      entity.Property(ss => ss.Value).IsRequired();
      entity.Property(ss => ss.Description).HasMaxLength(500);
  });

// BrandingProfile Configuration
modelBuilder.Entity<BrandingProfile>(entity =>
{
    entity.ToTable("BrandingProfiles");
    entity.HasKey(bp => bp.Id);
    entity.Property(bp => bp.Name).IsRequired().HasMaxLength(200);
    entity.Property(bp => bp.SocialHandles).HasMaxLength(1000);
    entity.Property(bp => bp.BrandColors).HasMaxLength(500);
    entity.Property(bp => bp.BrandFonts).HasMaxLength(500);
    entity.Property(bp => bp.TargetAudience).HasMaxLength(200);
    entity.Property(bp => bp.BrandAssetsUrl).HasMaxLength(2000);
    entity.Property(bp => bp.IsActive).IsRequired().HasDefaultValue(true);

    // Relationship: One User can have many BrandingProfiles (Cascade Delete)
    entity.HasOne<Domain.Entities.User>()
    .WithMany()
    .HasForeignKey(bp => bp.UserId)
    .OnDelete(DeleteBehavior.Cascade);
});

  // EditingProfile Configuration
  modelBuilder.Entity<EditingProfile>(entity =>
  {
      entity.ToTable("EditingProfiles");
      entity.HasKey(ep => ep.Id);
      entity.Property(ep => ep.Name).IsRequired().HasMaxLength(200);
      entity.Property(ep => ep.ReferenceUrl).HasMaxLength(2000);
      entity.Property(ep => ep.CutGuidelines).HasMaxLength(2000);
      entity.Property(ep => ep.ThumbnailPreference).HasMaxLength(100);
      entity.Property(ep => ep.MusicStyle).HasMaxLength(500);
      entity.Property(ep => ep.TextHighlightStyle).HasMaxLength(500);
      entity.Property(ep => ep.GeneralNotes).HasMaxLength(4000);
      entity.Property(ep => ep.IsActive).IsRequired().HasDefaultValue(true);

      // Relationship: One User can have many EditingProfiles (Cascade Delete)
      entity.HasOne<Domain.Entities.User>()
          .WithMany()
          .HasForeignKey(ep => ep.UserId)
          .OnDelete(DeleteBehavior.Cascade);
  });

  // Invoice Configuration
  modelBuilder.Entity<Invoice>(entity =>
  {
      entity.ToTable("Invoices");
      entity.HasKey(i => i.Id);
      entity.Property(i => i.Description).IsRequired().HasMaxLength(255);
      entity.Property(i => i.Amount).IsRequired();
      entity.Property(i => i.Status).IsRequired().HasDefaultValue(InvoiceStatus.Pending);

      entity.HasOne(i => i.Client)
          .WithMany()
          .HasForeignKey(i => i.ClientId)
          .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(i => i.Contract)
          .WithMany()
          .HasForeignKey(i => i.ContractId)
          .OnDelete(DeleteBehavior.SetNull);
  });

  // ClientSequence Configuration
  modelBuilder.Entity<ClientSequence>(entity =>
  {
      entity.ToTable("ClientSequences");
      entity.HasKey(cs => cs.Id);
      entity.HasIndex(cs => new { cs.ClientId, cs.EntityType }).IsUnique();
  });

  // ClientContract Composite Unique Index
  modelBuilder.Entity<ClientContract>()
      .HasIndex(cc => new { cc.ClientId, cc.SequentialId })
      .IsUnique();

  // Order Composite Unique Index
  modelBuilder.Entity<Order>()
      .HasIndex(o => new { o.ClientId, o.SequentialId })
      .IsUnique();

  // Invoice Composite Unique Index
  modelBuilder.Entity<Invoice>()
      .HasIndex(i => new { i.ClientId, i.SequentialId })
      .IsUnique();

  // BrandingProfile Composite Unique Index
  modelBuilder.Entity<BrandingProfile>()
      .HasIndex(bp => new { bp.UserId, bp.SequentialId })
      .IsUnique();

  // EditingProfile Composite Unique Index
  modelBuilder.Entity<EditingProfile>()
      .HasIndex(ep => new { ep.UserId, ep.SequentialId })
      .IsUnique();

  // Enforce DateOnly conversion if needed
}
}
