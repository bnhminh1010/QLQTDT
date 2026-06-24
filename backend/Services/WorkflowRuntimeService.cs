using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class WorkflowRuntimeService : IWorkflowRuntimeService
{
    private readonly AppDbContext _db;

    public WorkflowRuntimeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PendingTaskDto>> GetPendingTasksAsync(int userId)
    {
        var now = DateTime.UtcNow;

        var tasks = await _db.WorkflowAssignments
            .Where(wa => wa.NguoiDuocGiaoId == userId && !wa.DaXuLy)
            .Include(wa => wa.WorkflowStepInstance)
                .ThenInclude(wsi => wsi.BuocWorkflow)
            .Include(wa => wa.WorkflowStepInstance)
                .ThenInclude(wsi => wsi.WorkflowInstance)
                    .ThenInclude(wi => wi.GoiThau)
            .Where(wa => wa.WorkflowStepInstance != null
                && (wa.WorkflowStepInstance.TrangThai == WorkflowStepTrangThai.PENDING
                    || wa.WorkflowStepInstance.TrangThai == WorkflowStepTrangThai.DANG_XU_LY)
                && wa.WorkflowStepInstance.WorkflowInstance != null
                && wa.WorkflowStepInstance.WorkflowInstance.TrangThai == WorkflowTrangThai.ACTIVE
                && wa.WorkflowStepInstance.WorkflowInstance.GoiThau != null)
            .ToListAsync();

        return tasks.Select(wa =>
        {
            var step = wa.WorkflowStepInstance!;
            var instance = step.WorkflowInstance!;
            var goiThau = instance.GoiThau!;
            var buoc = step.BuocWorkflow!;
            var hanXuLy = step.NgayBatDau.AddDays(buoc.SoNgaySLA);
            return new PendingTaskDto
            {
                StepInstanceId = step.Id,
                WorkflowInstanceId = instance.Id,
                GoiThauId = goiThau.Id,
                MaGoiThau = goiThau.MaGoiThau,
                TenGoiThau = goiThau.TenGoiThau,
                TenBuoc = buoc.TenBuoc,
                NgayGiao = wa.NgayGiao,
                HanXuLy = hanXuLy,
                QuaHan = hanXuLy < now
            };
        }).ToList();
    }

    public async Task<List<OverdueTaskDto>> GetOverdueTasksAsync()
    {
        var now = DateTime.UtcNow;

        var overdueSteps = await _db.WorkflowStepInstances
            .Include(wsi => wsi.BuocWorkflow)
            .Include(wsi => wsi.WorkflowInstance)
                .ThenInclude(wi => wi.GoiThau)
            .Where(wsi => (wsi.TrangThai == WorkflowStepTrangThai.PENDING
                         || wsi.TrangThai == WorkflowStepTrangThai.DANG_XU_LY)
                && wsi.WorkflowInstance != null
                && wsi.WorkflowInstance.TrangThai == WorkflowTrangThai.ACTIVE
                && wsi.WorkflowInstance.GoiThau != null)
            .ToListAsync();

        return overdueSteps
            .Where(wsi =>
            {
                var hanXuLy = wsi.NgayBatDau.AddDays(wsi.BuocWorkflow?.SoNgaySLA ?? 0);
                return hanXuLy < now;
            })
            .Select(wsi =>
            {
                var hanXuLy = wsi.NgayBatDau.AddDays(wsi.BuocWorkflow?.SoNgaySLA ?? 0);
                return new OverdueTaskDto
                {
                    WorkflowInstanceId = wsi.WorkflowInstanceId,
                    StepInstanceId = wsi.Id,
                    MaGoiThau = wsi.WorkflowInstance!.GoiThau!.MaGoiThau,
                    TenBuoc = wsi.BuocWorkflow?.TenBuoc ?? "",
                    NguoiXuLyId = wsi.NguoiXuLyId,
                    HanXuLy = hanXuLy,
                    SoNgayQuaHan = (int)(now - hanXuLy).TotalDays
                };
            })
            .ToList();
    }

    public async Task<WorkflowInstanceDetailDto> GetInstanceAsync(long instanceId)
    {
        var instance = await _db.WorkflowInstances
            .Include(wi => wi.GoiThau)
            .Include(wi => wi.Workflow)
            .Include(wi => wi.BuocHienTai)
            .Include(wi => wi.WorkflowActionHistories)
                .ThenInclude(ah => ah.WorkflowStepInstance)
                    .ThenInclude(wsi => wsi!.NguoiXuLy)
            .FirstOrDefaultAsync(wi => wi.Id == instanceId)
            ?? throw new NotFoundException($"Không tìm thấy workflow instance với Id = {instanceId}");

        return new WorkflowInstanceDetailDto
        {
            Id = instance.Id,
            GoiThauId = instance.GoiThauId,
            MaGoiThau = instance.GoiThau?.MaGoiThau ?? "",
            TenGoiThau = instance.GoiThau?.TenGoiThau ?? "",
            TenWorkflow = instance.Workflow?.TenWorkflow ?? "",
            TrangThai = instance.TrangThai,
            BuocHienTaiId = instance.BuocHienTaiId,
            TenBuocHienTai = instance.BuocHienTai?.TenBuoc,
            NgayBatDau = instance.NgayBatDau,
            NgayHoanThanh = instance.NgayHoanThanh,
            LichSuHanhDong = instance.WorkflowActionHistories
                .OrderByDescending(ah => ah.ThoiGian)
                .Select(ah => new WorkflowActionHistoryDto
                {
                    Id = ah.Id,
                    HanhDong = ah.HanhDong,
                    NguoiThucHienId = ah.NguoiThucHienId,
                    TenNguoiThucHien = ah.WorkflowStepInstance?.NguoiXuLy?.HoTen,
                    GhiChu = ah.GhiChu,
                    ThoiGian = ah.ThoiGian
                })
                .ToList()
        };
    }

    public async Task<List<WorkflowStepInstanceDetailDto>> GetInstanceStepsAsync(long instanceId)
    {
        var instanceExists = await _db.WorkflowInstances.AnyAsync(wi => wi.Id == instanceId);
        if (!instanceExists)
            throw new NotFoundException($"Không tìm thấy workflow instance với Id = {instanceId}");

        var steps = await _db.WorkflowStepInstances
            .Include(wsi => wsi.BuocWorkflow)
            .Include(wsi => wsi.NguoiXuLy)
            .Include(wsi => wsi.WorkflowAssignments)
            .Where(wsi => wsi.WorkflowInstanceId == instanceId)
            .OrderBy(wsi => wsi.NgayBatDau)
            .ToListAsync();

        return steps.Select((wsi, index) => new WorkflowStepInstanceDetailDto
        {
            Id = wsi.Id,
            BuocWorkflowId = wsi.BuocWorkflowId,
            TenBuoc = wsi.BuocWorkflow?.TenBuoc ?? "",
            SoThuTu = index + 1,
            TrangThai = wsi.TrangThai,
            NguoiXuLyId = wsi.NguoiXuLyId,
            TenNguoiXuLy = wsi.NguoiXuLy?.HoTen,
            NgayBatDau = wsi.NgayBatDau,
            NgayHoanThanh = wsi.NgayHoanThanh,
            Assignments = wsi.WorkflowAssignments.Select(a => new WorkflowAssignmentDto
            {
                Id = a.Id,
                NguoiDuocGiaoId = a.NguoiDuocGiaoId,
                DaXuLy = a.DaXuLy
            }).ToList()
        }).ToList();
    }
}
