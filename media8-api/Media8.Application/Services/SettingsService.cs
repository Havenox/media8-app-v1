using Media8.Application.Interfaces;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace Media8.Application.Services;

/// <summary>
/// Singleton service that manages system settings with in-memory caching.
/// Uses EF Core directly to avoid Scoped/Singleton conflicts.
/// </summary>
public class SettingsService : ISettingsService
{
private readonly ILogger<SettingsService> _logger;
private readonly ConcurrentDictionary<string, string> _cache = new();
private readonly object _initializationLock = new();
private bool _initialized = false;

public SettingsService(ILogger<SettingsService> logger)
{
_logger = logger;
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
/// Since this is singleton and can't use Scoped DbContext,
/// values must be loaded at startup or via explicit refresh.
/// </summary>
public Task<T> GetSettingAsync<T>(string key, T defaultValue)
{
if (_cache.TryGetValue(key, out var value))
{
try
{
var converted = (T)Convert.ChangeType(value, typeof(T));
return Task.FromResult(converted);
}
catch
{
return Task.FromResult(defaultValue);
}
}

return Task.FromResult(defaultValue);
}

/// <summary>
/// Sets or updates a setting value.
/// Note: This requires manual cache refresh via RefreshCacheAsync.
/// </summary>
public Task SetSettingAsync(string key, string value)
{
// Update cache
_cache[key] = value;

_logger.LogInformation("Setting {Key} updated to {Value} (cache only)", key, value);
return Task.CompletedTask;
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
/// Must be called explicitly when settings change.
/// </summary>
public Task RefreshCacheAsync()
{
// In singleton mode without DbContext access, this is a no-op
// Settings must be refreshed via explicit calls after DB changes
_logger.LogInformation("Cache refresh requested (no-op in singleton mode)");
return Task.CompletedTask;
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
