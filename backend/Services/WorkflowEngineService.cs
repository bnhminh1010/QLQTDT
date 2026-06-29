using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
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
    private readonly ITenderAccessService _tenderAccess;
    private readonly IThongBaoService _thongBaoService;

    public WorkflowEngineService(
        AppDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ILogger<WorkflowEngineService> logger,
        ITenderAccessService tenderAccess,
        IThongBaoService thongBaoService)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _tenderAccess = tenderAccess;
        _thongBaoService = thongBaoService;
    }

    public async Task<ProcessStepResponse> ProcessStepAsync(int goiThauId, ProcessStepRequest request)
    {
        var currentUserId = GetCurrentUserId();
        await _tenderAccess.EnsureCanProcessAsync(currentUserId, goiThauId);

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

        // ─── 3. Resolve target step instance ──────────────────────────────
        WorkflowStepInstance currentStep;
        if (request.WorkflowStepInstanceId.HasValue)
        {
            // Explicit step instance ID — use directly (required for multi-step branch context)
            currentStep = await _db.WorkflowStepInstances
                .Include(s => s.BuocWorkflow)
                .Include(s => s.WorkflowAssignments)
                .FirstOrDefaultAsync(s =>
                    s.Id == request.WorkflowStepInstanceId.Value &&
                    s.WorkflowInstanceId == instance.Id &&
                    (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                     s.TrangThai == WorkflowStepTrangThai.CHO_DUYET))
                ?? throw new ConflictException("Không tìm thấy bước xử lý với ID đã cho.");
        }
        else
        {
            // Backward compat: use BuocHienTaiId (single-step / linear workflow)
            if (instance.BuocHienTaiId is null)
                throw new BadRequestException("Workflow instance không có bước hiện tại.");

            // Check if multiple active steps exist (branch context)
            var activeStepCount = await _db.WorkflowStepInstances
                .CountAsync(s =>
                    s.WorkflowInstanceId == instance.Id &&
                    (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                     s.TrangThai == WorkflowStepTrangThai.CHO_DUYET));

            if (activeStepCount > 1)
                throw new BadRequestException(
                    "Có nhiều bước đang xử lý. Vui lòng cung cấp WorkflowStepInstanceId để xác định bước cụ thể.");

            currentStep = (await _db.WorkflowStepInstances
                .Include(s => s.BuocWorkflow)
                .Include(s => s.WorkflowAssignments)
                .FirstOrDefaultAsync(s =>
                    s.WorkflowInstanceId == instance.Id &&
                    s.BuocWorkflowId == instance.BuocHienTaiId &&
                    (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                     s.TrangThai == WorkflowStepTrangThai.CHO_DUYET)))!;
            if (currentStep is null)
                throw new ConflictException("Bước hiện tại không ở trạng thái xử lý hoặc không tồn tại.");
        }

        // ─── 4. RowVersion concurrency check ──────────────────────────────
        if (request.RowVersion is null ||
            !request.RowVersion.SequenceEqual(currentStep.RowVersion ?? []))
            throw new ConflictException(
                "Bước đã được xử lý bởi người khác. Vui lòng tải lại trang.");

        // ─── 5. Permission check ─────────────────────────────────────────
        // Step role/unit metadata is used for visibility, tracking, and
        // notifications. The tender creator remains the person who updates
        // every workflow step for that tender.
        var isTenderCreator = goiThau.NguoiTaoId == currentUserId;
        if (!isTenderCreator)
            throw new ForbiddenException("Chỉ người tạo gói thầu được cập nhật bước xử lý của gói thầu này.");

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
                .FirstOrDefaultAsync(s => s.Id == currentStep.Id &&
                    (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                     s.TrangThai == WorkflowStepTrangThai.CHO_DUYET));
            if (lockedStep is null)
                throw new ConflictException("Bước đã được xử lý bởi tiến trình khác.");

            // Re-validate RowVersion against freshly locked data
            if (!request.RowVersion.SequenceEqual(lockedStep.RowVersion ?? []))
                throw new ConflictException(
                    "Bước đã được xử lý bởi người khác. Vui lòng tải lại trang.");

            // ─── 7. Route to action handler ───────────────────────────────
            if (ShouldPersistApproverText(request.HanhDong))
                ApplyApproverDisplayText(lockedStep, request);

            ProcessStepResponse response = request.HanhDong switch
            {
                WorkflowHanhDong.APPROVE or WorkflowHanhDong.DUYET => await HandleApproveAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong,
                    request, taiLieuDinhKem: request.TaiLieuDinhKem),
                WorkflowHanhDong.REJECT or WorkflowHanhDong.KHONG_DUYET => await HandleRejectAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong,
                    request, taiLieuDinhKem: request.TaiLieuDinhKem),
                WorkflowHanhDong.ROLLBACK or WorkflowHanhDong.TRA_VE => await HandleRollbackAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong, request),
                WorkflowHanhDong.SKIP => await HandleSkipAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request),
                WorkflowHanhDong.REASSIGN => await HandleReassignAsync(
                    lockedInstance, lockedStep, currentUserId, request.NguoiDuocGiaoId!.Value, request.GhiChu, request),
                _ => throw new BadRequestException($"Hành động {request.HanhDong} không được hỗ trợ.")
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
    //  APPROVE/DUYET — 2-pha: LAP_HO_SO → KY_DUYET → next step
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleApproveAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.APPROVE,
        ProcessStepRequest? request = null, string? taiLieuDinhKem = null)
    {
        var buoc = currentStep.BuocWorkflow!;

        // Use client-provided actor/timestamps if present; otherwise derive from JWT and DateTime.UtcNow.

        if (currentStep.PhaHienTai == "LAP_HO_SO")
        {
            // ── Phase 1: mark hồ sơ as done → move to KY_DUYET ──
            currentStep.NguoiXuLyId = currentUserId;
            currentStep.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
            currentStep.GhiChu = ghiChu;

            // Mark LAP_HO_SO assignment as done
            var lapHoSoAssignment = currentStep.WorkflowAssignments
                .FirstOrDefault(a => !a.DaXuLy);
            if (lapHoSoAssignment is not null)
            {
                lapHoSoAssignment.DaXuLy = true;
                lapHoSoAssignment.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
            }

            return await CompleteStepAndAdvanceAsync(
                goiThau, instance, currentStep, buoc, currentUserId, ghiChu, hanhDong, request);
        }
        else // KY_DUYET
        {
            // ── Phase 2: mark this signer's assignment as done ──
            var assignment = currentStep.WorkflowAssignments
                .FirstOrDefault(a => a.NguoiDuocGiaoId == currentUserId && !a.DaXuLy);
            if (assignment is not null)
            {
                assignment.DaXuLy = true;
                assignment.NgayXuLy = DateTime.UtcNow;
            }

            currentStep.NguoiKyDuyetId = request?.NguoiKyDuyetId;
            currentStep.NgayKyDuyet = request?.NgayKyDuyet ?? DateTime.UtcNow;
            currentStep.KetQua = request?.KetQua ?? "DUYET";

            return await CompleteStepAndAdvanceAsync(
                goiThau, instance, currentStep, buoc, currentUserId, ghiChu, hanhDong, request);
        }
    }

    /// <summary>
    /// Hoàn tất step hiện tại (HOAN_TAT), xử lý split/merge/sequential advance.
    /// </summary>
    private async Task<ProcessStepResponse> CompleteStepAndAdvanceAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        BuocWorkflow buoc, int currentUserId, string? ghiChu, string hanhDong,
        ProcessStepRequest? request = null)
    {
        currentStep.TrangThai = WorkflowStepTrangThai.HOAN_TAT;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.NguoiKyDuyetId = currentStep.NguoiKyDuyetId ?? request?.NguoiKyDuyetId;
        currentStep.NgayKyDuyet = currentStep.NgayKyDuyet ?? request?.NgayKyDuyet;
        currentStep.KetQua = currentStep.KetQua ?? request?.KetQua ?? "DUYET";
        currentStep.GhiChu = ghiChu ?? currentStep.GhiChu;
        await _db.SaveChangesAsync();

        // ── Check SPLIT: completed step is BuocTachNhanhId of a parallel group ──
        var splitGroup = await _db.NhomNhanhWorkflows
            .Include(g => g.Nhanhs.OrderBy(n => n.ThuTu))
                .ThenInclude(n => n.BuocDauTien)
            .Include(g => g.Nhanhs.OrderBy(n => n.ThuTu))
                .ThenInclude(n => n.BuocWorkflows)
            .FirstOrDefaultAsync(g =>
                g.WorkflowId == instance.WorkflowId &&
                g.BuocTachNhanhId == currentStep.BuocWorkflowId);

        if (splitGroup?.Nhanhs.Count > 0)
        {
            return await HandleSplitAsync(goiThau, instance, currentStep, buoc,
                currentUserId, ghiChu, hanhDong, splitGroup);
        }

        // ── Check MERGE: this is a branch step (has NhanhWorkflowId) ─────────
        if (buoc.NhanhWorkflowId.HasValue)
        {
            var branch = await _db.NhanhWorkflows
                .Include(n => n.BuocWorkflows)
                .Include(n => n.NhomNhanhWorkflow)
                .FirstOrDefaultAsync(n => n.Id == buoc.NhanhWorkflowId.Value);

            if (branch?.NhomNhanhWorkflow != null)
            {
                var branchAdvanceResult = await TryAdvanceBranchStepAsync(goiThau, instance, currentStep, buoc,
                    currentUserId, ghiChu, hanhDong, branch, request);

                if (branchAdvanceResult != null)
                    return branchAdvanceResult;

                var mergeResult = await TryCompleteMergeAsync(instance, currentStep, buoc,
                    currentUserId, ghiChu, hanhDong, branch.NhomNhanhWorkflow, request);

                if (mergeResult != null)
                    return mergeResult; // merge created or await condition
            }
        }

        // ── Find transition for sequential advance ───────────────────────────
        var transition = await _db.ChuyenTiepWorkflows
            .Include(t => t.DenBuoc)
            .FirstOrDefaultAsync(t =>
                t.TuBuocId == currentStep.BuocWorkflowId &&
                t.HanhDong == hanhDong);

        bool isCompleted;
        long? newStepId = null;
        string? newStepName = null;

        var isConfiguredEndStep = await IsConfiguredEndStepAsync(instance.WorkflowId, currentStep.BuocWorkflowId);
        var nextBuoc = isConfiguredEndStep
            ? null
            : transition?.DenBuoc ?? await ResolveSequentialNextBuocAsync(instance.WorkflowId, buoc);

        if (nextBuoc is null)
        {
            // ── No next step → complete workflow ──
            var oldStatus = goiThau.TrangThai;
            instance.TrangThai = WorkflowTrangThai.COMPLETED;
            instance.NgayHoanThanh = DateTime.UtcNow;
            instance.BuocHienTaiId = null;
            goiThau.TrangThai = GoiThauTrangThai.HOAN_THANH;
            AddStatusHistory(goiThau.Id, oldStatus, goiThau.TrangThai, currentUserId);
            await _thongBaoService.NotifyGoiThauHoanThanhAsync(goiThau);
            isCompleted = true;
        }
        else
        {
            // ── Sequential advance: activate existing pending step instance if it was pre-created at workflow start ──
            var nextStep = await _db.WorkflowStepInstances
                .FirstOrDefaultAsync(s =>
                    s.WorkflowInstanceId == instance.Id &&
                    s.BuocWorkflowId == nextBuoc.Id &&
                    (s.TrangThai == "PENDING" || s.TrangThai == "CHUA_BAT_DAU"));

            if (nextStep is null)
            {
                nextStep = new WorkflowStepInstance
                {
                    WorkflowInstanceId = instance.Id,
                    BuocWorkflowId = nextBuoc.Id,
                    PhaHienTai = "LAP_HO_SO",
                };
                _db.WorkflowStepInstances.Add(nextStep);
            }

            nextStep.TrangThai = WorkflowStepTrangThai.DANG_XU_LY;
            nextStep.PhaHienTai = "LAP_HO_SO";
            nextStep.NgayBatDau = DateTime.UtcNow;
            nextStep.HanXuLy = nextBuoc.SoNgayLapHoSo > 0
                ? DateTime.UtcNow.AddDays(nextBuoc.SoNgayLapHoSo)
                : null;
            await _db.SaveChangesAsync();

            AssignStepToTenderCreator(nextStep.Id, goiThau, currentUserId);

            instance.BuocHienTaiId = nextBuoc.Id;
            newStepId = nextStep.Id;
            newStepName = nextBuoc.TenBuoc;
            isCompleted = false;

            await _db.SaveChangesAsync();
        }

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Hoàn tất bước '{buoc.TenBuoc}'", currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: '{buoc.TenBuoc}' hoàn tất");

        return await BuildResponse2Phase(currentStep, instance, goiThau, hanhDong,
            isCompleted, newStepId, newStepName, null, null, null, request: request);
    }

    /// <summary>
    /// Handle SPLIT: create one WorkflowStepInstance per branch in the parallel group.
    /// </summary>
    private async Task<ProcessStepResponse> HandleSplitAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        BuocWorkflow buoc, int currentUserId, string? ghiChu, string hanhDong,
        NhomNhanhWorkflow splitGroup, ProcessStepRequest? request = null)
    {
        _logger.LogInformation("Split: workflow={WfId}, group={GroupId}, branches={Count}",
            instance.WorkflowId, splitGroup.Id, splitGroup.Nhanhs.Count);

        var createdSteps = new List<WorkflowStepInstance>();

        foreach (var branch in splitGroup.Nhanhs)
        {
            // Get all steps in this branch (ordered by ThuTu)
            var branchSteps = (branch.BuocWorkflows ?? []).OrderBy(b => b.ThuTu).ToList();
            if (branchSteps.Count == 0 && branch.BuocDauTien != null)
                branchSteps = [branch.BuocDauTien];

            var firstBranchStep = branch.BuocDauTienId > 0
                ? branchSteps.FirstOrDefault(step => step.Id == branch.BuocDauTienId) ?? branchSteps.FirstOrDefault()
                : branchSteps.FirstOrDefault();

            if (firstBranchStep is null)
                continue;

            var branchStep = await _db.WorkflowStepInstances
                .FirstOrDefaultAsync(s =>
                    s.WorkflowInstanceId == instance.Id &&
                    s.BuocWorkflowId == firstBranchStep.Id &&
                    (s.TrangThai == "PENDING" || s.TrangThai == "CHUA_BAT_DAU"));

            if (branchStep is null)
            {
                branchStep = new WorkflowStepInstance
                {
                    WorkflowInstanceId = instance.Id,
                    BuocWorkflowId = firstBranchStep.Id,
                };
                _db.WorkflowStepInstances.Add(branchStep);
            }

            branchStep.TrangThai = WorkflowStepTrangThai.DANG_XU_LY;
            branchStep.PhaHienTai = "LAP_HO_SO";
            branchStep.NgayBatDau = DateTime.UtcNow;
            branchStep.HanXuLy = branch.ThoiHanNgay > 0
                ? DateTime.UtcNow.AddDays((double)branch.ThoiHanNgay)
                : firstBranchStep.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(firstBranchStep.SoNgayLapHoSo)
                    : null;
            await _db.SaveChangesAsync();

            AssignStepToTenderCreator(branchStep.Id, goiThau, currentUserId);

            createdSteps.Add(branchStep);

            AddAuditEntries(instance.Id, branchStep.Id, hanhDong,
                $"Tạo nhánh '{branch.TenNhanh}' sau bước '{buoc.TenBuoc}', mở bước '{firstBranchStep.TenBuoc}'",
                currentUserId, goiThau.Id,
                $"SPLIT: '{buoc.TenBuoc}' → '{branch.TenNhanh}' / '{firstBranchStep.TenBuoc}'");
        }

        await _db.SaveChangesAsync();

        // Multiple current steps — clear single-step pointer
        instance.BuocHienTaiId = null;

        var branchNames = string.Join(", ", splitGroup.Nhanhs.Select(n => n.TenNhanh));

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Hoàn tất bước '{buoc.TenBuoc}', tách {splitGroup.Nhanhs.Count} nhánh: {branchNames}",
            currentUserId, goiThau.Id,
            $"{hanhDong}_SPLIT: '{buoc.TenBuoc}' → {splitGroup.Nhanhs.Count} nhánh");

        return await BuildResponse2Phase(currentStep, instance, goiThau, hanhDong, false,
            createdSteps.Count > 0 ? createdSteps[0].Id : null,
            $"{splitGroup.Nhanhs.Count} nhánh: {branchNames}",
            null, splitGroup: splitGroup, createdStepIds: createdSteps.Select(s => s.Id).ToList(), request: request);
    }

    private async Task<ProcessStepResponse?> TryAdvanceBranchStepAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        BuocWorkflow buoc, int currentUserId, string? ghiChu, string hanhDong,
        NhanhWorkflow branch, ProcessStepRequest? request = null)
    {
        var branchSteps = (branch.BuocWorkflows ?? [])
            .OrderBy(step => step.ThuTu)
            .ThenBy(step => step.Id)
            .ToList();

        var currentIndex = branchSteps.FindIndex(step => step.Id == buoc.Id);
        if (currentIndex < 0 || currentIndex + 1 >= branchSteps.Count)
            return null;

        var nextBuoc = branchSteps[currentIndex + 1];
        var nextStep = await _db.WorkflowStepInstances
            .FirstOrDefaultAsync(s =>
                s.WorkflowInstanceId == instance.Id &&
                s.BuocWorkflowId == nextBuoc.Id &&
                (s.TrangThai == "PENDING" || s.TrangThai == "CHUA_BAT_DAU"));

        if (nextStep is null)
        {
            nextStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = nextBuoc.Id,
            };
            _db.WorkflowStepInstances.Add(nextStep);
        }

        nextStep.TrangThai = WorkflowStepTrangThai.DANG_XU_LY;
        nextStep.PhaHienTai = "LAP_HO_SO";
        nextStep.NgayBatDau = DateTime.UtcNow;
        nextStep.HanXuLy = branch.ThoiHanNgay > 0
            ? DateTime.UtcNow.AddDays((double)branch.ThoiHanNgay)
            : nextBuoc.SoNgayLapHoSo > 0
                ? DateTime.UtcNow.AddDays(nextBuoc.SoNgayLapHoSo)
                : null;
        await _db.SaveChangesAsync();

        AssignStepToTenderCreator(nextStep.Id, goiThau, currentUserId);

        instance.BuocHienTaiId = null;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Hoàn tất bước '{buoc.TenBuoc}', chuyển sang bước '{nextBuoc.TenBuoc}' trong nhánh '{branch.TenNhanh}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_BRANCH_ADVANCE: '{buoc.TenBuoc}' → '{nextBuoc.TenBuoc}'");

        await _db.SaveChangesAsync();

        return await BuildResponse2Phase(currentStep, instance, goiThau, hanhDong,
            false, nextStep.Id, nextBuoc.TenBuoc, nextStep.RowVersion, request: request);
    }

    /// <summary>
    /// Check merge condition for a completed branch step.
    /// Returns a ProcessStepResponse indicating merge created or awaiting other branches.
    /// </summary>
    private async Task<ProcessStepResponse?> TryCompleteMergeAsync(
        WorkflowInstance instance, WorkflowStepInstance currentStep,
        BuocWorkflow buoc, int currentUserId, string? ghiChu, string hanhDong,
        NhomNhanhWorkflow group, ProcessStepRequest? request = null)
    {
        var fullGroup = await _db.NhomNhanhWorkflows
            .AsNoTracking()
            .Include(g => g.Nhanhs)
            .FirstOrDefaultAsync(g => g.Id == group.Id)
            ?? throw new ConflictException("Parallel group was removed.");

        var branchIds = fullGroup.Nhanhs.Select(n => n.Id).ToList();
        var branchCount = branchIds.Count;
        if (branchCount == 0)
            throw new ConflictException("Parallel group has no branches.");

        var goiThau = await _db.GoiThaus.AsNoTracking().FirstOrDefaultAsync(g => g.Id == instance.GoiThauId);

        // All step instances for this workflow — filter by branch membership
        var allBranchStepInstances = await _db.WorkflowStepInstances
            .AsNoTracking()
            .Where(s => s.WorkflowInstanceId == instance.Id)
            .Include(s => s.BuocWorkflow)
            .ToListAsync();

        var relevantSteps = allBranchStepInstances
            .Where(s => s.BuocWorkflow != null && branchIds.Contains(s.BuocWorkflow.NhanhWorkflowId ?? 0))
            .GroupBy(s => s.BuocWorkflowId)
            .Select(group => group
                .OrderByDescending(s => s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY || s.TrangThai == WorkflowStepTrangThai.CHO_DUYET)
                .ThenByDescending(s => s.TrangThai == WorkflowStepTrangThai.HOAN_TAT || s.TrangThai == WorkflowStepTrangThai.SKIPPED)
                .ThenByDescending(s => s.Id)
                .First())
            .ToList();

        // Mark current as complete (already done by caller)
        // Check merge condition
        bool mergeConditionMet;

        // Count branches only when every step in that branch is completed.
        // SKIPPED only satisfies the explicit SKIP_ALL merge condition.
        var completedBranchIds = relevantSteps
            .Where(s => s.BuocWorkflow?.NhanhWorkflowId.HasValue == true)
            .GroupBy(s => s.BuocWorkflow!.NhanhWorkflowId!.Value)
            .Where(group => group.All(s =>
                s.TrangThai == WorkflowStepTrangThai.HOAN_TAT))
            .Count();

        var terminalBranchIds = relevantSteps
            .Where(s => s.BuocWorkflow?.NhanhWorkflowId.HasValue == true)
            .GroupBy(s => s.BuocWorkflow!.NhanhWorkflowId!.Value)
            .Where(group => group.All(s =>
                s.TrangThai == WorkflowStepTrangThai.HOAN_TAT ||
                s.TrangThai == WorkflowStepTrangThai.SKIPPED))
            .Count();

        switch (group.DieuKienHopNhat)
        {
            case "ALL":
                mergeConditionMet = completedBranchIds >= branchCount;
                break;
            case "ANY":
                mergeConditionMet = completedBranchIds >= 1;
                break;
            case "COUNT":
                mergeConditionMet = group.SoNhanhHopNhatToiThieu.HasValue &&
                                    completedBranchIds >= group.SoNhanhHopNhatToiThieu.Value;
                break;
            case "SKIP_ALL":
                // Nếu tất cả nhánh đều đã kết thúc (dù là SKIPPED), merge vẫn chạy
                mergeConditionMet = terminalBranchIds >= branchCount;
                break;
            default:
                mergeConditionMet = completedBranchIds >= branchCount;
                break;
        }

        var auditMergeMsg = $"chờ merge ({completedBranchIds}/{branchCount})";

        if (!mergeConditionMet)
        {
            // Branch complete but merge not yet ready
            AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
                ghiChu ?? $"Hoàn tất nhánh (chờ merge: {group.DieuKienHopNhat})",
                currentUserId, instance.GoiThauId,
                $"{hanhDong}_BRANCH_DONE: '{buoc.TenBuoc}' — {auditMergeMsg}");

            {
                var resp = await BuildResponse2Phase(currentStep, instance, goiThau!, hanhDong,
                    false, null, null, currentStep.RowVersion, request: request);
                resp.IsAwaitingMerge = true;
                resp.Message = $"Hoàn tất bước '{buoc.TenBuoc}'. Đang chờ các nhánh còn lại hoàn tất ({completedBranchIds}/{branchCount}).";
                resp.NewRowVersion = currentStep.RowVersion;
                resp.TinhTrangTienDo = "DUNG_TIEN_DO";
                resp.SoNhanhHoanThanh = completedBranchIds;
                resp.TongSoNhanh = branchCount;
                return resp;
            }
        }

        // ── Merge condition met — create merge step exactly once (idempotent) ──
        // Use UPDLOCK to prevent race: re-read group within transaction
        var lockedGroup = await _db.NhomNhanhWorkflows
            .FromSqlRaw("SELECT * FROM NhomNhanhWorkflow WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", group.Id)
            .FirstOrDefaultAsync();

        if (lockedGroup is null)
            throw new ConflictException("Parallel group was removed.");

        var mergeStepAlreadyExists = await _db.WorkflowStepInstances.AnyAsync(s =>
            s.WorkflowInstanceId == instance.Id &&
            s.BuocWorkflowId == group.BuocSauHopNhatId &&
            (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
             s.TrangThai == WorkflowStepTrangThai.CHO_DUYET ||
             s.TrangThai == WorkflowStepTrangThai.HOAN_TAT));

        if (mergeStepAlreadyExists)
        {
            _logger.LogWarning("Merge step already exists for group {GroupId}, skipping duplicate creation", group.Id);
            {
                var resp = await BuildResponse2Phase(currentStep, instance, goiThau!, hanhDong,
                    false, null, null, currentStep.RowVersion, request: request);
                resp.Message = "Nhánh đã hoàn tất. Bước merge đã được tạo trước đó.";
                resp.NewRowVersion = currentStep.RowVersion;
                resp.TinhTrangTienDo = "DUNG_TIEN_DO";
                return resp;
            }
        }

        var mergeBuoc = await _db.BuocWorkflows.FindAsync(group.BuocSauHopNhatId);

        var mergeStep = await _db.WorkflowStepInstances
            .FirstOrDefaultAsync(s =>
                s.WorkflowInstanceId == instance.Id &&
                s.BuocWorkflowId == group.BuocSauHopNhatId &&
                (s.TrangThai == "PENDING" || s.TrangThai == "CHUA_BAT_DAU"));

        if (mergeStep is null)
        {
            mergeStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = group.BuocSauHopNhatId,
            };
            _db.WorkflowStepInstances.Add(mergeStep);
        }

        mergeStep.TrangThai = WorkflowStepTrangThai.DANG_XU_LY;
        mergeStep.PhaHienTai = "LAP_HO_SO";
        mergeStep.NgayBatDau = DateTime.UtcNow;
        mergeStep.HanXuLy = mergeBuoc?.SoNgayLapHoSo > 0
            ? DateTime.UtcNow.AddDays(mergeBuoc.SoNgayLapHoSo)
            : null;
        await _db.SaveChangesAsync();

        AssignStepToTenderCreator(mergeStep.Id, goiThau, currentUserId);

        // Cancel remaining active steps in other branches
        var remainingActiveSteps = await _db.WorkflowStepInstances
            .Where(s => s.WorkflowInstanceId == instance.Id)
            .Where(s => s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY || s.TrangThai == WorkflowStepTrangThai.CHO_DUYET)
            .Where(s => s.BuocWorkflow != null && branchIds.Contains(s.BuocWorkflow.NhanhWorkflowId ?? 0))
            .ToListAsync();

        foreach (var activeStep in remainingActiveSteps)
        {
            activeStep.TrangThai = WorkflowStepTrangThai.SKIPPED;
            activeStep.NgayHoanThanh = DateTime.UtcNow;
            activeStep.GhiChu = "Bước này không cần xử lý do nhánh khác đã hoàn tất điều kiện hợp nhất.";
        }

        instance.BuocHienTaiId = group.BuocSauHopNhatId;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Hợp nhánh thành công ({group.DieuKienHopNhat})",
            currentUserId, instance.GoiThauId,
            $"{hanhDong}_MERGE: nhóm '{group.TenNhom}' merge → bước id={group.BuocSauHopNhatId}");

        await _db.SaveChangesAsync();

        return await BuildResponse2Phase(currentStep, instance, null!, hanhDong, false,
            mergeStep.Id, mergeBuoc?.TenBuoc, mergeStep.RowVersion,
            isMerge: true, request: request);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REJECT/KHONG_DUYET — Từ chối (cả 2 pha)
    //  Branch-aware: uses HuongXuLyKhongDuyet from transition config.
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRejectAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.REJECT,
        ProcessStepRequest? request = null, string? taiLieuDinhKem = null)
    {
        var buoc = currentStep.BuocWorkflow;

        // Mark current step
        currentStep.TrangThai = WorkflowStepTrangThai.TRA_VE;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.KetQua = "KHONG_DUYET";
        currentStep.LyDoKhongDuyet = ghiChu;
        currentStep.GhiChu = ghiChu;
        if (taiLieuDinhKem != null) currentStep.TaiLieuDinhKem = taiLieuDinhKem;

        if (currentStep.PhaHienTai == "KY_DUYET")
        {
            currentStep.NguoiKyDuyetId = request?.NguoiKyDuyetId;
            currentStep.NgayKyDuyet = request?.NgayKyDuyet ?? DateTime.UtcNow;
        }
        else
        {
            currentStep.NguoiXuLyId = currentUserId;
            currentStep.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }

        // Mark all pending assignments as done
        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }

        // ── Branch-aware reject: check HuongXuLyKhongDuyet from transition ──
        // Find transition that leads TO this step (DenBuocId), not from it (TuBuocId)
        var rejectTransition = await _db.ChuyenTiepWorkflows
            .Include(t => t.TuBuoc)
            .FirstOrDefaultAsync(t =>
                t.DenBuocId == currentStep.BuocWorkflowId &&
                (t.HanhDong == hanhDong || t.HanhDong == WorkflowHanhDong.DUYET ||
                 t.HanhDong == WorkflowHanhDong.APPROVE || t.HanhDong == WorkflowHanhDong.TRA_VE ||
                 t.HanhDong == WorkflowHanhDong.REJECT || t.HanhDong == WorkflowHanhDong.KHONG_DUYET));

        if (rejectTransition?.HuongXuLyKhongDuyet == "TRA_VE_BUOC_TRUOC" && rejectTransition.TuBuoc != null)
        {
            // Config says rollback instead of end
            var previousStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = rejectTransition.TuBuoc.Id,
                HanXuLy = rejectTransition.TuBuoc.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(rejectTransition.TuBuoc.SoNgayLapHoSo)
                    : null,
                TrangThai = WorkflowStepTrangThai.DANG_XU_LY,
                PhaHienTai = "LAP_HO_SO",
                NgayBatDau = DateTime.UtcNow,
            };
            _db.WorkflowStepInstances.Add(previousStep);
            await _db.SaveChangesAsync();

            AssignStepToTenderCreator(previousStep.Id, goiThau, currentUserId);

            var hasOtherActiveSteps = await _db.WorkflowStepInstances.AnyAsync(s =>
                s.WorkflowInstanceId == instance.Id &&
                s.Id != currentStep.Id &&
                s.Id != previousStep.Id &&
                (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                 s.TrangThai == WorkflowStepTrangThai.CHO_DUYET));
            instance.BuocHienTaiId = hasOtherActiveSteps ? null : rejectTransition.TuBuoc.Id;

            AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
                ghiChu ?? $"Từ chối tại bước '{buoc?.TenBuoc}' — trả về '{rejectTransition.TuBuoc.TenBuoc}'",
                currentUserId, goiThau.Id,
                $"{hanhDong}_ROLLBACK: từ '{buoc?.TenBuoc}' về '{rejectTransition.TuBuoc.TenBuoc}'");

            await _db.SaveChangesAsync();

            return await BuildResponse2Phase(currentStep, instance, goiThau, hanhDong, false,
                previousStep.Id, rejectTransition.TuBuoc.TenBuoc, previousStep.RowVersion, request: request);
        }

        // ── Default: end workflow (conservative for branch context) ──
        instance.TrangThai = WorkflowTrangThai.REJECTED;
        instance.NgayHoanThanh = DateTime.UtcNow;
        instance.BuocHienTaiId = null;

        // Cancel any other active branch step instances
        var activeBranchSteps = await _db.WorkflowStepInstances
            .Where(s => s.WorkflowInstanceId == instance.Id &&
                        s.Id != currentStep.Id &&
                        (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                         s.TrangThai == WorkflowStepTrangThai.CHO_DUYET))
            .ToListAsync();
        foreach (var activeStep in activeBranchSteps)
        {
            activeStep.TrangThai = WorkflowStepTrangThai.TRA_VE;
            activeStep.NgayHoanThanh = DateTime.UtcNow;
            activeStep.KetQua = "KHONG_DUYET";
            activeStep.LyDoKhongDuyet = "Nhánh khác bị từ chối, workflow kết thúc.";
        }

        var oldGoiThauStatus = goiThau.TrangThai;
        goiThau.TrangThai = GoiThauTrangThai.DU_THAO;
        AddStatusHistory(goiThau.Id, oldGoiThauStatus, goiThau.TrangThai, currentUserId);

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Từ chối tại bước '{buoc?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ chối tại bước '{buoc?.TenBuoc}'");

        return await BuildResponse2Phase(currentStep, instance, goiThau, hanhDong, true, request: request);
    }

    // ════════════════════════════════════════════════════════════════════
    //  ROLLBACK/TRA_VE — Quay lại bước trước
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRollbackAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.ROLLBACK,
        ProcessStepRequest? request = null)
    {
        var rollbackTransition = await _db.ChuyenTiepWorkflows
            .Include(t => t.TuBuoc)
            .FirstOrDefaultAsync(t =>
                t.DenBuocId == currentStep.BuocWorkflowId &&
                (t.HanhDong == WorkflowHanhDong.ROLLBACK || t.HanhDong == WorkflowHanhDong.TRA_VE));

        if (rollbackTransition?.TuBuoc is null)
            throw new BadRequestException("Không thể rollback — không có luồng ROLLBACK cho bước này.");

        currentStep.TrangThai = WorkflowStepTrangThai.TRA_VE;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.KetQua = "KHONG_DUYET";
        currentStep.LyDoKhongDuyet = ghiChu;

        if (currentStep.PhaHienTai == "KY_DUYET")
        {
            currentStep.NguoiKyDuyetId = request?.NguoiKyDuyetId;
            currentStep.NgayKyDuyet = request?.NgayKyDuyet ?? DateTime.UtcNow;
        }
        else
        {
            currentStep.NguoiXuLyId = currentUserId;
            currentStep.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }

        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }

        // Create new PENDING step for rollback target
        var previousStep = new WorkflowStepInstance
        {
            WorkflowInstanceId = instance.Id,
            BuocWorkflowId = rollbackTransition.TuBuoc.Id,
            HanXuLy = rollbackTransition.TuBuoc.SoNgayLapHoSo > 0
                ? DateTime.UtcNow.AddDays(rollbackTransition.TuBuoc.SoNgayLapHoSo)
                : null,
            TrangThai = WorkflowStepTrangThai.DANG_XU_LY,
            PhaHienTai = "LAP_HO_SO",
            NgayBatDau = DateTime.UtcNow,
        };
        _db.WorkflowStepInstances.Add(previousStep);
        await _db.SaveChangesAsync();

        AssignStepToTenderCreator(previousStep.Id, goiThau, currentUserId);

        instance.BuocHienTaiId = rollbackTransition.TuBuoc.Id;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Rollback từ bước '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'");

        return await BuildResponse2Phase(currentStep, instance, goiThau,
            hanhDong, false, previousStep.Id, rollbackTransition.TuBuoc.TenBuoc, previousStep.RowVersion, request: request);
    }

    // ════════════════════════════════════════════════════════════════════
    //  SKIP — Bỏ qua bước hiện tại (giai đoạn LAP_HO_SO)
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleSkipAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, ProcessStepRequest? request = null)
    {
        var buoc = currentStep.BuocWorkflow;
        if (buoc is not null && !buoc.ChoPhepBoQua)
            throw new BadRequestException($"Bước '{buoc.TenBuoc}' không cho phép bỏ qua.");

        currentStep.TrangThai = WorkflowStepTrangThai.SKIPPED;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        if (buoc?.NhanhWorkflowId.HasValue == true)
        {
            var branch = await _db.NhanhWorkflows
                .Include(n => n.BuocWorkflows)
                .Include(n => n.NhomNhanhWorkflow)
                .FirstOrDefaultAsync(n => n.Id == buoc.NhanhWorkflowId.Value);

            if (branch?.NhomNhanhWorkflow != null)
            {
                var branchAdvanceResult = await TryAdvanceBranchStepAsync(goiThau, instance, currentStep, buoc,
                    currentUserId, ghiChu, WorkflowHanhDong.SKIP, branch, request);

                if (branchAdvanceResult != null)
                    return branchAdvanceResult;

                var mergeResult = await TryCompleteMergeAsync(instance, currentStep, buoc,
                    currentUserId, ghiChu, WorkflowHanhDong.SKIP, branch.NhomNhanhWorkflow, request);

                if (mergeResult != null)
                    return mergeResult;
            }
        }

        // Find next step
        var transition = await _db.ChuyenTiepWorkflows
            .Include(t => t.DenBuoc)
            .FirstOrDefaultAsync(t =>
                t.TuBuocId == currentStep.BuocWorkflowId &&
                t.HanhDong == WorkflowHanhDong.SKIP)
            ?? await _db.ChuyenTiepWorkflows
                .Include(t => t.DenBuoc)
                .FirstOrDefaultAsync(t =>
                    t.TuBuocId == currentStep.BuocWorkflowId &&
                    (t.HanhDong == WorkflowHanhDong.APPROVE || t.HanhDong == WorkflowHanhDong.DUYET));

        var isConfiguredEndStep = await IsConfiguredEndStepAsync(instance.WorkflowId, currentStep.BuocWorkflowId);
        var nextBuoc = isConfiguredEndStep
            ? null
            : transition?.DenBuoc ?? await ResolveSequentialNextBuocAsync(instance.WorkflowId, buoc!);

        bool isCompleted;
        long? newStepId = null;
        string? newStepName = null;

        if (nextBuoc is null)
        {
            var oldStatus = goiThau.TrangThai;
            instance.TrangThai = WorkflowTrangThai.COMPLETED;
            instance.NgayHoanThanh = DateTime.UtcNow;
            instance.BuocHienTaiId = null;
            goiThau.TrangThai = GoiThauTrangThai.HOAN_THANH;
            AddStatusHistory(goiThau.Id, oldStatus, goiThau.TrangThai, currentUserId);
            await _thongBaoService.NotifyGoiThauHoanThanhAsync(goiThau);
            isCompleted = true;
        }
        else
        {
            var nextStep = await _db.WorkflowStepInstances
                .FirstOrDefaultAsync(s =>
                    s.WorkflowInstanceId == instance.Id &&
                    s.BuocWorkflowId == nextBuoc.Id &&
                    (s.TrangThai == "PENDING" || s.TrangThai == "CHUA_BAT_DAU"));

            if (nextStep is null)
            {
                nextStep = new WorkflowStepInstance
                {
                    WorkflowInstanceId = instance.Id,
                    BuocWorkflowId = nextBuoc.Id,
                    PhaHienTai = "LAP_HO_SO",
                };
                _db.WorkflowStepInstances.Add(nextStep);
            }

            nextStep.TrangThai = WorkflowStepTrangThai.DANG_XU_LY;
            nextStep.PhaHienTai = "LAP_HO_SO";
            nextStep.NgayBatDau = DateTime.UtcNow;
            nextStep.HanXuLy = nextBuoc.SoNgayLapHoSo > 0
                ? DateTime.UtcNow.AddDays(nextBuoc.SoNgayLapHoSo)
                : null;
            await _db.SaveChangesAsync();
            AssignStepToTenderCreator(nextStep.Id, goiThau, currentUserId);

            instance.BuocHienTaiId = nextBuoc.Id;
            newStepId = nextStep.Id;
            newStepName = nextBuoc.TenBuoc;
            isCompleted = false;
        }

        AddAuditEntries(instance.Id, currentStep.Id, WorkflowHanhDong.SKIP,
            ghiChu ?? $"Bỏ qua bước '{buoc?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"SKIP_STEP: bỏ qua bước '{buoc?.TenBuoc}'");

        return await BuildResponse2Phase(currentStep, instance, goiThau, WorkflowHanhDong.SKIP,
            isCompleted, newStepId, newStepName);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REASSIGN — Gán lại người xử lý
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleReassignAsync(
        WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, int nguoiDuocGiaoId, string? ghiChu, ProcessStepRequest? request = null)
    {
        var targetUser = await _db.NguoiDungs.FindAsync(nguoiDuocGiaoId);
        if (targetUser is null || targetUser.DaXoa || !targetUser.TrangThaiHoatDong)
            throw new BadRequestException($"Người dùng Id = {nguoiDuocGiaoId} không tồn tại hoặc không hoạt động.");

        // Validate role based on current phase
        var buoc = currentStep.BuocWorkflow;
        var requiredRoleId = currentStep.PhaHienTai == "KY_DUYET"
            ? buoc?.VaiTroKyDuyetId
            : buoc?.VaiTroXuLyHoSoId;

        if (requiredRoleId.HasValue)
        {
            var hasRole = await _db.NguoiDungKhoaPhongVaiTros
                .AnyAsync(nkv => nkv.NguoiDungId == nguoiDuocGiaoId && nkv.VaiTroId == requiredRoleId.Value);
            if (!hasRole)
                throw new BadRequestException(
                    $"Người dùng Id = {nguoiDuocGiaoId} không có vai trò phù hợp để xử lý bước này.");
        }

        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = request?.NgayXuLy ?? DateTime.UtcNow;
        }

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

        {
            var goiThau = await _db.GoiThaus.FindAsync(instance.GoiThauId);
            var resp = await BuildResponse2Phase(currentStep, instance, goiThau!, WorkflowHanhDong.REASSIGN,
                false, null, null, currentStep.RowVersion, request: request);
            resp.HanhDong = WorkflowHanhDong.REASSIGN;
            resp.Message = $"Đã chuyển giao bước '{buoc?.TenBuoc}' cho người dùng Id = {nguoiDuocGiaoId}.";
            return resp;
        }
    }

    // ════════════════════════════════════════════════════════════════════
    //  Deadline checks
    // ════════════════════════════════════════════════════════════════════

    private async Task<string> CheckDeadlineAsync(BuocWorkflow buoc)
    {
        // Check NhomVaiTro priority for override
        string? tinhTrang = "DUNG_TIEN_DO";

        if (buoc.LoaiHan == "BAT_BUOC" && buoc.VaiTroXuLyHoSoId.HasValue)
        {
            var nhom = await _db.VaiTros
                .Where(v => v.Id == buoc.VaiTroXuLyHoSoId.Value)
                .Select(v => v.NhomVaiTro)
                .FirstOrDefaultAsync();

            if (nhom is not null && nhom.DoUuTien <= 2)
            {
                // Role thuộc nhóm cấp cao → tự động CANH_BAO
                buoc.LoaiHan = "CANH_BAO";
                tinhTrang = "SAP_QUA_HAN";
            }
        }

        return tinhTrang;
    }

    // ════════════════════════════════════════════════════════════════════
    //  Start workflow
    // ════════════════════════════════════════════════════════════════════

    public async Task<WorkflowInstanceDto> StartWorkflowAsync(int goiThauId, StartWorkflowRequest request)
    {
        var currentUserId = GetCurrentUserId();
        await _tenderAccess.EnsureCanProcessAsync(currentUserId, goiThauId);

        var goiThau = await _db.GoiThaus.FindAsync(goiThauId);
        if (goiThau is null || !goiThau.TrangThaiHoatDong)
            throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId}");

        if (goiThau.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException(
                $"Goi thau phai o trang thai DU_THAO. Trang thai hien tai: {goiThau.TrangThai}");

        if (request.AutoSuggest)
            throw new BadRequestException(
                "Tính năng tự động đề xuất workflow chưa được hỗ trợ. Vui lòng chọn workflow thủ công.");

        var workflow = await _db.Workflows
            .Include(w => w.HinhThuc)
            .FirstOrDefaultAsync(w => w.Id == request.WorkflowId!.Value);
        if (workflow is null)
            throw new NotFoundException($"Khong tim thay workflow template voi Id = {request.WorkflowId}");

        if (goiThau.HinhThucId.HasValue)
        {
            var goiThauHinhThuc = await _db.HinhThucDauThaus
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.Id == goiThau.HinhThucId.Value);

            if (goiThauHinhThuc is not null &&
                !HinhThucDauThauCompatibility.AreCompatible(goiThauHinhThuc, workflow.HinhThuc))
            {
                throw new BadRequestException("Workflow không phù hợp với hình thức đấu thầu của gói thầu.");
            }
        }

        var steps = await _db.BuocWorkflows
            .AsNoTracking()
            .Where(b => b.WorkflowId == request.WorkflowId!.Value)
            .OrderBy(b => b.ThuTu)
            .ThenBy(b => b.Id)
            .ToListAsync();

        if (steps.Count == 0)
            throw new BadRequestException("Workflow chua co buoc xu ly nao.");

        var hasActive = await _db.WorkflowInstances
            .AnyAsync(i => i.GoiThauId == goiThauId && i.TrangThai == WorkflowTrangThai.ACTIVE);
        if (hasActive)
            throw new ConflictException("Goi thau da co workflow instance dang hoat dong.");

        if (!workflow.TrangThaiHoatDong)
            throw new BadRequestException("Workflow da bi vo hieu hoa. Khong the khoi dong.");

        await using var txn = await _db.Database.BeginTransactionAsync();

        try
        {
            var lockedGoiThau = await _db.GoiThaus
                .FromSqlRaw("SELECT * FROM GoiThau WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", goiThauId)
                .FirstOrDefaultAsync();

            if (lockedGoiThau is null)
                throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId}");
            if (lockedGoiThau.TrangThai != GoiThauTrangThai.DU_THAO)
                throw new ConflictException("Goi thau da duoc xu ly boi tien trinh khac.");

            var firstStep = workflow.BuocBatDauId.HasValue
                ? steps.FirstOrDefault(step => step.Id == workflow.BuocBatDauId.Value) ?? steps[0]
                : steps[0];

            var instance = new WorkflowInstance
            {
                GoiThauId = goiThauId,
                WorkflowId = request.WorkflowId!.Value,
                BuocHienTaiId = firstStep.Id,
                TrangThai = WorkflowTrangThai.ACTIVE,
                NgayBatDau = DateTime.UtcNow,
            };
            _db.WorkflowInstances.Add(instance);
            await _db.SaveChangesAsync();

            var stepInstances = steps.Select(step => new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = step.Id,
                TrangThai = step.Id == firstStep.Id ? WorkflowStepTrangThai.DANG_XU_LY : "PENDING",
                PhaHienTai = "LAP_HO_SO",
                NgayBatDau = step.Id == firstStep.Id ? DateTime.UtcNow : default,
                HanXuLy = step.Id == firstStep.Id && step.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(step.SoNgayLapHoSo)
                    : null,
            }).ToList();
            _db.WorkflowStepInstances.AddRange(stepInstances);
            await _db.SaveChangesAsync();

            var stepInstance = stepInstances.First(step => step.BuocWorkflowId == firstStep.Id);

            AssignStepToTenderCreator(stepInstance.Id, lockedGoiThau, currentUserId);

            var actionHistory = new WorkflowActionHistory
            {
                WorkflowInstanceId = instance.Id,
                WorkflowStepInstanceId = stepInstance.Id,
                HanhDong = "START",
                GhiChu = $"Khoi tao workflow '{workflow.TenWorkflow}' cho goi thau {lockedGoiThau.MaGoiThau}",
                NguoiThucHienId = currentUserId,
                ThoiGian = DateTime.UtcNow
            };
            _db.WorkflowActionHistories.Add(actionHistory);

            _db.NhatKyKiemToans.Add(new NhatKyKiemToan
            {
                GoiThauId = goiThauId,
                HanhDong = "START_WORKFLOW",
                MoTaChiTiet = $"Khoi tao workflow '{workflow.TenWorkflow}' cho goi thau '{lockedGoiThau.MaGoiThau}'. " +
                              $"Buoc dau tien: '{firstStep.TenBuoc}'",
                NguoiThucHienId = currentUserId,
                ThoiGianThucHien = DateTime.UtcNow
            });

            var oldStatus = lockedGoiThau.TrangThai;
            lockedGoiThau.TrangThai = GoiThauTrangThai.DANG_XU_LY;
            lockedGoiThau.HinhThucId = workflow.HinhThucId;
            lockedGoiThau.WorkflowId = request.WorkflowId!.Value;
            lockedGoiThau.NgayCapNhat = DateTime.UtcNow;
            AddStatusHistory(lockedGoiThau.Id, oldStatus, lockedGoiThau.TrangThai, currentUserId);

            await _db.SaveChangesAsync();
            await txn.CommitAsync();

            _logger.LogInformation(
                "Started workflow: instanceId={InstanceId}, goiThauId={GoiThauId}, workflowId={WorkflowId}, stepId={StepId}",
                instance.Id, goiThauId, request.WorkflowId, firstStep.Id);

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
                        PhaHienTai = stepInstance.PhaHienTai,
                        NgayBatDau = stepInstance.NgayBatDau
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

    // ════════════════════════════════════════════════════════════════════
    //  Query endpoints
    // ════════════════════════════════════════════════════════════════════

    public async Task<WorkflowStateDto?> GetWorkflowStateAsync(int goiThauId)
    {
        var currentUserId = GetCurrentUserId();
        await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);

        var instance = await _db.WorkflowInstances
            .Include(i => i.Workflow)
            .Include(i => i.GoiThau!).ThenInclude(g => g.KhoaPhong)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.DonViXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.NhanhWorkflow)
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);

        if (instance is null) return null;

        var buocHienTai = instance.BuocHienTaiId.HasValue
            ? instance.WorkflowStepInstances
                .Where(s => s.BuocWorkflowId == instance.BuocHienTaiId)
                .OrderByDescending(s => s.Id)
                .FirstOrDefault()
            : null;

        var steps = instance.WorkflowStepInstances
            .OrderBy(s => s.BuocWorkflow?.ThuTu ?? int.MaxValue)
            .ThenBy(s => s.Id)
            .Select(s => new WorkflowStepStateDto
            {
                Id = s.Id,
                BuocWorkflowId = s.BuocWorkflowId,
                NhanhWorkflowId = s.BuocWorkflow != null ? s.BuocWorkflow.NhanhWorkflowId : null,
                TenNhanh = s.BuocWorkflow?.NhanhWorkflow?.TenNhanh,
                TenBuoc = s.BuocWorkflow?.TenBuoc ?? "",
                TrangThai = s.TrangThai,
                PhaHienTai = s.PhaHienTai,
                NgayBatDau = s.NgayBatDau,
                NgayHoanThanh = s.NgayHoanThanh,
                TenNguoiXuLy = !string.IsNullOrWhiteSpace(s.NguoiXuLyText) ? s.NguoiXuLyText : s.NguoiXuLy?.HoTen,
                NgayXuLy = s.NgayXuLy,
                TenNguoiKyDuyet = !string.IsNullOrWhiteSpace(s.NguoiKyDuyetText) ? s.NguoiKyDuyetText : s.NguoiKyDuyet?.HoTen,
                NgayKyDuyet = s.NgayKyDuyet,
                KetQua = s.KetQua,
                GhiChu = s.GhiChu,
                LyDoKhongDuyet = s.LyDoKhongDuyet,
                TenVaiTroXuLy = s.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
                TenVaiTroKyDuyet = s.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
                TenDonViXuLy = s.BuocWorkflow?.DonViXuLy != null ? s.BuocWorkflow.DonViXuLy.TenKhoaPhong : null,
                HanXuLy = s.HanXuLy,
                QuaHan = s.QuaHan,
                TinhTrangTienDo = ComputeTinhTrangTienDo(s.HanXuLy, s.TrangThai),
                RowVersion = s.RowVersion,
            }).ToList();

        var completedCount = steps.Count(s =>
            s.TrangThai == WorkflowStepTrangThai.HOAN_TAT ||
            s.TrangThai == WorkflowStepTrangThai.SKIPPED);

        // Build CurrentSteps for parallel-aware clients
        var currentSteps = instance.WorkflowStepInstances
            .Where(s => s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                        s.TrangThai == WorkflowStepTrangThai.CHO_DUYET)
            .Select(s => new CurrentStepDto
            {
                StepInstanceId = s.Id,
                BuocWorkflowId = s.BuocWorkflowId,
                TenBuoc = s.BuocWorkflow?.TenBuoc ?? "",
                TrangThai = s.TrangThai,
                PhaHienTai = s.PhaHienTai,
                TenNhanh = s.BuocWorkflow?.NhanhWorkflow?.TenNhanh,
                HanXuLy = s.HanXuLy,
                TinhTrangTienDo = ComputeTinhTrangTienDo(s.HanXuLy, s.TrangThai),
            }).ToList();

        return new WorkflowStateDto
        {
            WorkflowInstanceId = instance.Id,
            WorkflowId = instance.WorkflowId,
            WorkflowTen = instance.Workflow?.TenWorkflow,
            WorkflowTrangThai = instance.TrangThai,
            BuocHienTaiId = instance.BuocHienTaiId,
            TenBuocHienTai = buocHienTai?.BuocWorkflow?.TenBuoc,
            PhaHienTai = buocHienTai?.PhaHienTai,
            NgayBatDau = instance.NgayBatDau,
            SoBuocHoanThanh = completedCount,
            TongSoBuoc = steps.Count,
            TinhTrangTienDo = buocHienTai != null
                ? ComputeTinhTrangTienDo(buocHienTai.HanXuLy, buocHienTai.TrangThai)
                : null,
            TenNguoiTao = await _db.NguoiDungs
                .Where(n => n.Id == instance.GoiThau!.NguoiTaoId)
                .Select(n => n.HoTen)
                .FirstOrDefaultAsync(),
            TenKhoaPhong = instance.GoiThau?.KhoaPhong?.TenKhoaPhong,
            CurrentSteps = currentSteps,
            Steps = steps
        };
    }

    public async Task<List<WorkflowStepStateDto>> GetWorkflowStepsAsync(int goiThauId)
    {
        var currentUserId = GetCurrentUserId();
        await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);

        var instance = await _db.WorkflowInstances
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.DonViXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow!).ThenInclude(b => b.NhanhWorkflow)
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);

        if (instance is null) return [];

        return instance.WorkflowStepInstances
            .OrderBy(s => s.BuocWorkflow?.ThuTu ?? int.MaxValue)
            .ThenBy(s => s.Id)
            .Select(s => new WorkflowStepStateDto
            {
                Id = s.Id,
                BuocWorkflowId = s.BuocWorkflowId,
                NhanhWorkflowId = s.BuocWorkflow != null ? s.BuocWorkflow.NhanhWorkflowId : null,
                TenNhanh = s.BuocWorkflow?.NhanhWorkflow?.TenNhanh,
                TenBuoc = s.BuocWorkflow?.TenBuoc ?? "",
                TrangThai = s.TrangThai,
                PhaHienTai = s.PhaHienTai,
                NgayBatDau = s.NgayBatDau,
                NgayHoanThanh = s.NgayHoanThanh,
                TenNguoiXuLy = !string.IsNullOrWhiteSpace(s.NguoiXuLyText) ? s.NguoiXuLyText : s.NguoiXuLy?.HoTen,
                NgayXuLy = s.NgayXuLy,
                TenNguoiKyDuyet = !string.IsNullOrWhiteSpace(s.NguoiKyDuyetText) ? s.NguoiKyDuyetText : s.NguoiKyDuyet?.HoTen,
                NgayKyDuyet = s.NgayKyDuyet,
                KetQua = s.KetQua,
                GhiChu = s.GhiChu,
                LyDoKhongDuyet = s.LyDoKhongDuyet,
                TenVaiTroXuLy = s.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
                TenVaiTroKyDuyet = s.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
                TenDonViXuLy = s.BuocWorkflow?.DonViXuLy != null ? s.BuocWorkflow.DonViXuLy.TenKhoaPhong : null,
                HanXuLy = s.HanXuLy,
                QuaHan = s.QuaHan,
                TinhTrangTienDo = ComputeTinhTrangTienDo(s.HanXuLy, s.TrangThai),
                RowVersion = s.RowVersion,
            }).ToList();
    }


    // ════════════════════════════════════════════════════════════════════
    //  GET_STEP_DETAIL — Step detail (read-only)
    // ════════════════════════════════════════════════════════════════════
    public async Task<WorkflowStepStateDto?> GetWorkflowStepDetailAsync(int goiThauId, long stepId)
    {
        var currentUserId = GetCurrentUserId();
        await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);

        var instance = await _db.WorkflowInstances
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);
        if (instance is null) return null;

        var step = await _db.WorkflowStepInstances
            .Include(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(s => s.BuocWorkflow!).ThenInclude(b => b.VaiTroKyDuyet)
            .Include(s => s.BuocWorkflow!).ThenInclude(b => b.DonViXuLy)
            .Include(s => s.NguoiXuLy)
            .Include(s => s.NguoiKyDuyet)
            .Include(s => s.WorkflowAssignments).ThenInclude(a => a.NguoiDuocGiao)
            .FirstOrDefaultAsync(s => s.Id == stepId && s.WorkflowInstanceId == instance.Id);
        if (step is null) return null;

        return new WorkflowStepStateDto
        {
            Id = step.Id,
            TenBuoc = step.BuocWorkflow?.TenBuoc ?? "",
            TrangThai = step.TrangThai,
            PhaHienTai = step.PhaHienTai,
            NgayBatDau = step.NgayBatDau,
            NgayHoanThanh = step.NgayHoanThanh,
            TenNguoiXuLy = !string.IsNullOrWhiteSpace(step.NguoiXuLyText) ? step.NguoiXuLyText : step.NguoiXuLy?.HoTen,
            NgayXuLy = step.NgayXuLy,
            TenNguoiKyDuyet = !string.IsNullOrWhiteSpace(step.NguoiKyDuyetText) ? step.NguoiKyDuyetText : step.NguoiKyDuyet?.HoTen,
            NgayKyDuyet = step.NgayKyDuyet,
            KetQua = step.KetQua,
            GhiChu = step.GhiChu,
            LyDoKhongDuyet = step.LyDoKhongDuyet,
            TenVaiTroXuLy = step.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
            TenVaiTroKyDuyet = step.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
            TenDonViXuLy = step.BuocWorkflow?.DonViXuLy != null ? step.BuocWorkflow.DonViXuLy.TenKhoaPhong : null,
            HanXuLy = step.HanXuLy,
            QuaHan = step.QuaHan,
            TinhTrangTienDo = ComputeTinhTrangTienDo(step.HanXuLy, step.TrangThai),
            RowVersion = step.RowVersion
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

    private async Task<ProcessStepResponse> BuildResponse2Phase(
        WorkflowStepInstance currentStep, WorkflowInstance instance, GoiThau goiThau,
        string hanhDong, bool isCompleted,
        long? newStepId = null, string? newStepName = null,
        byte[]? rowVersion = null, string? tinhTrangTienDo = null,
        NhomNhanhWorkflow? splitGroup = null,
        List<long>? createdStepIds = null,
        bool isMerge = false,
        ProcessStepRequest? request = null)
    {
        var buoc = currentStep.BuocWorkflow;

        var message = isCompleted
            ? hanhDong switch
            {
                WorkflowHanhDong.APPROVE or WorkflowHanhDong.DUYET => "Đã duyệt bước cuối cùng. Workflow hoàn thành.",
                WorkflowHanhDong.REJECT or WorkflowHanhDong.KHONG_DUYET => "Đã từ chối. Workflow kết thúc.",
                WorkflowHanhDong.SKIP => "Đã bỏ qua bước cuối cùng. Workflow hoàn thành.",
                _ => $"Hành động '{hanhDong}' hoàn tất."
            }
            : hanhDong switch
            {
                WorkflowHanhDong.APPROVE or WorkflowHanhDong.DUYET =>
                    currentStep.PhaHienTai == "KY_DUYET" && newStepId != currentStep.Id
                        ? $"Đã duyệt bước '{buoc?.TenBuoc}'."
                        : $"Đã hoàn tất lập hồ sơ bước '{buoc?.TenBuoc}'.",
                WorkflowHanhDong.SKIP => $"Đã bỏ qua bước '{buoc?.TenBuoc}'.",
                WorkflowHanhDong.ROLLBACK or WorkflowHanhDong.TRA_VE =>
                    $"Đã rollback về bước '{newStepName}'.",
                _ => $"Hành động '{hanhDong}' hoàn tất."
            };

        var rv = isCompleted ? null : (rowVersion ?? currentStep.RowVersion);

        // Try to resolve user display names.
        // NguoiXuLy is determined by the current user/role and is not overridden by UI input.
        string? tenNguoiXuLy = null;
        string? tenNguoiKyDuyet = null;
        if (!string.IsNullOrWhiteSpace(currentStep.NguoiXuLyText))
        {
            tenNguoiXuLy = currentStep.NguoiXuLyText;
        }
        else if (currentStep.NguoiXuLyId.HasValue)
        {
            var u = await _db.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == currentStep.NguoiXuLyId.Value);
            tenNguoiXuLy = u?.HoTen;
        }

        if (!string.IsNullOrWhiteSpace(currentStep.NguoiKyDuyetText))
        {
            tenNguoiKyDuyet = currentStep.NguoiKyDuyetText;
        }
        else if (currentStep.NguoiKyDuyetId.HasValue)
        {
            var u2 = await _db.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == currentStep.NguoiKyDuyetId.Value);
            tenNguoiKyDuyet = u2?.HoTen;
        }

        return new ProcessStepResponse
        {
            CurrentStepId = currentStep.Id,
            TenBuocHienTai = buoc?.TenBuoc,
            NewStepId = newStepId,
            TenBuocMoi = newStepName,
            PhaHienTai = currentStep.PhaHienTai,
            WorkflowTrangThai = instance.TrangThai,
            GoiThauTrangThai = goiThau?.TrangThai,
            HanhDong = hanhDong,
            Message = message,
            NewRowVersion = rv,
            TinhTrangTienDo = tinhTrangTienDo ?? ComputeTinhTrangTienDo(currentStep.HanXuLy, currentStep.TrangThai) ?? "DUNG_TIEN_DO",
            IsSplit = splitGroup != null,
            IsMerge = isMerge,
            ActiveStepIds = createdStepIds ?? [],
            TongSoNhanh = splitGroup?.Nhanhs.Count,

            // 2-phase fields
            ChoKyDuyet = currentStep.PhaHienTai == "KY_DUYET",
            NguoiXuLyId = currentStep.NguoiXuLyId,
            TenNguoiXuLy = tenNguoiXuLy,
            NgayXuLy = currentStep.NgayXuLy,
            NguoiKyDuyetId = currentStep.NguoiKyDuyetId,
            TenNguoiKyDuyet = tenNguoiKyDuyet,
            NgayKyDuyet = currentStep.NgayKyDuyet,
            KetQua = currentStep.KetQua,
            LyDoKhongDuyet = currentStep.LyDoKhongDuyet,
            SoBuocHoanThanh = 0,
            TongSoBuoc = 0,
            HanXuLy = currentStep.HanXuLy,
            QuaHan = currentStep.QuaHan
        };
    }

    private static bool ShouldPersistApproverText(string? hanhDong)
        => hanhDong is WorkflowHanhDong.APPROVE
            or WorkflowHanhDong.DUYET
            or WorkflowHanhDong.REJECT
            or WorkflowHanhDong.KHONG_DUYET
            or WorkflowHanhDong.ROLLBACK
            or WorkflowHanhDong.TRA_VE;

    private static void ApplyApproverDisplayText(WorkflowStepInstance currentStep, ProcessStepRequest? request)
    {
        var approverText = request?.GetNguoiKyDuyetDisplayText();
        if (!string.IsNullOrWhiteSpace(approverText))
            currentStep.NguoiKyDuyetText = approverText;
    }

    private static string? ComputeTinhTrangTienDo(DateTime? hanXuLy, string trangThai)
    {
        if (trangThai is WorkflowStepTrangThai.HOAN_TAT or WorkflowStepTrangThai.TRA_VE
            or WorkflowStepTrangThai.SKIPPED)
            return "HOAN_TAT";

        if (trangThai is "PENDING" or "CHUA_BAT_DAU")
            return "CHUA_THUC_HIEN";

        if (!hanXuLy.HasValue)
            return "CHUA_CO_HAN";

        var remaining = hanXuLy.Value - DateTime.UtcNow;

        if (remaining.TotalDays < 0)
            return "QUA_HAN";
        if (remaining.TotalDays <= 3)
            return "SAP_QUA_HAN";

        return "DUNG_TIEN_DO";
    }

    private async Task<BuocWorkflow?> ResolveSequentialNextBuocAsync(int workflowId, BuocWorkflow currentBuoc)
    {
        var workflowSteps = await _db.BuocWorkflows
            .AsNoTracking()
            .Where(b => b.WorkflowId == workflowId)
            .OrderBy(b => b.ThuTu)
            .ThenBy(b => b.Id)
            .ToListAsync();

        var currentIndex = workflowSteps.FindIndex(b => b.Id == currentBuoc.Id);
        if (currentIndex >= 0 && currentIndex + 1 < workflowSteps.Count)
            return workflowSteps[currentIndex + 1];

        return null;
    }

    private async Task<bool> IsConfiguredEndStepAsync(int workflowId, int buocWorkflowId)
        => await _db.Workflows
            .AsNoTracking()
            .AnyAsync(w => w.Id == workflowId && w.BuocKetThucId == buocWorkflowId);

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User
            ?.FindFirst(ClaimTypes.NameIdentifier);

        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Khong the xac dinh nguoi dung hien tai.");

        return id;
    }

    private void AssignStepToTenderCreator(long stepInstanceId, GoiThau? goiThau, int fallbackUserId)
    {
        _db.WorkflowAssignments.Add(new WorkflowAssignment
        {
            WorkflowStepInstanceId = stepInstanceId,
            NguoiDuocGiaoId = goiThau?.NguoiTaoId ?? fallbackUserId,
            NgayGiao = DateTime.UtcNow
        });
    }

    private void AddStatusHistory(int goiThauId, string? oldStatus, string newStatus, int? userId)
    {
        if (oldStatus == newStatus) return;

        _db.LichSuTrangThaiGoiThaus.Add(new LichSuTrangThaiGoiThau
        {
            GoiThauId = goiThauId,
            TrangThaiCu = oldStatus,
            TrangThaiMoi = newStatus,
            NguoiThayDoiId = userId,
            ThoiGianThayDoi = DateTime.UtcNow
        });
    }

    // ════════════════════════════════════════════════════════════════════
}
