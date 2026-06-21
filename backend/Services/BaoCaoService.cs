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
        if (filter.Page < 1)
            throw new BadRequestException("page phải lớn hơn hoặc bằng 1.");
        if (filter.PageSize < 1 || filter.PageSize > 100)
            throw new BadRequestException("pageSize phải từ 1 đến 100.");

        var (allowedKhoaPhongIds, isFullScope) = await ScopeResolver.ResolveAsync(_db, userId);

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
        var (allowedKhoaPhongIds, isFullScope) = await ScopeResolver.ResolveAsync(_db, userId);

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

}
