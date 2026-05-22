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

        // Configurations

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

        // Service Balance Lot
        modelBuilder.Entity<ServiceBalanceLot>()
            .HasOne(sl => sl.Contract)
            .WithMany(cc => cc.ServiceBalanceLots)
            .HasForeignKey(sl => sl.AssignmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // VideoFormat Configuration
        modelBuilder.Entity<VideoFormat>(entity =>
        {
            entity.ToTable("VideoFormats");
            entity.HasKey(v => v.Id);
            entity.HasIndex(v => v.Slug).IsUnique();
            entity.Property(v => v.Name).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Slug).IsRequired().HasMaxLength(100);
            entity.Property(v => v.MaxDurationSeconds).IsRequired();
            entity.Property(v => v.EditingStyleId).IsRequired(false);
            entity.Property(v => v.IsActive).HasDefaultValue(true);

            entity.HasOne(v => v.EditingStyle)
                .WithMany(es => es.VideoFormats)
                .HasForeignKey(v => v.EditingStyleId)
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

            entity.HasOne(o => o.VideoFormat)
                .WithMany()
                .HasForeignKey(o => o.VideoFormatId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(o => o.EditingStyle)
                .WithMany()
                .HasForeignKey(o => o.EditingStyleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

// ClientContract Configuration
modelBuilder.Entity<ClientContract>(entity =>
{
entity.ToTable("ClientContracts");
entity.HasKey(cc => cc.Id);
entity.Property(cc => cc.OfferId).IsRequired();
entity.Property(cc => cc.ClientId).IsRequired();
entity.Property(cc => cc.AssignedBy).IsRequired();
entity.Property(cc => cc.Status).HasDefaultValue(AssignmentStatus.Active);
entity.Property(cc => cc.SnapshotOfferName).HasMaxLength(255);

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

// Enforce DateOnly conversion if needed
}
}
