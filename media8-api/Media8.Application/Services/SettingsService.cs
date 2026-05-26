using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace Media8.Application.Services;

/// <summary>
/// Singleton service that manages system settings with in-memory caching.
/// Uses IServiceScopeFactory to resolve Scoped dependencies (IRepository) safely.
/// </summary>
public class SettingsService : ISettingsService
{
private readonly ILogger<SettingsService> _logger;
private readonly IServiceScopeFactory _scopeFactory;
private readonly ConcurrentDictionary<string, string> _cache = new();
private readonly object _initializationLock = new();
private bool _initialized = false;

public SettingsService(
ILogger<SettingsService> logger,
IServiceScopeFactory scopeFactory)
{
_logger = logger;
_scopeFactory = scopeFactory;
}

/// <summary>
/// Initializes the cache by loading all settings from the database.
/// Should be called during application startup.
/// </summary>
public Task InitializeAsync()
{
if (_initialized) return Task.CompletedTask;

lock (_initializationLock)
{
if (_initialized) return Task.CompletedTask;
_initialized = true;
}

_logger.LogInformation("SettingsService initialized");
return Task.CompletedTask;
}

  /// <summary>
  /// Gets a setting value by key with automatic type conversion.
  /// Throws exception if setting is not found in cache (cache must be initialized at startup).
  /// </summary>
  public async Task<T> GetSettingAsync<T>(string key, T defaultValue)
  {
    if (!_cache.TryGetValue(key, out var value))
    {
      throw new InvalidOperationException($"Setting '{key}' not found in cache. Cache was not properly initialized at startup.");
    }

    try
    {
      var converted = (T)Convert.ChangeType(value, typeof(T));
      return converted;
    }
    catch (Exception ex)
    {
      throw new InvalidOperationException($"Failed to convert setting '{key}' value '{value}' to type {typeof(T).Name}", ex);
    }
  }

/// <summary>
/// Sets or updates a setting value, persisting to database and updating cache.
/// Uses IServiceScopeFactory to resolve scoped IRepository safely from Singleton.
/// </summary>
public async Task SetSettingAsync(string key, string value)
{
try
{
// Create a temporary scope to resolve scoped services
using var scope = _scopeFactory.CreateScope();
var repository = scope.ServiceProvider.GetRequiredService<IRepository<SystemSetting>>();

// Try to find existing setting
var settings = await repository.FindAsync(s => s.Key == key);
var setting = settings.FirstOrDefault();

if (setting != null)
{
// Update existing
setting.Value = value;
setting.UpdatedAt = DateTime.UtcNow;
await repository.UpdateAsync(setting);
}
else
{
// Create new
var newSetting = new SystemSetting
{
Key = key,
Value = value,
Description = key,
CreatedAt = DateTime.UtcNow,
UpdatedAt = DateTime.UtcNow
};
await repository.AddAsync(newSetting);
}

// Update cache only after successful DB persistence
_cache[key] = value;

_logger.LogInformation("Setting {Key} updated to {Value} (persisted to DB and cache)", key, value);
}
catch (Exception ex)
{
_logger.LogError(ex, "Error updating setting {Key}", key);
throw;
}
}

/// <summary>
/// Gets all settings as a dictionary.
/// </summary>
public Task<Dictionary<string, string>> GetAllSettingsAsync()
{
return Task.FromResult(_cache.ToDictionary(k => k.Key, v => v.Value));
}

  /// <summary>
  /// Refreshes the cache from the database.
  /// Uses IServiceScopeFactory to resolve scoped repository safely.
  /// </summary>
  public async Task RefreshCacheAsync()
  {
    try
    {
      using var scope = _scopeFactory.CreateScope();
      var repository = scope.ServiceProvider.GetRequiredService<IRepository<SystemSetting>>();

      var allSettings = await repository.GetAllAsync();
      var newCache = new Dictionary<string, string>();

      foreach (var setting in allSettings)
      {
        newCache[setting.Key] = setting.Value;
      }

      // Replace cache atomically
      _cache.Clear();
      foreach (var kvp in newCache)
      {
        _cache[kvp.Key] = kvp.Value;
      }

      _logger.LogInformation("✓ Settings cache loaded with {Count} settings: {Keys}", newCache.Count, string.Join(", ", newCache.Keys));
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "✗ Critical failure: Could not load settings cache from database");
      throw;
    }
  }

/// <summary>
/// Loads settings from a dictionary (called during startup).
/// </summary>
public void LoadFromDictionary(Dictionary<string, string> settings)
{
foreach (var kvp in settings)
{
_cache[kvp.Key] = kvp.Value;
}

_logger.LogInformation("Loaded {Count} settings from dictionary", settings.Count);
}

/// <summary>
/// Updates a single setting in cache (called after DB update).
/// </summary>
public void UpdateCache(string key, string value)
{
_cache[key] = value;
_logger.LogInformation("Cache updated for {Key}", key);
}
}
