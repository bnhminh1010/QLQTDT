using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;
using System.Text.RegularExpressions;

namespace QLQTDT.Api.Services;

public class BuocWorkflowService : IBuocWorkflowService
{
    private static readonly string[] EndStepTypes = ["KET_THUC", "Kết thúc"];
    private static readonly string[] StartStepTypes = ["BAT_DAU", "Bắt đầu"];

    private readonly AppDbContext _context;

    private readonly ILogger<BuocWorkflowService> _logger;

    public BuocWorkflowService(AppDbContext context, ILogger<BuocWorkflowService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static string SanitizeForLog(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        return Regex.Replace(input, @"\r\n?|\n", " ");
    }

    private static string NormalizeLoaiBuoc(string? loaiBuoc) => loaiBuoc switch
    {
        "Bắt đầu" => "BAT_DAU",
        "Thường" => "THUC_HIEN",
        "Kết thúc" => "KET_THUC",
        "APPROVAL" => "THUC_HIEN",
        "REVIEW" => "THUC_HIEN",
        "SIGN" => "THUC_HIEN",
        _ => loaiBuoc ?? "THUC_HIEN"
    };

    private static bool IsSpecialStepType(string loaiBuoc) =>
        StartStepTypes.Contains(loaiBuoc) || EndStepTypes.Contains(loaiBuoc);

    private static BuocWorkflowListItemDto ToListItemDto(BuocWorkflow step) => new()
    {
        Id = step.Id,
        MaBuoc = step.MaBuoc,
        TenBuoc = step.TenBuoc,
        LoaiBuoc = step.LoaiBuoc,
        VaiTroXuLyHoSoId = step.VaiTroXuLyHoSoId,
        SoNgayLapHoSo = step.SoNgayLapHoSo,
        VaiTroKyDuyetId = step.VaiTroKyDuyetId,
        SoNgayXuLy = step.SoNgayXuLy,
        LoaiHan = step.LoaiHan,
        NhomSongSong = step.NhomSongSong,
        LaBuocJoin = step.LaBuocJoin,
        ThuTu = step.ThuTu,
        NhomGiaiDoan = step.NhomGiaiDoan,
        MoTa = step.MoTa,
        DonViXuLyId = step.DonViXuLyId,
        DonViKyHoSoId = step.DonViKyHoSoId,
        BatBuocGhiChu = step.BatBuocGhiChu,
        BatBuocTaiLieu = step.BatBuocTaiLieu,
        BatBuocKyTruocChuyenBuoc = step.BatBuocKyTruocChuyenBuoc,
        BatBuocDungSLA = step.BatBuocDungSLA,
        NhanhWorkflowId = step.NhanhWorkflowId,
        ChoPhepTuChoi = step.ChoPhepTuChoi,
        ChoPhepBoQua = step.ChoPhepBoQua
    };

    private async Task ValidateBranchAsync(int workflowId, int? nhanhWorkflowId)
    {
        if (!nhanhWorkflowId.HasValue)
            return;

        var branchExists = await _context.NhanhWorkflows
            .Include(n => n.NhomNhanhWorkflow)
            .AnyAsync(n =>
                n.Id == nhanhWorkflowId.Value &&
                n.NhomNhanhWorkflow != null &&
                n.NhomNhanhWorkflow.WorkflowId == workflowId);

        if (!branchExists)
            throw new NotFoundException($"Branch not found in workflow: {nhanhWorkflowId.Value}");
    }

    private async Task<int> ResolveInsertOrderAsync(int workflowId, int requestedThuTu, string loaiBuoc)
    {
        var stepCount = await _context.BuocWorkflows.CountAsync(b => b.WorkflowId == workflowId);
        var insertOrder = requestedThuTu > 0
            ? Math.Clamp(requestedThuTu, 1, stepCount + 1)
            : stepCount + 1;

        if (!EndStepTypes.Contains(loaiBuoc))
        {
            var endStepOrder = await _context.BuocWorkflows
                .Where(b => b.WorkflowId == workflowId && EndStepTypes.Contains(b.LoaiBuoc))
                .OrderBy(b => b.ThuTu)
                .Select(b => (int?)b.ThuTu)
                .FirstOrDefaultAsync();

            if (endStepOrder.HasValue)
                insertOrder = Math.Min(insertOrder, endStepOrder.Value);
        }

        return insertOrder;
    }

    public async Task<List<BuocWorkflowListItemDto>> GetStepsByWorkflowIdAsync(int workflowId)
    {
        var exists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!exists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var steps = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId)
            .OrderBy(b => b.ThuTu)
            .ThenBy(b => b.Id)
            .ToListAsync();

        return steps.Select(ToListItemDto).ToList();
    }

