using Microsoft.Extensions.Caching.Memory;

namespace QLQTDT.Api.Services;

/// <summary>
/// Kiểm soát brute-force login: 5 lần sai trong 10 phút → khóa 15 phút
/// </summary>
public class LoginAttemptGuard
{
    private readonly IMemoryCache _cache;
    private const int MaxAttempts = 5;
    private static readonly TimeSpan TrackingWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public LoginAttemptGuard(IMemoryCache cache)
    {
        _cache = cache;
    }

    private static string GetLockoutKey(string identifier) => $"lockout:{identifier}";
    private static string GetAttemptsKey(string identifier) => $"attempts:{identifier}";

    public bool IsLockedOut(string identifier)
    {
        return _cache.TryGetValue(GetLockoutKey(identifier), out _);
    }

    public void RecordFailedAttempt(string identifier)
    {
        var key = GetAttemptsKey(identifier);
        var count = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TrackingWindow;
            return 0;
        });

        count++;
        _cache.Set(key, count, TrackingWindow);

        if (count >= MaxAttempts)
        {
            _cache.Set(GetLockoutKey(identifier), true, LockoutDuration);
            _cache.Remove(key);
        }
    }

    public void ResetAttempts(string identifier)
    {
        _cache.Remove(GetAttemptsKey(identifier));
    }
}
