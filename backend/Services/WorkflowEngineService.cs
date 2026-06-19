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
                (s.TrangThai == WorkflowStepTrangThai.DANG_XU_LY ||
                 s.TrangThai == WorkflowStepTrangThai.CHO_DUYET));
        if (currentStep is null)
            throw new ConflictException("Bước hiện tại không ở trạng thái xử lý hoặc không tồn tại.");

        // ─── 4. RowVersion concurrency check ──────────────────────────────
        if (request.RowVersion is null ||
            !request.RowVersion.SequenceEqual(currentStep.RowVersion ?? []))
            throw new ConflictException(
                "Bước đã được xử lý bởi người khác. Vui lòng tải lại trang.");

        // ─── 5. Permission check based on current phase ──────────────────
        if (currentStep.PhaHienTai == "LAP_HO_SO")
        {
            var isAssignee = currentStep.WorkflowAssignments
                .Any(a => a.NguoiDuocGiaoId == currentUserId && !a.DaXuLy);
            if (!isAssignee)
                throw new ForbiddenException("Bạn không được phân công xử lý hồ sơ bước này.");
        }
        else // KY_DUYET
        {
            var isSigner = currentStep.WorkflowAssignments
                .Any(a => a.NguoiDuocGiaoId == currentUserId && !a.DaXuLy);
            if (!isSigner)
                throw new ForbiddenException("Bạn không được phân công ký duyệt bước này.");
        }

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
            ProcessStepResponse response = request.HanhDong switch
            {
                WorkflowHanhDong.APPROVE or WorkflowHanhDong.DUYET => await HandleApproveAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong,
                    nguoiXuLyId: request.NguoiXuLyId, ngayXuLy: request.NgayXuLy,
                    nguoiKyDuyetId: request.NguoiKyDuyetId, ngayKyDuyet: request.NgayKyDuyet,
                    taiLieuDinhKem: request.TaiLieuDinhKem),
                WorkflowHanhDong.REJECT or WorkflowHanhDong.KHONG_DUYET => await HandleRejectAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong,
                    nguoiXuLyId: request.NguoiXuLyId, ngayXuLy: request.NgayXuLy,
                    nguoiKyDuyetId: request.NguoiKyDuyetId, ngayKyDuyet: request.NgayKyDuyet,
                    taiLieuDinhKem: request.TaiLieuDinhKem),
                WorkflowHanhDong.ROLLBACK or WorkflowHanhDong.TRA_VE => await HandleRollbackAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu, request.HanhDong),
                WorkflowHanhDong.SKIP => await HandleSkipAsync(
                    goiThau, lockedInstance, lockedStep, currentUserId, request.GhiChu),
                WorkflowHanhDong.REASSIGN => await HandleReassignAsync(
                    lockedInstance, lockedStep, currentUserId, request.NguoiDuocGiaoId!.Value, request.GhiChu),
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
        int? nguoiXuLyId = null, DateTime? ngayXuLy = null,
        int? nguoiKyDuyetId = null, DateTime? ngayKyDuyet = null,
        string? taiLieuDinhKem = null)
    {
        var buoc = currentStep.BuocWorkflow!;

        // ── FAST PATH: frontend submitted full form (both phases in 1 call) ──
        bool isFullSubmit = nguoiKyDuyetId.HasValue && ngayKyDuyet.HasValue;
        if (isFullSubmit)
        {
            // Mark LAP_HO_SO phase done
            currentStep.NguoiXuLyId = nguoiXuLyId ?? currentUserId;
            currentStep.NgayXuLy = ngayXuLy ?? DateTime.UtcNow;
            currentStep.TaiLieuDinhKem = taiLieuDinhKem;
            currentStep.GhiChu = ghiChu ?? currentStep.GhiChu;

            foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
            {
                a.DaXuLy = true;
                a.NgayXuLy = DateTime.UtcNow;
            }

            // Check if step requires approval
            if (buoc.VaiTroKyDuyetId.HasValue)
            {
                // Mark KY_DUYET phase done
                currentStep.NguoiKyDuyetId = nguoiKyDuyetId;
                currentStep.NgayKyDuyet = ngayKyDuyet.Value;
                currentStep.KetQua = "DUYET";

                // Resolve all signers and mark them done
                var signerIds = await ResolveAssigneesAsync(buoc.VaiTroKyDuyetId.Value, nguoiKyDuyetId.Value);
                foreach (var signerId in signerIds)
                {
                    var existing = currentStep.WorkflowAssignments
                        .FirstOrDefault(a => a.NguoiDuocGiaoId == signerId);
                    if (existing is null)
                    {
                        _db.WorkflowAssignments.Add(new WorkflowAssignment
                        {
                            WorkflowStepInstanceId = currentStep.Id,
                            NguoiDuocGiaoId = signerId,
                            DaXuLy = true,
                            NgayGiao = DateTime.UtcNow,
                            NgayXuLy = DateTime.UtcNow
                        });
                    }
                    else if (!existing.DaXuLy)
                    {
                        existing.DaXuLy = true;
                        existing.NgayXuLy = DateTime.UtcNow;
                    }
                }

                // Advance to next step
                return await CompleteStepAndAdvanceAsync(
                    goiThau, instance, currentStep, buoc,
                    nguoiKyDuyetId.Value, ghiChu, hanhDong);
            }
            else
            {
                // No approval needed, advance directly
                return await CompleteStepAndAdvanceAsync(
                    goiThau, instance, currentStep, buoc,
                    nguoiXuLyId ?? currentUserId, ghiChu, hanhDong);
            }
        }

        if (currentStep.PhaHienTai == "LAP_HO_SO")
        {
            // ── Phase 1: mark hồ sơ as done → move to KY_DUYET ──
            currentStep.NguoiXuLyId = currentUserId;
            currentStep.NgayXuLy = DateTime.UtcNow;
            currentStep.GhiChu = ghiChu;

            // Mark LAP_HO_SO assignment as done
            var lapHoSoAssignment = currentStep.WorkflowAssignments
                .FirstOrDefault(a => !a.DaXuLy);
            if (lapHoSoAssignment is not null)
            {
                lapHoSoAssignment.DaXuLy = true;
                lapHoSoAssignment.NgayXuLy = DateTime.UtcNow;
            }

            // Check if step needs ký duyệt
            if (buoc.VaiTroKyDuyetId.HasValue)
            {
                // Step requires approval → enter KY_DUYET phase
                currentStep.PhaHienTai = "KY_DUYET";
                currentStep.TrangThai = WorkflowStepTrangThai.CHO_DUYET;

                // Resolve signers: có thể nhiều người ký song song
                var signerIds = await ResolveAssigneesAsync(buoc.VaiTroKyDuyetId.Value, currentUserId);
                foreach (var signerId in signerIds)
                {
                    _db.WorkflowAssignments.Add(new WorkflowAssignment
                    {
                        WorkflowStepInstanceId = currentStep.Id,
                        NguoiDuocGiaoId = signerId,
                        NgayGiao = DateTime.UtcNow
                    });
                }

                // Deadline check
                var deadlineStatus = await CheckDeadlineAsync(buoc);

                await _db.SaveChangesAsync();

                AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
                    ghiChu ?? $"Hoàn tất lập hồ sơ bước '{buoc.TenBuoc}', chuyển sang ký duyệt",
                    currentUserId, goiThau.Id,
                    $"{hanhDong}_LAP_HO_SO: '{buoc.TenBuoc}' → KY_DUYET");

                return BuildResponse2Phase(currentStep, instance, goiThau, hanhDong,
                    false, currentStep.Id, buoc.TenBuoc, currentStep.RowVersion,
                    deadlineStatus);
            }
            else
            {
                // No approval needed → complete this step, move to next
                return await CompleteStepAndAdvanceAsync(
                    goiThau, instance, currentStep, buoc, currentUserId, ghiChu, hanhDong);
            }
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

            // Check if all signing assignments are done
            var allSigned = currentStep.WorkflowAssignments.All(a => a.DaXuLy);

            if (allSigned)
            {
                currentStep.NguoiKyDuyetId = currentUserId;
                currentStep.NgayKyDuyet = DateTime.UtcNow;
                currentStep.KetQua = "DUYET";

                return await CompleteStepAndAdvanceAsync(
                    goiThau, instance, currentStep, buoc, currentUserId, ghiChu, hanhDong);
            }
            else
            {
                // Still waiting for other signers
                await _db.SaveChangesAsync();

                var remaining = currentStep.WorkflowAssignments.Count(a => !a.DaXuLy);

                AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
                    ghiChu ?? $"Đã ký duyệt, còn {remaining} người ký chờ duyệt",
                    currentUserId, goiThau.Id,
                    $"{hanhDong}_KY_DUYET_PARTIAL: '{buoc.TenBuoc}' — {remaining} signer(s) remaining");

                return new ProcessStepResponse
                {
                    CurrentStepId = currentStep.Id,
                    TenBuocHienTai = buoc.TenBuoc,
                    PhaHienTai = "KY_DUYET",
                    ChoKyDuyet = true,
                    WorkflowTrangThai = instance.TrangThai,
                    GoiThauTrangThai = goiThau.TrangThai,
                    HanhDong = hanhDong,
                    Message = $"Đã ký duyệt. Còn {remaining} người ký chờ duyệt.",
                    NewRowVersion = currentStep.RowVersion
                };
            }
        }
    }

    /// <summary>
    /// Hoàn tất step hiện tại (HOAN_TAT), chuyển sang step kế hoặc complete workflow.
    /// </summary>
    private async Task<ProcessStepResponse> CompleteStepAndAdvanceAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        BuocWorkflow buoc, int currentUserId, string? ghiChu, string hanhDong)
    {
        currentStep.TrangThai = WorkflowStepTrangThai.HOAN_TAT;
        currentStep.NgayHoanThanh = DateTime.UtcNow;
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.NguoiKyDuyetId ??= currentUserId;
        currentStep.NgayKyDuyet ??= DateTime.UtcNow;
        currentStep.KetQua ??= "DUYET";
        currentStep.GhiChu = ghiChu ?? currentStep.GhiChu;

        // Find transition
        var transition = await _db.ChuyenTiepWorkflows
            .Include(t => t.DenBuoc)
            .FirstOrDefaultAsync(t =>
                t.TuBuocId == currentStep.BuocWorkflowId &&
                t.HanhDong == hanhDong);

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
            // ── Check if this is a join step (NhomSongSong) ──
            // For now: simple sequential advance
            var nextStep = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = transition.DenBuocId,
                TrangThai = WorkflowStepTrangThai.DANG_XU_LY,
                PhaHienTai = "LAP_HO_SO",
                NgayBatDau = DateTime.UtcNow,
                HanXuLy = transition!.DenBuoc.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(transition!.DenBuoc.SoNgayLapHoSo)
                    : null,
            };
            _db.WorkflowStepInstances.Add(nextStep);
            await _db.SaveChangesAsync();

            // Resolve assignee for next step's LAP_HO_SO phase
            var nextBuoc = transition.DenBuoc;
            if (nextBuoc.VaiTroXuLyHoSoId.HasValue)
            {
                var assigneeIds = await ResolveAssigneesAsync(nextBuoc.VaiTroXuLyHoSoId.Value, currentUserId);
                foreach (var assigneeId in assigneeIds)
                {
                    _db.WorkflowAssignments.Add(new WorkflowAssignment
                    {
                        WorkflowStepInstanceId = nextStep.Id,
                        NguoiDuocGiaoId = assigneeId,
                        NgayGiao = DateTime.UtcNow
                    });
                }
            }
            else
            {
                // Fallback to current user
                _db.WorkflowAssignments.Add(new WorkflowAssignment
                {
                    WorkflowStepInstanceId = nextStep.Id,
                    NguoiDuocGiaoId = currentUserId,
                    NgayGiao = DateTime.UtcNow
                });
            }

            instance.BuocHienTaiId = transition.DenBuocId;
            newStepId = nextStep.Id;
            newStepName = nextBuoc.TenBuoc;
            isCompleted = false;

            await _db.SaveChangesAsync();
        }

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Hoàn tất bước '{buoc.TenBuoc}'", currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: '{buoc.TenBuoc}' hoàn tất");

        return BuildResponse2Phase(currentStep, instance, goiThau, hanhDong,
            isCompleted, newStepId, newStepName, null);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REJECT/KHONG_DUYET — Từ chối (cả 2 pha)
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRejectAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.REJECT,
        int? nguoiXuLyId = null, DateTime? ngayXuLy = null,
        int? nguoiKyDuyetId = null, DateTime? ngayKyDuyet = null,
        string? taiLieuDinhKem = null)
    {
        var buoc = currentStep.BuocWorkflow;
        if (buoc is not null && !buoc.ChoPhepTuChoi)
            throw new BadRequestException($"Bước '{buoc.TenBuoc}' không cho phép từ chối.");

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
            currentStep.NguoiKyDuyetId = nguoiKyDuyetId ?? currentUserId;
            currentStep.NgayKyDuyet = ngayKyDuyet ?? DateTime.UtcNow;
        }
        else
        {
            currentStep.NguoiXuLyId = nguoiXuLyId ?? currentUserId;
            currentStep.NgayXuLy = ngayXuLy ?? DateTime.UtcNow;
        }

        // Mark all pending assignments as done
        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = DateTime.UtcNow;
        }

        // End workflow
        instance.TrangThai = WorkflowTrangThai.REJECTED;
        instance.NgayHoanThanh = DateTime.UtcNow;
        instance.BuocHienTaiId = null;

        // Return GoiThau to draft
        goiThau.TrangThai = GoiThauTrangThai.DU_THAO;
        goiThau.WorkflowId = null;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Từ chối tại bước '{buoc?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ chối tại bước '{buoc?.TenBuoc}'");

        return BuildResponse2Phase(currentStep, instance, goiThau, hanhDong, true);
    }

    // ════════════════════════════════════════════════════════════════════
    //  ROLLBACK/TRA_VE — Quay lại bước trước
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleRollbackAsync(
        GoiThau goiThau, WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, string? ghiChu, string hanhDong = WorkflowHanhDong.ROLLBACK)
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
            currentStep.NguoiKyDuyetId = currentUserId;
            currentStep.NgayKyDuyet = DateTime.UtcNow;
        }
        else
        {
            currentStep.NguoiXuLyId = currentUserId;
            currentStep.NgayXuLy = DateTime.UtcNow;
        }

        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = DateTime.UtcNow;
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

        // Resolve assignees
        var tuBuoc = rollbackTransition.TuBuoc;
        if (tuBuoc.VaiTroXuLyHoSoId.HasValue)
        {
            var assigneeIds = await ResolveAssigneesAsync(tuBuoc.VaiTroXuLyHoSoId.Value, currentUserId);
            foreach (var assigneeId in assigneeIds)
            {
                _db.WorkflowAssignments.Add(new WorkflowAssignment
                {
                    WorkflowStepInstanceId = previousStep.Id,
                    NguoiDuocGiaoId = assigneeId,
                    NgayGiao = DateTime.UtcNow
                });
            }
        }
        else
        {
            _db.WorkflowAssignments.Add(new WorkflowAssignment
            {
                WorkflowStepInstanceId = previousStep.Id,
                NguoiDuocGiaoId = currentUserId,
                NgayGiao = DateTime.UtcNow
            });
        }

        instance.BuocHienTaiId = rollbackTransition.TuBuoc.Id;

        AddAuditEntries(instance.Id, currentStep.Id, hanhDong,
            ghiChu ?? $"Rollback từ bước '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"{hanhDong}_STEP: từ '{currentStep.BuocWorkflow?.TenBuoc}' về '{rollbackTransition.TuBuoc.TenBuoc}'");

        return BuildResponse2Phase(currentStep, instance, goiThau,
            hanhDong, false, previousStep.Id, rollbackTransition.TuBuoc.TenBuoc, previousStep.RowVersion);
    }

    // ════════════════════════════════════════════════════════════════════
    //  SKIP — Bỏ qua bước hiện tại (giai đoạn LAP_HO_SO)
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
        if (currentStep.HanXuLy.HasValue && currentStep.NgayHoanThanh > currentStep.HanXuLy)
            currentStep.QuaHan = true;
        else
            currentStep.QuaHan = false;
        currentStep.NguoiXuLyId = currentUserId;
        currentStep.GhiChu = ghiChu;

        foreach (var a in currentStep.WorkflowAssignments.Where(a => !a.DaXuLy))
        {
            a.DaXuLy = true;
            a.NgayXuLy = DateTime.UtcNow;
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
                TrangThai = WorkflowStepTrangThai.DANG_XU_LY,
                PhaHienTai = "LAP_HO_SO",
                NgayBatDau = DateTime.UtcNow,
                HanXuLy = transition.DenBuoc.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(transition.DenBuoc.SoNgayLapHoSo)
                    : null,
            };

            var nextBuoc = transition.DenBuoc;
            if (nextBuoc.VaiTroXuLyHoSoId.HasValue)
            {
                var assigneeIds = await ResolveAssigneesAsync(nextBuoc.VaiTroXuLyHoSoId.Value, currentUserId);
                foreach (var assigneeId in assigneeIds)
                {
                    _db.WorkflowAssignments.Add(new WorkflowAssignment
                    {
                        WorkflowStepInstanceId = nextStep.Id,
                        NguoiDuocGiaoId = assigneeId,
                        NgayGiao = DateTime.UtcNow
                    });
                }
            }
            else
            {
                _db.WorkflowAssignments.Add(new WorkflowAssignment
                {
                    WorkflowStepInstanceId = nextStep.Id,
                    NguoiDuocGiaoId = currentUserId,
                    NgayGiao = DateTime.UtcNow
                });
            }

            instance.BuocHienTaiId = transition.DenBuocId;
            newStepId = nextStep.Id;
            newStepName = nextBuoc.TenBuoc;
            isCompleted = false;
        }

        AddAuditEntries(instance.Id, currentStep.Id, WorkflowHanhDong.SKIP,
            ghiChu ?? $"Bỏ qua bước '{buoc?.TenBuoc}'",
            currentUserId, goiThau.Id,
            $"SKIP_STEP: bỏ qua bước '{buoc?.TenBuoc}'");

        return BuildResponse2Phase(currentStep, instance, goiThau, WorkflowHanhDong.SKIP,
            isCompleted, newStepId, newStepName);
    }

    // ════════════════════════════════════════════════════════════════════
    //  REASSIGN — Gán lại người xử lý
    // ════════════════════════════════════════════════════════════════════
    private async Task<ProcessStepResponse> HandleReassignAsync(
        WorkflowInstance instance, WorkflowStepInstance currentStep,
        int currentUserId, int nguoiDuocGiaoId, string? ghiChu)
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
            a.NgayXuLy = DateTime.UtcNow;
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

        return new ProcessStepResponse
        {
            CurrentStepId = currentStep.Id,
            TenBuocHienTai = buoc?.TenBuoc,
            PhaHienTai = currentStep.PhaHienTai,
            WorkflowTrangThai = instance.TrangThai,
            HanhDong = WorkflowHanhDong.REASSIGN,
            Message = $"Đã chuyển giao bước '{buoc?.TenBuoc}' cho người dùng Id = {nguoiDuocGiaoId}.",
            NewRowVersion = currentStep.RowVersion
        };
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

        var goiThau = await _db.GoiThaus.FindAsync(goiThauId);
        if (goiThau is null || !goiThau.TrangThaiHoatDong)
            throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId}");

        if (goiThau.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException(
                $"Goi thau phai o trang thai DU_THAO. Trang thai hien tai: {goiThau.TrangThai}");

        if (request.AutoSuggest)
            throw new BadRequestException(
                "Tính năng tự động đề xuất workflow chưa được hỗ trợ. Vui lòng chọn workflow thủ công.");

        var workflow = await _db.Workflows.FindAsync(request.WorkflowId!.Value);
        if (workflow is null)
            throw new NotFoundException($"Khong tim thay workflow template voi Id = {request.WorkflowId}");

        var steps = await _db.BuocWorkflows
            .Where(b => b.WorkflowId == request.WorkflowId!.Value)
            .OrderBy(b => b.Id)
            .ToListAsync();

        if (steps.Count == 0)
            throw new BadRequestException("Workflow chua co buoc xu ly nao.");

        var hasActive = await _db.WorkflowInstances
            .AnyAsync(i => i.GoiThauId == goiThauId && i.TrangThai == WorkflowTrangThai.ACTIVE);
        if (hasActive)
            throw new ConflictException("Goi thau da co workflow instance dang hoat dong.");

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

            var firstStep = steps[0];

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

            var stepInstance = new WorkflowStepInstance
            {
                WorkflowInstanceId = instance.Id,
                BuocWorkflowId = firstStep.Id,
                TrangThai = WorkflowStepTrangThai.DANG_XU_LY,
                PhaHienTai = "LAP_HO_SO",
                NgayBatDau = DateTime.UtcNow,
                HanXuLy = firstStep.SoNgayLapHoSo > 0
                    ? DateTime.UtcNow.AddDays(firstStep.SoNgayLapHoSo)
                    : null,
            };
            _db.WorkflowStepInstances.Add(stepInstance);
            await _db.SaveChangesAsync();

            // Resolve assignees cho LAP_HO_SO phase
            if (firstStep.VaiTroXuLyHoSoId.HasValue)
            {
                var assigneeIds = await ResolveAssigneesAsync(firstStep.VaiTroXuLyHoSoId.Value, currentUserId);
                foreach (var assigneeId in assigneeIds)
                {
                    _db.WorkflowAssignments.Add(new WorkflowAssignment
                    {
                        WorkflowStepInstanceId = stepInstance.Id,
                        NguoiDuocGiaoId = assigneeId,
                        NgayGiao = DateTime.UtcNow
                    });
                }
            }
            else
            {
                _db.WorkflowAssignments.Add(new WorkflowAssignment
                {
                    WorkflowStepInstanceId = stepInstance.Id,
                    NguoiDuocGiaoId = currentUserId,
                    NgayGiao = DateTime.UtcNow
                });
            }

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

            lockedGoiThau.TrangThai = GoiThauTrangThai.DANG_XU_LY;
            lockedGoiThau.WorkflowId = request.WorkflowId!.Value;
            lockedGoiThau.NgayCapNhat = DateTime.UtcNow;

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
        var instance = await _db.WorkflowInstances
            .Include(i => i.Workflow)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiKyDuyet)
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);

        if (instance is null) return null;

        var buocHienTai = instance.BuocHienTaiId.HasValue
            ? instance.WorkflowStepInstances
                .Where(s => s.BuocWorkflowId == instance.BuocHienTaiId)
                .OrderByDescending(s => s.Id)
                .FirstOrDefault()
            : null;

        var steps = instance.WorkflowStepInstances
            .OrderBy(s => s.Id)
            .Select(s => new WorkflowStepStateDto
            {
                Id = s.Id,
                TenBuoc = s.BuocWorkflow?.TenBuoc ?? "",
                TrangThai = s.TrangThai,
                PhaHienTai = s.PhaHienTai,
                NgayBatDau = s.NgayBatDau,
                NgayHoanThanh = s.NgayHoanThanh,
                TenNguoiXuLy = s.NguoiXuLy?.HoTen,
                NgayXuLy = s.NgayXuLy,
                TenNguoiKyDuyet = s.NguoiKyDuyet?.HoTen,
                NgayKyDuyet = s.NgayKyDuyet,
                KetQua = s.KetQua,
                LyDoKhongDuyet = s.LyDoKhongDuyet,
                TenVaiTroXuLy = s.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
                TenVaiTroKyDuyet = s.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
                HanXuLy = s.HanXuLy,
                QuaHan = s.QuaHan,
                TinhTrangTienDo = ComputeTinhTrangTienDo(s.HanXuLy, s.TrangThai),
            }).ToList();

        var completedCount = steps.Count(s =>
            s.TrangThai == WorkflowStepTrangThai.HOAN_TAT ||
            s.TrangThai == WorkflowStepTrangThai.SKIPPED);

        return new WorkflowStateDto
        {
            WorkflowInstanceId = instance.Id,
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
            Steps = steps
        };
    }

    public async Task<List<WorkflowStepStateDto>> GetWorkflowStepsAsync(int goiThauId)
    {
        var instance = await _db.WorkflowInstances
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiXuLy)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.NguoiKyDuyet)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(i => i.WorkflowStepInstances).ThenInclude(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroKyDuyet)
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);

        if (instance is null) return [];

        return instance.WorkflowStepInstances
            .OrderBy(s => s.Id)
            .Select(s => new WorkflowStepStateDto
            {
                Id = s.Id,
                TenBuoc = s.BuocWorkflow?.TenBuoc ?? "",
                TrangThai = s.TrangThai,
                PhaHienTai = s.PhaHienTai,
                NgayBatDau = s.NgayBatDau,
                NgayHoanThanh = s.NgayHoanThanh,
                TenNguoiXuLy = s.NguoiXuLy?.HoTen,
                NgayXuLy = s.NgayXuLy,
                TenNguoiKyDuyet = s.NguoiKyDuyet?.HoTen,
                NgayKyDuyet = s.NgayKyDuyet,
                KetQua = s.KetQua,
                LyDoKhongDuyet = s.LyDoKhongDuyet,
                TenVaiTroXuLy = s.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
                TenVaiTroKyDuyet = s.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
                HanXuLy = s.HanXuLy,
                QuaHan = s.QuaHan,
                TinhTrangTienDo = ComputeTinhTrangTienDo(s.HanXuLy, s.TrangThai),
            }).ToList();
    }


    // ════════════════════════════════════════════════════════════════════
    //  GET_STEP_DETAIL — Step detail (read-only)
    // ════════════════════════════════════════════════════════════════════
    public async Task<WorkflowStepStateDto?> GetWorkflowStepDetailAsync(int goiThauId, long stepId)
    {
        var instance = await _db.WorkflowInstances
            .FirstOrDefaultAsync(i => i.GoiThauId == goiThauId);
        if (instance is null) return null;

        var step = await _db.WorkflowStepInstances
            .Include(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroXuLyHoSo)
            .Include(s => s.BuocWorkflow).ThenInclude(b => b.VaiTroKyDuyet)
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
            TenNguoiXuLy = step.NguoiXuLy?.HoTen,
            NgayXuLy = step.NgayXuLy,
            TenNguoiKyDuyet = step.NguoiKyDuyet?.HoTen,
            NgayKyDuyet = step.NgayKyDuyet,
            KetQua = step.KetQua,
            LyDoKhongDuyet = step.LyDoKhongDuyet,
            TenVaiTroXuLy = step.BuocWorkflow?.VaiTroXuLyHoSo?.TenVaiTro,
            TenVaiTroKyDuyet = step.BuocWorkflow?.VaiTroKyDuyet?.TenVaiTro,
            HanXuLy = step.HanXuLy,
            QuaHan = step.QuaHan,
            TinhTrangTienDo = ComputeTinhTrangTienDo(step.HanXuLy, step.TrangThai)
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

    private ProcessStepResponse BuildResponse2Phase(
        WorkflowStepInstance currentStep, WorkflowInstance instance, GoiThau goiThau,
        string hanhDong, bool isCompleted,
        long? newStepId = null, string? newStepName = null,
        byte[]? rowVersion = null, string? tinhTrangTienDo = null)
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

        return new ProcessStepResponse
        {
            CurrentStepId = currentStep.Id,
            TenBuocHienTai = buoc?.TenBuoc,
            NewStepId = newStepId,
            TenBuocMoi = newStepName,
            PhaHienTai = currentStep.PhaHienTai,
            WorkflowTrangThai = instance.TrangThai,
            GoiThauTrangThai = goiThau.TrangThai,
            HanhDong = hanhDong,
            Message = message,
            NewRowVersion = rv,
            TinhTrangTienDo = tinhTrangTienDo ?? "DUNG_TIEN_DO"
        };
    }

    private static string? ComputeTinhTrangTienDo(DateTime? hanXuLy, string trangThai)
    {
        if (trangThai is WorkflowStepTrangThai.HOAN_TAT or WorkflowStepTrangThai.TRA_VE
            or WorkflowStepTrangThai.SKIPPED)
            return null;

        if (!hanXuLy.HasValue)
            return "DUNG_TIEN_DO";

        var remaining = hanXuLy.Value - DateTime.UtcNow;

        if (remaining.TotalDays < 0)
            return "QUA_HAN";
        if (remaining.TotalDays <= 3)
            return "SAP_QUA_HAN";

        return "DUNG_TIEN_DO";
    }

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User
            ?.FindFirst(ClaimTypes.NameIdentifier);

        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Khong the xac dinh nguoi dung hien tai.");

        return id;
    }

    /// <summary>
    /// Resolve danh sách người dùng có vai trò cụ thể (hỗ trợ ký song song).
    /// </summary>
    private async Task<List<int>> ResolveAssigneesAsync(int vaiTroId, int fallbackUserId)
    {
        var userIds = await _db.NguoiDungKhoaPhongVaiTros
            .Where(nkv =>
                nkv.VaiTroId == vaiTroId &&
                nkv.NguoiDung.TrangThaiHoatDong &&
                !nkv.NguoiDung.DaXoa)
            .Select(nkv => nkv.NguoiDungId)
            .Distinct()
            .ToListAsync();

        if (userIds.Count > 0)
        {
            // Prefer current user if they have the role
            if (userIds.Contains(fallbackUserId))
                return [fallbackUserId];

            return userIds;
        }

        // Fallback: assign to current user
        return [fallbackUserId];
    }

    // ════════════════════════════════════════════════════════════════════
}
