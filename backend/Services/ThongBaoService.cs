using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.ThongBao;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class ThongBaoService : IThongBaoService
{
    private const string LoaiHeThong = "HE_THONG";
    private const string LoaiGoiThau = "GOI_THAU";
    private const string LoaiWorkflow = "WORKFLOW";
    private const string LoaiDeadline = "DEADLINE";

    private readonly AppDbContext _db;

    public ThongBaoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ThongBaoListResponse> GetListAsync(int nguoiDungId, int page = 1, int pageSize = 20, bool? daDoc = null)
    {
        var query = _db.ThongBaos
            .Where(t => t.NguoiDungId == nguoiDungId);

        if (daDoc.HasValue)
            query = query.Where(t => t.DaDoc == daDoc.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.NgayTao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new ThongBaoListItemDto
            {
                IdCongKhai = t.IdCongKhai,
                LoaiThongBao = t.LoaiThongBao,
                TieuDe = t.TieuDe,
                NoiDung = t.NoiDung,
                DaDoc = t.DaDoc,
                UrlDieuHuong = t.UrlDieuHuong,
                NgayTao = t.NgayTao
            })
            .ToListAsync();

        return new ThongBaoListResponse
        {
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task MarkReadAsync(Guid idCongKhai, int nguoiDungId)
    {
        var thongBao = await _db.ThongBaos
            .FirstOrDefaultAsync(t => t.IdCongKhai == idCongKhai);

        if (thongBao is null)
            throw new NotFoundException("Không tìm thấy thông báo.");

        if (thongBao.NguoiDungId != nguoiDungId)
            throw new ForbiddenException("Bạn không có quyền thao tác thông báo này.");

        thongBao.DaDoc = true;
        thongBao.NgayDoc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<int> MarkAllReadAsync(int nguoiDungId)
    {
        var count = await _db.ThongBaos
            .CountAsync(t => t.NguoiDungId == nguoiDungId && !t.DaDoc);

        await _db.ThongBaos
            .Where(t => t.NguoiDungId == nguoiDungId && !t.DaDoc)
            .ExecuteUpdateAsync(set => set
                .SetProperty(t => t.DaDoc, true)
                .SetProperty(t => t.NgayDoc, DateTime.UtcNow));

        return count;
    }

    public async Task CreateAsync(ThongBao thongBao)
    {
        if (thongBao.IdCongKhai == Guid.Empty)
            thongBao.IdCongKhai = Guid.NewGuid();

        thongBao.NgayTao = thongBao.NgayTao == default ? DateTime.UtcNow : thongBao.NgayTao;
        _db.ThongBaos.Add(thongBao);
        await _db.SaveChangesAsync();
    }

    public async Task NotifyGoiThauMoiAsync(GoiThau goiThau)
    {
        var recipients = await ResolveHighLevelUserIdsAsync();
        await CreateForUsersAsync(
            recipients,
            LoaiGoiThau,
            $"Có gói thầu mới {BuildMaGoiThau(goiThau)}",
            goiThau.TenGoiThau,
            BuildGoiThauUrl(goiThau.Id),
            goiThau.Id,
            null,
            $"GOI_THAU_MOI:{goiThau.Id}");
    }

    public async Task NotifyGoiThauHoanThanhAsync(GoiThau goiThau)
    {
        var recipients = await ResolveHighLevelUserIdsAsync();
        if (goiThau.NguoiTaoId.HasValue)
            recipients.Add(goiThau.NguoiTaoId.Value);

        await CreateForUsersAsync(
            recipients,
            LoaiWorkflow,
            $"Gói thầu {BuildMaGoiThau(goiThau)} đã hoàn thành",
            goiThau.TenGoiThau,
            BuildGoiThauUrl(goiThau.Id),
            goiThau.Id,
            null,
            $"GOI_THAU_HOAN_THANH:{goiThau.Id}");
    }

    public async Task NotifyGoiThauHuyAsync(GoiThau goiThau)
    {
        var recipients = await ResolveHighLevelUserIdsAsync();
        if (goiThau.NguoiTaoId.HasValue)
            recipients.Add(goiThau.NguoiTaoId.Value);

        await CreateForUsersAsync(
            recipients,
            LoaiGoiThau,
            $"Gói thầu {BuildMaGoiThau(goiThau)} đã bị hủy",
            goiThau.TenGoiThau,
            BuildGoiThauUrl(goiThau.Id),
            goiThau.Id,
            null,
            $"GOI_THAU_HUY:{goiThau.Id}");
    }

    public async Task NotifyStepDeadlineAsync(long workflowStepInstanceId, bool overdue)
    {
        var step = await _db.WorkflowStepInstances
            .Include(s => s.WorkflowInstance)
                .ThenInclude(i => i!.GoiThau)
            .Include(s => s.BuocWorkflow)
            .Include(s => s.WorkflowAssignments)
            .FirstOrDefaultAsync(s => s.Id == workflowStepInstanceId);

        if (step?.WorkflowInstance?.GoiThau is null || step.BuocWorkflow is null)
            return;

        var goiThau = step.WorkflowInstance.GoiThau;
        var recipients = await ResolveStepRecipientIdsAsync(step);
        var prefix = overdue ? "Quá hạn" : "Sắp tới hạn";
        var keyPrefix = overdue ? "STEP_QUA_HAN" : "STEP_SAP_TOI_HAN";

        await CreateForUsersAsync(
            recipients,
            LoaiDeadline,
            $"{prefix}: {step.BuocWorkflow.TenBuoc}",
            $"Gói thầu {BuildMaGoiThau(goiThau)} - {goiThau.TenGoiThau}",
            BuildStepUrl(goiThau.Id, step.Id),
            goiThau.Id,
            step.Id,
            $"{keyPrefix}:{step.Id}");
    }

    public async Task<int> SendAdminAsync(CreateAdminThongBaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new BadRequestException("Tiêu đề thông báo là bắt buộc.");

        List<int> recipients;
        if (request.GuiTatCa)
        {
            recipients = await _db.NguoiDungs
                .Where(u => u.TrangThaiHoatDong && !u.DaXoa)
                .Select(u => u.Id)
                .ToListAsync();
        }
        else
        {
            recipients = request.NguoiDungIds.Distinct().ToList();
        }

        if (recipients.Count == 0)
            throw new BadRequestException("Vui lòng chọn người nhận thông báo.");

        return await CreateForUsersAsync(
            recipients,
            LoaiHeThong,
            request.TieuDe.Trim(),
            request.NoiDung,
            request.UrlDieuHuong,
            request.GoiThauId,
            null,
            null);
    }

    private async Task<List<int>> ResolveHighLevelUserIdsAsync()
    {
        return await _db.NguoiDungKhoaPhongVaiTros
            .Where(x =>
                x.NguoiDung.TrangThaiHoatDong &&
                !x.NguoiDung.DaXoa &&
                x.VaiTro.NhomVaiTro != null &&
                (x.VaiTro.NhomVaiTro.MaNhom == "CAP_CAO" || x.VaiTro.NhomVaiTro.DoUuTien == 1))
            .Select(x => x.NguoiDungId)
            .Distinct()
            .ToListAsync();
    }

    private async Task<List<int>> ResolveStepRecipientIdsAsync(WorkflowStepInstance step)
    {
        var recipients = new HashSet<int>();
        var goiThau = step.WorkflowInstance?.GoiThau;
        var buoc = step.BuocWorkflow;

        if (goiThau?.NguoiTaoId is int nguoiTaoId)
            recipients.Add(nguoiTaoId);
        if (step.NguoiXuLyId is int nguoiXuLyId)
            recipients.Add(nguoiXuLyId);
        if (step.NguoiKyDuyetId is int nguoiKyDuyetId)
            recipients.Add(nguoiKyDuyetId);

        foreach (var assignment in step.WorkflowAssignments)
            recipients.Add(assignment.NguoiDuocGiaoId);

        if (buoc?.VaiTroXuLyHoSoId is int vaiTroId)
        {
            var query = _db.NguoiDungKhoaPhongVaiTros
                .Where(x =>
                    x.VaiTroId == vaiTroId &&
                    x.NguoiDung.TrangThaiHoatDong &&
                    !x.NguoiDung.DaXoa);

            if (buoc.DonViXuLyId.HasValue)
                query = query.Where(x => x.KhoaPhongId == buoc.DonViXuLyId.Value);

            var matched = await query.Select(x => x.NguoiDungId).Distinct().ToListAsync();
            foreach (var id in matched)
                recipients.Add(id);
        }

        return recipients.ToList();
    }

    private async Task<int> CreateForUsersAsync(
        IEnumerable<int> nguoiDungIds,
        string loaiThongBao,
        string tieuDe,
        string? noiDung,
        string? urlDieuHuong,
        int? goiThauId,
        long? workflowStepInstanceId,
        string? notificationKey)
    {
        var recipients = nguoiDungIds.Distinct().ToList();
        if (recipients.Count == 0)
            return 0;

        if (!string.IsNullOrWhiteSpace(notificationKey))
        {
            var existed = await _db.ThongBaos
                .Where(t => t.NotificationKey == notificationKey && recipients.Contains(t.NguoiDungId))
                .Select(t => t.NguoiDungId)
                .ToListAsync();
            recipients = recipients.Except(existed).ToList();
        }

        if (recipients.Count == 0)
            return 0;

        var now = DateTime.UtcNow;
        var items = recipients.Select(id => new ThongBao
        {
            IdCongKhai = Guid.NewGuid(),
            NguoiDungId = id,
            GoiThauId = goiThauId,
            WorkflowStepInstanceId = workflowStepInstanceId,
            LoaiThongBao = loaiThongBao,
            TieuDe = tieuDe,
            NoiDung = noiDung,
            UrlDieuHuong = urlDieuHuong,
            NotificationKey = notificationKey,
            DaDoc = false,
            NgayTao = now
        });

        _db.ThongBaos.AddRange(items);
        await _db.SaveChangesAsync();
        return recipients.Count;
    }

    private static string BuildGoiThauUrl(int goiThauId) => $"/danh-sach-goi-thau?goiThauId=GT{goiThauId}";

    private static string BuildStepUrl(int goiThauId, long stepId) => $"/xu-ly-buoc/GT{goiThauId}?stepId={stepId}";

    private static string BuildMaGoiThau(GoiThau goiThau) =>
        string.IsNullOrWhiteSpace(goiThau.MaGoiThau) ? $"GT{goiThau.Id}" : goiThau.MaGoiThau;
}
