namespace QLQTDT.Api.Services;

using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

public class LockoutCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LockoutCleanupService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    public LockoutCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<LockoutCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);
            await CleanupAsync(stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-1);

            // Fix: chỉ xóa khi lockout hết hạn HOẶC tracking cũ quá lâu
            // KHÔNG xóa LockoutEnd==null mà LastFailedAttempt còn mới
            var deleted = await context.LoginLockouts
                .Where(x =>
                    (x.LockoutEnd != null && x.LockoutEnd < cutoff)
                    ||
                    (x.LockoutEnd == null && x.LastFailedAttempt < cutoff))
                .ExecuteDeleteAsync(ct);

            if (deleted > 0)
                _logger.LogInformation(
                    "LockoutCleanup: Đã xóa {Count} bản ghi hết hạn", deleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LockoutCleanup: Lỗi khi dọn dẹp bảng LoginLockout");
        }
    }
}
