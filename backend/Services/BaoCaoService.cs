using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.BaoCao;
using QLQTDT.Api.Models.Entities;
using System.Text;

namespace QLQTDT.Api.Services;

public class BaoCaoService : IBaoCaoService
{
    private readonly AppDbContext _db;
    private readonly ITenderAccessService _tenderAccess;

    public BaoCaoService(AppDbContext db, ITenderAccessService tenderAccess)
    {
        _db = db;
        _tenderAccess = tenderAccess;
    }

    public async Task<BaoCaoGoiThauResponse> GetGoiThauListAsync(int userId, BaoCaoGoiThauFilterDto filter)
    {
        if (filter.Page < 1)
            throw new BadRequestException("page phải lớn hơn hoặc bằng 1.");
        if (filter.PageSize < 1 || filter.PageSize > 100)
            throw new BadRequestException("pageSize phải từ 1 đến 100.");

        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        if (!isFullScope && filter.KhoaPhongId.HasValue && !allowedKhoaPhongIds.Contains(filter.KhoaPhongId.Value))
            throw new ForbiddenException("Bạn không có quyền xem dữ liệu của khoa/phòng này.");

        var query = _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong)
            .AsQueryable();

        // Scope filter
        if (!isFullScope)
            query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));
        else if (filter.KhoaPhongId.HasValue)
            query = query.Where(g => g.KhoaPhongId == filter.KhoaPhongId.Value);

        // Optional filters
        if (filter.TuNgay.HasValue)
            query = query.Where(g => g.NgayTao >= filter.TuNgay.Value);
        if (filter.DenNgay.HasValue)
            query = query.Where(g => g.NgayTao <= filter.DenNgay.Value);
        if (!string.IsNullOrWhiteSpace(filter.TrangThai))
            query = query.Where(g => g.TrangThai == filter.TrangThai);
        if (filter.HinhThucId.HasValue)
            query = query.Where(g => g.HinhThucId == filter.HinhThucId.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(g => g.NgayTao)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(g => new BaoCaoGoiThauItemDto
            {
                Id = g.Id,
                IdCongKhai = g.IdCongKhai,
                MaGoiThau = g.MaGoiThau,
                TenGoiThau = g.TenGoiThau,
                HinhThucId = g.HinhThucId,
                GiaTri = g.NganSach,
                TrangThai = g.TrangThai,
                TenKhoaPhong = g.KhoaPhongId != null
                    ? _db.KhoaPhongs.Where(k => k.Id == g.KhoaPhongId).Select(k => k.TenKhoaPhong).FirstOrDefault()
                    : null,
                KhoaPhongId = g.KhoaPhongId,
                NgayTao = g.NgayTao,
            })
            .ToListAsync();

        // Batch resolve hinh thuc names
        var hinhThucIds = items.Where(i => i.HinhThucId.HasValue).Select(i => i.HinhThucId!.Value).Distinct().ToList();
        var hinhThucDict = hinhThucIds.Count > 0
            ? await _db.HinhThucDauThaus.Where(h => hinhThucIds.Contains(h.Id)).ToDictionaryAsync(h => h.Id, h => h.TenHinhThuc)
            : new Dictionary<int, string>();

        // Batch resolve step counts
        var goiThauIds = items.Select(g => g.Id).ToList();
        var stepCountsRaw = await _db.WorkflowInstances
            .Where(wi => goiThauIds.Contains(wi.GoiThauId))
            .SelectMany(wi => wi.WorkflowStepInstances)
            .GroupBy(wsi => wsi.WorkflowInstance!.GoiThauId)
            .Select(g => new
            {
                GoiThauId = g.Key,
                Total = g.Count(),
                Completed = g.Count(wsi => wsi.TrangThai == QLQTDT.Api.Models.Entities.WorkflowStepTrangThai.HOAN_TAT)
            })
            .ToListAsync();
        var stepCountDict = stepCountsRaw.ToDictionary(s => s.GoiThauId);

        foreach (var item in items)
        {
            item.TenHinhThuc = item.HinhThucId.HasValue ? hinhThucDict.GetValueOrDefault(item.HinhThucId.Value) : null;
            if (stepCountDict.TryGetValue(item.Id, out var counts))
            {
                item.TongSoBuoc = counts.Total;
                item.SoBuocHoanThanh = counts.Completed;
            }
            item.PhanTramHoanThanh = item.TongSoBuoc > 0
                ? Math.Round((double)item.SoBuocHoanThanh / item.TongSoBuoc * 100, 1)
                : 0;
        }

        return new BaoCaoGoiThauResponse
        {
            Items = items,
            Total = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<BaoCaoTongHopDto> GetTongHopAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        var query = _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong)
            .AsQueryable();

        if (!isFullScope)
            query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        if (tuNgay.HasValue) query = query.Where(g => g.NgayTao >= tuNgay.Value);
        if (denNgay.HasValue) query = query.Where(g => g.NgayTao <= denNgay.Value);
        if (hinhThucId.HasValue) query = query.Where(g => g.HinhThucId == hinhThucId.Value);

        var tongGoiThau = await query.CountAsync();
        var dangXuLy = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.DANG_XU_LY);
        var hoanThanh = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.HOAN_THANH);
        var daHuy = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.HUY_BO);
        var quaHan = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.QUA_HAN);
        var tongNganSach = await query.SumAsync(g => g.NganSach ?? 0);

        List<BaoCaoTheoDonViDto> theoDonVi = [];
        if (isFullScope)
        {
            var filterQuery = _db.GoiThaus.Where(g => g.TrangThaiHoatDong);
            if (tuNgay.HasValue) filterQuery = filterQuery.Where(g => g.NgayTao >= tuNgay.Value);
            if (denNgay.HasValue) filterQuery = filterQuery.Where(g => g.NgayTao <= denNgay.Value);
            if (hinhThucId.HasValue) filterQuery = filterQuery.Where(g => g.HinhThucId == hinhThucId.Value);

            theoDonVi = await filterQuery
                .GroupBy(g => g.KhoaPhongId)
                .Select(g => new BaoCaoTheoDonViDto
                {
                    KhoaPhongId = g.Key,
                    TenKhoaPhong = g.Key != null
                        ? _db.KhoaPhongs.Where(k => k.Id == g.Key).Select(k => k.TenKhoaPhong).FirstOrDefault() ?? "(Không xác định)"
                        : "(Không xác định)",
                    TongGoiThau = g.Count(),
                    DangXuLy = g.Count(x => x.TrangThai == GoiThauTrangThai.DANG_XU_LY),
                    HoanThanh = g.Count(x => x.TrangThai == GoiThauTrangThai.HOAN_THANH),
                    DaHuy = g.Count(x => x.TrangThai == GoiThauTrangThai.HUY_BO),
                    TongGiaTri = g.Sum(x => x.NganSach)
                })
                .ToListAsync();
        }

        var theoThang = await query
            .GroupBy(g => new { g.NgayTao.Year, g.NgayTao.Month })
            .Select(g => new BaoCaoTheoThangDto
            {
                Nam = g.Key.Year,
                Thang = g.Key.Month,
                SoLuong = g.Count()
            })
            .OrderByDescending(t => t.Nam).ThenByDescending(t => t.Thang)
            .Take(12)
            .ToListAsync();

        var theoHinhThuc = await query
            .GroupBy(g => new { HinhThucId = g.HinhThucId ?? -1 })
            .Select(g => new BaoCaoTheoHinhThucDto
            {
                HinhThucId = g.Key.HinhThucId,
                TenHinhThuc = g.Key.HinhThucId != -1
                    ? _db.HinhThucDauThaus.Where(h => h.Id == g.Key.HinhThucId).Select(h => h.TenHinhThuc).FirstOrDefault()!
                    : "(Không xác định)",
                SoLuong = g.Count(),
                TongGiaTri = g.Sum(x => x.NganSach)
            })
            .ToListAsync();

        return new BaoCaoTongHopDto
        {
            TongGoiThau = tongGoiThau,
            DangXuLy = dangXuLy,
            HoanThanh = hoanThanh,
            DaHuy = daHuy,
            QuaHan = quaHan,
            TongNganSach = tongNganSach,
            TheoDonVi = theoDonVi,
            TheoThang = theoThang,
            TheoHinhThuc = theoHinhThuc
        };
    }

    public async Task<List<BaoCaoChiTieuTheoKhoaDto>> GetChiTieuTheoKhoaAsync(
        int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(
            userId, "REPORT.VIEW_ALL");

        var query = _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong)
            .AsQueryable();

        if (!isFullScope)
            query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        if (tuNgay.HasValue) query = query.Where(g => g.NgayTao >= tuNgay.Value);
        if (denNgay.HasValue) query = query.Where(g => g.NgayTao <= denNgay.Value);
        if (hinhThucId.HasValue) query = query.Where(g => g.HinhThucId == hinhThucId.Value);

        // Aggregate spending by department
        var result = await query
            .GroupBy(g => g.KhoaPhongId)
            .Select(g => new
            {
                KhoaPhongId = g.Key,
                TongGoiThau = g.Count(),
                TongNganSach = g.Sum(x => x.NganSach),
                DangXuLy = g.Count(x => x.TrangThai == GoiThauTrangThai.DANG_XU_LY),
                HoanThanh = g.Count(x => x.TrangThai == GoiThauTrangThai.HOAN_THANH),
                DaHuy = g.Count(x => x.TrangThai == GoiThauTrangThai.HUY_BO),
                GoiThauIds = g.Select(x => x.Id).ToList(),
            })
            .ToListAsync();

        // Get actual contract spending for completed tenders
        var allGoiThauIds = result.SelectMany(r => r.GoiThauIds).Distinct().ToList();
        var hopDongSpending = await _db.HopDongs
            .Where(h => allGoiThauIds.Contains(h.GoiThauId))
            .Include(h => h.GoiThau)
            .Select(h => new { h.GoiThau!.KhoaPhongId, h.TongGiaTri })
            .Where(x => x.KhoaPhongId != null)
            .GroupBy(x => x.KhoaPhongId!.Value)
            .Select(g => new
            {
                KhoaPhongId = g.Key,
                TongGiaiNgan = g.Sum(x => x.TongGiaTri)
            })
            .ToListAsync();
        var giaiNganDict = hopDongSpending.ToDictionary(h => h.KhoaPhongId, h => h.TongGiaiNgan);

        // Resolve department names
        var khoaPhongIds = result.Where(r => r.KhoaPhongId.HasValue).Select(r => r.KhoaPhongId!.Value).Distinct().ToList();
        var khoaPhongDict = khoaPhongIds.Count > 0
            ? await _db.KhoaPhongs.Where(k => khoaPhongIds.Contains(k.Id)).ToDictionaryAsync(k => k.Id, k => k.TenKhoaPhong)
            : new Dictionary<int, string>();

        return result.Select(r => new BaoCaoChiTieuTheoKhoaDto
        {
            KhoaPhongId = r.KhoaPhongId,
            TenKhoaPhong = r.KhoaPhongId.HasValue
                ? khoaPhongDict.GetValueOrDefault(r.KhoaPhongId.Value, "(Không xác định)")
                : "(Không xác định)",
            TongGoiThau = r.TongGoiThau,
            TongNganSach = r.TongNganSach,
            TongGiaiNgan = r.KhoaPhongId.HasValue ? giaiNganDict.GetValueOrDefault(r.KhoaPhongId.Value) : null,
            PhanTramGiaiNgan = r.TongNganSach.GetValueOrDefault() > 0 && r.KhoaPhongId.HasValue
                ? Math.Round((double)(giaiNganDict.GetValueOrDefault(r.KhoaPhongId.Value, 0)
                    / r.TongNganSach.GetValueOrDefault()) * 100, 1)
                : 0,
            DangXuLy = r.DangXuLy,
            HoanThanh = r.HoanThanh,
            DaHuy = r.DaHuy,
        }).ToList();
    }

    public async Task<byte[]> ExportCsvAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        // Use chi-tieu data as CSV source, plus tong-hop stats
        var chiTieu = await GetChiTieuTheoKhoaAsync(userId, tuNgay, denNgay, hinhThucId);
        var tongHop = await GetTongHopAsync(userId, tuNgay, denNgay, hinhThucId);

        var sb = new StringBuilder();
        sb.AppendLine("BÁO CÁO TỔNG HỢP ĐẤU THẦU");
        sb.AppendLine($"Ngày xuất: {DateTime.UtcNow:dd/MM/yyyy HH:mm:ss}");
        sb.AppendLine();

        // Summary section
        sb.AppendLine("--- TỔNG QUAN ---");
        sb.AppendLine($"Tổng số gói thầu,{tongHop.TongGoiThau}");
        sb.AppendLine($"Đang xử lý,{tongHop.DangXuLy}");
        sb.AppendLine($"Hoàn thành,{tongHop.HoanThanh}");
        sb.AppendLine($"Đã hủy,{tongHop.DaHuy}");
        sb.AppendLine($"Quá hạn,{tongHop.QuaHan}");
        sb.AppendLine($"Tổng ngân sách,{tongHop.TongNganSach:N0}");
        sb.AppendLine();

        // By department
        sb.AppendLine("--- CHI TIÊU THEO KHOA ---");
        sb.AppendLine("Khoa phòng,Tổng gói thầu,Ngân sách,Giải ngân,% giải ngân,Đang xử lý,Hoàn thành,Đã hủy");
        foreach (var item in chiTieu)
        {
            sb.AppendLine($"\"{item.TenKhoaPhong}\",{item.TongGoiThau},{item.TongNganSach:N0},{item.TongGiaiNgan:N0},{item.PhanTramGiaiNgan}%,{item.DangXuLy},{item.HoanThanh},{item.DaHuy}");
        }
        sb.AppendLine();

        // By month
        sb.AppendLine("--- THEO THÁNG ---");
        sb.AppendLine("Tháng,Năm,Số lượng");
        foreach (var item in tongHop.TheoThang)
        {
            sb.AppendLine($"{item.Thang},{item.Nam},{item.SoLuong}");
        }
        sb.AppendLine();

        // By procurement type
        sb.AppendLine("--- THEO HÌNH THỨC ---");
        sb.AppendLine("Hình thức,Số lượng,Tổng giá trị");
        foreach (var item in tongHop.TheoHinhThuc)
        {
            sb.AppendLine($"\"{item.TenHinhThuc}\",{item.SoLuong},{item.TongGiaTri:N0}");
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }
}
