using Media8.Application.DTOs.Packages;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Media8.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Media8.Api.Controllers;

[ApiController]
[Route("api/v1/package-assignments")]
[Authorize]
public class PackageAssignmentsController : ControllerBase
{
    private readonly IRepository<PackageAssignment> _assignmentRepository;
    private readonly IPackageRepository _packageRepository;
    private readonly IRepository<ServiceBalanceLot> _balanceRepository;

    public PackageAssignmentsController(
        IRepository<PackageAssignment> assignmentRepository,
        IPackageRepository packageRepository,
        IRepository<ServiceBalanceLot> balanceRepository)
    {
        _assignmentRepository = assignmentRepository;
        _packageRepository = packageRepository;
        _balanceRepository = balanceRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PackageAssignmentDto>>> GetAll([FromQuery] Guid? clientId)
    {
        IEnumerable<PackageAssignment> assignments;
        if (clientId.HasValue)
        {
            assignments = await _assignmentRepository.FindAsync(a => a.ClientId == clientId.Value);
        }
        else
        {
            assignments = await _assignmentRepository.GetAllAsync();
        }

        var dtos = assignments.Select(MapToDto);
        return Ok(dtos);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<PackageAssignmentDto>> Create([FromBody] AssignPackageRequest request)
    {
        // Get the package
        var package = await _packageRepository.GetByIdAsync(request.PackageId);
        if (package == null) return NotFound(new { message = "Package not found" });

        // Get current user as assigner
        var assignerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (assignerIdClaim == null) return Unauthorized();
        var assignerId = Guid.Parse(assignerIdClaim);

        // Calculate expiration date
        DateTime? expiresAt = null;
        if (package.ValidityDays.HasValue && package.ValidityDays.Value > 0)
        {
            expiresAt = DateTime.UtcNow.AddDays(package.ValidityDays.Value);
        }

        // Create the assignment
        var assignment = new PackageAssignment
        {
            PackageId = request.PackageId,
            ClientId = request.ClientId,
            AssignedBy = assignerId,
            AssignedAt = DateTime.UtcNow,
            ActivatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,

            Status = AssignmentStatus.Active,
            // Snapshot Data (Immutable Contract)
            SnapshotPackageName = package.Name,
            SnapshotVideoQuantity = package.VideoQuantity,
            SnapshotPrice = package.Price,
            SnapshotValidityDays = package.ValidityDays
        };

        await _assignmentRepository.AddAsync(assignment);

        // Provision ServiceBalanceLots for each ServiceType in the package
        foreach (var serviceType in package.ServiceTypes)
        {
            var balanceLot = new ServiceBalanceLot
            {
                UserId = request.ClientId,
                ServiceType = serviceType,
                Quantity = package.VideoQuantity,
                RemainingQuantity = package.VideoQuantity,
                PurchasedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                Source = LotSource.Purchase, // From Package assignment
                AssignmentId = assignment.Id
            };

            await _balanceRepository.AddAsync(balanceLot);
        }

        return CreatedAtAction(nameof(GetAll), new { clientId = request.ClientId }, MapToDto(assignment));
    }

    private static PackageAssignmentDto MapToDto(PackageAssignment assignment)
    {
        return new PackageAssignmentDto
        {
            Id = assignment.Id,
            PackageId = assignment.PackageId,
            ClientId = assignment.ClientId,
            AssignedBy = assignment.AssignedBy,
            AssignedAt = assignment.AssignedAt,
            ActivatedAt = assignment.ActivatedAt,
            ExpiresAt = assignment.ExpiresAt,
            Status = assignment.Status
        };
    }
}

