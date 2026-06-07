using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
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

    public async Task<PagedResult<WorkflowListItemDto>> GetWorkflowsAsync(string? search, int page, int pageSize)
    {
        var query = _context.Workflows.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(w => w.TenWorkflow.Contains(keyword) || w.MaWorkflow.Contains(keyword));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(w => w.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WorkflowListItemDto
            {
                Id = w.Id,
                TenWorkflow = w.TenWorkflow,
                HinhThucId = w.HinhThucId,
                TrangThaiHoatDong = w.TrangThaiHoatDong
            })
            .ToListAsync();

        return new PagedResult<WorkflowListItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request, int? nguoiTaoId)
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

        await using var tx = await _context.Database.BeginTransactionAsync();

        _context.Workflows.Add(entity);
        await _context.SaveChangesAsync();

        _context.WorkflowVersionHistories.Add(new WorkflowVersionHistory
        {
            WorkflowId = entity.Id,
            VersionNumber = 1,
            SnapshotData = await SerializeSnapshotAsync(entity),
            NgayTao = DateTime.UtcNow,
            NguoiTaoId = nguoiTaoId
        });
        await _context.SaveChangesAsync();

        await tx.CommitAsync();

        _logger.LogInformation("Created workflow: id={WorkflowId}, ma={MaWorkflow}", entity.Id, entity.MaWorkflow);

        return new WorkflowCreateResponse
        {
            Id = entity.Id,
            TenWorkflow = entity.TenWorkflow
        };
    }

    public async Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request, int? nguoiTaoId)
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

        var nextVersion = await _context.WorkflowVersionHistories
            .Where(v => v.WorkflowId == id)
            .MaxAsync(v => (int?)v.VersionNumber) ?? 0;

        _context.WorkflowVersionHistories.Add(new WorkflowVersionHistory
        {
            WorkflowId = id,
            VersionNumber = nextVersion + 1,
            SnapshotData = await SerializeSnapshotAsync(entity),
            NgayTao = DateTime.UtcNow,
            NguoiTaoId = nguoiTaoId
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated workflow: id={WorkflowId}, version={Version}", id, nextVersion + 1);
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

    public async Task<List<WorkflowVersionListItemDto>> GetVersionsAsync(int workflowId)
    {
        var workflowExists = await _context.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        return await _context.WorkflowVersionHistories
            .Where(v => v.WorkflowId == workflowId)
            .OrderByDescending(v => v.VersionNumber)
            .Select(v => new WorkflowVersionListItemDto
            {
                Id = v.Id,
                VersionNumber = v.VersionNumber,
                NgayTao = v.NgayTao,
                NguoiTaoId = v.NguoiTaoId,
                NguoiTaoHoTen = v.NguoiTao != null ? v.NguoiTao.HoTen : null
            })
            .ToListAsync();
    }

    public async Task<WorkflowVersionDetailDto> GetVersionByIdAsync(int workflowId, long versionId)
    {
        var version = await _context.WorkflowVersionHistories
            .Include(v => v.NguoiTao)
            .Where(v => v.WorkflowId == workflowId && v.Id == versionId)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Version {versionId} not found for workflow {workflowId}");

        return new WorkflowVersionDetailDto
        {
            Id = version.Id,
            VersionNumber = version.VersionNumber,
            NgayTao = version.NgayTao,
            NguoiTaoId = version.NguoiTaoId,
            NguoiTaoHoTen = version.NguoiTao?.HoTen,
            SnapshotData = version.SnapshotData
        };
    }

    private async Task<string> SerializeSnapshotAsync(Workflow workflow)
    {
        var buocs = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == workflow.Id)
            .ToListAsync();

        var buocIds = buocs.Select(b => b.Id).ToList();

        var chuyenTieps = buocIds.Count > 0
            ? await _context.ChuyenTiepWorkflows
                .Where(c => buocIds.Contains(c.TuBuocId))
                .ToListAsync()
            : [];

        var snapshot = new WorkflowSnapshotDto
        {
            WorkflowId = workflow.Id,
            MaWorkflow = workflow.MaWorkflow,
            TenWorkflow = workflow.TenWorkflow,
            HinhThucId = workflow.HinhThucId,
            TrangThaiHoatDong = workflow.TrangThaiHoatDong,
            BuocWorkflows = buocs.Select(b => new BuocSnapshotDto
            {
                Id = b.Id,
                MaBuoc = b.MaBuoc,
                TenBuoc = b.TenBuoc,
                LoaiBuoc = b.LoaiBuoc,
                VaiTroXuLyId = b.VaiTroXuLyId,
                KhoaPhongXuLyId = b.KhoaPhongXuLyId,
                SoNgaySLA = b.SoNgaySLA,
                ChoPhepTuChoi = b.ChoPhepTuChoi,
                ChoPhepBoQua = b.ChoPhepBoQua
            }).ToList(),
            ChuyenTiepWorkflows = chuyenTieps.Select(c => new ChuyenTiepSnapshotDto
            {
                Id = c.Id,
                TuBuocId = c.TuBuocId,
                DenBuocId = c.DenBuocId,
                HanhDong = c.HanhDong,
                DieuKien = c.DieuKien
            }).ToList()
        };

        return JsonSerializer.Serialize(snapshot);
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
