using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

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
                VaiTroXuLyId = b.VaiTroXuLyId,
                KhoaPhongXuLyId = b.KhoaPhongXuLyId,
                ChoPhepBoQua = b.ChoPhepBoQua,
                SoNgaySLA = b.SoNgaySLA
            })
            .ToListAsync();
    }

    public async Task<BuocWorkflowListItemDto> CreateStepAsync(int workflowId, BuocWorkflowCreateRequest request)
    {
        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        if (request.VaiTroXuLyId.HasValue)
        {
            var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroXuLyId.Value);
            if (!roleExists)
                throw new NotFoundException($"VaiTro not found: {request.VaiTroXuLyId.Value}");
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
            VaiTroXuLyId = request.VaiTroXuLyId,
            ChoPhepBoQua = request.ChoPhepBoQua,
            SoNgaySLA = request.SoNgaySLA,
            KhoaPhongXuLyId = request.KhoaPhongXuLyId
        };

        _context.BuocWorkflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created step: id={StepId}, ma={MaBuoc}, workflow={WorkflowId}",
            entity.Id, entity.MaBuoc, workflowId);

        return new BuocWorkflowListItemDto
        {
            Id = entity.Id,
            MaBuoc = entity.MaBuoc,
            TenBuoc = entity.TenBuoc,
            LoaiBuoc = entity.LoaiBuoc,
            VaiTroXuLyId = entity.VaiTroXuLyId,
            ChoPhepBoQua = entity.ChoPhepBoQua,
            SoNgaySLA = entity.SoNgaySLA,
            KhoaPhongXuLyId = entity.KhoaPhongXuLyId
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

        if (request.VaiTroXuLyId.HasValue)
        {
            if (request.VaiTroXuLyId.Value == 0)
            {
                entity.VaiTroXuLyId = null;
            }
            else
            {
                var roleExists = await _context.VaiTros.AnyAsync(r => r.Id == request.VaiTroXuLyId.Value);
                if (!roleExists)
                    throw new NotFoundException($"VaiTro not found: {request.VaiTroXuLyId.Value}");
                entity.VaiTroXuLyId = request.VaiTroXuLyId;
            }
        }

        if (request.ChoPhepBoQua.HasValue)
            entity.ChoPhepBoQua = request.ChoPhepBoQua.Value;

        if (request.SoNgaySLA.HasValue)
            entity.SoNgaySLA = request.SoNgaySLA.Value;

        if (request.KhoaPhongXuLyId.HasValue)
        {
            if (request.KhoaPhongXuLyId.Value == 0)
                entity.KhoaPhongXuLyId = null;
            else
                entity.KhoaPhongXuLyId = request.KhoaPhongXuLyId.Value;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated step: id={StepId}", id);
    }

    public async Task DeleteStepAsync(int id)
    {
        var entity = await _context.BuocWorkflows.FindAsync(id)
            ?? throw new NotFoundException($"BuocWorkflow not found: {id}");

        var workflowActive = await _context.Workflows.AnyAsync(w => w.Id == entity.WorkflowId && w.TrangThaiHoatDong);
        if (workflowActive)
            throw new AppException(400, "WORKFLOW_ACTIVE",
                "Cannot delete step when its workflow template is active. Deactivate the workflow first.");

        var hasTransitions = await _context.ChuyenTiepWorkflows.AnyAsync(
            t => t.TuBuocId == id || t.DenBuocId == id);
        if (hasTransitions)
            throw new AppException(400, "HAS_TRANSITIONS",
                "Cannot delete step with existing transitions. Remove transitions first.");

        var hasActiveInstance = await _context.WorkflowInstances.AnyAsync(
            i => i.BuocHienTaiId == id && i.TrangThai == "ACTIVE");
        if (hasActiveInstance)
            throw new AppException(400, "HAS_ACTIVE_INSTANCE",
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
            entity.Id, entity.TuBuocId, entity.DenBuocId, entity.HanhDong);

        return new ChuyenTiepWorkflowListItemDto
        {
            Id = entity.Id,
            TuBuocId = entity.TuBuocId,
            DenBuocId = entity.DenBuocId,
            HanhDong = entity.HanhDong,
            DieuKien = entity.DieuKien
        };
    }
}
