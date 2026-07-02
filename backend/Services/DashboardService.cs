using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models.DTOs.Dashboard;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly ITenderAccessService _tenderAccess;

    public DashboardService(AppDbContext db, ITenderAccessService tenderAccess)
    {
        _db = db;
        _tenderAccess = tenderAccess;
    }

    public async Task<DashboardTongQuanDto> GetTongQuanAsync(int userId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        var query = _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong)
            .AsNoTracking()
            .AsQueryable();

        if (!isFullScope)
            query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        // KPI cards
        var tongGoiThau = await query.CountAsync();
        var dangXuLy = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.DANG_XU_LY);
        var hoanThanh = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.HOAN_THANH);
        var quaHan = await query.CountAsync(g => g.TrangThai == GoiThauTrangThai.QUA_HAN);
        var tongNganSach = await query.SumAsync(g => g.NganSach ?? 0);

        // Monthly stats (last 12 months)
        var thongKeThang = await query
            .GroupBy(g => new { g.NgayTao.Year, g.NgayTao.Month })
            .Select(g => new DashboardThongKeDto
            {
                Nam = g.Key.Year,
                Thang = g.Key.Month,
                SoLuong = g.Count()
            })
            .OrderByDescending(t => t.Nam).ThenByDescending(t => t.Thang)
            .Take(12)
            .ToListAsync();

        // Status distribution
        var phanBoTrangThai = await query
            .GroupBy(g => g.TrangThai)
            .Select(g => new DashboardPhanBoDto
            {
                TrangThai = g.Key,
                SoLuong = g.Count()
            })
            .ToListAsync();

        // Notable package — pick first active with workflow instance
        var activeQuery = query
            .Where(g => g.TrangThai == GoiThauTrangThai.DANG_XU_LY);

        var notable = await activeQuery
            .OrderByDescending(g => g.NgayTao)
            .Select(g => new GoiThauHienTaiDto
            {
                Id = g.Id,
                IdCongKhai = g.IdCongKhai,
                MaGoiThau = g.MaGoiThau,
                TenGoiThau = g.TenGoiThau,
                TenKhoaPhong = g.KhoaPhongId != null
                    ? _db.KhoaPhongs.Where(k => k.Id == g.KhoaPhongId).Select(k => k.TenKhoaPhong).FirstOrDefault()
                    : null,
                TrangThai = g.TrangThai
            })
            .FirstOrDefaultAsync();

        if (notable != null)
        {
            // Count total and completed steps
            var stepCounts = await _db.WorkflowInstances
                .Where(wi => wi.GoiThauId == notable.Id)
                .SelectMany(wi => wi.WorkflowStepInstances)
                .GroupBy(wsi => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Completed = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.HOAN_TAT)
                })
                .FirstOrDefaultAsync();

            notable.TongSoBuoc = stepCounts?.Total ?? 0;
            notable.SoBuocHoanThanh = stepCounts?.Completed ?? 0;
            notable.PhanTramHoanThanh = notable.TongSoBuoc > 0
                ? Math.Round((double)notable.SoBuocHoanThanh / notable.TongSoBuoc * 100, 1)
                : 0;
        }

        return new DashboardTongQuanDto
        {
            TongGoiThau = tongGoiThau,
            DangXuLy = dangXuLy,
            HoanThanh = hoanThanh,
            QuaHan = quaHan,
            TongNganSach = tongNganSach,
            GoiThauNoiBat = notable,
            ThongKeThang = thongKeThang,
            PhanBoTrangThai = phanBoTrangThai
        };
    }
}