    public async Task<BuocWorkflowListItemDto> CreateStepAsync(int workflowId, BuocWorkflowCreateRequest request)
    {
        request.LoaiBuoc = NormalizeLoaiBuoc(request.LoaiBuoc);
        if (IsSpecialStepType(request.LoaiBuoc))
            throw new AppException(400, "INVALID_STEP_TYPE",
                "Chi duoc tao buoc Thuong trong workflow da ton tai.");

        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        if (request.VaiTroXuLyHoSoId.HasValue)
        {
            var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroXuLyHoSoId.Value);
            if (!roleExists)
                throw new NotFoundException($"VaiTro not found: {request.VaiTroXuLyHoSoId.Value}");
        }

        if (request.VaiTroKyDuyetId.HasValue)
        {
            var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroKyDuyetId.Value);
            if (!roleExists)
                throw new NotFoundException($"VaiTro not found: {request.VaiTroKyDuyetId.Value}");
        }

        var duplicate = await _context.BuocWorkflows.AnyAsync(b =>
            b.WorkflowId == workflowId && b.MaBuoc == request.MaBuoc);
        if (duplicate)
            throw new ConflictException($"Buoc '{request.MaBuoc}' already exists in this workflow.");

        await ValidateBranchAsync(workflowId, request.NhanhWorkflowId);

        var insertOrder = await ResolveInsertOrderAsync(workflowId, request.ThuTu, request.LoaiBuoc);

        await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId && b.ThuTu >= insertOrder)
            .ExecuteUpdateAsync(set => set.SetProperty(b => b.ThuTu, b => b.ThuTu + 1));

        var entity = new BuocWorkflow
        {
            WorkflowId = workflowId,
            MaBuoc = request.MaBuoc,
            TenBuoc = request.TenBuoc,
            LoaiBuoc = request.LoaiBuoc,
            ThuTu = insertOrder,
            NhomGiaiDoan = request.NhomGiaiDoan,
            MoTa = request.MoTa,
            VaiTroXuLyHoSoId = request.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = request.SoNgayLapHoSo,
            VaiTroKyDuyetId = request.VaiTroKyDuyetId,
            SoNgayXuLy = request.SoNgayXuLy,
            LoaiHan = request.LoaiHan,
            NhomSongSong = request.NhomSongSong,
            LaBuocJoin = request.LaBuocJoin,
            ChoPhepTuChoi = request.ChoPhepTuChoi,
            ChoPhepBoQua = request.ChoPhepBoQua,
            DonViXuLyId = request.DonViXuLyId,
            DonViKyHoSoId = request.DonViKyHoSoId,
            BatBuocGhiChu = request.BatBuocGhiChu,
            BatBuocTaiLieu = request.BatBuocTaiLieu,
            BatBuocKyTruocChuyenBuoc = request.BatBuocKyTruocChuyenBuoc,
            BatBuocDungSLA = request.BatBuocDungSLA,
            NhanhWorkflowId = request.NhanhWorkflowId
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created step: id={StepId}, ma={MaBuoc}, workflow={WorkflowId}",
            entity.Id, SanitizeForLog(entity.MaBuoc), workflowId);

        return ToListItemDto(entity);
    }

    public async Task UpdateStepAsync(int id, BuocWorkflowUpdateRequest request)
    {
        if (request.LoaiBuoc != null)
        {
            request.LoaiBuoc = NormalizeLoaiBuoc(request.LoaiBuoc);
        }

        var entity = await _context.BuocWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"BuocWorkflow not found: {id}");

        if (request.TenBuoc != null)
            entity.TenBuoc = request.TenBuoc;

        if (request.LoaiBuoc != null)
        {
            var currentIsSpecial = IsSpecialStepType(entity.LoaiBuoc);
            var requestedIsSpecial = IsSpecialStepType(request.LoaiBuoc);

            if (!currentIsSpecial && requestedIsSpecial)
                throw new AppException(400, "INVALID_STEP_TYPE",
                    "Chi duoc tao buoc Bat dau/Ket thuc khi khoi tao workflow.");

            if (currentIsSpecial && request.LoaiBuoc != entity.LoaiBuoc)
                throw new AppException(400, "IMMUTABLE_STEP_TYPE",
                    "Khong the doi loai cua buoc Bat dau/Ket thuc.");

            entity.LoaiBuoc = request.LoaiBuoc;
        }

        if (request.VaiTroXuLyHoSoId.HasValue)
        {
            if (request.VaiTroXuLyHoSoId.Value == 0)
            {
                entity.VaiTroXuLyHoSoId = null;
            }
            else
            {
                var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroXuLyHoSoId.Value);
                if (!roleExists)
                    throw new NotFoundException($"VaiTro not found: {request.VaiTroXuLyHoSoId.Value}");
                entity.VaiTroXuLyHoSoId = request.VaiTroXuLyHoSoId;
            }
        }

        if (request.VaiTroKyDuyetId.HasValue)
        {
            if (request.VaiTroKyDuyetId.Value == 0)
            {
                entity.VaiTroKyDuyetId = null;
            }
            else
            {
                var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroKyDuyetId.Value);
                if (!roleExists)
                    throw new NotFoundException($"VaiTro not found: {request.VaiTroKyDuyetId.Value}");
                entity.VaiTroKyDuyetId = request.VaiTroKyDuyetId;
            }
        }

        if (request.SoNgayLapHoSo.HasValue)
            entity.SoNgayLapHoSo = request.SoNgayLapHoSo.Value;

        if (request.SoNgayXuLy.HasValue)
            entity.SoNgayXuLy = request.SoNgayXuLy.Value;

        if (request.LoaiHan != null)
            entity.LoaiHan = request.LoaiHan;

        if (request.NhomSongSong != null)
            entity.NhomSongSong = request.NhomSongSong;

        if (request.LaBuocJoin.HasValue)
            entity.LaBuocJoin = request.LaBuocJoin.Value;

        if (request.ChoPhepTuChoi.HasValue)
            entity.ChoPhepTuChoi = request.ChoPhepTuChoi.Value;

        if (request.ChoPhepBoQua.HasValue)
            entity.ChoPhepBoQua = request.ChoPhepBoQua.Value;

        // Designer extensions
        if (request.NhomGiaiDoan != null)
            entity.NhomGiaiDoan = request.NhomGiaiDoan;
        if (request.MoTa != null)
            entity.MoTa = request.MoTa;
        if (request.DonViXuLyId.HasValue)
            entity.DonViXuLyId = request.DonViXuLyId.Value == 0 ? null : request.DonViXuLyId;
        if (request.DonViKyHoSoId.HasValue)
            entity.DonViKyHoSoId = request.DonViKyHoSoId.Value == 0 ? null : request.DonViKyHoSoId;
        if (request.BatBuocGhiChu.HasValue)
            entity.BatBuocGhiChu = request.BatBuocGhiChu.Value;
        if (request.BatBuocTaiLieu.HasValue)
            entity.BatBuocTaiLieu = request.BatBuocTaiLieu.Value;
        if (request.BatBuocKyTruocChuyenBuoc.HasValue)
            entity.BatBuocKyTruocChuyenBuoc = request.BatBuocKyTruocChuyenBuoc.Value;
        if (request.BatBuocDungSLA.HasValue)
            entity.BatBuocDungSLA = request.BatBuocDungSLA.Value;
        if (request.NhanhWorkflowId.HasValue)
        {
            if (request.NhanhWorkflowId.Value == 0)
            {
                entity.NhanhWorkflowId = null;
            }
            else
            {
                await ValidateBranchAsync(entity.WorkflowId, request.NhanhWorkflowId);
                entity.NhanhWorkflowId = request.NhanhWorkflowId;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated step: id={StepId}", id);
    }

    public async Task DeleteStepAsync(int id)
    {
        var entity = await _context.BuocWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"BuocWorkflow not found: {id}");

        // Không cho xóa bước BẮT ĐẦU hoặc KẾT THÚC
        if (StartStepTypes.Contains(entity.LoaiBuoc))
            throw new AppException(400, "CANNOT_DELETE_START", "Không thể xóa bước Bắt đầu.");
        if (EndStepTypes.Contains(entity.LoaiBuoc))
            throw new AppException(400, "CANNOT_DELETE_END", "Không thể xóa bước Kết thúc.");

        var workflowActive = await _context.Workflows.AnyAsync(w => w.Id == entity.WorkflowId && w.TrangThaiHoatDong);
        if (workflowActive)
            throw new AppException(409, "WORKFLOW_ACTIVE",
                "Cannot delete step when its workflow template is active. Deactivate the workflow first.");

        var hasActiveInstance = await _context.WorkflowInstances.AnyAsync(
            i => i.TrangThai == "ACTIVE" && i.WorkflowStepInstances.Any(s => s.BuocWorkflowId == id));
        if (hasActiveInstance)
            throw new AppException(409, "HAS_ACTIVE_INSTANCE",
                "Cannot delete step referenced by an active workflow instance.");

        var incomingTransitions = await _context.ChuyenTiepWorkflows
            .Where(t => t.DenBuocId == id)
            .ToListAsync();
        var outgoingTransitions = await _context.ChuyenTiepWorkflows
            .Where(t => t.TuBuocId == id)
            .ToListAsync();

        if (entity.NhanhWorkflowId.HasValue)
        {
            var branchId = entity.NhanhWorkflowId.Value;
            var branch = await _context.NhanhWorkflows.FindAsync(branchId)
                ?? throw new NotFoundException($"Branch not found: {branchId}");

            var branchSteps = await _context.BuocWorkflows
                .Where(b => b.NhanhWorkflowId == branchId)
                .OrderBy(b => b.ThuTu)
                .ThenBy(b => b.Id)
                .ToListAsync();

            if (branchSteps.Count <= 1)
                throw new AppException(400, "BRANCH_EMPTY", "Khong duoc de nhanh song song rong.");

            var branchStepIndex = branchSteps.FindIndex(s => s.Id == id);
            var previousBranchStep = branchStepIndex > 0 ? branchSteps[branchStepIndex - 1] : null;
            var nextBranchStep = branchStepIndex >= 0 && branchStepIndex < branchSteps.Count - 1
                ? branchSteps[branchStepIndex + 1]
                : null;

            if (previousBranchStep is null && nextBranchStep is not null)
                branch.BuocDauTienId = nextBranchStep.Id;

            ChuyenTiepWorkflow? rewiredIncomingTransition = null;
            if (previousBranchStep is not null && nextBranchStep is not null)
            {
                rewiredIncomingTransition = incomingTransitions
                    .FirstOrDefault(t => t.TuBuocId == previousBranchStep.Id && t.HanhDong == "DUYET")
                    ?? incomingTransitions.FirstOrDefault(t => t.TuBuocId == previousBranchStep.Id);

                if (rewiredIncomingTransition is not null)
                    rewiredIncomingTransition.DenBuocId = nextBranchStep.Id;
            }

            _context.ChuyenTiepWorkflows.RemoveRange(outgoingTransitions);
            _context.ChuyenTiepWorkflows.RemoveRange(
                incomingTransitions.Where(t => rewiredIncomingTransition is null || t.Id != rewiredIncomingTransition.Id));
        }
        else
        {
            var hasTransitions = incomingTransitions.Count > 0 || outgoingTransitions.Count > 0;
            if (hasTransitions)
                throw new AppException(409, "HAS_TRANSITIONS",
                    "Cannot delete step with existing transitions. Remove transitions first.");
        }

        var laterSteps = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == entity.WorkflowId && b.ThuTu > entity.ThuTu)
            .ToListAsync();
        foreach (var step in laterSteps)
            step.ThuTu -= 1;

        _context.BuocWorkflows.Remove(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted step: id={StepId}, ma={MaBuoc}", id, entity.MaBuoc);
    }

    public async Task<List<ChuyenTiepWorkflowListItemDto>> GetTransitionsByWorkflowIdAsync(int workflowId)
    {
        var exists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!exists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var stepIds = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId)
            .Select(b => b.Id)
            .ToListAsync();

        return await _context.ChuyenTiepWorkflows
            .Where(t => stepIds.Contains(t.TuBuocId) || stepIds.Contains(t.DenBuocId))
            .OrderBy(t => t.Id)
            .Select(t => new ChuyenTiepWorkflowListItemDto
            {
                Id = t.Id,
                TuBuocId = t.TuBuocId,
                DenBuocId = t.DenBuocId,
                HanhDong = t.HanhDong,
                DieuKien = t.DieuKien
            })
            .ToListAsync();
    }

    public async Task<ChuyenTiepWorkflowListItemDto> CreateTransitionAsync(int workflowId, ChuyenTiepWorkflowCreateRequest request)
    {
        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var tuBuoc = await _context.BuocWorkflows.FindAsync(request.TuBuocId)
            ?? throw new NotFoundException($"TuBuoc not found: {request.TuBuocId}");
        var denBuoc = await _context.BuocWorkflows.FindAsync(request.DenBuocId)
            ?? throw new NotFoundException($"DenBuoc not found: {request.DenBuocId}");

        if (tuBuoc.WorkflowId != workflowId || denBuoc.WorkflowId != workflowId)
            throw new AppException(400, "CROSS_WORKFLOW",
                "Both steps must belong to the same workflow.");

        var duplicate = await _context.ChuyenTiepWorkflows.AnyAsync(
            t => t.TuBuocId == request.TuBuocId && t.HanhDong == request.HanhDong);
        if (duplicate)
            throw new ConflictException($"Transition with action '{request.HanhDong}' already exists from step {request.TuBuocId}.");

        var entity = new ChuyenTiepWorkflow
        {
            TuBuocId = request.TuBuocId,
            DenBuocId = request.DenBuocId,
            HanhDong = request.HanhDong,
            DieuKien = request.DieuKien,
            DieuKienKichHoat = request.DieuKienKichHoat ?? "LUON",
            KetQuaApDung = request.KetQuaApDung,
            VaiTroApDungId = request.VaiTroApDungId,
            BatBuocGhiChu = request.BatBuocGhiChu,
            BatBuocTaiLieu = request.BatBuocTaiLieu,
            HuongXuLyKhongDuyet = request.HuongXuLyKhongDuyet
        };

        _context.ChuyenTiepWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created transition: id={TransId}, tu={TuBuoc}, den={DenBuoc}, action={HanhDong}",
            entity.Id, entity.TuBuocId, entity.DenBuocId, SanitizeForLog(entity.HanhDong));

        return new ChuyenTiepWorkflowListItemDto
        {
            Id = entity.Id,
            TuBuocId = entity.TuBuocId,
            DenBuocId = entity.DenBuocId,
            HanhDong = entity.HanhDong,
            DieuKien = entity.DieuKien
        };
    }

    public async Task DeleteTransitionAsync(int id)
    {
        var entity = await _context.ChuyenTiepWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"ChuyenTiepWorkflow not found: {id}");

        _context.ChuyenTiepWorkflows.Remove(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted transition: id={TransId}", id);
    }

    // ══════════════════════════════════════════════════════════════════
    //  Step actions: insert-after, clone, reorder
    // ══════════════════════════════════════════════════════════════════

    public async Task<BuocWorkflowListItemDto> InsertStepAfterAsync(int workflowId, int stepId, InsertStepAfterRequest request)
    {
        request.LoaiBuoc = NormalizeLoaiBuoc(request.LoaiBuoc);
        if (IsSpecialStepType(request.LoaiBuoc))
            throw new AppException(400, "INVALID_STEP_TYPE",
                "Chi duoc chen buoc Thuong sau mot buoc khac.");

        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var afterStep = await _context.BuocWorkflows.FindAsync(stepId)
            ?? throw new NotFoundException($"Step not found: {stepId}");

        if (afterStep.WorkflowId != workflowId)
            throw new AppException(400, "CROSS_WORKFLOW", "Step does not belong to this workflow.");

        if (EndStepTypes.Contains(afterStep.LoaiBuoc) && !EndStepTypes.Contains(request.LoaiBuoc))
            throw new AppException(400, "INVALID_AFTER_STEP",
                "Khong duoc chen buoc thuong sau buoc KET_THUC.");

        // Check duplicate MaBuoc
        var duplicateMa = await _context.BuocWorkflows.AnyAsync(b =>
            b.WorkflowId == workflowId && b.MaBuoc == request.MaBuoc);
        if (duplicateMa)
            throw new ConflictException($"MaBuoc '{request.MaBuoc}' da ton tai trong workflow nay.");

        // Shift ThuTu of later steps
        await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId && b.ThuTu > afterStep.ThuTu)
            .ExecuteUpdateAsync(set => set.SetProperty(b => b.ThuTu, b => b.ThuTu + 1));

        var entity = new BuocWorkflow
        {
            WorkflowId = workflowId,
            MaBuoc = request.MaBuoc,
            TenBuoc = request.TenBuoc,
            LoaiBuoc = request.LoaiBuoc,
            ThuTu = afterStep.ThuTu + 1,
            VaiTroXuLyHoSoId = request.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = request.SoNgayLapHoSo,
            VaiTroKyDuyetId = request.VaiTroKyDuyetId,
            SoNgayXuLy = request.SoNgayXuLy,
            LoaiHan = request.LoaiHan,
            ChoPhepTuChoi = true,
            ChoPhepBoQua = false,
            BatBuocGhiChu = request.BatBuocGhiChu,
            BatBuocTaiLieu = request.BatBuocTaiLieu,
            BatBuocKyTruocChuyenBuoc = request.BatBuocKyTruocChuyenBuoc,
            BatBuocDungSLA = request.BatBuocDungSLA,
            DonViXuLyId = request.DonViXuLyId,
            DonViKyHoSoId = request.DonViKyHoSoId,
            NhanhWorkflowId = afterStep.NhanhWorkflowId
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        // Create default DUYET transition to next step
        if (request.CreateDefaultTransition)
        {
            var nextStep = await _context.BuocWorkflows
                .Where(b => b.WorkflowId == workflowId && b.ThuTu == entity.ThuTu + 1)
                .FirstOrDefaultAsync();

            if (nextStep != null)
            {
                _context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
                {
                    TuBuocId = entity.Id,
                    DenBuocId = nextStep.Id,
                    HanhDong = "DUYET",
                    DieuKienKichHoat = "LUON"
                });
            }

            // Update transition from afterStep to point to new step
            var existingTransition = await _context.ChuyenTiepWorkflows
                .Where(t => t.TuBuocId == afterStep.Id && t.HanhDong == "DUYET")
                .FirstOrDefaultAsync();
            if (existingTransition != null)
                existingTransition.DenBuocId = entity.Id;

            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Inserted step after {AfterStepId}: id={NewStepId}, ma={MaBuoc}",
            stepId, entity.Id, SanitizeForLog(entity.MaBuoc));

        return ToListItemDto(entity);
    }

    public async Task<BuocWorkflowListItemDto> CloneStepAsync(int workflowId, int stepId, CloneStepRequest request)
    {
        var source = await _context.BuocWorkflows.FindAsync(stepId)
            ?? throw new NotFoundException($"Step not found: {stepId}");

        if (source.WorkflowId != workflowId)
            throw new AppException(400, "CROSS_WORKFLOW", "Step does not belong to this workflow.");

        // Check duplicate MaBuoc
        var duplicateMa = await _context.BuocWorkflows.AnyAsync(b =>
            b.WorkflowId == workflowId && b.MaBuoc == request.MaBuocMoi);
        if (duplicateMa)
            throw new ConflictException($"MaBuoc '{request.MaBuocMoi}' da ton tai trong workflow nay.");

        // Shift ThuTu
        await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId && b.ThuTu > source.ThuTu)
            .ExecuteUpdateAsync(set => set.SetProperty(b => b.ThuTu, b => b.ThuTu + 1));

        var entity = new BuocWorkflow
        {
            WorkflowId = workflowId,
            MaBuoc = request.MaBuocMoi,
            TenBuoc = request.TenBuocMoi,
            LoaiBuoc = source.LoaiBuoc,
            ThuTu = source.ThuTu + 1,
            VaiTroXuLyHoSoId = source.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = source.SoNgayLapHoSo,
            VaiTroKyDuyetId = source.VaiTroKyDuyetId,
            SoNgayXuLy = source.SoNgayXuLy,
            LoaiHan = source.LoaiHan,
            NhomSongSong = source.NhomSongSong,
            LaBuocJoin = source.LaBuocJoin,
            ChoPhepTuChoi = source.ChoPhepTuChoi,
            ChoPhepBoQua = source.ChoPhepBoQua,
            BatBuocGhiChu = source.BatBuocGhiChu,
            BatBuocTaiLieu = source.BatBuocTaiLieu,
            BatBuocKyTruocChuyenBuoc = source.BatBuocKyTruocChuyenBuoc,
            BatBuocDungSLA = source.BatBuocDungSLA,
            NhomGiaiDoan = source.NhomGiaiDoan,
            MoTa = source.MoTa,
            DonViXuLyId = source.DonViXuLyId,
            DonViKyHoSoId = source.DonViKyHoSoId,
            NhanhWorkflowId = source.NhanhWorkflowId
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cloned step {SourceId} -> new step id={NewId}, ma={MaBuoc}",
            stepId, entity.Id, SanitizeForLog(entity.MaBuoc));

        return ToListItemDto(entity);
    }

    public async Task ReorderStepsAsync(int workflowId, ReorderStepsRequest request)
    {
        var exists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!exists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var stepIds = request.Steps.Select(s => s.Id).ToHashSet();

        var steps = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId && stepIds.Contains(b.Id))
            .ToListAsync();

        if (steps.Count != request.Steps.Count)
            throw new AppException(400, "INVALID_STEP", "One or more steps not found in this workflow.");

        foreach (var stepDto in request.Steps)
        {
            var step = steps.First(s => s.Id == stepDto.Id);
            step.ThuTu = stepDto.ThuTu;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Reordered {Count} steps for workflow {WorkflowId}", request.Steps.Count, workflowId);
    }
}
