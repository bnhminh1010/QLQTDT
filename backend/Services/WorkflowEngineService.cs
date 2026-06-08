using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;
using System.Security.Claims;

namespace QLQTDT.Api.Services;

public class WorkflowEngineService : IWorkflowEngineService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<WorkflowEngineService> _logger;

    public WorkflowEngineService(
        AppDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ILogger<WorkflowEngineService> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<WorkflowInstanceDto> StartWorkflowAsync(int goiThauId, StartWorkflowRequest request)
    {
        var currentUserId = GetCurrentUserId();

        // 1. Validate GoiThau
        var goiThau = await _db.GoiThaus.FindAsync(goiThauId);
        if (goiThau is null || !goiThau.TrangThaiHoatDong)
            throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId}");

        if (goiThau.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException(
                $"Goi thau phai o trang thai DU_THAO. Trang thai hien tai: {goiThau.TrangThai}");

        // 2. Validate Workflow template
        var workflow = await _db.Workflows.FindAsync(request.WorkflowId);
        if (workflow is null)
            throw new NotFoundException($"Khong tim thay workflow template voi Id = {request.WorkflowId}");

        // 3. Validate workflow has steps
        var steps = await _db.BuocWorkflows
            .Where(b => b.WorkflowId == request.WorkflowId)
            .OrderBy(b => b.Id)
            .ToListAsync();

        if (steps.Count == 0)
            throw new BadRequestException("Workflow chua co buoc xu ly nao.");

        // 4. Check no active instance exists (early guard, rechecked under lock)
        var hasActive = await _db.WorkflowInstances
            .AnyAsync(i => i.GoiThauId == goiThauId && i.TrangThai == WorkflowTrangThai.ACTIVE);
        if (hasActive)
            throw new ConflictException("Goi thau da co workflow instance dang hoat dong.");

        // 5. Begin transaction
        await using var txn = await _db.Database.BeginTransactionAsync();

        try
        {
            // 6. UPDLOCK re-read of GoiThau under exclusive row lock
            var lockedGoiThau = await _db.GoiThaus
                .FromSqlRaw("SELECT * FROM GoiThau WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", goiThauId)
                .FirstOrDefaultAsync();

            if (lockedGoiThau is null)
                throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId}");
            if (lockedGoiThau.TrangThai != GoiThauTrangThai.DU_THAO)
                throw new ConflictException("Goi thau da duoc xu ly boi tien trinh khac.");

            // 7. Resolve first step
            var firstStep = steps[0];

            // 8. Create WorkflowInstance
            var instance = new WorkflowInstance
            {
                GoiThauId = goiThauId,
                WorkflowId = request.WorkflowId,
                BuocHienTaiId = firstStep.Id,
                TrangThai = WorkflowTrangThai.ACTIVE,
                NgayBatDau = DateTime.UtcNow
            };
            _db.WorkflowInstances.Add(instance);
            await _db.SaveChangesAsync();

            // 9. Create WorkflowStepInstance for first step
            var stepInstance = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = firstStep.Id,
                TrangThai = WorkflowStepTrangThai.PENDING,
                NgayBatDau = DateTime.UtcNow
            };
            _db.WorkflowStepInstances.Add(stepInstance);
            await _db.SaveChangesAsync();

            // 10. Resolve who gets assigned to this step
            var assigneeId = await ResolveAssigneeAsync(firstStep, currentUserId);

            // 11. Create WorkflowAssignment
            var assignment = new WorkflowAssignment
            {
                WorkflowStepInstanceId = stepInstance.Id,
                NguoiDuocGiaoId = assigneeId,
                NgayGiao = DateTime.UtcNow
            };
            _db.WorkflowAssignments.Add(assignment);

            // 12. Create WorkflowActionHistory
            var actionHistory = new WorkflowActionHistory
            {
                WorkflowInstanceId = instance.Id,
                WorkflowStepInstanceId = stepInstance.Id,
                HanhDong = "START",
                GhiChu = $"Khoi tao workflow cho goi thau {lockedGoiThau.MaGoiThau}",
                NguoiThucHienId = currentUserId,
                ThoiGian = DateTime.UtcNow
            };
            _db.WorkflowActionHistories.Add(actionHistory);

            // 13. Create explicit audit log
            _db.NhatKyKiemToans.Add(new NhatKyKiemToan
            {
                GoiThauId = goiThauId,
                HanhDong = "START_WORKFLOW",
                MoTaChiTiet = $"Khoi tao workflow '{workflow.TenWorkflow}' cho goi thau '{lockedGoiThau.MaGoiThau}'. " +
                              $"Buoc dau tien: '{firstStep.TenBuoc}'",
                NguoiThucHienId = currentUserId,
                ThoiGianThucHien = DateTime.UtcNow
            });

            // 14. Update GoiThau state
            lockedGoiThau.TrangThai = GoiThauTrangThai.DANG_XU_LY;
            lockedGoiThau.WorkflowId = request.WorkflowId;
            lockedGoiThau.NgayCapNhat = DateTime.UtcNow;

            // 15. Save all changes and commit
            await _db.SaveChangesAsync();
            await txn.CommitAsync();

            _logger.LogInformation(
                "Started workflow: instanceId={InstanceId}, goiThauId={GoiThauId}, workflowId={WorkflowId}, stepId={StepId}",
                instance.Id, goiThauId, request.WorkflowId, firstStep.Id);

            // 16. Build response
            return new WorkflowInstanceDto
            {
                Id = instance.Id,
                GoiThauId = goiThauId,
                TrangThai = instance.TrangThai,
                BuocHienTaiId = instance.BuocHienTaiId,
                TenBuocHienTai = firstStep.TenBuoc,
                NgayBatDau = instance.NgayBatDau,
                Steps =
                [
                    new WorkflowStepInstanceDto
                    {
                        Id = stepInstance.Id,
                        BuocWorkflowId = stepInstance.BuocWorkflowId,
                        TenBuoc = firstStep.TenBuoc,
                        TrangThai = stepInstance.TrangThai,
                        NgayBatDau = stepInstance.NgayBatDau,
                        Assignments =
                        [
                            new WorkflowAssignmentDto
                            {
                                Id = assignment.Id,
                                NguoiDuocGiaoId = assignment.NguoiDuocGiaoId,
                                DaXuLy = assignment.DaXuLy
                            }
                        ]
                    }
                ]
            };
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User
            ?.FindFirst(ClaimTypes.NameIdentifier);

        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Khong the xac dinh nguoi dung hien tai.");

        return id;
    }

    private async Task<int> ResolveAssigneeAsync(BuocWorkflow step, int fallbackUserId)
    {
        if (step.VaiTroXuLyId.HasValue)
        {
            var userIds = await _db.NguoiDungKhoaPhongVaiTros
                .Where(nkv =>
                    nkv.VaiTroId == step.VaiTroXuLyId.Value &&
                    nkv.NguoiDung.TrangThaiHoatDong &&
                    !nkv.NguoiDung.DaXoa)
                .Select(nkv => nkv.NguoiDungId)
                .Distinct()
                .ToListAsync();

            if (userIds.Count > 0)
            {
                // Prefer the current user if they already have the required role
                if (userIds.Contains(fallbackUserId))
                    return fallbackUserId;

                return userIds[0];
            }
        }

        // Fallback: assign to current user who started the workflow
        return fallbackUserId;
    }
}
