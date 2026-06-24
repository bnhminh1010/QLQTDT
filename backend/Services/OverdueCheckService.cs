using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class OverdueCheckService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OverdueCheckService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    public OverdueCheckService(IServiceScopeFactory scopeFactory, ILogger<OverdueCheckService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OverdueCheckService started. Interval: {Interval} phút", Interval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);
            await CheckOverdueAsync(stoppingToken);
        }
    }

    private async Task CheckOverdueAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;

            // Lay admin ID de ghi audit (fallback ve 0 neu khong tim thay, FK se nem loi ro rang)
            var systemUserId = await db.NguoiDungs
                .Where(u => u.TenDangNhap == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync(ct);

            var overdueSteps = await db.WorkflowStepInstances
                .Include(wsi => wsi.BuocWorkflow)
                .Include(wsi => wsi.WorkflowInstance)
                    .ThenInclude(wi => wi.GoiThau)
                .Where(wsi => (wsi.TrangThai == WorkflowStepTrangThai.PENDING
                             || wsi.TrangThai == WorkflowStepTrangThai.DANG_XU_LY)
                    && wsi.WorkflowInstance != null
                    && wsi.WorkflowInstance.TrangThai == WorkflowTrangThai.ACTIVE)
                .ToListAsync(ct);

            var count = 0;
            foreach (var step in overdueSteps)
            {
                var hanXuLy = step.NgayBatDau.AddDays(step.BuocWorkflow?.SoNgaySLA ?? 0);
                if (hanXuLy >= now) continue;

                count++;

                // Ghi audit log
                db.NhatKyKiemToans.Add(new NhatKyKiemToan
                {
                    GoiThauId = step.WorkflowInstance!.GoiThauId,
                    HanhDong = "WORKFLOW_OVERDUE",
                    MoTaChiTiet = $"Buoc '{step.BuocWorkflow?.TenBuoc}' cua goi thau '{step.WorkflowInstance.GoiThau?.MaGoiThau}' " +
                                  $"da qua han xu ly (han: {hanXuLy:yyyy-MM-dd HH:mm}). Qua {step.BuocWorkflow?.SoNgaySLA ?? 0} ngay.",
                    NguoiThucHienId = systemUserId, // System
                    ThoiGianThucHien = now
                });

                // Cap nhat GoiThau trang thai qua han
                var goiThau = step.WorkflowInstance.GoiThau;
                if (goiThau != null && goiThau.TrangThai == GoiThauTrangThai.DANG_XU_LY)
                {
                    goiThau.TrangThai = GoiThauTrangThai.QUA_HAN;
                    goiThau.NgayCapNhat = now;
                }

                _logger.LogWarning(
                    "OVERDUE: stepId={StepId}, buoc='{TenBuoc}', goiThau='{MaGoiThau}', hanXuLy={HanXuLy:yyyy-MM-dd HH:mm}, " +
                    "soNgayQuaHan={SoNgayQuaHan}",
                    step.Id, step.BuocWorkflow?.TenBuoc, step.WorkflowInstance.GoiThau?.MaGoiThau,
                    hanXuLy, (now - hanXuLy).TotalDays);
            }

            if (count > 0)
            {
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("OverdueCheckService: da xu ly {Count} buoc qua han.", count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OverdueCheckService: loi khi kiem tra buoc qua han.");
        }
    }
}
