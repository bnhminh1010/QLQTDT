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

    public async Task<List<BuocWorkflowListItemDto>> GetStepsByWorkflowIdAsync(int workflowId)
    {
        var exists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!exists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        return await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflowId)
            .OrderBy(b => b.Id)
            .Select(b => new BuocWorkflowListItemDto
            {
                Id = b.Id,
                MaBuoc = b.MaBuoc,
                TenBuoc = b.TenBuoc,
                LoaiBuoc = b.LoaiBuoc,
                VaiTroXuLyHoSoId = b.VaiTroXuLyHoSoId,
                SoNgayLapHoSo = b.SoNgayLapHoSo,
                VaiTroKyDuyetId = b.VaiTroKyDuyetId,
                SoNgayXuLy = b.SoNgayXuLy,
                LoaiHan = b.LoaiHan,
                NhomSongSong = b.NhomSongSong,
                LaBuocJoin = b.LaBuocJoin,
                ChoPhepTuChoi = b.ChoPhepTuChoi,
                ChoPhepBoQua = b.ChoPhepBoQua
            })
            .ToListAsync();
    }

    public async Task<BuocWorkflowListItemDto> CreateStepAsync(int workflowId, BuocWorkflowCreateRequest request)
    {
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

        var entity = new BuocWorkflow
        {
            WorkflowId = workflowId,
            MaBuoc = request.MaBuoc,
            TenBuoc = request.TenBuoc,
            LoaiBuoc = request.LoaiBuoc,
            VaiTroXuLyHoSoId = request.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = request.SoNgayLapHoSo,
            VaiTroKyDuyetId = request.VaiTroKyDuyetId,
            SoNgayXuLy = request.SoNgayXuLy,
            LoaiHan = request.LoaiHan,
            NhomSongSong = request.NhomSongSong,
            LaBuocJoin = request.LaBuocJoin,
            ChoPhepTuChoi = request.ChoPhepTuChoi,
            ChoPhepBoQua = request.ChoPhepBoQua
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created step: id={StepId}, ma={MaBuoc}, workflow={WorkflowId}",
            entity.Id, SanitizeForLog(entity.MaBuoc), workflowId);

        return new BuocWorkflowListItemDto
        {
            Id = entity.Id,
            MaBuoc = entity.MaBuoc,
            TenBuoc = entity.TenBuoc,
            LoaiBuoc = entity.LoaiBuoc,
            VaiTroXuLyHoSoId = entity.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = entity.SoNgayLapHoSo,
            VaiTroKyDuyetId = entity.VaiTroKyDuyetId,
            SoNgayXuLy = entity.SoNgayXuLy,
            LoaiHan = entity.LoaiHan,
            NhomSongSong = entity.NhomSongSong,
            LaBuocJoin = entity.LaBuocJoin,
            ChoPhepTuChoi = entity.ChoPhepTuChoi,
            ChoPhepBoQua = entity.ChoPhepBoQua
        };
    }

    public async Task UpdateStepAsync(int id, BuocWorkflowUpdateRequest request)
    {
        var entity = await _context.BuocWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"BuocWorkflow not found: {id}");

        if (request.TenBuoc != null)
            entity.TenBuoc = request.TenBuoc;

        if (request.LoaiBuoc != null)
            entity.LoaiBuoc = request.LoaiBuoc;

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

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated step: id={StepId}", id);
    }

    public async Task DeleteStepAsync(int id)
    {
        var entity = await _context.BuocWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"BuocWorkflow not found: {id}");

        // Không cho xóa bước BẮT ĐẦU hoặc KẾT THÚC
        if (entity.LoaiBuoc == "BAT_DAU")
            throw new AppException(400, "CANNOT_DELETE_START", "Không thể xóa bước Bắt đầu.");
        if (entity.LoaiBuoc == "KET_THUC")
            throw new AppException(400, "CANNOT_DELETE_END", "Không thể xóa bước Kết thúc.");

        var workflowActive = await _context.Workflows.AnyAsync(w => w.Id == entity.WorkflowId && w.TrangThaiHoatDong);
        if (workflowActive)
            throw new AppException(409, "WORKFLOW_ACTIVE",
                "Cannot delete step when its workflow template is active. Deactivate the workflow first.");

        var hasTransitions = await _context.ChuyenTiepWorkflows.AnyAsync(
            t => t.TuBuocId == id || t.DenBuocId == id);
        if (hasTransitions)
            throw new AppException(409, "HAS_TRANSITIONS",
                "Cannot delete step with existing transitions. Remove transitions first.");

        var hasActiveInstance = await _context.WorkflowInstances.AnyAsync(
            i => i.TrangThai == "ACTIVE" && i.WorkflowStepInstances.Any(s => s.BuocWorkflowId == id));
        if (hasActiveInstance)
            throw new AppException(409, "HAS_ACTIVE_INSTANCE",
                "Cannot delete step referenced by an active workflow instance.");

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
            DieuKien = request.DieuKien
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
        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var afterStep = await _context.BuocWorkflows.FindAsync(stepId)
            ?? throw new NotFoundException($"Step not found: {stepId}");

        if (afterStep.WorkflowId != workflowId)
            throw new AppException(400, "CROSS_WORKFLOW", "Step does not belong to this workflow.");

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
            DonViKyHoSoId = request.DonViKyHoSoId
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

        return new BuocWorkflowListItemDto
        {
            Id = entity.Id,
            MaBuoc = entity.MaBuoc,
            TenBuoc = entity.TenBuoc,
            LoaiBuoc = entity.LoaiBuoc,
            ThuTu = entity.ThuTu,
            VaiTroXuLyHoSoId = entity.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = entity.SoNgayLapHoSo,
            VaiTroKyDuyetId = entity.VaiTroKyDuyetId,
            SoNgayXuLy = entity.SoNgayXuLy,
            LoaiHan = entity.LoaiHan,
            ChoPhepTuChoi = entity.ChoPhepTuChoi,
            ChoPhepBoQua = entity.ChoPhepBoQua
        };
    }

    public async Task<BuocWorkflowListItemDto> CloneStepAsync(int workflowId, int stepId, CloneStepRequest request)
    {
        var source = await _context.BuocWorkflows.FindAsync(stepId)
            ?? throw new NotFoundException($"Step not found: {stepId}");

        if (source.WorkflowId != workflowId)
            throw new AppException(400, "CROSS_WORKFLOW", "Step does not belong to this workflow.");

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
            BatBuocDungSLA = source.BatBuocDungSLA
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cloned step {SourceId} -> new step id={NewId}, ma={MaBuoc}",
            stepId, entity.Id, SanitizeForLog(entity.MaBuoc));

        return new BuocWorkflowListItemDto
        {
            Id = entity.Id,
            MaBuoc = entity.MaBuoc,
            TenBuoc = entity.TenBuoc,
            LoaiBuoc = entity.LoaiBuoc,
            ThuTu = entity.ThuTu,
            VaiTroXuLyHoSoId = entity.VaiTroXuLyHoSoId,
            SoNgayLapHoSo = entity.SoNgayLapHoSo,
            VaiTroKyDuyetId = entity.VaiTroKyDuyetId,
            SoNgayXuLy = entity.SoNgayXuLy,
            LoaiHan = entity.LoaiHan,
            ChoPhepTuChoi = entity.ChoPhepTuChoi,
            ChoPhepBoQua = entity.ChoPhepBoQua
        };
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
