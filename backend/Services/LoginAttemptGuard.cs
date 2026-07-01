using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

/// <summary>
/// Kiểm soát brute-force login — Hybrid: MemoryCache (L1) + SQL Server (L2).
/// 
/// Scoped: inject trực tiếp AppDbContext, không cần ScopeFactory workaround.
/// Read:  Cache → miss → DB → set cache (đảm bảo không miss sau restart).
/// Write: SemaphoreSlim + await DB (không fire-and-forget, đảm bảo persist khi crash).
/// BaseCount: restore từ DB khi cache miss sau restart.
/// </summary>
public class LoginAttemptGuard
{
    private readonly IMemoryCache _cache;
    private readonly AppDbContext _context;
    private readonly ILogger<LoginAttemptGuard> _logger;

    // Static lock — share toàn bộ instances trong process (single-instance app)
    private static readonly SemaphoreSlim _writeLock = new(1, 1);

    private const int MaxAttempts = 50;
    private static readonly TimeSpan TrackingWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(5);

    private static string LockoutCacheKey(string id) => $"lockout:{id}";
    private static string AttemptsCacheKey(string id) => $"attempts:{id}";

    public LoginAttemptGuard(
        IMemoryCache cache,
        AppDbContext context,
        ILogger<LoginAttemptGuard> logger)
    {
        _cache = cache;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Kiểm tra IP:Username có đang bị khóa không.
    /// Cache hit → trả ngay (O(1)).
    /// Cache miss → query DB → set cache với TTL còn lại → trả kết quả.
    /// Giải quyết race condition khi server vừa restart xong.
    /// </summary>
    public async Task<bool> IsLockedOutAsync(string identifier)
    {
        // L1: Cache hit — O(1)
        if (_cache.TryGetValue(LockoutCacheKey(identifier), out _))
            return true;

        // L2: DB fallback sau restart
        var record = await _context.LoginLockouts
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Identifier == identifier);

        if (record?.LockoutEnd is not null && record.LockoutEnd > DateTime.UtcNow)
        {
            // Restore vào cache với TTL còn lại
            var remaining = record.LockoutEnd.Value - DateTime.UtcNow;
            _cache.Set(LockoutCacheKey(identifier), true, remaining);
            return true;
        }

        return false;
    }

    /// <summary>
    /// Loại bỏ ký tự xuống dòng để tránh log forging khi ghi dữ liệu từ user input.
    /// </summary>
    private static string SanitizeForLog(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Replace("\r", string.Empty).Replace("\n", string.Empty);
    }

    /// <summary>
    /// Ghi nhận lần đăng nhập sai.
    /// SemaphoreSlim đảm bảo atomic increment (single-instance).
    /// BaseCount restore từ DB khi cache miss (không mất lịch sử sau restart).
    /// await DB save — không fire-and-forget.
    /// </summary>
    public async Task RecordFailedAttemptAsync(string identifier)
    {
        await _writeLock.WaitAsync();
        try
        {
            // Restore baseCount từ cache hoặc DB
            int baseCount;
            if (_cache.TryGetValue(AttemptsCacheKey(identifier), out int cached))
            {
                baseCount = cached;
            }
            else
            {
                var record = await _context.LoginLockouts
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Identifier == identifier);
                baseCount = record?.FailedAttempts ?? 0;
            }

            var count = baseCount + 1;
            _cache.Set(AttemptsCacheKey(identifier), count, TrackingWindow);

            DateTime? lockoutEnd = null;
            if (count >= MaxAttempts)
            {
                lockoutEnd = DateTime.UtcNow.Add(LockoutDuration);
                _cache.Set(LockoutCacheKey(identifier), true, LockoutDuration);
                _cache.Remove(AttemptsCacheKey(identifier));
                var safeIdentifier = SanitizeForLog(identifier);
                _logger.LogWarning(
                    "Brute-force lockout: {Identifier} bị khóa đến {LockoutEnd}",
                    safeIdentifier, lockoutEnd);

                // Ghi audit trail
                _context.NhatKyKiemToans.Add(new NhatKyKiemToan
                {
                    HanhDong = "LOGIN_LOCKOUT",
                    MoTaChiTiet = $"[SECURITY] Brute-force lockout: {safeIdentifier} locked until {lockoutEnd:u}",
                    DiaChiIP = identifier.Split(':')[0],
                    ThoiGianThucHien = BusinessClock.VietnamNow
                });
            }

            // await DB UPSERT — không fire-and-forget
            var existing = await _context.LoginLockouts
                .FirstOrDefaultAsync(x => x.Identifier == identifier);

            if (existing is null)
            {
                _context.LoginLockouts.Add(new LoginLockout
                {
                    Identifier = identifier,
                    FailedAttempts = count,
                    LockoutEnd = lockoutEnd,
                    LastFailedAttempt = DateTime.UtcNow
                });
            }
            else
            {
                existing.FailedAttempts = count;
                existing.LockoutEnd = lockoutEnd;
                existing.LastFailedAttempt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
        finally
        {
            _writeLock.Release();
        }
    }

    /// <summary>
    /// Xóa counter sau khi đăng nhập thành công.
    /// await DB — không fire-and-forget.
    /// </summary>
    public async Task ResetAttemptsAsync(string identifier)
    {
        _cache.Remove(AttemptsCacheKey(identifier));
        _cache.Remove(LockoutCacheKey(identifier));

        var existing = await _context.LoginLockouts
            .FirstOrDefaultAsync(x => x.Identifier == identifier);
        if (existing is not null)
        {
            _context.LoginLockouts.Remove(existing);
            await _context.SaveChangesAsync();
        }
    }
}
