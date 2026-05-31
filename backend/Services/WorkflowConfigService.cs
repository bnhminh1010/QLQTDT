using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class WorkflowConfigService : IWorkflowConfigService
{
    private const int MaWorkflowSuffixLength = 3;

    private readonly AppDbContext _context;
    private readonly ILogger<WorkflowConfigService> _logger;

    public WorkflowConfigService(AppDbContext context, ILogger<WorkflowConfigService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<WorkflowListItemDto>> GetWorkflowsAsync()
    {
        return await _context.Workflows
            .OrderBy(w => w.Id)
            .Select(w => new WorkflowListItemDto
            {
                Id = w.Id,
                TenWorkflow = w.TenWorkflow,
                HinhThucId = w.HinhThucId,
                TrangThaiHoatDong = w.TrangThaiHoatDong
            })
            .ToListAsync();
    }

    public async Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request)
    {
        var hinhThucExists = await _context.HinhThucDauThaus
            .AnyAsync(h => h.Id == request.HinhThucId);
        if (!hinhThucExists)
            throw new NotFoundException($"HinhThucDauThau not found: {request.HinhThucId}");

        var tenWorkflow = request.TenWorkflow.Trim();

        var duplicate = await _context.Workflows.AnyAsync(w =>
            w.TenWorkflow == tenWorkflow
            && w.HinhThucId == request.HinhThucId);
        if (duplicate)
            throw new ConflictException("Workflow name already exists for the same bidding method.");

        var entity = new Workflow
        {
            MaWorkflow = await GenerateMaWorkflowAsync(),
            TenWorkflow = tenWorkflow,
            HinhThucId = request.HinhThucId,
            TrangThaiHoatDong = true
        };

        _context.Workflows.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created workflow: id={WorkflowId}, ma={MaWorkflow}", entity.Id, entity.MaWorkflow);

        return new WorkflowCreateResponse
        {
            Id = entity.Id,
            TenWorkflow = entity.TenWorkflow
        };
    }

    public async Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request)
    {
        var entity = await _context.Workflows.FindAsync(id)
            ?? throw new NotFoundException($"Workflow not found: {id}");

        if (request.HinhThucId.HasValue)
        {
            var hinhThucExists = await _context.HinhThucDauThaus
                .AnyAsync(h => h.Id == request.HinhThucId.Value);
            if (!hinhThucExists)
                throw new NotFoundException($"HinhThucDauThau not found: {request.HinhThucId.Value}");
        }

        if (request.TenWorkflow != null)
            entity.TenWorkflow = request.TenWorkflow.Trim();

        if (request.HinhThucId.HasValue)
            entity.HinhThucId = request.HinhThucId.Value;

        if (request.TrangThaiHoatDong.HasValue)
            entity.TrangThaiHoatDong = request.TrangThaiHoatDong.Value;

        var duplicate = await _context.Workflows.AnyAsync(w =>
            w.Id != id
            && w.TenWorkflow == entity.TenWorkflow
            && w.HinhThucId == entity.HinhThucId);
        if (duplicate)
            throw new ConflictException("Workflow name already exists for the same bidding method.");

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated workflow: id={WorkflowId}", id);
    }

    public async Task DeleteWorkflowAsync(int id)
    {
        var entity = await _context.Workflows.FindAsync(id)
            ?? throw new NotFoundException($"Workflow not found: {id}");

        var hasActiveInstance = await _context.WorkflowInstances
            .AnyAsync(i => i.WorkflowId == id && i.TrangThai == "ACTIVE");
        if (hasActiveInstance || entity.TrangThaiHoatDong)
            throw new AppException(400, "HAS_INSTANCE", "Workflow dang hoat dong hoac co workflow instance active nen khong the xoa.");

        _context.Workflows.Remove(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted workflow: id={WorkflowId}", id);
    }

    private async Task<string> GenerateMaWorkflowAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"QT-{year}-";

        var existingCodes = await _context.Workflows
            .Where(w => w.MaWorkflow.StartsWith(prefix))
            .Select(w => w.MaWorkflow)
            .ToListAsync();

        var maxNumber = existingCodes
            .Select(code => code.Length > prefix.Length ? code[prefix.Length..] : string.Empty)
            .Select(suffix => int.TryParse(suffix, out var number) ? number : 0)
            .DefaultIfEmpty(0)
            .Max();

        var nextNumber = maxNumber + 1;
        var formatted = nextNumber.ToString().PadLeft(MaWorkflowSuffixLength, '0');
        return $"{prefix}{formatted}";
    }
}
