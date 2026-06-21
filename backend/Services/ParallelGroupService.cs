using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class ParallelGroupService : IParallelGroupService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ParallelGroupService> _logger;

    public ParallelGroupService(AppDbContext db, ILogger<ParallelGroupService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<ParallelGroupDto>> GetGroupsAsync(int workflowId)
    {
        var groups = await _db.NhomNhanhWorkflows
            .Include(g => g.Nhanhs.OrderBy(n => n.ThuTu))
            .Where(g => g.WorkflowId == workflowId)
            .ToListAsync();

        return groups.Select(g => ToGroupDto(g)).ToList();
    }

    public async Task<ParallelGroupDto> CreateGroupAsync(int workflowId, ParallelGroupCreateRequest request)
    {
        var workflowExists = await _db.Workflows.AnyAsync(w => w.Id == workflowId);
        if (!workflowExists)
            throw new NotFoundException($"Workflow not found: {workflowId}");

        var splitStepExists = await _db.BuocWorkflows.AnyAsync(b => b.Id == request.BuocTachNhanhId && b.WorkflowId == workflowId);
        if (!splitStepExists)
            throw new NotFoundException("BuocTachNhanh not found in this workflow.");

        var mergeStepExists = await _db.BuocWorkflows.AnyAsync(b => b.Id == request.BuocSauHopNhatId && b.WorkflowId == workflowId);
        if (!mergeStepExists)
            throw new NotFoundException("BuocSauHopNhat not found in this workflow.");

        var entity = new NhomNhanhWorkflow
        {
            WorkflowId = workflowId,
            BuocTachNhanhId = request.BuocTachNhanhId,
            TenNhom = request.TenNhom,
            DieuKienHopNhat = request.DieuKienHopNhat,
            SoNhanhHopNhatToiThieu = request.DieuKienHopNhat == "COUNT" ? request.SoNhanhHopNhatToiThieu : null,
            BuocSauHopNhatId = request.BuocSauHopNhatId,
            NgayTao = DateTime.UtcNow
        };

        _db.NhomNhanhWorkflows.Add(entity);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created parallel group: id={GroupId}, workflow={WorkflowId}, split={SplitId}",
            entity.Id, workflowId, request.BuocTachNhanhId);

        return ToGroupDto(entity);
    }

    public async Task UpdateGroupAsync(int workflowId, int groupId, ParallelGroupUpdateRequest request)
    {
        var group = await _db.NhomNhanhWorkflows
            .FirstOrDefaultAsync(g => g.Id == groupId && g.WorkflowId == workflowId)
            ?? throw new NotFoundException($"Parallel group not found: {groupId}");

        if (request.TenNhom != null) group.TenNhom = request.TenNhom;
        if (request.DieuKienHopNhat != null) group.DieuKienHopNhat = request.DieuKienHopNhat;
        if (request.BuocSauHopNhatId.HasValue) group.BuocSauHopNhatId = request.BuocSauHopNhatId.Value;

        group.SoNhanhHopNhatToiThieu = request.DieuKienHopNhat == "COUNT"
            ? request.SoNhanhHopNhatToiThieu
            : (request.DieuKienHopNhat == null ? group.SoNhanhHopNhatToiThieu : null);
        if (request.SoNhanhHopNhatToiThieu.HasValue && request.DieuKienHopNhat != "COUNT")
            group.SoNhanhHopNhatToiThieu = null;

        group.NgayCapNhat = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated parallel group: id={GroupId}", groupId);
    }

    public async Task DeleteGroupAsync(int workflowId, int groupId)
    {
        var group = await _db.NhomNhanhWorkflows
            .Include(g => g.Nhanhs)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.WorkflowId == workflowId)
            ?? throw new NotFoundException($"Parallel group not found: {groupId}");

        // Delete all branches first
        _db.NhanhWorkflows.RemoveRange(group.Nhanhs);
        _db.NhomNhanhWorkflows.Remove(group);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deleted parallel group: id={GroupId}, branches={BranchCount}",
            groupId, group.Nhanhs.Count);
    }

    public async Task<ParallelBranchDto> CreateBranchAsync(int groupId, ParallelBranchCreateRequest request)
    {
        var group = await _db.NhomNhanhWorkflows.FindAsync(groupId)
            ?? throw new NotFoundException($"Parallel group not found: {groupId}");

        var firstStepExists = await _db.BuocWorkflows.AnyAsync(b => b.Id == request.BuocDauTienId && b.WorkflowId == group.WorkflowId);
        if (!firstStepExists)
            throw new NotFoundException("BuocDauTien not found in this workflow.");

        var entity = new NhanhWorkflow
        {
            NhomNhanhWorkflowId = groupId,
            MaNhanh = request.MaNhanh,
            TenNhanh = request.TenNhanh,
            ThuTu = request.ThuTu,
            DonViXuLyId = request.DonViXuLyId,
            VaiTroXuLyId = request.VaiTroXuLyId,
            ThoiHanNgay = request.ThoiHanNgay,
            LoaiHan = request.LoaiHan,
            BuocDauTienId = request.BuocDauTienId
        };

        _db.NhanhWorkflows.Add(entity);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created branch: id={BranchId}, group={GroupId}, ma={MaNhanh}",
            entity.Id, groupId, entity.MaNhanh);

        return ToBranchDto(entity);
    }

    public async Task UpdateBranchAsync(int branchId, ParallelBranchUpdateRequest request)
    {
        var branch = await _db.NhanhWorkflows.FindAsync(branchId)
            ?? throw new NotFoundException($"Branch not found: {branchId}");

        if (request.TenNhanh != null) branch.TenNhanh = request.TenNhanh;
        if (request.ThuTu.HasValue) branch.ThuTu = request.ThuTu.Value;
        if (request.DonViXuLyId.HasValue) branch.DonViXuLyId = request.DonViXuLyId;
        if (request.VaiTroXuLyId.HasValue) branch.VaiTroXuLyId = request.VaiTroXuLyId;
        if (request.ThoiHanNgay.HasValue) branch.ThoiHanNgay = request.ThoiHanNgay.Value;
        if (request.LoaiHan != null) branch.LoaiHan = request.LoaiHan;
        if (request.BuocDauTienId.HasValue) branch.BuocDauTienId = request.BuocDauTienId.Value;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Updated branch: id={BranchId}", branchId);
    }

    public async Task DeleteBranchAsync(int branchId)
    {
        var branch = await _db.NhanhWorkflows.FindAsync(branchId)
            ?? throw new NotFoundException($"Branch not found: {branchId}");

        _db.NhanhWorkflows.Remove(branch);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deleted branch: id={BranchId}", branchId);
    }

    private static ParallelGroupDto ToGroupDto(NhomNhanhWorkflow g) => new()
    {
        Id = g.Id,
        WorkflowId = g.WorkflowId,
        BuocTachNhanhId = g.BuocTachNhanhId,
        TenNhom = g.TenNhom,
        DieuKienHopNhat = g.DieuKienHopNhat,
        SoNhanhHopNhatToiThieu = g.SoNhanhHopNhatToiThieu,
        BuocSauHopNhatId = g.BuocSauHopNhatId,
        Branches = g.Nhanhs.Select(ToBranchDto).ToList()
    };

    private static ParallelBranchDto ToBranchDto(NhanhWorkflow n) => new()
    {
        Id = n.Id,
        NhomNhanhWorkflowId = n.NhomNhanhWorkflowId,
        MaNhanh = n.MaNhanh,
        TenNhanh = n.TenNhanh,
        ThuTu = n.ThuTu,
        DonViXuLyId = n.DonViXuLyId,
        VaiTroXuLyId = n.VaiTroXuLyId,
        ThoiHanNgay = n.ThoiHanNgay,
        LoaiHan = n.LoaiHan,
        BuocDauTienId = n.BuocDauTienId
    };
}
