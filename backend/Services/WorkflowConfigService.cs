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
        var query = _context.Workflows.AsNoTracking().AsQueryable();

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
                MaWorkflow = w.MaWorkflow,
                TenWorkflow = w.TenWorkflow,
                HinhThucId = w.HinhThucId,
                TrangThaiHoatDong = w.TrangThaiHoatDong,
                LoaiHinhDauThau = w.LoaiHinhDauThau,
                LaQuyTrinhChuan = w.LaQuyTrinhChuan,
                SoBuoc = w.BuocWorkflows.Count,
                NgayTao = EF.Property<DateTime>(w, "NgayTao")
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

    public async Task<WorkflowListItemDto> GetWorkflowByIdAsync(int id)
    {
        return await _context.Workflows
            .AsNoTracking()
            .Where(w => w.Id == id)
            .Select(w => new WorkflowListItemDto
            {
                Id = w.Id,
                MaWorkflow = w.MaWorkflow,
                TenWorkflow = w.TenWorkflow,
                HinhThucId = w.HinhThucId,
                TrangThaiHoatDong = w.TrangThaiHoatDong,
                LoaiHinhDauThau = w.LoaiHinhDauThau,
                LaQuyTrinhChuan = w.LaQuyTrinhChuan,
                SoBuoc = w.BuocWorkflows.Count,
                NgayTao = EF.Property<DateTime>(w, "NgayTao")
            })
            .FirstOrDefaultAsync() ?? throw new NotFoundException($"Workflow not found: {id}");
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
            LoaiHinhDauThau = request.LoaiHinhDauThau,
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

    public async Task<WorkflowCreateResponse> CreateWorkflowFromDesignAsync(WorkflowDesignSaveRequest request, int? nguoiTaoId)
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
            LoaiHinhDauThau = request.LoaiHinhDauThau,
            TrangThaiHoatDong = true
        };

        await using var tx = await _context.Database.BeginTransactionAsync();

        _context.Workflows.Add(entity);
        await _context.SaveChangesAsync();

        var stepByDraftId = new Dictionary<string, BuocWorkflow>();
        var normalizedSteps = request.Steps
            .Select((step, index) => new { Step = step, Index = index })
            .ToList();

        var duplicateStepIds = normalizedSteps
            .GroupBy(x => x.Step.Id)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicateStepIds != null)
            throw new AppException(400, "DUPLICATE_STEP_ID", $"Duplicate step id in design payload: {duplicateStepIds.Key}");

        foreach (var item in normalizedSteps)
        {
            var step = item.Step;
            var stepEntity = new BuocWorkflow
            {
                WorkflowId = entity.Id,
                MaBuoc = step.MaBuoc,
                TenBuoc = step.TenBuoc,
                LoaiBuoc = step.LoaiBuoc,
                ThuTu = item.Index + 1,
                VaiTroXuLyHoSoId = step.VaiTroXuLyHoSoId,
                SoNgayLapHoSo = step.SoNgayLapHoSo,
                VaiTroKyDuyetId = step.VaiTroKyDuyetId,
                SoNgayXuLy = step.SoNgayXuLy,
                LoaiHan = step.LoaiHan,
                NhomSongSong = step.NhomSongSong,
                LaBuocJoin = step.LaBuocJoin,
                NhomGiaiDoan = step.NhomGiaiDoan,
                MoTa = step.MoTa,
                DonViXuLyId = step.DonViXuLyId,
                DonViKyHoSoId = step.DonViKyHoSoId,
                BatBuocGhiChu = step.BatBuocGhiChu,
                BatBuocTaiLieu = step.BatBuocTaiLieu,
                BatBuocKyTruocChuyenBuoc = step.BatBuocKyTruocChuyenBuoc,
                BatBuocDungSLA = step.BatBuocDungSLA,
                ChoPhepTuChoi = step.ChoPhepTuChoi,
                ChoPhepBoQua = step.ChoPhepBoQua
            };

            _context.BuocWorkflows.Add(stepEntity);
            await _context.SaveChangesAsync();
            stepByDraftId[step.Id] = stepEntity;
        }

        entity.BuocBatDauId = ResolveDesignBoundaryStepId(request.BuocBatDauDraftId, request.Steps, stepByDraftId, "BAT_DAU");
        entity.BuocKetThucId = ResolveDesignBoundaryStepId(request.BuocKetThucDraftId, request.Steps, stepByDraftId, "KET_THUC");
        await _context.SaveChangesAsync();

        foreach (var group in request.ParallelGroups.Select((group, groupIndex) => new { Group = group, GroupIndex = groupIndex }))
        {
            if (!stepByDraftId.TryGetValue(group.Group.BuocTachNhanhId, out var splitStep))
                throw new AppException(400, "INVALID_DESIGN", $"Unknown split step id: {group.Group.BuocTachNhanhId}");

            if (!stepByDraftId.TryGetValue(group.Group.BuocSauHopNhatId, out var mergeStep))
                throw new AppException(400, "INVALID_DESIGN", $"Unknown merge step id: {group.Group.BuocSauHopNhatId}");

            var groupEntity = new NhomNhanhWorkflow
            {
                WorkflowId = entity.Id,
                BuocTachNhanhId = splitStep.Id,
                TenNhom = group.Group.TenNhom,
                DieuKienHopNhat = group.Group.DieuKienHopNhat,
                SoNhanhHopNhatToiThieu = group.Group.DieuKienHopNhat == "COUNT"
                    ? group.Group.SoNhanhHopNhatToiThieu
                    : null,
                BuocSauHopNhatId = mergeStep.Id,
                NgayTao = DateTime.UtcNow
            };

            _context.NhomNhanhWorkflows.Add(groupEntity);
            await _context.SaveChangesAsync();

            var duplicateBranchIds = group.Group.Branches
                .GroupBy(branch => branch.Id)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateBranchIds != null)
                throw new AppException(400, "DUPLICATE_BRANCH_ID", $"Duplicate branch id in design payload: {duplicateBranchIds.Key}");

            var duplicateBranchCodes = group.Group.Branches
                .GroupBy(branch => branch.MaNhanh, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateBranchCodes != null)
                throw new AppException(400, "DUPLICATE_BRANCH_CODE", $"Duplicate branch code in design payload: {duplicateBranchCodes.Key}");

            foreach (var branch in group.Group.Branches.OrderBy(b => b.ThuTu))
            {
                if (branch.StepIds.Count == 0)
                    throw new AppException(400, "INVALID_DESIGN", $"Branch '{branch.TenNhanh}' does not contain any steps.");

                var orderedBranchSteps = branch.StepIds.Select(stepId =>
                    stepByDraftId.TryGetValue(stepId, out var stepEntity)
                        ? stepEntity
                        : throw new AppException(400, "INVALID_DESIGN", $"Unknown branch step id: {stepId}")).ToList();

                var firstBranchStep = orderedBranchSteps[0];
                var branchEntity = new NhanhWorkflow
                {
                    NhomNhanhWorkflowId = groupEntity.Id,
                    MaNhanh = branch.MaNhanh,
                    TenNhanh = branch.TenNhanh,
                    ThuTu = branch.ThuTu,
                    DonViXuLyId = branch.DonViXuLyId,
                    VaiTroXuLyId = branch.VaiTroXuLyId,
                    ThoiHanNgay = branch.ThoiHanNgay,
                    LoaiHan = branch.LoaiHan,
                    BuocDauTienId = firstBranchStep.Id
                };

                _context.NhanhWorkflows.Add(branchEntity);
                await _context.SaveChangesAsync();

                foreach (var branchStep in orderedBranchSteps)
                    branchStep.NhanhWorkflowId = branchEntity.Id;
            }
        }

        var branchDraftById = request.ParallelGroups
            .SelectMany(group => group.Branches)
            .ToDictionary(branch => branch.Id, branch => branch);

        var branchStepDraftIds = new HashSet<string>();
        foreach (var branch in branchDraftById.Values)
        {
            foreach (var stepId in branch.StepIds)
            {
                if (!stepByDraftId.ContainsKey(stepId))
                    throw new AppException(400, "INVALID_DESIGN", $"Unknown branch step id: {stepId}");

                if (!branchStepDraftIds.Add(stepId))
                    throw new AppException(400, "INVALID_DESIGN", $"Step '{stepId}' belongs to more than one branch.");

                var stepDraft = normalizedSteps.First(x => x.Step.Id == stepId);
                if (!string.Equals(stepDraft.Step.NhanhId, branch.Id, StringComparison.Ordinal))
                    throw new AppException(400, "INVALID_DESIGN", $"Step '{stepId}' is not assigned to branch '{branch.Id}'.");
            }
        }

        foreach (var stepDraft in normalizedSteps.Where(x => !string.IsNullOrWhiteSpace(x.Step.NhanhId)))
        {
            if (!branchDraftById.TryGetValue(stepDraft.Step.NhanhId!, out var branch))
                throw new AppException(400, "INVALID_DESIGN", $"Unknown branch id: {stepDraft.Step.NhanhId}");

            if (!branch.StepIds.Contains(stepDraft.Step.Id))
                throw new AppException(400, "INVALID_DESIGN", $"Step '{stepDraft.Step.Id}' is not included in branch '{branch.Id}'.");
        }

        var stepRequestByEntityId = normalizedSteps
            .ToDictionary(x => stepByDraftId[x.Step.Id].Id, x => x.Step);

        var mainSteps = normalizedSteps
            .Where(x => string.IsNullOrWhiteSpace(x.Step.NhanhId))
            .Select(x => stepByDraftId[x.Step.Id])
            .OrderBy(step => step.ThuTu)
            .ToList();

        for (var i = 0; i < mainSteps.Count - 1; i++)
        {
            _context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
            {
                TuBuocId = mainSteps[i].Id,
                DenBuocId = mainSteps[i + 1].Id,
                HanhDong = "DUYET",
                DieuKienKichHoat = "LUON",
                BatBuocGhiChu = false,
                BatBuocTaiLieu = false,
                HuongXuLyKhongDuyet = stepRequestByEntityId.GetValueOrDefault(mainSteps[i + 1].Id)?.HuongXuLyKhongDuyet
            });
        }

        foreach (var group in request.ParallelGroups)
        {
            foreach (var branch in group.Branches.OrderBy(b => b.ThuTu))
            {
                var orderedBranchSteps = branch.StepIds
                    .Select(stepId => stepByDraftId[stepId])
                    .ToList();

                for (var i = 0; i < orderedBranchSteps.Count - 1; i++)
                {
                    _context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
                    {
                        TuBuocId = orderedBranchSteps[i].Id,
                        DenBuocId = orderedBranchSteps[i + 1].Id,
                        HanhDong = "DUYET",
                        DieuKienKichHoat = "LUON",
                        BatBuocGhiChu = false,
                        BatBuocTaiLieu = false,
                        HuongXuLyKhongDuyet = stepRequestByEntityId.GetValueOrDefault(orderedBranchSteps[i + 1].Id)?.HuongXuLyKhongDuyet
                    });
                }
            }
        }

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

        _logger.LogInformation("Created workflow from design: id={WorkflowId}, ma={MaWorkflow}", entity.Id, entity.MaWorkflow);

        return new WorkflowCreateResponse
        {
            Id = entity.Id,
            TenWorkflow = entity.TenWorkflow
        };
    }

    public async Task UpdateWorkflowFromDesignAsync(int id, WorkflowDesignSaveRequest request, int? nguoiTaoId)
    {
        var entity = await _context.Workflows.FindAsync(id)
            ?? throw new NotFoundException($"Workflow not found: {id}");

        entity.TenWorkflow = request.TenWorkflow.Trim();
        if (request.LoaiHinhDauThau != null)
            entity.LoaiHinhDauThau = request.LoaiHinhDauThau;

        // Remove old transitions, branches, groups, then steps (FK-safe order)
        var oldStepIds = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == id)
            .Select(b => b.Id)
            .ToListAsync();

        if (oldStepIds.Count > 0)
        {
            await _context.ChuyenTiepWorkflows
                .Where(t => oldStepIds.Contains(t.TuBuocId) || oldStepIds.Contains(t.DenBuocId))
                .ExecuteDeleteAsync();
        }

        if (oldStepIds.Count > 0)
        {
            await _context.BuocWorkflows
                .Where(b => oldStepIds.Contains(b.Id) && b.NhanhWorkflowId != null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(b => b.NhanhWorkflowId, (int?)null));
        }

        var oldGroups = await _context.NhomNhanhWorkflows
            .Where(g => g.WorkflowId == id)
            .Include(g => g.Nhanhs)
            .ToListAsync();

        _context.NhanhWorkflows.RemoveRange(oldGroups.SelectMany(g => g.Nhanhs));
        await _context.SaveChangesAsync();

        _context.NhomNhanhWorkflows.RemoveRange(oldGroups);
        await _context.SaveChangesAsync();

        var oldSteps = await _context.BuocWorkflows.Where(b => b.WorkflowId == id).ToListAsync();
        _context.BuocWorkflows.RemoveRange(oldSteps);
        await _context.SaveChangesAsync();

        // Re-create everything using the design request
        var stepByDraftId = new Dictionary<string, BuocWorkflow>();
        var normalizedSteps = request.Steps
            .Select((step, index) => new { Step = step, Index = index })
            .ToList();

        foreach (var item in normalizedSteps)
        {
            var step = item.Step;
            var stepEntity = new BuocWorkflow
            {
                WorkflowId = entity.Id,
                MaBuoc = step.MaBuoc,
                TenBuoc = step.TenBuoc,
                LoaiBuoc = step.LoaiBuoc,
                ThuTu = item.Index + 1,
                VaiTroXuLyHoSoId = step.VaiTroXuLyHoSoId,
                SoNgayLapHoSo = step.SoNgayLapHoSo,
                VaiTroKyDuyetId = step.VaiTroKyDuyetId,
                SoNgayXuLy = step.SoNgayXuLy,
                LoaiHan = step.LoaiHan,
                NhomSongSong = step.NhomSongSong,
                LaBuocJoin = step.LaBuocJoin,
                NhomGiaiDoan = step.NhomGiaiDoan,
                MoTa = step.MoTa,
                DonViXuLyId = step.DonViXuLyId,
                DonViKyHoSoId = step.DonViKyHoSoId,
                BatBuocGhiChu = step.BatBuocGhiChu,
                BatBuocTaiLieu = step.BatBuocTaiLieu,
                BatBuocKyTruocChuyenBuoc = step.BatBuocKyTruocChuyenBuoc,
                BatBuocDungSLA = step.BatBuocDungSLA,
                ChoPhepTuChoi = step.ChoPhepTuChoi,
                ChoPhepBoQua = step.ChoPhepBoQua
            };
            _context.BuocWorkflows.Add(stepEntity);
            await _context.SaveChangesAsync();
            stepByDraftId[step.Id] = stepEntity;
        }

        entity.BuocBatDauId = ResolveDesignBoundaryStepId(request.BuocBatDauDraftId, request.Steps, stepByDraftId, "BAT_DAU");
        entity.BuocKetThucId = ResolveDesignBoundaryStepId(request.BuocKetThucDraftId, request.Steps, stepByDraftId, "KET_THUC");
        await _context.SaveChangesAsync();

        // Build reverse lookup: entity PK → step request (for HuongXuLyKhongDuyet etc.)
        var stepRequestByEntityId = request.Steps
            .Select(s => stepByDraftId.TryGetValue(s.Id, out var entity) ? (entity.Id, Step: s) : ((long Id, WorkflowDesignStepRequest Step)?)null)
            .Where(x => x.HasValue)
            .ToDictionary(x => x!.Value.Id, x => x!.Value.Step);

        // Create transitions between main steps
        var mainSteps = normalizedSteps
            .Where(x => string.IsNullOrWhiteSpace(x.Step.NhanhId))
            .Select(x => stepByDraftId[x.Step.Id])
            .OrderBy(s => s.ThuTu)
            .ToList();

        for (var i = 0; i < mainSteps.Count - 1; i++)
        {
            _context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
            {
                TuBuocId = mainSteps[i].Id,
                DenBuocId = mainSteps[i + 1].Id,
                HanhDong = "DUYET",
                DieuKienKichHoat = "LUON",
                BatBuocGhiChu = false,
                BatBuocTaiLieu = false,
                HuongXuLyKhongDuyet = stepRequestByEntityId.GetValueOrDefault(mainSteps[i + 1].Id)?.HuongXuLyKhongDuyet
            });
        }

        // Create parallel groups
        foreach (var group in request.ParallelGroups)
        {
            if (!stepByDraftId.TryGetValue(group.BuocTachNhanhId, out var splitStep))
                throw new AppException(400, "INVALID_DESIGN", $"Unknown split step id: {group.BuocTachNhanhId}");

            if (!stepByDraftId.TryGetValue(group.BuocSauHopNhatId, out var mergeStep))
                throw new AppException(400, "INVALID_DESIGN", $"Unknown merge step id: {group.BuocSauHopNhatId}");

            var duplicateBranchIds = group.Branches
                .GroupBy(branch => branch.Id)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateBranchIds != null)
                throw new AppException(400, "DUPLICATE_BRANCH_ID", $"Duplicate branch id in design payload: {duplicateBranchIds.Key}");

            var duplicateBranchCodes = group.Branches
                .GroupBy(branch => branch.MaNhanh, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateBranchCodes != null)
                throw new AppException(400, "DUPLICATE_BRANCH_CODE", $"Duplicate branch code in design payload: {duplicateBranchCodes.Key}");

            var entityGroup = new NhomNhanhWorkflow
            {
                WorkflowId = entity.Id,
                BuocTachNhanhId = splitStep.Id,
                TenNhom = group.TenNhom,
                DieuKienHopNhat = group.DieuKienHopNhat,
                SoNhanhHopNhatToiThieu = group.DieuKienHopNhat == "COUNT"
                    ? group.SoNhanhHopNhatToiThieu
                    : null,
                BuocSauHopNhatId = mergeStep.Id,
                NgayTao = DateTime.UtcNow
            };
            _context.NhomNhanhWorkflows.Add(entityGroup);
            await _context.SaveChangesAsync();

            foreach (var branch in group.Branches.OrderBy(b => b.ThuTu))
            {
                if (branch.StepIds.Count == 0)
                    throw new AppException(400, "INVALID_DESIGN", $"Branch '{branch.TenNhanh}' does not contain any steps.");

                var orderedBranchSteps = branch.StepIds.Select(stepId =>
                    stepByDraftId.TryGetValue(stepId, out var stepEntity)
                        ? stepEntity
                        : throw new AppException(400, "INVALID_DESIGN", $"Unknown branch step id: {stepId}")).ToList();

                var firstBranchStep = orderedBranchSteps[0];
                var branchEntity = new NhanhWorkflow
                {
                    NhomNhanhWorkflowId = entityGroup.Id,
                    MaNhanh = branch.MaNhanh,
                    TenNhanh = branch.TenNhanh,
                    ThuTu = branch.ThuTu,
                    DonViXuLyId = branch.DonViXuLyId,
                    VaiTroXuLyId = branch.VaiTroXuLyId,
                    ThoiHanNgay = branch.ThoiHanNgay,
                    LoaiHan = branch.LoaiHan,
                    BuocDauTienId = firstBranchStep.Id
                };
                _context.NhanhWorkflows.Add(branchEntity);
                await _context.SaveChangesAsync();

                foreach (var branchStep in orderedBranchSteps)
                    branchStep.NhanhWorkflowId = branchEntity.Id;
            }
        }

        // Create transitions within branches
        foreach (var group in request.ParallelGroups)
        {
            foreach (var branch in group.Branches.OrderBy(b => b.ThuTu))
            {
                var orderedBranchSteps = branch.StepIds
                    .Select(stepId => stepByDraftId.GetValueOrDefault(stepId))
                    .Where(s => s != null)
                    .ToList();

                for (var i = 0; i < orderedBranchSteps.Count - 1; i++)
                {
                    _context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
                    {
                        TuBuocId = orderedBranchSteps[i].Id,
                        DenBuocId = orderedBranchSteps[i + 1].Id,
                        HanhDong = "DUYET",
                        DieuKienKichHoat = "LUON",
                        BatBuocGhiChu = false,
                        BatBuocTaiLieu = false,
                        HuongXuLyKhongDuyet = stepRequestByEntityId.GetValueOrDefault(orderedBranchSteps[i + 1].Id)?.HuongXuLyKhongDuyet
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

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

        _logger.LogInformation("Updated workflow from design: id={WorkflowId}", id);
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
        if (hasActiveInstance)
            throw new AppException(400, "HAS_INSTANCE", "Workflow co instance active nen khong the xoa.");

        // Xoá toàn bộ dữ liệu liên quan để tránh FK violation
        var buocIds = await _context.BuocWorkflows
            .Where(b => b.WorkflowId == id)
            .Select(b => b.Id)
            .ToListAsync();

        if (buocIds.Count > 0)
        {
            await _context.ChuyenTiepWorkflows
                .Where(t => buocIds.Contains(t.TuBuocId) || buocIds.Contains(t.DenBuocId))
                .ExecuteDeleteAsync();

            await _context.BuocWorkflows
                .Where(b => b.WorkflowId == id)
                .ExecuteDeleteAsync();
        }

        await _context.NhomNhanhWorkflows
            .Where(pg => pg.WorkflowId == id)
            .ExecuteDeleteAsync();

        await _context.WorkflowVersionHistories
            .Where(v => v.WorkflowId == id)
            .ExecuteDeleteAsync();

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

        var parallelGroups = await _context.NhomNhanhWorkflows
            .Include(g => g.Nhanhs.OrderBy(n => n.ThuTu))
            .Where(g => g.WorkflowId == workflow.Id)
            .ToListAsync();

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
                VaiTroXuLyHoSoId = b.VaiTroXuLyHoSoId,
                SoNgayLapHoSo = b.SoNgayLapHoSo,
                VaiTroKyDuyetId = b.VaiTroKyDuyetId,
                SoNgayXuLy = b.SoNgayXuLy,
                LoaiHan = b.LoaiHan,
                NhomSongSong = b.NhomSongSong,
                LaBuocJoin = b.LaBuocJoin,
                ThuTu = b.ThuTu,
                NhomGiaiDoan = b.NhomGiaiDoan,
                MoTa = b.MoTa,
                DonViXuLyId = b.DonViXuLyId,
                DonViKyHoSoId = b.DonViKyHoSoId,
                BatBuocGhiChu = b.BatBuocGhiChu,
                BatBuocTaiLieu = b.BatBuocTaiLieu,
                BatBuocKyTruocChuyenBuoc = b.BatBuocKyTruocChuyenBuoc,
                BatBuocDungSLA = b.BatBuocDungSLA,
                NhanhWorkflowId = b.NhanhWorkflowId,
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
            }).ToList(),
            ParallelGroups = parallelGroups.Select(pg => new ParallelGroupSnapshotDto
            {
                Id = pg.Id,
                WorkflowId = pg.WorkflowId,
                BuocTachNhanhId = pg.BuocTachNhanhId,
                TenNhom = pg.TenNhom,
                DieuKienHopNhat = pg.DieuKienHopNhat,
                SoNhanhHopNhatToiThieu = pg.SoNhanhHopNhatToiThieu,
                BuocSauHopNhatId = pg.BuocSauHopNhatId,
                Branches = pg.Nhanhs.Select(n => new ParallelBranchSnapshotDto
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
                    BuocDauTienId = n.BuocDauTienId,
                    StepIds = buocs
                        .Where(b => b.NhanhWorkflowId == n.Id)
                        .OrderBy(b => b.ThuTu)
                        .Select(b => b.Id)
                        .ToList()
                }).ToList()
            }).ToList()
        };

        return JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }

    private static int? ResolveDesignBoundaryStepId(
        string? draftId,
        List<WorkflowDesignStepRequest> steps,
        Dictionary<string, BuocWorkflow> stepByDraftId,
        string loaiBuoc)
    {
        var selectedDraftId = !string.IsNullOrWhiteSpace(draftId)
            ? draftId
            : steps
                .FirstOrDefault(step => string.Equals(step.LoaiBuoc, loaiBuoc, StringComparison.OrdinalIgnoreCase))
                ?.Id;

        return selectedDraftId != null && stepByDraftId.TryGetValue(selectedDraftId, out var step)
            ? step.Id
            : null;
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
