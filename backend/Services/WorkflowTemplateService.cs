using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class WorkflowTemplateService : IWorkflowTemplateService
{
    private readonly AppDbContext _db;
    private readonly ILogger<WorkflowTemplateService> _logger;

    public WorkflowTemplateService(AppDbContext db, ILogger<WorkflowTemplateService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<WorkflowTemplateSummaryDto>> GetTemplatesAsync(string? loaiHinh)
    {
        var query = _db.Workflows
            .Where(w => w.TrangThaiHoatDong
                && (w.LaQuyTrinhChuan || w.BuocWorkflows.Any()))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(loaiHinh))
            query = query.Where(w => w.LoaiHinhDauThau == loaiHinh);

        return await query
            .Select(w => new WorkflowTemplateSummaryDto
            {
                Id = w.Id,
                MaWorkflow = w.MaWorkflow,
                TenWorkflow = w.TenWorkflow,
                LoaiHinhDauThau = w.LoaiHinhDauThau,
                MoTaNgan = w.MoTaNgan,
                SoBuoc = w.BuocWorkflows.Count
            })
            .ToListAsync();
    }

    public async Task<WorkflowTemplatePreviewDto> PreviewAsync(int templateId)
    {
        return await BuildPreviewAsync(templateId, requireTemplate: false);
    }

    private async Task<WorkflowTemplatePreviewDto> BuildPreviewAsync(int workflowId, bool requireTemplate)
    {
        var query = _db.Workflows
            .Include(w => w.BuocWorkflows.OrderBy(b => b.ThuTu))
            .Where(w => w.Id == workflowId);

        if (requireTemplate)
            query = query.Where(w => w.LaQuyTrinhChuan);

        var workflow = await query.FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Template not found: {workflowId}");

        var buocIds = workflow.BuocWorkflows.Select(b => b.Id).ToList();

        var transitions = buocIds.Count > 0
            ? await _db.ChuyenTiepWorkflows
                .Where(t => buocIds.Contains(t.TuBuocId))
                .ToListAsync()
            : [];

        var parallelGroups = await _db.NhomNhanhWorkflows
            .Include(pg => pg.Nhanhs.OrderBy(n => n.ThuTu))
            .Where(pg => pg.WorkflowId == workflowId)
            .ToListAsync();

        return new WorkflowTemplatePreviewDto
        {
            Id = workflow.Id,
            TenWorkflow = workflow.TenWorkflow,
            LoaiHinhDauThau = workflow.LoaiHinhDauThau,
            Steps = workflow.BuocWorkflows.Select(b => ToStepDto(b)).ToList(),
            Transitions = transitions.Select(t => ToTransitionDto(t)).ToList(),
            ParallelGroups = parallelGroups.Select(pg => new ParallelGroupDto
            {
                Id = pg.Id,
                WorkflowId = pg.WorkflowId,
                BuocTachNhanhId = pg.BuocTachNhanhId,
                TenNhom = pg.TenNhom,
                DieuKienHopNhat = pg.DieuKienHopNhat,
                SoNhanhHopNhatToiThieu = pg.SoNhanhHopNhatToiThieu,
                BuocSauHopNhatId = pg.BuocSauHopNhatId,
                Branches = pg.Nhanhs.Select(n => new ParallelBranchDto
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
                }).ToList()
            }).ToList()
        };
    }

    public async Task<WorkflowTemplatePreviewDto> GenerateFromTemplateAsync(
        GenerateWorkflowFromTemplateRequest request, int? nguoiTaoId)
    {
        var template = await _db.Workflows
            .Include(w => w.BuocWorkflows.OrderBy(b => b.ThuTu))
            .FirstOrDefaultAsync(w => w.Id == request.TemplateWorkflowId
                && w.LaQuyTrinhChuan
                && w.TrangThaiHoatDong);

        if (template is null && !string.IsNullOrWhiteSpace(request.LoaiHinhDauThau))
        {
            template = await _db.Workflows
                .Include(w => w.BuocWorkflows.OrderBy(b => b.ThuTu))
                .FirstOrDefaultAsync(w => w.LoaiHinhDauThau == request.LoaiHinhDauThau
                    && w.LaQuyTrinhChuan
                    && w.TrangThaiHoatDong);
        }

        if (template is null)
            throw new NotFoundException("Không tìm thấy quy trình chuẩn hợp lệ cho loại hình đấu thầu đã chọn.");

        if (!template.BuocWorkflows.Any())
            throw new AppException(400, "TEMPLATE_EMPTY", "Template has no steps. Cannot generate workflow.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Create new non-template workflow
        var newWorkflow = new Workflow
        {
            MaWorkflow = await GenerateMaWorkflowAsync(),
            TenWorkflow = request.TenWorkflow,
            HinhThucId = template.HinhThucId,
            LoaiHinhDauThau = request.LoaiHinhDauThau ?? template.LoaiHinhDauThau,
            PhamViApDung = template.PhamViApDung,
            MoTaNgan = template.MoTaNgan,
            TrangThaiHoatDong = true,
            LaQuyTrinhChuan = false
        };

        _db.Workflows.Add(newWorkflow);
        await _db.SaveChangesAsync();

        // Copy steps with new Ids — build mapping
        var stepIdMap = new Dictionary<int, int>(); // old id -> new id
        foreach (var templateStep in template.BuocWorkflows.OrderBy(b => b.ThuTu))
        {
            var newStep = new BuocWorkflow
            {
                WorkflowId = newWorkflow.Id,
                MaBuoc = templateStep.MaBuoc,
                TenBuoc = templateStep.TenBuoc,
                LoaiBuoc = templateStep.LoaiBuoc,
                ThuTu = templateStep.ThuTu,
                VaiTroXuLyHoSoId = templateStep.VaiTroXuLyHoSoId,
                SoNgayLapHoSo = templateStep.SoNgayLapHoSo,
                VaiTroKyDuyetId = templateStep.VaiTroKyDuyetId,
                SoNgayXuLy = templateStep.SoNgayXuLy,
                LoaiHan = templateStep.LoaiHan,
                ChoPhepTuChoi = templateStep.ChoPhepTuChoi,
                ChoPhepBoQua = templateStep.ChoPhepBoQua,
                BatBuocGhiChu = templateStep.BatBuocGhiChu,
                BatBuocTaiLieu = templateStep.BatBuocTaiLieu,
                BatBuocKyTruocChuyenBuoc = templateStep.BatBuocKyTruocChuyenBuoc,
                BatBuocDungSLA = templateStep.BatBuocDungSLA
            };

            _db.BuocWorkflows.Add(newStep);
            await _db.SaveChangesAsync();
            stepIdMap[templateStep.Id] = newStep.Id;
        }

        // Copy transitions with new step ids
        var templateBuocIds = template.BuocWorkflows.Select(b => b.Id).ToList();
        var templateTransitions = await _db.ChuyenTiepWorkflows
            .Where(t => templateBuocIds.Contains(t.TuBuocId))
            .ToListAsync();

        foreach (var t in templateTransitions)
        {
            _db.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
            {
                TuBuocId = stepIdMap[t.TuBuocId],
                DenBuocId = stepIdMap[t.DenBuocId],
                HanhDong = t.HanhDong,
                DieuKien = t.DieuKien,
                DieuKienKichHoat = t.DieuKienKichHoat,
                KetQuaApDung = t.KetQuaApDung,
                VaiTroApDungId = t.VaiTroApDungId,
                BatBuocGhiChu = t.BatBuocGhiChu,
                BatBuocTaiLieu = t.BatBuocTaiLieu,
                HuongXuLyKhongDuyet = t.HuongXuLyKhongDuyet
            });
        }

        // Copy parallel groups with new step ids
        var templateGroups = await _db.NhomNhanhWorkflows
            .Include(pg => pg.Nhanhs)
            .Where(pg => pg.WorkflowId == template.Id)
            .ToListAsync();

        foreach (var g in templateGroups)
        {
            var newGroup = new NhomNhanhWorkflow
            {
                WorkflowId = newWorkflow.Id,
                BuocTachNhanhId = stepIdMap.GetValueOrDefault(g.BuocTachNhanhId, g.BuocTachNhanhId),
                TenNhom = g.TenNhom,
                DieuKienHopNhat = g.DieuKienHopNhat,
                SoNhanhHopNhatToiThieu = g.SoNhanhHopNhatToiThieu,
                BuocSauHopNhatId = stepIdMap.GetValueOrDefault(g.BuocSauHopNhatId, g.BuocSauHopNhatId),
                NgayTao = DateTime.UtcNow
            };

            _db.NhomNhanhWorkflows.Add(newGroup);
            await _db.SaveChangesAsync();

            foreach (var n in g.Nhanhs)
            {
                _db.NhanhWorkflows.Add(new NhanhWorkflow
                {
                    NhomNhanhWorkflowId = newGroup.Id,
                    MaNhanh = n.MaNhanh,
                    TenNhanh = n.TenNhanh,
                    ThuTu = n.ThuTu,
                    DonViXuLyId = n.DonViXuLyId,
                    VaiTroXuLyId = n.VaiTroXuLyId,
                    ThoiHanNgay = n.ThoiHanNgay,
                    LoaiHan = n.LoaiHan,
                    BuocDauTienId = stepIdMap.GetValueOrDefault(n.BuocDauTienId, n.BuocDauTienId)
                });
            }
        }

        // Record version history
        _db.WorkflowVersionHistories.Add(new WorkflowVersionHistory
        {
            WorkflowId = newWorkflow.Id,
            VersionNumber = 1,
            SnapshotData = "{\"generatedFrom\":\"" + template.Id + "\"}",
            NgayTao = DateTime.UtcNow,
            NguoiTaoId = nguoiTaoId
        });

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _logger.LogInformation("Generated workflow {NewId} from template {TemplateId}",
            newWorkflow.Id, template.Id);

        // Return preview for generated workflow (not a template)
        return await BuildPreviewAsync(newWorkflow.Id, requireTemplate: false);
    }

    private static BuocWorkflowListItemDto ToStepDto(BuocWorkflow b) => new()
    {
        Id = b.Id,
        MaBuoc = b.MaBuoc,
        TenBuoc = b.TenBuoc,
        LoaiBuoc = b.LoaiBuoc,
        ThuTu = b.ThuTu,
        VaiTroXuLyHoSoId = b.VaiTroXuLyHoSoId,
        SoNgayLapHoSo = b.SoNgayLapHoSo,
        VaiTroKyDuyetId = b.VaiTroKyDuyetId,
        SoNgayXuLy = b.SoNgayXuLy,
        LoaiHan = b.LoaiHan,
        NhomSongSong = b.NhomSongSong,
        LaBuocJoin = b.LaBuocJoin,
        ChoPhepTuChoi = b.ChoPhepTuChoi,
        ChoPhepBoQua = b.ChoPhepBoQua,
        NhomGiaiDoan = b.NhomGiaiDoan,
        MoTa = b.MoTa,
        DonViXuLyId = b.DonViXuLyId,
        DonViKyHoSoId = b.DonViKyHoSoId,
        BatBuocGhiChu = b.BatBuocGhiChu,
        BatBuocTaiLieu = b.BatBuocTaiLieu,
        BatBuocKyTruocChuyenBuoc = b.BatBuocKyTruocChuyenBuoc,
        BatBuocDungSLA = b.BatBuocDungSLA,
        NhanhWorkflowId = b.NhanhWorkflowId
    };

    private static ChuyenTiepWorkflowListItemDto ToTransitionDto(ChuyenTiepWorkflow t) => new()
    {
        Id = t.Id,
        TuBuocId = t.TuBuocId,
        DenBuocId = t.DenBuocId,
        HanhDong = t.HanhDong,
        DieuKien = t.DieuKien,
        DieuKienKichHoat = t.DieuKienKichHoat,
        KetQuaApDung = t.KetQuaApDung,
        VaiTroApDungId = t.VaiTroApDungId,
        BatBuocGhiChu = t.BatBuocGhiChu,
        BatBuocTaiLieu = t.BatBuocTaiLieu,
        HuongXuLyKhongDuyet = t.HuongXuLyKhongDuyet
    };

    private async Task<string> GenerateMaWorkflowAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"QT-{year}-";

        var maxSuffix = await _db.Workflows
            .Where(w => w.MaWorkflow.StartsWith(prefix))
            .MaxAsync(w => w.MaWorkflow) ?? prefix + "000";

        var maxNumber = maxSuffix.Length > prefix.Length && int.TryParse(maxSuffix[prefix.Length..], out var n) ? n : 0;
        return $"{prefix}{(maxNumber + 1).ToString().PadLeft(3, '0')}";
    }
}
