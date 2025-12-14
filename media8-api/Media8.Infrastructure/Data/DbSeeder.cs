using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Media8.Infrastructure.Data;

public class DbSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public DbSeeder(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task SeedAsync()
    {
        Console.WriteLine("Seeder started... Checking for existing demo data...");

        // ==========================================

        // ==========================================
        // 1. SEED USERS & PROFILES
        // ==========================================
        var usersToAdd = new List<User>();
        
        // Define IDs
        var adminId = Guid.NewGuid();
        var clientAnaId = Guid.NewGuid();
        var editorPedroId = Guid.NewGuid();
        var clientMariaId = Guid.NewGuid();
        var editorJoaoId = Guid.NewGuid();

        var passwordHash = _passwordHasher.Hash("123456");

        // Check and prepare users
        await EnsureUser(usersToAdd, adminId, "Carlos Silva", "carlos@media8.com", AppRole.Admin, passwordHash);
        await EnsureUser(usersToAdd, clientAnaId, "Ana Costa", "ana@cliente.com", AppRole.Client, passwordHash);
        await EnsureUser(usersToAdd, editorPedroId, "Pedro Santos", "pedro@editor.com", AppRole.Editor, passwordHash);
        await EnsureUser(usersToAdd, clientMariaId, "Maria Oliveira", "maria@cliente.com", AppRole.Client, passwordHash);
        await EnsureUser(usersToAdd, editorJoaoId, "João Pereira", "joao@editor.com", AppRole.Editor, passwordHash);

        if (usersToAdd.Any())
        {
             try
             {
                 await _context.Users.AddRangeAsync(usersToAdd);
                 await _context.SaveChangesAsync();
                 Console.WriteLine($"[DIAGNOSTIC] Added {usersToAdd.Count} new users.");
             }
             catch (Exception ex)
             {
                 Console.WriteLine($"[DIAGNOSTIC] ERROR saving users: {ex.Message}");
                 if (ex.InnerException != null)
                     Console.WriteLine($"[DIAGNOSTIC] Inner: {ex.InnerException.Message}");
                 // Do not throw, so we can see the error
                 return;
             }
        }

        // Re-fetch seeds to ensure we have the correct IDs for relationships
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == "carlos@media8.com");
        var ana = await _context.Users.FirstOrDefaultAsync(u => u.Email == "ana@cliente.com");
        var pedro = await _context.Users.FirstOrDefaultAsync(u => u.Email == "pedro@editor.com");
        var maria = await _context.Users.FirstOrDefaultAsync(u => u.Email == "maria@cliente.com");
        var joao = await _context.Users.FirstOrDefaultAsync(u => u.Email == "joao@editor.com");

        if (admin == null || ana == null || pedro == null || maria == null || joao == null)
        {
            Console.WriteLine("[DIAGNOSTIC] Error: Could not retrieve all seeded users. Aborting further seed.");
            return;
        }

        // Update local IDs to match DB
        adminId = admin.Id;
        clientAnaId = ana.Id;
        editorPedroId = pedro.Id;
        clientMariaId = maria.Id;
        editorJoaoId = joao.Id;

        // ==========================================
        // 2. SEED PACKAGES
        // ==========================================
            Console.WriteLine("[DIAGNOSTIC] Seeding Packages...");
            
            // Check if we need to re-seed (if existing packages have no slug)
            var existingPackages = await _context.Packages.ToListAsync();
            if (existingPackages.Any() && string.IsNullOrEmpty(existingPackages.First().Slug))
            {
                 Console.WriteLine("[DIAGNOSTIC] Detected packages without slugs. Re-seeding...");
                 _context.Packages.RemoveRange(existingPackages);
                 await _context.SaveChangesAsync();
            }

            if (!await _context.Packages.AnyAsync())
            {
                var packages = new List<Package>
            {
                // Avulsos
                CreatePackage("Reels Estratégico", "avulso-reels-130", PackageCategory.Avulso, 130, 1, 90, 7, 0, 7, new[] { ServiceType.Avulso }, "Edição avançada..."),
                CreatePackage("Reels Estendido", "avulso-reels-200", PackageCategory.Avulso, 200, 1, 180, 7, 0, 7, new[] { ServiceType.Avulso }, "Edição avançada..."),
                CreatePackage("Reels Narrado", "avulso-reels-narrado", PackageCategory.Avulso, 150, 1, 90, 7, 0, 7, new[] { ServiceType.Avulso }, "Vídeo criado a partir de fotos..."),
                CreatePackage("YouTube Curto", "avulso-youtube-curto", PackageCategory.Avulso, 280, 1, 15, 14, 0, 0, new[] { ServiceType.YoutubeCurto }, "YouTube Curto..."),
                CreatePackage("YouTube Médio", "avulso-youtube-medio", PackageCategory.Avulso, 350, 1, 30, 14, 0, 0, new[] { ServiceType.YoutubeMedio }, "YouTube Médio..."),
                CreatePackage("YouTube Longo", "avulso-youtube-longo", PackageCategory.Avulso, 530, 1, 60, 14, 0, 0, new[] { ServiceType.YoutubeLongo }, "YouTube Longo..."),

                // Assinaturas
                CreatePackage("Plano Starter", "assinatura-starter", PackageCategory.Assinatura, 597, 8, 90, null, 6, 5, new[] { ServiceType.ReelsStandard }, "Starter..."),
                CreatePackage("Plano Growth", "assinatura-growth", PackageCategory.Assinatura, 847, 12, 90, null, 6, 5, new[] { ServiceType.ReelsStandard, ServiceType.ReelsPremium }, "Growth..."),
                CreatePackage("Plano Scale", "assinatura-scale", PackageCategory.Assinatura, 1497, 24, 90, null, 6, 5, new[] { ServiceType.ReelsStandard, ServiceType.ReelsPremium }, "Scale..."),
                CreatePackage("Assinatura Demo", "assinatura-demo-test", PackageCategory.Assinatura, 97, 2, 90, null, 1, 5, new[] { ServiceType.ReelsStandard }, "Demo..."),

                // Pacotes
                CreatePackage("Pacote Essencial", "pacote-essencial", PackageCategory.Pacote, 697, 8, 90, 60, 0, 7, new[] { ServiceType.PacoteReels }, "Essencial..."),
                CreatePackage("Pacote Profissional", "pacote-profissional", PackageCategory.Pacote, 997, 12, 90, 60, 0, 7, new[] { ServiceType.PacoteReels }, "Profissional..."),
                CreatePackage("Pacote Premium", "pacote-premium", PackageCategory.Pacote, 1697, 24, 90, 60, 0, 7, new[] { ServiceType.PacoteReels }, "Premium...")
            };

            await _context.Packages.AddRangeAsync(packages);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 3. SEED ASSIGNMENTS
        // ==========================================
        if (!await _context.PackageAssignments.AnyAsync())
        {
             Console.WriteLine("[DIAGNOSTIC] Seeding Assignments...");
             var allPackages = await _context.Packages.ToListAsync();
             var growthPkg = allPackages.First(p => p.Name == "Plano Growth");
             var proPkg = allPackages.First(p => p.Name == "Pacote Profissional");
             var demoPkg = allPackages.First(p => p.Name == "Assinatura Demo");

             var assignment1 = CreateAssignment(growthPkg.Id, clientAnaId, adminId, AssignmentStatus.Active);
             var assignment2 = CreateAssignment(proPkg.Id, clientMariaId, adminId, AssignmentStatus.Active);
             var assignmentDemoAna = CreateAssignment(demoPkg.Id, clientAnaId, adminId, AssignmentStatus.Active, DateTime.UtcNow.AddYears(1));
             var assignmentDemoMaria = CreateAssignment(demoPkg.Id, clientMariaId, adminId, AssignmentStatus.Active, DateTime.UtcNow.AddYears(1));

             await _context.PackageAssignments.AddRangeAsync(new[] { assignment1, assignment2, assignmentDemoAna, assignmentDemoMaria });
             await _context.SaveChangesAsync();

             // Refetch to get Ids
             assignment1 = await _context.PackageAssignments.FirstAsync(a => a.PackageId == growthPkg.Id && a.ClientId == clientAnaId);
             assignment2 = await _context.PackageAssignments.FirstAsync(a => a.PackageId == proPkg.Id && a.ClientId == clientMariaId);

            // ==========================================
            // 4. SEED SERVICE BALANCES
            // ==========================================
            Console.WriteLine("[DIAGNOSTIC] Seeding Balances...");
            var lots = new List<ServiceBalanceLot>
            {
                CreateLot(adminId, ServiceType.ReelsStandard, 12, "Plano Growth"),
                CreateLot(adminId, ServiceType.ReelsPremium, 5, "Plano Premium"),
                CreateLot(adminId, ServiceType.YoutubeCurto, 3, "Avulso"),
                CreateLot(adminId, ServiceType.YoutubeMedio, 2, "Avulso"),
                CreateLot(adminId, ServiceType.YoutubeLongo, 1, "Projeto Especial"),
                CreateLot(adminId, ServiceType.PacoteReels, 4, "Black Friday"),
                CreateLot(adminId, ServiceType.Avulso, 2, "Créditos Flex"),
                
                CreateLot(clientAnaId, ServiceType.ReelsStandard, 12, "Growth Assignment", assignment1.Id),
                CreateLot(clientMariaId, ServiceType.PacoteReels, 12, "Pro Assignment", assignment2.Id)
            };
            await _context.ServiceBalanceLots.AddRangeAsync(lots);
            await _context.SaveChangesAsync();
        }


        // ==========================================
        // 5. SEED ORDERS
        // ==========================================
        if (!await _context.Orders.AnyAsync())
        {
            Console.WriteLine("[DIAGNOSTIC] Seeding Orders...");
            var orders = new List<Order>
            {
                CreateOrder(clientAnaId, null, "Reels Lançamento Produto", OrderStatus.Pending, ServiceType.ReelsStandard),
                CreateOrder(clientAnaId, editorPedroId, "Reels Premium - Black Friday", OrderStatus.InProgress, ServiceType.ReelsPremium),
                CreateOrder(clientMariaId, editorPedroId, "YouTube Tutorial", OrderStatus.InReview, ServiceType.YoutubeCurto),
                CreateOrder(clientAnaId, editorJoaoId, "YouTube Entrevista", OrderStatus.ChangesRequested, ServiceType.YoutubeMedio),
                CreateOrder(clientMariaId, editorPedroId, "Documentário Completo", OrderStatus.Approved, ServiceType.YoutubeLongo),
                CreateOrder(clientAnaId, null, "Pacote Black Friday", OrderStatus.Pending, ServiceType.PacoteReels),
                CreateOrder(clientMariaId, editorJoaoId, "Projeto Especial - Evento", OrderStatus.InProgress, ServiceType.Avulso)
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

    private Package CreatePackage(string name, string slug, PackageCategory category, decimal price, int qty, int duration, int? validity, int loyalty, int delivery, ServiceType[] types, string desc)
    {
        return new Package
        {
            Name = name,
            Slug = slug,
            Category = category,
            Price = price,
            VideoQuantity = qty,
            MaxDurationMinutes = duration,
            ValidityDays = validity,
            LoyaltyMonths = loyalty,
            DeliveryDays = delivery,
            ServiceTypes = types.ToList(),
            Description = desc,

        };
    }

    private PackageAssignment CreateAssignment(Guid pkgId, Guid clientId, Guid assignerId, AssignmentStatus status, DateTime? expires = null)
    {
        return new PackageAssignment
        {
            PackageId = pkgId,
            ClientId = clientId,
            AssignedBy = assignerId,
            Status = status,
            AssignedAt = DateTime.UtcNow,
            ActivatedAt = DateTime.UtcNow,
            ExpiresAt = expires ?? DateTime.UtcNow.AddMonths(6)
        };
    }
    
    private ServiceBalanceLot CreateLot(Guid userId, ServiceType type, int qty, string sourceName, Guid? assignmentId = null)
    {
        return new ServiceBalanceLot
        {
            UserId = userId,
            ServiceType = type,
            Quantity = qty,
            RemainingQuantity = qty,
            Source = LotSource.Purchase, // Simplification
            AssignmentId = assignmentId,
            CreatedAt = DateTime.UtcNow
        };
    }

    private Order CreateOrder(Guid clientId, Guid? editorId, string title, OrderStatus status, ServiceType type)
    {
        return new Order
        {
            ClientId = clientId,
            EditorId = editorId,
            Title = title,
            Briefing = "Seeded briefing...",
            SourceFilesUrl = "http://drive.google.com/seeded",
            Status = status,
            ServiceType = type,
            Deadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
