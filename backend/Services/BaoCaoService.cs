using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.BaoCao;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class BaoCaoService : IBaoCaoService
{
    private readonly AppDbContext _db;

    public BaoCaoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<BaoCaoGoiThauResponse> GetGoiThauListAsync(int userId, BaoCaoGoiThauFilterDto filter)
    {
        var (allowedKhoaPhongIds, isFullScope) = await ResolveScopeAsync(userId);

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
                IdCongKhai = g.IdCongKhai,
                MaGoiThau = g.MaGoiThau,
                TenGoiThau = g.TenGoiThau,
                TenHinhThuc = g.HinhThucId != null
                    ? _db.HinhThucDauThaus.Where(h => h.Id == g.HinhThucId).Select(h => h.TenHinhThuc).FirstOrDefault()
                    : null,
                GiaTri = g.NganSach,
                TrangThai = g.TrangThai,
                TongSoBuoc = _db.WorkflowInstances
                    .Where(wi => wi.GoiThauId == g.Id)
                    .SelectMany(wi => wi.WorkflowStepInstances)
                    .Count(),
                SoBuocHoanThanh = _db.WorkflowInstances
                    .Where(wi => wi.GoiThauId == g.Id)
                    .SelectMany(wi => wi.WorkflowStepInstances)
                    .Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.HOAN_TAT)
            })
            .ToListAsync();

        // Calculate percentage
        foreach (var item in items)
        {
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
        var (allowedKhoaPhongIds, isFullScope) = await ResolveScopeAsync(userId);

        var query = _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong)
            .AsQueryable();

        if (!isFullScope)
            query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        if (tuNgay.HasValue) query = query.Where(g => g.NgayTao >= tuNgay.Value);
        if (denNgay.HasValue) query = query.Where(g => g.NgayTao <= denNgay.Value);
        if (hinhThucId.HasValue) query = query.Where(g => g.HinhThucId == hinhThucId.Value);

        // KPI totals
        var tongGoiThau = await query.CountAsync();
        var dangXuLy = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.DANG_XU_LY);
        var hoanThanh = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.HOAN_THANH);
        var daHuy = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.HUY_BO);
        var quaHan = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.QUA_HAN);
        var tongNganSach = await query.SumAsync(g => g.NganSach ?? 0);

        // Stats by department — only for full-scope users
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

        // Stats by month
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

        // Stats by procurement type
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

    /// <summary>Resolve scope: returns (allowedKhoaPhongIds, isFullScope).
    /// Full scope = user có role gắn với null KhoaPhongId (Admin/BGĐ/P.QLĐT toàn quyền).</summary>
    private async Task<(HashSet<int> Ids, bool IsFull)> ResolveScopeAsync(int userId)
    {
        var assignments = await _db.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.NguoiDungId == userId)
            .Select(nkv => nkv.KhoaPhongId)
            .Distinct()
            .ToListAsync();

        // User has any assignment with null KhoaPhongId = full scope (global role)
        if (assignments.Any(id => id == null))
            return ([], true);

        var khoaPhongIds = assignments.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();
        return (khoaPhongIds, false);
    }
}
