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

    public async Task<ProcessStepResponse> ProcessStepAsync(int goiThauId, ProcessStepRequest request)
    {
        var currentUserId = GetCurrentUserId();

        // ─── 1. Validate GoiThau ───────────────────────────────────────────
        var goiThau = await _db.GoiThaus.FindAsync(goiThauId);
        if (goiThau is null || !goiThau.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {goiThauId}");

        if (goiThau.TrangThai != GoiThauTrangThai.DANG_XU_LY)
            throw new ConflictException(
                $"Gói thầu phải ở trạng thái DANG_XU_LY. Trạng thái hiện tại: {goiThau.TrangThai}");

        // ─── 2. Find active WorkflowInstance ──────────────────────────────
        var instance = await _db.WorkflowInstances
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId && i.TrangThai == WorkflowTrangThai.ACTIVE);
        if (instance is null)
            throw new ConflictException("Không tìm thấy workflow instance đang hoạt động cho gói thầu này.");

        if (instance.BuocHienTaiId is null)
            throw new BadRequestException("Workflow instance không có bước hiện tại.");

        // ─── 3. Find current WorkflowStepInstance ─────────────────────────
        var currentStep = await _db.WorkflowStepInstances
            .Include(s => s.BuocWorkflow)
            .Include(s => s.WorkflowAssignments)
            .FirstOrDefaultAsync(s =>
                s.WorkflowInstanceId == instance.Id &&
                s.BuocWorkflowId == instance.BuocHienTaiId &&
                s.TrangThai == WorkflowStepTrangThai.PENDING);
        if (currentStep is null)
            throw new ConflictException("Bước hiện tại không ở trạng thái DANG_XU_LY hoặc không tồn tại.");

        // ─── 4. RowVersion concurrency check ──────────────────────────────
        if (request.RowVersion is null ||
            !request.RowVersion.SequenceEqual(currentStep.RowVersion ?? []))
            throw new ConflictException(
                "Bước đã được xử lý bởi người khác. Vui lòng tải lại trang.");

        // ─── 5. Permission check: user must be assignee ───────────────────
        var isAssignee = currentStep.WorkflowAssignments
            .Any(a => a.NguoiDuocGiaoId == currentUserId && !a.DaXuLy);
        if (!isAssignee)
            throw new ForbiddenException("Bạn không được phân công xử lý bước này.");

        // ─── 6. BEGIN transaction + UPDLOCK ───────────────────────────────
        await using var txn = await _db.Database.BeginTransactionAsync();

        try
        {
            // Re-read WorkflowInstance under exclusive row lock
            var lockedInstance = await _db.WorkflowInstances
                .FromSqlRaw("SELECT * FROM WorkflowInstance WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", instance.Id)
                .FirstOrDefaultAsync();

            if (lockedInstance is null || lockedInstance.TrangThai != WorkflowTrangThai.ACTIVE)
                throw new ConflictException("Workflow instance đã được xử lý bởi tiến trình khác.");

            // Re-check step state
            var lockedStep = await _db.WorkflowStepInstances
                .FirstOrDefaultAsync(s => s.Id == currentStep.Id && s.TrangThai == WorkflowStepTrangThai.PENDING);
            if (lockedStep is null)
                throw new ConflictException("Bước đã được xử lý bởi tiến trình khác.");

            // Re-validate RowVersion against freshly locked data
            if (!request.RowVersion.SequenceEqual(lockedStep.RowVersion ?? []))
                throw new ConflictException(
                    "Bước đã được xử lý bởi người khác. Vui lòng tải lại trang.");

            // ─── 7. Route to action handler ───────────────────────────────
            ProcessStepResponse response = request.HanhDong switch
            {
                WorkflowHanhDong.APPROVE or WorkflowHanhDong.DUYET => await HandleApproveAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong),
                WorkflowHanhDong.REJECT or WorkflowHanhDong.KHONG_DUYET => await HandleRejectAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong),
                WorkflowHanhDong.ROLLBACK or WorkflowHanhDong.TRA_VE => await HandleRollbackAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong),
                WorkflowHanhDong.SKIP => await HandleSkipAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu),
                WorkflowHanhDong.REASSIGN => await HandleReassignAsync(
                    lockedInstance, lockedStep, currentUserId, request.NguoiDuocGiaoId!.Value, request.GhiChu),
                _ => throw new BadRequestException($"Hành động '{request.HanhDong}' không được hỗ trợ.")
            };

            goiThau.NgayCapNhat = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await txn.CommitAsync();

            _logger.LogInformation(
                "ProcessStep: goiThauId={GoiThauId}, instanceId={InstanceId}, action={Action}, stepId={StepId}, userId={UserId}",
                goiThauId, lockedInstance.Id, request.HanhDong, lockedStep.Id, currentUserId);

            return response;
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    // ════════════════════════════════════════════════════════════════════
    //  APPROVE/DUYET — Duyệt bước hiện tại, chuyển step kế hoặc complete
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleApproveAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.APPROVE)
    {
        // Validate transition exists — lookup by (TuBuocId, HanhDong) for conditional routing
        var transition = await _db.ChuyenTiepWorkflows
            .Include(t => t.DenBuoc)
            .FirstOrDefaultAsync(t =>
                t.TuBuocId == currentStep.BuocWorkflowId &&
                t.HanhDong == hanhDong);

        // Mark current step as HOAN_TAT
        currentStep.TrangThai = WorkflowStepTrangThai.HOAN_TAT;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        // Mark assignment as done
        var assignment = currentStep.WorkflowAssignments
            .FirstOrDefault(a => !a.DaXuLy);
        if (assignment is not null)
        {
            assignment.DaXuLy = true;
            assignment.NgayXuLy = DateTime.UtcNow;
        }

        bool isCompleted;
        long? newStepId = null;
        string? newStepName = null;

        if (transition?.DenBuoc is null)
        {
            // ── No next step → complete workflow ──
            instance.TrangThai = WorkflowTrangThai.COMPLETED;
            instance.NgayHoanThanh = DateTime.UtcNow;
            instance.BuocHienTaiId = null;
            goiThau.TrangThai = GoiThauTrangThai.HOAN_THANH;
            isCompleted = true;
        }
        else
        {
            // ── Move to next step ──
            var nextStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = transition.DenBuocId,
                TrangThai = WorkflowStepTrangThai.PENDING,
                NgayBatDau = DateTime.UtcNow
            };
            _db.WorkflowStepInstances.Add(nextStep);
            await _db.SaveChangesAsync();

            // Resolve assignee for next step
            var assigneeId = await ResolveAssigneeAsync(transition.DenBuoc, currentUserId);
            _db.WorkflowAssignments.Add(new WorkflowAssignment
            {
                WorkflowStepInstanceId = nextStep.Id,
                NguoiDuocGiaoId = assigneeId,
                NgayGiao = DateTime.UtcNow
            });

            instance.BuocHienTaiId = transition.DenBuocId;
            newStepId = nextStep.Id;
            newStepName = transition.DenBuoc.TenBuoc;
            isCompleted = false;
        }

        // Audit
        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Duyệt bước '{currentStep.BuocWorkflow?.TenBuoc}'", currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: duyệt bước '{currentStep.BuocWorkflow?.TenBuoc}'");

        // Capture new step's RowVersion for optimistic concurrency on next action
        var nextStepRv = newStepId.HasValue
            ? (await _db.WorkflowStepInstances
                .Where(s => s.Id == newStepId.Value)
                .Select(s => s.RowVersion)
                .FirstOrDefaultAsync())
            : null;

        return BuildResponse(currentStep, null, instance, goiThau, hanhDong,
            isCompleted, newStepId, newStepName, nextStepRv);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REJECT/KHONG_DUYET — Từ chối, kết thúc workflow, đưa GoiThau về DU_THAO
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRejectAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.REJECT)
    {
        var buoc = currentStep.BuocWorkflow;
        if (buoc is not null && !buoc.ChoPhepTuChoi)
            throw new BadRequestException($"Bước '{buoc.TenBuoc}' không cho phép từ chối.");

        // Mark current step as TRA_VE
        currentStep.TrangThai = WorkflowStepTrangThai.TRA_VE;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        // Mark assignment
        var assignment = currentStep.WorkflowAssignments
            .FirstOrDefault(a => !a.DaXuLy);
        if (assignment is not null)
        {
            assignment.DaXuLy = true;
            assignment.NgayXuLy = DateTime.UtcNow;
        }

        // End workflow
        instance.TrangThai = WorkflowTrangThai.REJECTED;
        instance.NgayHoanThanh = DateTime.UtcNow;
        instance.BuocHienTaiId = null;

        // Return GoiThau to draft
        goiThau.TrangThai = GoiThauTrangThai.DU_THAO;
        goiThau.WorkflowId = null;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Từ chối tại bước '{currentStep.BuocWorkflow?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ chối tại bước '{currentStep.BuocWorkflow?.TenBuoc}'");

        return BuildResponse(currentStep, null, instance, goiThau, hanhDong, true);
    }

    // ════════════════════════════════════════════════════════════════════
    //  ROLLBACK/TRA_VE — Quay lại bước trước
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRollbackAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.ROLLBACK)
    {
        // Find ROLLBACK/TRA_VE transition pointing TO this step's BuocWorkflow
        var rollbackTransition = await _db.ChuyenTiepWorkflows
            .Include(t => t.TuBuoc)
            .FirstOrDefaultAsync(t =>
                t.DenBuocId == currentStep.BuocWorkflowId &&
                (t.HanhDong == WorkflowHanhDong.ROLLBACK || t.HanhDong == WorkflowHanhDong.TRA_VE));

        if (rollbackTransition?.TuBuoc is null)
            throw new BadRequestException("Không thể rollback — không có luồng ROLLBACK cho bước này.");

        // Mark current step as TRA_VE
        currentStep.TrangThai = WorkflowStepTrangThai.TRA_VE;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        var assignment = currentStep.WorkflowAssignments
            .FirstOrDefault(a => !a.DaXuLy);
        if (assignment is not null)
        {
            assignment.DaXuLy = true;
            assignment.NgayXuLy = DateTime.UtcNow;
        }

        // Create new PENDING step for the "TuBuoc" (the step we roll back to)
        var previousStep = new WorkflowStepInstance
        {
            WorkflowInstanceId = instance.Id,
            BuocWorkflowId = rollbackTransition.TuBuoc.Id,
            TrangThai = WorkflowStepTrangThai.PENDING,
            NgayBatDau = DateTime.UtcNow
        };
        _db.WorkflowStepInstances.Add(previousStep);
        await _db.SaveChangesAsync();

        var assigneeId = await ResolveAssigneeAsync(rollbackTransition.TuBuoc, currentUserId);
        _db.WorkflowAssignments.Add(new WorkflowAssignment
        {
            WorkflowStepInstanceId = previousStep.Id,
            NguoiDuocGiaoId = assigneeId,
            NgayGiao = DateTime.UtcNow
        });

        instance.BuocHienTaiId = rollbackTransition.TuBuoc.Id;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Rollback từ bước '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'");

        return BuildResponse(currentStep, rollbackTransition.TuBuoc, instance, goiThau,
            hanhDong, false, previousStep.Id, rollbackTransition.TuBuoc.TenBuoc);
    }

    // ════════════════════════════════════════════════════════════════════
    //  SKIP — Bỏ qua bước hiện tại
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleSkipAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu)
    {
        var buoc = currentStep.BuocWorkflow;
        if (buoc is not null && !buoc.ChoPhepBoQua)
            throw new BadRequestException($"Bước '{buoc.TenBuoc}' không cho phép bỏ qua.");

        currentStep.TrangThai = WorkflowStepTrangThai.SKIPPED;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        var assignment = currentStep.WorkflowAssignments
            .FirstOrDefault(a => !a.DaXuLy);
        if (assignment is not null)
        {
            assignment.DaXuLy = true;
            assignment.NgayXuLy = DateTime.UtcNow;
        }

        // Find next step: try SKIP transition first, fallback to APPROVE
        var transition = await _db.ChuyenTiepWorkflows
            .Include(t => t.DenBuoc)
            .FirstOrDefaultAsync(t =>
                t.TuBuocId == currentStep.BuocWorkflowId &&
                t.HanhDong == WorkflowHanhDong.SKIP)
            ?? await _db.ChuyenTiepWorkflows
                .Include(t => t.DenBuoc)
                .FirstOrDefaultAsync(t =>
                    t.TuBuocId == currentStep.BuocWorkflowId &&
                    t.HanhDong == WorkflowHanhDong.APPROVE);

        bool isCompleted;
        long? newStepId = null;
        string? newStepName = null;

        if (transition?.DenBuoc is null)
        {
            instance.TrangThai = WorkflowTrangThai.COMPLETED;
            instance.NgayHoanThanh = DateTime.UtcNow;
            instance.BuocHienTaiId = null;
            goiThau.TrangThai = GoiThauTrangThai.HOAN_THANH;
            isCompleted = true;
        }
        else
        {
            var nextStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = transition.DenBuocId,
                TrangThai = WorkflowStepTrangThai.PENDING,
                NgayBatDau = DateTime.UtcNow
            };
            _db.WorkflowStepInstances.Add(nextStep);
            await _db.SaveChangesAsync();

            var assigneeId = await ResolveAssigneeAsync(transition.DenBuoc, currentUserId);
            _db.WorkflowAssignments.Add(new WorkflowAssignment
            {
                WorkflowStepInstanceId = nextStep.Id,
                NguoiDuocGiaoId = assigneeId,
                NgayGiao = DateTime.UtcNow
            });

            instance.BuocHienTaiId = transition.DenBuocId;
            newStepId = nextStep.Id;
            newStepName = transition.DenBuoc.TenBuoc;
            isCompleted = false;
        }

        AddAuditEntries(instance.Id, currentStep.Id, WorkflowHanhDong.SKIP,
            ghiChu ?? $"Bỏ qua bước '{currentStep.BuocWorkflow?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"SKIP_STEP: bỏ qua bước '{currentStep.BuocWorkflow?.TenBuoc}'");

        return BuildResponse(currentStep, null, instance, goiThau, WorkflowHanhDong.SKIP,
            isCompleted, newStepId, newStepName);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REASSIGN — Gán lại người xử lý
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleReassignAsync(
        WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, int nguoiDuocGiaoId, string? ghiChu)
    {
        // Validate target user exists
        var targetUser = await _db.NguoiDungs.FindAsync(nguoiDuocGiaoId);
        if (targetUser is null || targetUser.DaXoa || !targetUser.TrangThaiHoatDong)
            throw new BadRequestException($"Người dùng Id = {nguoiDuocGiaoId} không tồn tại hoặc không hoạt động.");

        // Validate target user has required role for this step
        var buoc = currentStep.BuocWorkflow;
        if (buoc?.VaiTroXuLyId is not null)
        {
            var hasRole = await _db.NguoiDungKhoaPhongVaiTros
                .AnyAsync(nkv => nkv.NguoiDungId == nguoiDuocGiaoId && nkv.VaiTroId == buoc.VaiTroXuLyId);
            if (!hasRole)
                throw new BadRequestException(
                    $"Người dùng Id = {nguoiDuocGiaoId} không có vai trò phù hợp để xử lý bước này.");
        }

        // Mark existing active assignments as done (revoke)
        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = DateTime.UtcNow;
        }

        // Create new assignment for the target user
        _db.WorkflowAssignments.Add(new WorkflowAssignment
        {
            WorkflowStepInstanceId = currentStep.Id,
            NguoiDuocGiaoId = nguoiDuocGiaoId,
            NgayGiao = DateTime.UtcNow
        });

        AddAuditEntries(instance.Id, currentStep.Id, WorkflowHanhDong.REASSIGN,
            ghiChu ?? $"Chuyển giao cho người dùng Id = {nguoiDuocGiaoId}",
            currentUserId, instance.GoiThauId,
            $"REASSIGN_STEP: chuyển giao bước cho người dùng Id = {nguoiDuocGiaoId}");

        return new ProcessStepResponse
        {
            CurrentStepId = currentStep.Id,
            TenBuocHienTai = currentStep.BuocWorkflow?.TenBuoc,
            WorkflowTrangThai = instance.TrangThai,
            HanhDong = WorkflowHanhDong.REASSIGN,
            Message = $"Đã chuyển giao bước '{currentStep.BuocWorkflow?.TenBuoc}' cho người dùng Id = {nguoiDuocGiaoId}.",
            NewRowVersion = currentStep.RowVersion
        };
    }

    // ════════════════════════════════════════════════════════════════════
    //  Helpers
    // ════════════════════════════════════════════════════════════════════

    private void AddAuditEntries(
        long instanceId, long? stepInstanceId, string hanhDong,
        string ghiChu, int nguoiThucHienId, int goiThauId, string moTaChiTiet)
    {
        _db.WorkflowActionHistories.Add(new WorkflowActionHistory
        {
            WorkflowInstanceId = instanceId,
            WorkflowStepInstanceId = stepInstanceId,
            HanhDong = hanhDong,
            GhiChu = ghiChu,
            NguoiThucHienId = nguoiThucHienId,
            ThoiGian = DateTime.UtcNow
        });

        _db.NhatKyKiemToans.Add(new NhatKyKiemToan
        {
            GoiThauId = goiThauId,
            HanhDong = hanhDong,
            MoTaChiTiet = moTaChiTiet,
            NguoiThucHienId = nguoiThucHienId,
            ThoiGianThucHien = DateTime.UtcNow
        });
    }

    private static ProcessStepResponse BuildResponse(
        WorkflowStepInstance currentStep, BuocWorkflow? rollbackTarget,
        WorkflowInstance instance, GoiThau goiThau,
        string hanhDong, bool isCompleted,
        long? newStepId = null, string? newStepName = null,
        byte[]? nextStepRowVersion = null)
    {
        var message = isCompleted
            ? hanhDong switch
            {
                WorkflowHanhDong.APPROVE => "Đã duyệt bước cuối cùng. Workflow hoàn thành.",
                WorkflowHanhDong.REJECT => "Đã từ chối. Workflow kết thúc.",
                WorkflowHanhDong.SKIP => "Đã bỏ qua bước cuối cùng. Workflow hoàn thành.",
                _ => $"Hành động '{hanhDong}' hoàn tất."
            }
            : hanhDong switch
            {
                WorkflowHanhDong.APPROVE => $"Đã duyệt bước '{currentStep.BuocWorkflow?.TenBuoc}'.",
                WorkflowHanhDong.SKIP => $"Đã bỏ qua bước '{currentStep.BuocWorkflow?.TenBuoc}'.",
                WorkflowHanhDong.ROLLBACK => $"Đã rollback về bước '{rollbackTarget?.TenBuoc ?? newStepName}'.",
                _ => $"Hành động '{hanhDong}' hoàn tất."
            };

        // RowVersion: return new step's RV for continued actions, null for terminal states
        var rowVersion = isCompleted ? null : (nextStepRowVersion ?? currentStep.RowVersion);

        return new ProcessStepResponse
        {
            CurrentStepId = currentStep.Id,
            TenBuocHienTai = currentStep.BuocWorkflow?.TenBuoc,
            NewStepId = newStepId,
            TenBuocMoi = newStepName,
            WorkflowTrangThai = instance.TrangThai,
            GoiThauTrangThai = goiThau.TrangThai,
            HanhDong = hanhDong,
            Message = message,
            NewRowVersion = rowVersion
        };
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

        // 2. Auto-suggest mode (WorkflowRule chưa implement)
        if (request.AutoSuggest)
            throw new BadRequestException(
                "Tính năng tự động đề xuất workflow chưa được hỗ trợ. Vui lòng chọn workflow thủ công.");

        // 3. Validate Workflow template
        var workflow = await _db.Workflows.FindAsync(request.WorkflowId!.Value);
        if (workflow is null)
            throw new NotFoundException($"Khong tim thay workflow template voi Id = {request.WorkflowId}");

        // 3. Validate workflow has steps
        var steps = await _db.BuocWorkflows
            .Where(b => b.WorkflowId == request.WorkflowId!.Value)
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
                WorkflowId = request.WorkflowId!.Value,
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
            lockedGoiThau.WorkflowId = request.WorkflowId!.Value;
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
