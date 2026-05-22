namespace Media8.Application.Interfaces;

/// <summary>
/// Service for managing system-wide settings with in-memory caching.
/// Provides fast access to configuration values without database queries on every request.
/// </summary>
public interface ISettingsService
{
/// <summary>
/// Gets a setting value by key, with automatic caching.
/// </summary>
Task<T> GetSettingAsync<T>(string key, T defaultValue);

/// <summary>
/// Sets or updates a setting value, updating both database and cache.
/// </summary>
Task SetSettingAsync(string key, string value);

/// <summary>
/// Gets all settings as a dictionary.
/// </summary>
Task<Dictionary<string, string>> GetAllSettingsAsync();

/// <summary>
/// Refreshes the in-memory cache from the database.
/// </summary>
Task RefreshCacheAsync();

/// <summary>
/// Initializes the cache by loading all settings from the database.
/// </summary>
Task InitializeAsync();
}
