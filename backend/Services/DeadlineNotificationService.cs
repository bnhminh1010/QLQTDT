using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class DeadlineNotificationService : BackgroundService
{
    private static readonly string[] ActiveStepStatuses =
    [
        WorkflowStepTrangThai.DANG_XU_LY,
        WorkflowStepTrangThai.CHO_DUYET,
        WorkflowStepTrangThai.CHO_LAP_HO_SO,
        WorkflowStepTrangThai.CHO_KY_DUYET
    ];

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeadlineNotificationService> _logger;

    public DeadlineNotificationService(
        IServiceScopeFactory scopeFactory,
        ILogger<DeadlineNotificationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ScanAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ScanAsync(stoppingToken);
    }

    private async Task ScanAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var thongBaoService = scope.ServiceProvider.GetRequiredService<IThongBaoService>();
            var now = DateTime.UtcNow;
            var dueSoonTo = now.AddHours(24);

            var candidates = await db.WorkflowStepInstances
                .Where(s =>
                    s.HanXuLy != null &&
                    ActiveStepStatuses.Contains(s.TrangThai) &&
                    s.WorkflowInstance != null &&
                    s.WorkflowInstance.TrangThai == WorkflowTrangThai.ACTIVE)
                .Select(s => new
                {
                    s.Id,
                    s.HanXuLy
                })
                .ToListAsync(cancellationToken);

            foreach (var step in candidates)
            {
                if (step.HanXuLy <= now)
                    await thongBaoService.NotifyStepDeadlineAsync(step.Id, overdue: true);
                else if (step.HanXuLy <= dueSoonTo)
                    await thongBaoService.NotifyStepDeadlineAsync(step.Id, overdue: false);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Normal shutdown.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to scan workflow step deadlines for notifications.");
        }
    }
}
