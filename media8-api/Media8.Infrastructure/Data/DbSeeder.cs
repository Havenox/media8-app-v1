using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Media8.Infrastructure.Authentication;

namespace Media8.Infrastructure.Data;

public class DbSeeder
{
    private readonly ApplicationDbContext _context;

    public DbSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        var passwordHasher = new PasswordHasher();

        // ==========================================
        // 1. Seed EditingStyles (dynamic complexity)
        // ==========================================
        if (!_context.EditingStyles.Any())
        {
            var editingStyles = new List<EditingStyle>
            {
                new EditingStyle { Name = "Simples", Description = "Edição básica, cortes simples e transições diretas" },
                new EditingStyle { Name = "Profissional", Description = "Edição avançada com efeitos, motion e color grading" },
                new EditingStyle { Name = "Viral", Description = "Edição complexa com VFX, transições dinâmicas e trilha sonora" }
            };

            await _context.EditingStyles.AddRangeAsync(editingStyles);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 2. Seed VideoFormats (data-driven)
        // ==========================================
        if (!_context.VideoFormats.Any())
        {
            var videoFormats = new List<VideoFormat>
            {
                new VideoFormat { Name = "Reels Standard", Slug = "reels-standard", MaxDurationSeconds = 60 },
                new VideoFormat { Name = "Reels Premium", Slug = "reels-premium", MaxDurationSeconds = 90 },
                new VideoFormat { Name = "YouTube Curto", Slug = "youtube-curto", MaxDurationSeconds = 180 },
                new VideoFormat { Name = "YouTube Médio", Slug = "youtube-medio", MaxDurationSeconds = 600 },
                new VideoFormat { Name = "YouTube Longo", Slug = "youtube-longo", MaxDurationSeconds = 1800 },
                new VideoFormat { Name = "Pacote Reels", Slug = "pacote-reels", MaxDurationSeconds = 60 },
                new VideoFormat { Name = "Avulso", Slug = "avulso", MaxDurationSeconds = 120 }
            };

            await _context.VideoFormats.AddRangeAsync(videoFormats);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 3. Seed Standard Test Users ONLY
        // ==========================================
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var clientId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var editorId = Guid.Parse("00000000-0000-0000-0000-000000000003");

        if (!await _context.Users.AnyAsync())
        {
            var usersToSeed = new List<User>();

            // Admin User
            await EnsureUser(usersToSeed, adminId, "Administrador", "admin@admin.com", AppRole.Admin, passwordHasher.Hash("SenhaAdmin"));

            // Client User
            await EnsureUser(usersToSeed, clientId, "Cliente Teste", "cliente@cliente.com", AppRole.Client, passwordHasher.Hash("SenhaCliente"));

            // Editor User
            await EnsureUser(usersToSeed, editorId, "Editor Chefe", "editor@editor.com", AppRole.Editor, passwordHasher.Hash("SenhaEditor"));

            await _context.Users.AddRangeAsync(usersToSeed);
            await _context.SaveChangesAsync();
        }

        // No Packages or Orders seeding - clean schema
    }

    private async Task EnsureUser(List<User> usersToAdd, Guid id, string name, string email, AppRole role, string passwordHash)
    {
        var exists = await _context.Users.AnyAsync(u => u.Email == email);
        if (!exists)
        {
            var user = CreateUser(id, name, email, role, passwordHash);
            usersToAdd.Add(user);
        }
    }

    private User CreateUser(Guid id, string name, string email, AppRole role, string passwordHash)
    {
        var user = new User
        {
            Id = id,
            Email = email,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Profile = new Profile
            {
                Id = Guid.NewGuid(),
                UserId = id,
                Name = name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        user.Roles.Add(new UserRole { UserId = id, Role = role });
        return user;
    }

    private Package CreatePackage(string name, string slug, PackageCategory category, decimal price, int qty, int duration, int? validity, int loyalty, int delivery)
    {
        return new Package
        {
            Name = name,
            Slug = slug,
            Category = category,
            Price = price,
            VideoQuantity = qty,
            MaxDurationSeconds = duration * 60,
            ValidityDays = validity,
            LoyaltyMonths = loyalty,
            DeliveryDays = delivery,
            Description = $"Pacote {name} com {qty} vídeos de até {duration} minutos."
        };
    }

    private Order CreateOrder(Guid clientId, Guid? editorId, string title, OrderStatus status, Guid videoFormatId)
    {
        return new Order
        {
            ClientId = clientId,
            EditorId = editorId,
            Title = title,
            Briefing = "Seeded briefing...",
            SourceFilesUrl = "http://drive.google.com/seeded",
            Status = status,
            VideoFormatId = videoFormatId,
            Deadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
