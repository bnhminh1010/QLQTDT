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
            .AsNoTracking()
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
        if (filter.PageSize > 100) filter.PageSize = 100;

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

    public async Task<List<WorkflowStepReportDto>> GetStepReportAsync(
        int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        var goiThauQuery = _db.GoiThaus.Where(g => g.TrangThaiHoatDong);
        if (!isFullScope)
            goiThauQuery = goiThauQuery.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        var allowedGoiThauIds = await goiThauQuery.Select(g => g.Id).ToListAsync();

        var query = _db.WorkflowInstances
            .Where(wi => allowedGoiThauIds.Contains(wi.GoiThauId))
            .Where(wi => wi.TrangThai == WorkflowTrangThai.ACTIVE || wi.TrangThai == WorkflowTrangThai.COMPLETED)
            .AsQueryable();

        if (tuNgay.HasValue) query = query.Where(wi => wi.NgayBatDau >= tuNgay.Value);
        if (denNgay.HasValue) query = query.Where(wi => wi.NgayBatDau <= denNgay.Value);
        if (hinhThucId.HasValue)
            query = query.Where(wi => wi.Workflow!.HinhThucId == hinhThucId.Value);

        var raw = await query
            .SelectMany(wi => wi.WorkflowStepInstances)
            .GroupBy(wsi => wsi.BuocWorkflow!.TenBuoc)
            .Select(g => new
            {
                TenBuoc = g.Key,
                TongSo = g.Count(),
                HoanThanh = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.HOAN_TAT
                    || wsi.TrangThai == WorkflowStepTrangThai.SKIPPED),
                DangXuLy = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.DANG_XU_LY),
                ChoDuyet = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.CHO_DUYET),
                QuaHanCount = g.Count(wsi => wsi.QuaHan == true),
            })
            .ToListAsync();

        return raw.Select(r => new WorkflowStepReportDto
        {
            TenBuoc = r.TenBuoc,
            TongSo = r.TongSo,
            HoanThanh = r.HoanThanh,
            DangXuLy = r.DangXuLy,
            ChoDuyet = r.ChoDuyet,
            QuaHan = r.QuaHanCount,
            TiLeHoanThanh = r.TongSo > 0 ? Math.Round((double)r.HoanThanh / r.TongSo * 100, 1) : 0
        }).OrderBy(r => r.TiLeHoanThanh).ThenByDescending(r => r.TongSo).ToList();
    }

    public async Task<List<BaoCaoTietKiemDto>> GetTietKiemAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
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

        var goiThauData = await query
            .Select(g => new
            {
                g.Id,
                g.KhoaPhongId,
                NganSach = g.NganSach ?? 0,
            })
            .ToListAsync();

        var goiThauIds = goiThauData.Select(g => g.Id).ToList();
        var hopDongData = await _db.HopDongs
            .Where(h => goiThauIds.Contains(h.GoiThauId))
            .Select(h => new { h.GoiThauId, h.TongGiaTri })
            .ToListAsync();

        var hopDongByGoiThau = hopDongData
            .GroupBy(h => h.GoiThauId)
            .ToDictionary(g => g.Key, g => g.Sum(h => h.TongGiaTri));

        // Group by department
        var result = goiThauData
            .GroupBy(g => g.KhoaPhongId)
            .Select(g =>
            {
                var tongNganSach = g.Sum(x => x.NganSach);
                var tongHopDong = g.Sum(x => hopDongByGoiThau.GetValueOrDefault(x.Id, 0));
                var tienTietKiem = tongNganSach - tongHopDong;
                var phanTram = tongNganSach > 0
                    ? Math.Round((double)(tienTietKiem / tongNganSach) * 100, 1)
                    : 0;
                return new BaoCaoTietKiemDto
                {
                    KhoaPhongId = g.Key,
                    TenKhoaPhong = "", // resolve below
                    TongGoiThau = g.Count(),
                    TongNganSach = tongNganSach,
                    TongGiaTriHopDong = tongHopDong,
                    TienTietKiem = tienTietKiem,
                    PhanTramTietKiem = phanTram,
                };
            })
            .ToList();

        // Resolve department names
        var khoaPhongIds = result.Where(r => r.KhoaPhongId.HasValue).Select(r => r.KhoaPhongId!.Value).Distinct().ToList();
        var khoaPhongDict = khoaPhongIds.Count > 0
            ? await _db.KhoaPhongs.Where(k => khoaPhongIds.Contains(k.Id)).ToDictionaryAsync(k => k.Id, k => k.TenKhoaPhong)
            : new Dictionary<int, string>();

        foreach (var item in result)
        {
            item.TenKhoaPhong = item.KhoaPhongId.HasValue
                ? khoaPhongDict.GetValueOrDefault(item.KhoaPhongId.Value, "(Không xác định)")
                : "(Không xác định)";
        }

        return result.OrderByDescending(r => r.TienTietKiem).ToList();
    }

    public async Task<List<BaoCaoHieuSuatNguoiDungDto>> GetHieuSuatNguoiDungAsync(
        int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        var goiThauQuery = _db.GoiThaus.Where(g => g.TrangThaiHoatDong);
        if (!isFullScope)
            goiThauQuery = goiThauQuery.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        var allowedGoiThauIds = await goiThauQuery.Select(g => g.Id).ToListAsync();

        var wsiQuery = _db.WorkflowInstances
            .Where(wi => allowedGoiThauIds.Contains(wi.GoiThauId))
            .SelectMany(wi => wi.WorkflowStepInstances)
            .AsQueryable();

        if (tuNgay.HasValue)
            wsiQuery = wsiQuery.Where(wsi => wsi.NgayBatDau >= tuNgay.Value);
        if (denNgay.HasValue)
            wsiQuery = wsiQuery.Where(wsi => wsi.NgayBatDau <= denNgay.Value);

        var raw = await wsiQuery.ToListAsync();

        // Collect user activity: both processor and approver
        var userActivity = new Dictionary<int, (int total, int completed, int overdue, double totalHours, int completedWithTime)>();
        void AddActivity(int? nguoiDungId, string trangThai, DateTime? ngayBatDau, DateTime? ngayHoanThanh, bool? quaHan)
        {
            if (nguoiDungId == null) return;
            var id = nguoiDungId.Value;
            if (!userActivity.ContainsKey(id))
                userActivity[id] = (0, 0, 0, 0, 0);
            var cur = userActivity[id];
            cur.total++;
            if (trangThai == WorkflowStepTrangThai.HOAN_TAT || trangThai == WorkflowStepTrangThai.SKIPPED)
            {
                cur.completed++;
                if (ngayBatDau.HasValue && ngayHoanThanh.HasValue)
                {
                    cur.totalHours += (ngayHoanThanh.Value - ngayBatDau.Value).TotalHours;
                    cur.completedWithTime++;
                }
            }
            if (quaHan == true)
                cur.overdue++;
            userActivity[id] = cur;
        }

        foreach (var wsi in raw)
        {
            AddActivity(wsi.NguoiXuLyId, wsi.TrangThai, wsi.NgayBatDau, wsi.NgayHoanThanh, wsi.QuaHan);
            // Also count approver if different
            if (wsi.NguoiKyDuyetId != null && wsi.NguoiKyDuyetId != wsi.NguoiXuLyId)
            {
                AddActivity(wsi.NguoiKyDuyetId, wsi.KetQua == "DUYET" ? WorkflowStepTrangThai.HOAN_TAT : WorkflowStepTrangThai.TRA_VE, wsi.NgayBatDau, wsi.NgayKyDuyet, wsi.QuaHan);
            }
        }

        if (userActivity.Count == 0)
            return [];

        // Resolve user names
        var userIds = userActivity.Keys.ToList();
        var users = await _db.NguoiDungs
            .Where(u => userIds.Contains(u.Id) && u.TrangThaiHoatDong)
            .ToDictionaryAsync(u => u.Id, u => new { u.HoTen, u.TenDangNhap });

        return userActivity
            .Select(kv =>
            {
                var (total, completed, overdue, totalHours, completedWithTime) = kv.Value;
                var u = users.GetValueOrDefault(kv.Key);
                return new BaoCaoHieuSuatNguoiDungDto
                {
                    NguoiDungId = kv.Key,
                    HoTen = u?.HoTen ?? "(Đã xóa)",
                    TenDangNhap = u?.TenDangNhap ?? "?",
                    TongBuocXuLy = total,
                    SoBuocHoanThanh = completed,
                    SoBuocQuaHan = overdue,
                    ThoiGianXuLyTrungBinhGio = completedWithTime > 0
                        ? Math.Round(totalHours / completedWithTime, 1)
                        : 0,
                    TiLeQuaHan = total > 0
                        ? Math.Round((double)overdue / total * 100, 1)
                        : 0,
                };
            })
            .OrderByDescending(d => d.TongBuocXuLy)
            .ToList();
    }

    public async Task<List<WorkflowBottleneckDto>> GetWorkflowBottleneckAsync(
        int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId)
    {
        var (allowedKhoaPhongIds, isFullScope) = await _tenderAccess.ResolveTenderScopeAsync(userId);

        var goiThauQuery = _db.GoiThaus.Where(g => g.TrangThaiHoatDong);
        if (!isFullScope)
            goiThauQuery = goiThauQuery.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));

        var allowedGoiThauIds = await goiThauQuery.Select(g => g.Id).ToListAsync();

        var query = _db.WorkflowStepInstances
            .Include(wsi => wsi.BuocWorkflow)
            .Where(wsi => allowedGoiThauIds.Contains(wsi.WorkflowInstance!.GoiThauId))
            .AsQueryable();

        if (tuNgay.HasValue) query = query.Where(wsi => wsi.NgayBatDau >= tuNgay.Value);
        if (denNgay.HasValue) query = query.Where(wsi => wsi.NgayBatDau <= denNgay.Value);

        var raw = await query.ToListAsync();

        var grouped = raw
            .GroupBy(wsi => wsi.BuocWorkflow!.TenBuoc)
            .Select(g =>
            {
                var completed = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.HOAN_TAT || wsi.TrangThai == WorkflowStepTrangThai.SKIPPED);
                var dangXuLy = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.DANG_XU_LY);
                var choDuyet = g.Count(wsi => wsi.TrangThai == WorkflowStepTrangThai.CHO_DUYET);
                var quaHan = g.Count(wsi => wsi.QuaHan == true);
                var total = g.Count();

                // Average hours for completed steps only
                var completedWithTime = g.Where(wsi =>
                    (wsi.TrangThai == WorkflowStepTrangThai.HOAN_TAT || wsi.TrangThai == WorkflowStepTrangThai.SKIPPED)
                    && wsi.NgayBatDau != null && wsi.NgayHoanThanh != null);
                var avgHours = completedWithTime.Any()
                    ? Math.Round(completedWithTime.Average(wsi => (wsi.NgayHoanThanh!.Value - wsi.NgayBatDau).TotalHours), 1)
                    : 0;

                // Warning level
                var waiting = dangXuLy + choDuyet;
                var overdueRate = total > 0 ? (double)quaHan / total : 0;
                string mucDo;
                if (overdueRate > 0.3 || waiting > 20)
                    mucDo = "CRITICAL";
                else if (overdueRate > 0.1 || waiting > 10)
                    mucDo = "WARN";
                else
                    mucDo = "OK";

                return new WorkflowBottleneckDto
                {
                    TenBuoc = g.Key,
                    TongSo = total,
                    HoanThanh = completed,
                    DangXuLy = dangXuLy,
                    ChoDuyet = choDuyet,
                    QuaHan = quaHan,
                    ThoiGianTrungBinhGio = avgHours,
                    MucDoCanhBao = mucDo,
                };
            })
            .OrderByDescending(d => d.MucDoCanhBao == "CRITICAL" ? 2 : d.MucDoCanhBao == "WARN" ? 1 : 0)
            .ThenByDescending(d => d.QuaHan)
            .ToList();

        return grouped;
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
