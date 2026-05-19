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
// 1. Seed VideoFormats first (data-driven)
// ==========================================
if (!_context.VideoFormats.Any())
{
var videoFormats = new List<VideoFormat>
{
new VideoFormat { Name = "Reels Standard", Slug = "reels-standard", MaxDurationSeconds = 60, Tier = ComplexityLevel.Standard },
new VideoFormat { Name = "Reels Premium", Slug = "reels-premium", MaxDurationSeconds = 90, Tier = ComplexityLevel.Premium },
new VideoFormat { Name = "YouTube Curto", Slug = "youtube-curto", MaxDurationSeconds = 180, Tier = ComplexityLevel.Standard },
new VideoFormat { Name = "YouTube Médio", Slug = "youtube-medio", MaxDurationSeconds = 600, Tier = ComplexityLevel.Premium },
new VideoFormat { Name = "YouTube Longo", Slug = "youtube-longo", MaxDurationSeconds = 1800, Tier = ComplexityLevel.GodMode },
new VideoFormat { Name = "Pacote Reels", Slug = "pacote-reels", MaxDurationSeconds = 60, Tier = ComplexityLevel.Standard },
new VideoFormat { Name = "Avulso", Slug = "avulso", MaxDurationSeconds = 120, Tier = ComplexityLevel.Standard }
};

await _context.VideoFormats.AddRangeAsync(videoFormats);
await _context.SaveChangesAsync();
}

// ==========================================
// 2. Seed Users (always ensure they exist)
// ==========================================
var clientCarlosId = Guid.Parse("00000000-0000-0000-0000-000000000001");
var clientAnaId = Guid.Parse("00000000-0000-0000-0000-000000000002");
var editorRobertoId = Guid.Parse("00000000-0000-0000-0000-000000000003");
var adminId = Guid.Parse("00000000-0000-0000-0000-000000000004");

// Check if users need to be seeded
if (!await _context.Users.AnyAsync())
{
var usersToSeed = new List<User>();
await EnsureUser(usersToSeed, clientCarlosId, "Carlos Silva", "carlos@media8.com", AppRole.Client, passwordHasher.Hash("123456"));
await EnsureUser(usersToSeed, clientAnaId, "Ana Souza", "ana@media8.com", AppRole.Client, passwordHasher.Hash("123456"));
await EnsureUser(usersToSeed, editorRobertoId, "Roberto Editor", "roberto@media8.com", AppRole.Editor, passwordHasher.Hash("123456"));
await EnsureUser(usersToSeed, adminId, "Admin Chefe", "admin@media8.com", AppRole.Admin, passwordHasher.Hash("123456"));

await _context.Users.AddRangeAsync(usersToSeed);
await _context.SaveChangesAsync();
}

        // ==========================================
        // 3. Seed Packages
        // ==========================================
        if (!_context.Packages.Any())
        {
            var packages = new List<Package>
            {
                CreatePackage("Pacote Reels Viral", "reels-viral", PackageCategory.Pacote, 499.90m, 10, 60, 30, 0, 3),
                CreatePackage("YouTube Creator", "youtube-creator", PackageCategory.Assinatura, 899.90m, 8, 300, null, 0, 5),
                CreatePackage("Pacote Completo", "completo", PackageCategory.Pacote, 1499.90m, 15, 180, 60, 1, 7)
            };
            
            await _context.Packages.AddRangeAsync(packages);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 4. Seed Orders (using VideoFormatId)
        // ==========================================
        if (!_context.Orders.Any())
        {
            var reelsStandardId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "reels-standard")).Id;
            var reelsPremiumId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "reels-premium")).Id;
            var youtubeCurtoId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "youtube-curto")).Id;
            var youtubeMedioId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "youtube-medio")).Id;
            var youtubeLongoId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "youtube-longo")).Id;
            var pacoteReelsId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "pacote-reels")).Id;
            var avulsoId = (await _context.VideoFormats.FirstAsync(v => v.Slug == "avulso")).Id;

            var orders = new List<Order>
            {
                CreateOrder(clientCarlosId, null, "Reels Lançamento Produto", OrderStatus.Pending, reelsStandardId),
                CreateOrder(clientCarlosId, editorRobertoId, "Reels Premium - Black Friday", OrderStatus.InProgress, reelsPremiumId),
                CreateOrder(clientAnaId, editorRobertoId, "YouTube Tutorial", OrderStatus.InReview, youtubeCurtoId),
                CreateOrder(clientAnaId, editorRobertoId, "YouTube Entrevista", OrderStatus.ChangesRequested, youtubeMedioId),
                CreateOrder(clientAnaId, editorRobertoId, "Documentário Completo", OrderStatus.Approved, youtubeLongoId),
                CreateOrder(clientCarlosId, null, "Pacote Black Friday", OrderStatus.Pending, pacoteReelsId),
                CreateOrder(clientAnaId, editorRobertoId, "Projeto Especial - Evento", OrderStatus.InProgress, avulsoId)
            };

            await _context.Orders.AddRangeAsync(orders);
            await _context.SaveChangesAsync();
        }
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
