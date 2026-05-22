using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Media8.Application.Services;

/// <summary>
/// Singleton service that manages system settings with in-memory caching.
/// Uses a thread-safe dictionary for O(1) access without external dependencies.
/// </summary>
public class SettingsService : ISettingsService
{
private readonly IRepository<SystemSetting> _repository;
private readonly ILogger<SettingsService> _logger;
private readonly Dictionary<string, string> _cache = new();
private readonly object _lock = new();
private bool _initialized = false;

public SettingsService(
IRepository<SystemSetting> repository,
ILogger<SettingsService> logger)
{
_repository = repository;
_logger = logger;
}

/// <summary>
/// Initializes the cache by loading all settings from the database.
/// </summary>
public async Task InitializeAsync()
{
if (_initialized) return;

lock (_lock)
{
if (_initialized) return;
_initialized = true;
}

try
{
var allSettings = await _repository.GetAllAsync();

lock (_lock)
{
_cache.Clear();
foreach (var setting in allSettings)
{
if (!_cache.ContainsKey(setting.Key))
_cache[setting.Key] = setting.Value;
}
}

_logger.LogInformation("SettingsService initialized with {Count} settings", _cache.Count);
}
catch (Exception ex)
{
_logger.LogError(ex, "Error initializing SettingsService cache");
throw;
}
}

/// <summary>
/// Gets a setting value by key with automatic type conversion.
/// </summary>
public Task<T> GetSettingAsync<T>(string key, T defaultValue)
{
lock (_lock)
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
}

return Task.FromResult(defaultValue);
}

/// <summary>
/// Sets or updates a setting value.
/// </summary>
public async Task SetSettingAsync(string key, string value)
{
try
{
var settings = await _repository.FindAsync(s => s.Key == key);
var setting = settings.FirstOrDefault();

if (setting != null)
{
setting.Value = value;
setting.UpdatedAt = DateTime.UtcNow;
await _repository.UpdateAsync(setting);
}
else
{
var newSetting = new SystemSetting
{
Key = key,
Value = value,
Description = key,
CreatedAt = DateTime.UtcNow,
UpdatedAt = DateTime.UtcNow
};
await _repository.AddAsync(newSetting);
}

// Update cache
lock (_lock)
{
_cache[key] = value;
}

_logger.LogInformation("Setting {Key} updated to {Value}", key, value);
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
lock (_lock)
{
return Task.FromResult(new Dictionary<string, string>(_cache));
}
}

/// <summary>
/// Refreshes the cache from the database.
/// </summary>
public async Task RefreshCacheAsync()
{
var allSettings = await _repository.GetAllAsync();

lock (_lock)
{
_cache.Clear();
foreach (var setting in allSettings)
{
if (!_cache.ContainsKey(setting.Key))
_cache[setting.Key] = setting.Value;
}
}

_logger.LogInformation("Settings cache refreshed with {Count} settings", _cache.Count);
}
}
