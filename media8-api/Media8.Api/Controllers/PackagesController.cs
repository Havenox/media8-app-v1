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

    public PackagesController(IPackageRepository packageRepository)
    {
        _packageRepository = packageRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Package>>> GetAll([FromQuery] string? category = null)
    {
        IEnumerable<Package> packages;

        // Base query: Active filter is already applied if requested, 
        // but we need to enforce Public = True for non-admins.
        var user = User;
        var isAdmin = user?.IsInRole("Admin") ?? false;

        // If not Admin, force Active=True and IsPublic=True, unless explicitly looking for something else (but still limited)
        // Actually, requirement says Public=True for normal users.
        
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<PackageCategory>(category, true, out var catEnum))
        {
            packages = await _packageRepository.GetByCategoryAsync(catEnum);
        }
        else
        {
            packages = await _packageRepository.GetAllAsync();
        }

        // Apply IsPublic filter for non-admins
        if (!isAdmin)
        {
            packages = packages.Where(p => p.IsPublic);
        }

        return Ok(packages);
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
            MaxDurationMinutes = request.MaxDurationMinutes,
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
        if (request.MaxDurationMinutes.HasValue) package.MaxDurationMinutes = request.MaxDurationMinutes.Value;
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

        // Hard delete since IsActive column is removed
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

