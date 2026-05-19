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
    public DbSet<Package> Packages { get; set; }
    public DbSet<PackageAssignment> PackageAssignments { get; set; }
    public DbSet<ServiceBalanceLot> ServiceBalanceLots { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderTimeline> OrderTimelines { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    /// <summary>
    /// Entidade VideoFormat para catálogo dinâmico de formatos de vídeo
    /// </summary>
    public DbSet<VideoFormat> VideoFormats => Set<VideoFormat>();

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
        modelBuilder.HasPostgresEnum<ComplexityLevel>();

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

        // Package Assignment
        modelBuilder.Entity<PackageAssignment>()
        .HasOne(pa => pa.Client)
        .WithMany(u => u.Assignments)
        .HasForeignKey(pa => pa.ClientId);

        modelBuilder.Entity<PackageAssignment>()
        .HasOne(pa => pa.Assigner)
        .WithMany()
        .HasForeignKey(pa => pa.AssignedBy)
        .OnDelete(DeleteBehavior.Restrict);

        // Package
        modelBuilder.Entity<Package>()
        .HasIndex(p => p.Slug)
        .IsUnique();

        // Service Balance Lot
        modelBuilder.Entity<ServiceBalanceLot>()
        .HasOne(sl => sl.Assignment)
        .WithMany(pa => pa.ServiceBalanceLots)
        .HasForeignKey(sl => sl.AssignmentId)
        .OnDelete(DeleteBehavior.SetNull);

        // VideoFormat Configuration
        modelBuilder.Entity<VideoFormat>(entity =>
        {
            entity.ToTable("video_formats");
            entity.HasKey(v => v.Id);
            entity.HasIndex(v => v.Slug).IsUnique();
            entity.Property(v => v.Name).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Slug).IsRequired().HasMaxLength(100);
            entity.Property(v => v.MaxDurationSeconds).IsRequired();
            entity.Property(v => v.Tier).IsRequired();
            entity.Property(v => v.IsActive).HasDefaultValue(true);
        });

        // Package - VideoFormat Many-to-Many relationship
        modelBuilder.Entity<Package>()
        .HasMany(p => p.SupportedFormats)
        .WithMany(v => v.Packages)
        .UsingEntity(j => j
        .ToTable("package_video_formats")
        .HasData()
        );

        // Enforce DateOnly conversion if needed (Postgres 6+ handles it natively, but good to be safe)
        // Npgsql 6.0+ maps DateOnly to 'date' automatically.
    }
}
