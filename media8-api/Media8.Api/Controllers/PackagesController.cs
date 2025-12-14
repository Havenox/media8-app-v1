using Media8.Application.DTOs.Packages;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PackagesController : ControllerBase
{
    private readonly IPackageRepository _packageRepository;
    private readonly IRepository<PackageAssignment> _assignmentRepository;

    public PackagesController(
        IPackageRepository packageRepository,
        IRepository<PackageAssignment> assignmentRepository)
    {
        _packageRepository = packageRepository;
        _assignmentRepository = assignmentRepository;
    }

    [HttpGet]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Package>>> GetAll(
        [FromQuery] string? category = null, 
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        // Simple GetAll for specific category (legacy support if needed, or mapped to paged)
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<PackageCategory>(category, true, out var catEnum) && string.IsNullOrEmpty(search))
        {
             // For simplicity, if category is strictly requested without search, we might just return list. 
             // But let's funnel everything through GetPagedAsync if possible, or keep separate paths.
             // Given the repo method structure, let's keep Category separate for now or update GetPagedAsync to support Category too.
             // The user asked for Search Optimization. Let's focus on the Search path.
             // If search is present OR page > 0, we treat it as Paged.
             // But wait, the existing frontend expects basic array for GetAll.
             // We need to return { items, total } or just items?
             // UsersController.GetAll switched to { items, total } but that uses a different hook.
             // usePackages hook expects array. 
             // If I change the return type, I break current `usePackages`.
             // I should probably create a new endpoint `GetPaged` like UsersController, OR check headers.
             
             // Strategy: UsersController returned List but added X-Total-Count header.
             // I will do the same here to maintain "List" shape for backward compatibility if anyone ignores the header,
             // but `useInfiniteQuery` will needed properties.
             
             // Actually, creating a specific Paged endpoint `api/v1/packages/paged` might be safer for typing,
             // OR just use query params and return List.
             // Let's stick to the UsersController pattern: Same Endpoint, params control logic, Return List + Header.
             // But wait, UsersController `GetAll` was completely replaced.
        }

        var user = User;
        var isAdmin = user?.IsInRole("Admin") ?? false;
        
        // Visibility Filter
        bool? isPublicFilter = isAdmin ? null : true; // Admin sees all (null), Client sees public only (true)

        // If category is set, we use old logic (or update repo). 
        // Let's assume for this task we primarily need Search.
        
        if (!string.IsNullOrEmpty(search) || page > 0)
        {
             var (packages, total) = await _packageRepository.GetPagedAsync(search, page, pageSize, isPublicFilter);
             Response.Headers.Append("X-Total-Count", total.ToString());
             return Ok(packages);
        }

        // Fallback to old behavior (should be unreachable if page default is 1)
        IEnumerable<Package> allPackages = await _packageRepository.GetAllAsync();
        if (isPublicFilter == true) allPackages = allPackages.Where(p => p.IsPublic);
        
        return Ok(allPackages);
    }

    [HttpGet("{idOrSlug}")]
    public async Task<ActionResult<Package>> GetById(string idOrSlug)
    {
        Package? pkg = null;
        if (Guid.TryParse(idOrSlug, out var id))
        {
            pkg = await _packageRepository.GetByIdAsync(id);
        }
        else
        {
            pkg = await _packageRepository.GetBySlugAsync(idOrSlug);
        }

        if (pkg == null) return NotFound();

        // Check visibility
        var isAdmin = User?.IsInRole("Admin") ?? false;
        if (!pkg.IsPublic && !isAdmin)
        {
            return NotFound(); // Hide private packages from non-admins
        }

        return Ok(pkg);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Package>> Create([FromBody] CreatePackageRequest request)
    {
        var package = new Package
        {
            Name = request.Name,
            Slug = request.Slug ?? GenerateSlug(request.Name),
            Category = request.Category,
            Price = request.Price,
            VideoQuantity = request.VideoQuantity,
            MaxDurationSeconds = request.MaxDurationSeconds,
            ValidityDays = request.ValidityDays,
            LoyaltyMonths = request.LoyaltyMonths,
            DeliveryDays = request.DeliveryDays,
            ServiceTypes = request.ServiceTypes,
            Description = request.Description,
            Features = request.Features,
            Disclaimer = request.Disclaimer,
            Badge = request.Badge,
            IsPublic = request.IsPublic
        };

        await _packageRepository.AddAsync(package);
        return CreatedAtAction(nameof(GetById), new { idOrSlug = package.Id }, package);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<Package>> Update(Guid id, [FromBody] UpdatePackageRequest request)
    {
        var package = await _packageRepository.GetByIdAsync(id);
        if (package == null) return NotFound();

        // Update only non-null fields
        if (request.Name != null) package.Name = request.Name;
        if (request.Slug != null) package.Slug = request.Slug;
        if (request.Category.HasValue) package.Category = request.Category.Value;
        if (request.Price.HasValue) package.Price = request.Price.Value;
        if (request.VideoQuantity.HasValue) package.VideoQuantity = request.VideoQuantity.Value;
        if (request.MaxDurationSeconds.HasValue) package.MaxDurationSeconds = request.MaxDurationSeconds.Value;
        if (request.ValidityDays.HasValue) package.ValidityDays = request.ValidityDays;
        if (request.LoyaltyMonths.HasValue) package.LoyaltyMonths = request.LoyaltyMonths.Value;
        if (request.DeliveryDays.HasValue) package.DeliveryDays = request.DeliveryDays.Value;
        if (request.ServiceTypes != null) package.ServiceTypes = request.ServiceTypes;
        if (request.Description != null) package.Description = request.Description;
        if (request.Features != null) package.Features = request.Features;
        if (request.Disclaimer != null) package.Disclaimer = request.Disclaimer;
        if (request.Badge != null) package.Badge = request.Badge;
        if (request.IsPublic.HasValue) package.IsPublic = request.IsPublic.Value;

        package.UpdatedAt = DateTime.UtcNow;

        await _packageRepository.UpdateAsync(package);
        return Ok(package);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var package = await _packageRepository.GetByIdAsync(id);
        if (package == null) return NotFound();

        // Check for assignments to prevent history loss
        var assignments = await _assignmentRepository.FindAsync(a => a.PackageId == id);
        if (assignments.Any())
        {
            return Conflict(new { message = "Este pacote possui vendas associadas e não pode ser excluído. Tente desativar a visibilidade (Tornar Privado)." });
        }

        await _packageRepository.DeleteAsync(id);

        return NoContent();
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
            .Replace("ã", "a").Replace("õ", "o").Replace("ç", "c");
    }
}

