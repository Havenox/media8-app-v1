using System.Security.Claims;
using Media8.Application.DTOs.Settings;
using Media8.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Media8.Api.Controllers;

/// <summary>
/// Controller for managing system-wide settings.
/// Restricted to Admin role only.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<AdminSettingsController> _logger;

    public AdminSettingsController(
        ISettingsService settingsService,
        ILogger<AdminSettingsController> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all system settings as key-value pairs.
    /// </summary>
    /// <returns>Dictionary of all settings.</returns>
    [HttpGet]
    public async Task<ActionResult<SystemSettingsResponse>> GetAllSettings()
    {
        try
        {
            var allSettings = await _settingsService.GetAllSettingsAsync();
            return Ok(new SystemSettingsResponse { Settings = allSettings });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all settings");
            return BadRequest(new { message = "Erro ao buscar configurações" });
        }
    }

    /// <summary>
    /// Updates or creates a single system setting.
    /// </summary>
    /// <param name="request">The setting key and new value.</param>
    [HttpPatch]
    public async Task<ActionResult<UpdateSettingsResponse>> UpdateSetting(UpdateSettingsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
        {
            return BadRequest(new { message = "Key é obrigatório" });
        }

        try
        {
            await _settingsService.SetSettingAsync(request.Key, request.Value ?? string.Empty);
            
            var response = new UpdateSettingsResponse
            {
                Key = request.Key,
                Value = request.Value ?? string.Empty,
                Message = $"Configuração {request.Key} atualizada com sucesso"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating setting {Key}", request.Key);
            return BadRequest(new { message = $"Erro ao atualizar configuração: {ex.Message}" });
        }
    }

    /// <summary>
    /// Refreshes the in-memory cache from the database.
    /// Useful when multiple instances need to sync.
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult> RefreshCache()
    {
        try
        {
            await _settingsService.RefreshCacheAsync();
            return Ok(new { message = "Cache atualizado com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing cache");
            return BadRequest(new { message = "Erro ao atualizar cache" });
        }
    }
}
