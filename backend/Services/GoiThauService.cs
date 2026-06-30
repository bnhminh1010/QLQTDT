using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.Constants;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class GoiThauService : BaseService<GoiThau>, IGoiThauService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenderAccessService _tenderAccess;
    private readonly IWorkflowEngineService _workflowEngine;
    private readonly IThongBaoService _thongBaoService;
    private readonly ILogger<GoiThauService> _logger;

    public GoiThauService(
        AppDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ITenderAccessService tenderAccess,
        IWorkflowEngineService workflowEngine,
        IThongBaoService thongBaoService,
        ILogger<GoiThauService> logger) : base(db)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenderAccess = tenderAccess;
        _workflowEngine = workflowEngine;
        _thongBaoService = thongBaoService;
        _logger = logger;
    }

    public async Task<PagedResult<GoiThauDto>> SearchAsync(int page, int pageSize, string? trangThai)
    {
        if (page < 1) throw new BadRequestException("page phải lớn hơn hoặc bằng 1.");
        if (pageSize < 1 || pageSize > 100) throw new BadRequestException("pageSize phải từ 1 đến 100.");

        var normalizedTrangThai = trangThai?.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedTrangThai) && !GoiThauTrangThai.All.Contains(normalizedTrangThai))
            throw new BadRequestException($"trangThai không hợp lệ. Giá trị hợp lệ: {string.Join(", ", GoiThauTrangThai.All)}");

        var query = _set.Where(g => g.TrangThaiHoatDong);

        if (!string.IsNullOrWhiteSpace(normalizedTrangThai))
            query = query.Where(g => g.TrangThai == normalizedTrangThai);

        // Áp scope filter theo khoa/phòng cho user limited.
        // Scope rỗng phải trả danh sách rỗng, không được bỏ filter thành full scope.
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        var scope = await _tenderAccess.ResolveTenderScopeDetailAsync(userId);
        if (!scope.IsFullScope)
        {
            // Step 1: Resolve strict-scope IDs (creator OR same department)
            var strictIds = scope.OwnOnly
                ? await _set
                    .Where(g => g.TrangThaiHoatDong && g.NguoiTaoId == userId)
                    .Select(g => g.Id)
                    .ToListAsync()
                : await _set
                    .Where(g => g.TrangThaiHoatDong && (g.NguoiTaoId == userId || scope.KhoaPhongIds.Contains(g.KhoaPhongId ?? -1)))
                    .Select(g => g.Id)
                    .ToListAsync();

            var combinedIds = new HashSet<int>(strictIds);

            // Step 2: Add TheoDoi scope — user's unit/role names match tender's TheoDoi JSON
            var userNames = await _tenderAccess.GetUserViewableNamesAsync(userId);
            if (userNames.Count > 0)
            {
                // Load all active tenders with TheoDoi in one query
                var theoDoiCandidates = await _set
                    .Where(g => g.TrangThaiHoatDong && g.TheoDoi != null && g.TheoDoi != "")
                    .Select(g => new { g.Id, g.TheoDoi })
                    .ToListAsync();

                foreach (var t in theoDoiCandidates)
                {
                    if (combinedIds.Contains(t.Id)) continue; // already covered by strict scope
                    var vals = JsonSerializer.Deserialize<string[]>(t.TheoDoi!) ?? [];
                    if (vals.Any(v => userNames.Contains(v, StringComparer.OrdinalIgnoreCase)))
                        combinedIds.Add(t.Id);
                }
            }

            if (combinedIds.Count == 0)
                return new PagedResult<GoiThauDto> { Items = [], Total = 0, Page = page, PageSize = pageSize };

            query = _set.Where(g => combinedIds.Contains(g.Id) && g.TrangThaiHoatDong);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(g => g.NgayTao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GoiThauDto
            {
                Id = g.Id,
                MaGoiThau = g.MaGoiThau,
                TenGoiThau = g.TenGoiThau,
                NganSach = g.NganSach,
                TrangThai = g.TrangThai,
                NgayTao = g.NgayTao,
                KhoaPhongId = g.KhoaPhongId,
                HinhThucId = g.HinhThucId,
                WorkflowId = g.WorkflowId,
                TheoDoi = g.TheoDoi,
                TenHinhThuc = g.HinhThuc != null ? g.HinhThuc.TenHinhThuc : null,
                TenKhoaPhong = g.KhoaPhongId != null && g.KhoaPhong != null ? g.KhoaPhong.TenKhoaPhong : null,
            })
            .ToListAsync();

        // Populate workflow step counts for all items in one batch
        var goiThauIds = items.Select(i => i.Id).ToList();
        var stepCounts = await _db.WorkflowInstances
            .Where(wi => goiThauIds.Contains(wi.GoiThauId))
            .GroupBy(wi => wi.GoiThauId)
            .Select(g => new
            {
                GoiThauId = g.Key,
                Total = g.SelectMany(wi => wi.WorkflowStepInstances).Count(),
                Completed = g.SelectMany(wi => wi.WorkflowStepInstances).Count(wsi => wsi.TrangThai == "HOAN_TAT" || wsi.TrangThai == "COMPLETED" || wsi.NgayHoanThanh != null)
            })
            .ToListAsync();

        var stepCountsByGoiThauId = stepCounts.ToDictionary(s => s.GoiThauId);
        foreach (var item in items)
        {
            if (stepCountsByGoiThauId.TryGetValue(item.Id, out var sc))
            {
                item.TongSoBuoc = sc.Total;
                item.SoBuocHoanThanh = sc.Completed;
                item.PhanTramHoanThanh = sc.Total > 0
                    ? Math.Round((double)sc.Completed / sc.Total * 100, 1)
                    : 0;
            }
        }

        return new PagedResult<GoiThauDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task<(HashSet<int> Ids, bool IsFull)> ResolveScopeAsync()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return ([], true);

        var assignments = await _db.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.NguoiDungId == userId.Value)
            .Select(nkv => nkv.KhoaPhongId)
            .Distinct()
            .ToListAsync();

        if (assignments.Any(id => id == null))
            return ([], true);

        var khoaPhongIds = assignments.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();
        return (khoaPhongIds, false);
    }

    private int? GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }

    public override async Task<GoiThau?> GetByIdAsync(int id)
    {
        var entity = await _set.FindAsync(id);
        if (entity is null || !entity.TrangThaiHoatDong) return null;
        return entity;
    }

    public async Task<GoiThauDetailDto> GetChiTietAsync(int id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        await _tenderAccess.EnsureCanViewAsync(userId, id);

        var entity = await _set
            .Include(g => g.HinhThuc)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (entity is null || !entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        return new GoiThauDetailDto
        {
            Id = entity.Id,
            IdCongKhai = entity.IdCongKhai,
            MaGoiThau = entity.MaGoiThau,
            TenGoiThau = entity.TenGoiThau,
            MoTa = entity.MoTa,
            DeXuatId = entity.DeXuatId,
            NganSach = entity.NganSach,
            TrangThai = entity.TrangThai,
            NgayTao = entity.NgayTao,
            NgayCapNhat = entity.NgayCapNhat,
            KhoaPhongId = entity.KhoaPhongId,
            HinhThucId = entity.HinhThucId,
            TenHinhThuc = entity.HinhThuc?.TenHinhThuc,
            NguonVon = entity.NguonVon,
            LoaiGoiThau = entity.LoaiGoiThau,
            CanCuApDungRutGon = entity.CanCuApDungRutGon,
            TheoDoi = entity.TheoDoi,
            WorkflowId = entity.WorkflowId,
        };
    }

    public async Task<IReadOnlyList<LichSuTrangThaiGoiThauDto>> GetLichSuTrangThaiAsync(int id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        await _tenderAccess.EnsureCanViewAsync(userId, id);

        var exists = await _set.AnyAsync(g => g.Id == id);
        if (!exists)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        return await _db.LichSuTrangThaiGoiThaus
            .Where(l => l.GoiThauId == id)
            .GroupJoin(
                _db.NguoiDungs,
                l => l.NguoiThayDoiId,
                n => n.Id,
                (l, users) => new { History = l, User = users.FirstOrDefault() })
            .OrderByDescending(l => l.History.ThoiGianThayDoi)
            .Select(l => new LichSuTrangThaiGoiThauDto
            {
                Id = l.History.Id,
                GoiThauId = l.History.GoiThauId,
                TrangThaiCu = l.History.TrangThaiCu,
                TrangThaiMoi = l.History.TrangThaiMoi,
                NguoiThayDoiId = l.History.NguoiThayDoiId,
                TenNguoiThayDoi = l.User != null ? l.User.HoTen : null,
                ThoiGianThayDoi = l.History.ThoiGianThayDoi
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<LichSuGoiThauTimelineDto>> GetLichSuDayDuAsync(int id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        await _tenderAccess.EnsureCanViewAsync(userId, id);

        var exists = await _set.AnyAsync(g => g.Id == id);
        if (!exists)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        var statusHistories = await _db.LichSuTrangThaiGoiThaus
            .AsNoTracking()
            .Where(l => l.GoiThauId == id)
            .ToListAsync();

        var workflowActions = await _db.WorkflowActionHistories
            .AsNoTracking()
            .Include(a => a.WorkflowInstance)
            .Include(a => a.WorkflowStepInstance)
                .ThenInclude(s => s!.BuocWorkflow)
            .Where(a => a.WorkflowInstance != null && a.WorkflowInstance.GoiThauId == id)
            .ToListAsync();

        var auditLogs = await _db.NhatKyKiemToans
            .AsNoTracking()
            .Where(l => l.GoiThauId == id)
            .OrderByDescending(l => l.ThoiGianThucHien)
            .Take(300)
            .ToListAsync();

        var userIds = statusHistories.Select(h => h.NguoiThayDoiId)
            .Concat(workflowActions.Select(h => (int?)h.NguoiThucHienId))
            .Concat(auditLogs.Select(h => (int?)h.NguoiThucHienId))
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var users = await _db.NguoiDungs
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.HoTen })
            .ToDictionaryAsync(u => u.Id, u => u.HoTen);

        var events = new List<LichSuGoiThauTimelineDto>();

        events.AddRange(statusHistories.Select(h => new LichSuGoiThauTimelineDto
        {
            Id = $"status-{h.Id}",
            GoiThauId = h.GoiThauId,
            Loai = "TRANG_THAI",
            TieuDe = BuildStatusTitle(h.TrangThaiMoi),
            NoiDung = $"{FormatStatus(h.TrangThaiCu) ?? "Khởi tạo"} -> {FormatStatus(h.TrangThaiMoi)}",
            NguoiThucHienId = h.NguoiThayDoiId,
            TenNguoiThucHien = h.NguoiThayDoiId.HasValue && users.TryGetValue(h.NguoiThayDoiId.Value, out var name) ? name : null,
            ThoiGian = h.ThoiGianThayDoi,
            Metadata = new Dictionary<string, string?>
            {
                ["trangThaiCu"] = h.TrangThaiCu,
                ["trangThaiMoi"] = h.TrangThaiMoi
            }
        }));

        events.AddRange(workflowActions.Select(a =>
        {
            var step = a.WorkflowStepInstance;
            var stepName = step?.BuocWorkflow?.TenBuoc;
            var title = BuildWorkflowActionTitle(a.HanhDong, stepName);
            var note = FirstNonEmpty(a.GhiChu, step?.LyDoKhongDuyet, step?.GhiChu);
            var details = new List<string>();
            if (!string.IsNullOrWhiteSpace(stepName)) details.Add($"Bước: {stepName}");
            details.Add($"Hành động: {FormatWorkflowAction(a.HanhDong)}");
            if (!string.IsNullOrWhiteSpace(step?.KetQua)) details.Add($"Kết quả: {FormatWorkflowKetQua(step.KetQua)}");
            if (!string.IsNullOrWhiteSpace(note)) details.Add($"Ghi chú: {note}");

            return new LichSuGoiThauTimelineDto
            {
                Id = $"workflow-{a.Id}",
                GoiThauId = id,
                Loai = "QUY_TRINH",
                TieuDe = title,
                NoiDung = string.Join(". ", details),
                NguoiThucHienId = a.NguoiThucHienId,
                TenNguoiThucHien = users.TryGetValue(a.NguoiThucHienId, out var name) ? name : null,
                ThoiGian = a.ThoiGian,
                Metadata = new Dictionary<string, string?>
                {
                    ["hanhDong"] = a.HanhDong,
                    ["workflowStepInstanceId"] = a.WorkflowStepInstanceId?.ToString(),
                    ["tenBuoc"] = stepName,
                    ["ketQua"] = step?.KetQua,
                    ["ghiChu"] = note
                }
            };
        }));

        events.AddRange(auditLogs
            .Where(ShouldShowAuditLog)
            .Select(a => new LichSuGoiThauTimelineDto
            {
                Id = $"audit-{a.Id}",
                GoiThauId = id,
                Loai = BuildAuditType(a),
                TieuDe = BuildAuditTitle(a),
                NoiDung = BuildAuditContent(a),
                NguoiThucHienId = a.NguoiThucHienId,
                TenNguoiThucHien = users.TryGetValue(a.NguoiThucHienId, out var name) ? name : null,
                ThoiGian = a.ThoiGianThucHien,
                Metadata = new Dictionary<string, string?>
                {
                    ["hanhDong"] = a.HanhDong,
                    ["bang"] = a.Bang,
                    ["banGhiId"] = a.BanGhiId?.ToString()
                }
            }));

        return events
            .OrderByDescending(e => e.ThoiGian)
            .ThenByDescending(e => e.Id)
            .ToList();
    }

    public async Task<GoiThauDetailDto> CreateAsync(CreateGoiThauDto dto)
    {
        var currentUserId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        // Validate HinhThucDauThau exists and is active
        var selectedHinhThuc = await _db.HinhThucDauThaus
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == dto.HinhThucId && h.TrangThaiHoatDong)
            ?? throw new BadRequestException("Hình thức đấu thầu không hợp lệ hoặc đã bị vô hiệu hóa.");

        // Prefer workflow selected by frontend; fallback to active workflow matching HinhThucId.
        int? workflowId = dto.WorkflowId;
        Workflow? workflow = null;
        var resolvedHinhThuc = selectedHinhThuc;
        if (workflowId.HasValue)
        {
            workflow = await _db.Workflows
                .AsNoTracking()
                .Include(w => w.HinhThuc)
                .FirstOrDefaultAsync(w => w.Id == workflowId.Value && w.TrangThaiHoatDong)
                ?? throw new BadRequestException("Quy trình đấu thầu không hợp lệ hoặc đã bị vô hiệu hóa.");

            // Dùng HinhThuc từ Workflow (FK đảm bảo đúng), bỏ qua dto.HinhThucId
            resolvedHinhThuc = workflow.HinhThuc;
        }
        else
        {
            workflow = await _db.Workflows
                .AsNoTracking()
                .Where(w => w.HinhThucId == selectedHinhThuc.Id && w.TrangThaiHoatDong)
                .OrderBy(w => w.Id)
                .FirstOrDefaultAsync();
            workflowId = workflow?.Id;
        }

        ValidateRutGonPolicy(
            resolvedHinhThuc.MaHinhThuc,
            resolvedHinhThuc.TenHinhThuc,
            dto.NganSach,
            dto.LoaiGoiThau,
            dto.CanCuApDungRutGon,
            resolvedHinhThuc.HanMucToiDa);

        // Resolve KhoaPhongId from current user if not provided
        int? khoaPhongId = dto.KhoaPhongId;
        if (!khoaPhongId.HasValue)
        {
            var primaryKp = await _db.NguoiDungKhoaPhongVaiTros
                .Where(nkv => nkv.NguoiDungId == currentUserId && nkv.LaChinh)
                .Select(nkv => nkv.KhoaPhongId)
                .FirstOrDefaultAsync();
            khoaPhongId = primaryKp;
        }

        if (dto.DeXuatId.HasValue)
        {
            var deXuatExists = await _db.DeXuatMuaSams.AnyAsync(d => d.Id == dto.DeXuatId.Value);
            if (!deXuatExists)
                throw new NotFoundException($"Không tìm thấy đề xuất với Id = {dto.DeXuatId.Value}");
        }

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var maGoiThau = await GenerateMaGoiThauAsync();

                var entity = new GoiThau
                {
                    MaGoiThau = maGoiThau,
                    TenGoiThau = dto.TenGoiThau,
                    MoTa = dto.MoTa,
                    DeXuatId = dto.DeXuatId,
                    NganSach = dto.NganSach,
                    HinhThucId = resolvedHinhThuc.Id,
                    WorkflowId = workflowId,
                    KhoaPhongId = khoaPhongId,
                    NguoiTaoId = currentUserId,
                    NguonVon = dto.NguonVon,
                    LoaiGoiThau = dto.LoaiGoiThau,
                    TheoDoi = dto.TheoDoi,
                    TrangThai = GoiThauTrangThai.DU_THAO,
                    TrangThaiHoatDong = true,
                    NgayTao = DateTime.UtcNow,
                };

                var created = await base.CreateAsync(entity);
                AddStatusHistory(created.Id, null, created.TrangThai, currentUserId);
                await _db.SaveChangesAsync();

                // Auto-start workflow if workflow template matched
                if (workflowId.HasValue)
                {
                    try
                    {
                        await _workflowEngine.StartWorkflowAsync(created.Id, new Models.DTOs.Workflow.StartWorkflowRequest
                        {
                            WorkflowId = workflowId.Value,
                            AutoSuggest = false
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to auto-start workflow for GoiThauId={GoiThauId}, WorkflowId={WorkflowId}", created.Id, workflowId.Value);
                        throw;
                    }
                }

                await _thongBaoService.NotifyGoiThauMoiAsync(created);
                return await GetChiTietAsync(created.Id);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx
                      && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                if (attempt == 3)
                    throw new ConflictException("Không thể tạo mã gói thầu do xung đột đồng thời. Vui lòng thử lại.");
            }
        }

        throw new ConflictException("Không thể tạo mã gói thầu. Vui lòng thử lại.");
    }

    public async Task<GoiThauDetailDto> UpdateAsync(int id, UpdateGoiThauDto dto)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        await _tenderAccess.EnsureCanEditAsync(userId, id);

        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (entity.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException($"Chỉ có thể chỉnh sửa gói thầu ở trạng thái DU_THAO. Trạng thái hiện tại: {entity.TrangThai}");

        var nextHinhThucId = dto.HinhThucId ?? entity.HinhThucId;
        if (!nextHinhThucId.HasValue)
            throw new BadRequestException("Vui lòng chọn hình thức đấu thầu.");

        var hinhThuc = await _db.HinhThucDauThaus
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == nextHinhThucId.Value && h.TrangThaiHoatDong)
            ?? throw new BadRequestException("Hình thức đấu thầu không hợp lệ hoặc đã bị vô hiệu hóa.");

        var nextLoaiGoiThau = dto.LoaiGoiThau ?? entity.LoaiGoiThau;
        var nextCanCuRutGon = dto.CanCuApDungRutGon ?? entity.CanCuApDungRutGon;
        ValidateRutGonPolicy(hinhThuc.MaHinhThuc, hinhThuc.TenHinhThuc, dto.NganSach, nextLoaiGoiThau, nextCanCuRutGon, hinhThuc.HanMucToiDa);

        entity.TenGoiThau = dto.TenGoiThau;
        entity.MoTa = dto.MoTa;
        entity.NganSach = dto.NganSach;
        entity.NgayCapNhat = DateTime.UtcNow;

        entity.HinhThucId = nextHinhThucId;
        if (dto.NguonVon is not null)
            entity.NguonVon = dto.NguonVon;
        if (dto.LoaiGoiThau is not null)
            entity.LoaiGoiThau = dto.LoaiGoiThau;
        if (dto.CanCuApDungRutGon is not null)
            entity.CanCuApDungRutGon = dto.CanCuApDungRutGon;
        if (dto.TheoDoi is not null)
            entity.TheoDoi = dto.TheoDoi;

        await _db.SaveChangesAsync();
        return await GetChiTietAsync(entity.Id);
    }

    public override async Task DeleteAsync(int id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        await _tenderAccess.EnsureCanEditAsync(userId, id);

        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (entity.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException($"Chỉ có thể xóa gói thầu ở trạng thái DU_THAO. Trạng thái hiện tại: {entity.TrangThai}");

        entity.TrangThaiHoatDong = false;
        entity.NgayCapNhat = DateTime.UtcNow;
        AddStatusHistory(entity.Id, entity.TrangThai, "DA_XOA", userId);
        await _db.SaveChangesAsync();
    }

    private static void ValidateRutGonPolicy(
        string? maHinhThuc,
        string? tenHinhThuc,
        decimal? nganSach,
        string? loaiGoiThau,
        string? canCuApDungRutGon,
        decimal? hanMucHinhThuc)
    {
        if (!GoiThauRules.IsRutGon(maHinhThuc, tenHinhThuc))
            return;

        if (!nganSach.HasValue || nganSach.Value <= 0)
            throw new BadRequestException("Giá gói thầu phải lớn hơn 0 khi áp dụng quy trình rút gọn.");

        if (string.IsNullOrWhiteSpace(loaiGoiThau))
            throw new BadRequestException("Vui lòng chọn loại gói thầu khi áp dụng quy trình rút gọn.");

        if (string.IsNullOrWhiteSpace(canCuApDungRutGon))
            throw new BadRequestException("Vui lòng nhập căn cứ áp dụng quy trình rút gọn.");

        var hanMuc = hanMucHinhThuc ?? GoiThauRules.GetHanMucRutGonTheoLoaiGoiThau(loaiGoiThau);
        if (!hanMuc.HasValue)
            throw new BadRequestException("Chưa cấu hình hạn mức cho loại gói thầu áp dụng quy trình rút gọn.");

        if (nganSach.Value > hanMuc.Value)
            throw new BadRequestException(
                $"Gói thầu không đủ điều kiện áp dụng quy trình rút gọn. " +
                $"Giá gói thầu ({nganSach.Value:N0} VNĐ) vượt hạn mức tối đa ({hanMuc.Value:N0} VNĐ) của loại gói thầu \"{loaiGoiThau}\".");
    }

    private async Task<string> GenerateMaGoiThauAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"GT-{year}-";

        var lastCode = await _set
            .Where(g => g.MaGoiThau.StartsWith(prefix))
            .OrderByDescending(g => g.Id)
            .Select(g => g.MaGoiThau)
            .FirstOrDefaultAsync();

        var seq = 1;
        if (lastCode is not null)
        {
            var seqPart = lastCode[prefix.Length..];
            if (int.TryParse(seqPart, out var lastSeq))
                seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D3}";
    }

    public async Task CancelAsync(int id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        _logger.LogInformation("Cancel tender requested. GoiThauId={GoiThauId}, UserId={UserId}", id, userId);
        await _tenderAccess.EnsureCanEditAsync(userId, id);

        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        var oldStatus = entity.TrangThai;
        entity.TrangThai = GoiThauTrangThai.HUY_BO;
        entity.NgayCapNhat = DateTime.UtcNow;
        AddStatusHistory(entity.Id, oldStatus, entity.TrangThai, userId);
        await _db.SaveChangesAsync();
        await _thongBaoService.NotifyGoiThauHuyAsync(entity);
        _logger.LogInformation(
            "Cancel tender succeeded. GoiThauId={GoiThauId}, MaGoiThau={MaGoiThau}, UserId={UserId}",
            entity.Id,
            entity.MaGoiThau,
            userId);
    }

    private void AddStatusHistory(int goiThauId, string? oldStatus, string newStatus, int? userId)
    {
        if (oldStatus == newStatus) return;

        _db.LichSuTrangThaiGoiThaus.Add(new LichSuTrangThaiGoiThau
        {
            GoiThauId = goiThauId,
            TrangThaiCu = oldStatus,
            TrangThaiMoi = newStatus,
            NguoiThayDoiId = userId,
            ThoiGianThayDoi = DateTime.UtcNow
        });
    }

    private static string BuildStatusTitle(string status) => status switch
    {
        GoiThauTrangThai.DU_THAO => "Tạo gói thầu",
        GoiThauTrangThai.DANG_XU_LY => "Bắt đầu xử lý gói thầu",
        GoiThauTrangThai.DA_CHON_NHA_THAU => "Chọn nhà thầu",
        GoiThauTrangThai.HOAN_THANH => "Hoàn thành gói thầu",
        GoiThauTrangThai.HUY_BO => "Hủy gói thầu",
        "DA_XOA" => "Xóa gói thầu",
        _ => "Cập nhật trạng thái gói thầu"
    };

    private static string? FormatStatus(string? status) => status switch
    {
        null => null,
        GoiThauTrangThai.DU_THAO => "Dự thảo",
        GoiThauTrangThai.DANG_XU_LY => "Đang xử lý",
        "CHO_DUYET" => "Chờ duyệt",
        "TRE_HAN" => "Trễ hạn",
        GoiThauTrangThai.DA_CHON_NHA_THAU => "Đã chọn nhà thầu",
        GoiThauTrangThai.HOAN_THANH => "Hoàn thành",
        GoiThauTrangThai.HUY_BO => "Đã hủy",
        "DA_XOA" => "Đã xóa",
        _ => status
    };

    private static string BuildWorkflowActionTitle(string action, string? stepName)
    {
        var prefix = action switch
        {
            "START" => "Khởi động quy trình",
            WorkflowHanhDong.DUYET or WorkflowHanhDong.APPROVE => "Duyệt/cập nhật bước",
            WorkflowHanhDong.KHONG_DUYET or WorkflowHanhDong.REJECT => "Không duyệt bước",
            WorkflowHanhDong.TRA_VE or WorkflowHanhDong.ROLLBACK => "Trả về bước",
            WorkflowHanhDong.SKIP => "Bỏ qua bước",
            WorkflowHanhDong.REASSIGN => "Phân công lại bước",
            _ => "Xử lý bước"
        };

        return string.IsNullOrWhiteSpace(stepName) ? prefix : $"{prefix}: {stepName}";
    }

    private static string FormatWorkflowAction(string action) => action switch
    {
        "START" => "Khởi động quy trình",
        WorkflowHanhDong.DUYET or WorkflowHanhDong.APPROVE => "Duyệt",
        WorkflowHanhDong.KHONG_DUYET or WorkflowHanhDong.REJECT => "Không duyệt",
        WorkflowHanhDong.TRA_VE or WorkflowHanhDong.ROLLBACK => "Trả về",
        WorkflowHanhDong.SKIP => "Bỏ qua",
        WorkflowHanhDong.REASSIGN => "Phân công lại",
        _ => action
    };

    private static string FormatWorkflowKetQua(string ketQua) => ketQua switch
    {
        "DUYET" => "Duyệt",
        "KHONG_DUYET" => "Không duyệt",
        _ => ketQua
    };

    private static string? FirstNonEmpty(params string?[] values)
        => values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();

    private static bool ShouldShowAuditLog(NhatKyKiemToan log)
    {
        if (log.HanhDong is "START_WORKFLOW" or "LOGIN_LOCKOUT")
            return false;

        var table = log.Bang;
        if (string.IsNullOrWhiteSpace(table))
            return false;

        if (table is "LichSuTrangThaiGoiThau" or "WorkflowActionHistory"
            or "WorkflowInstance" or "WorkflowStepInstance" or "WorkflowAssignment")
            return false;

        if (table == "GoiThau")
            return log.HanhDong != "ADDED" && !IsStatusOnlyGoiThauChange(log);

        return table is "TaiLieuHoSo" or "HoSoDuThau" or "HopDong";
    }

    private static bool IsStatusOnlyGoiThauChange(NhatKyKiemToan log)
    {
        if (log.HanhDong != "MODIFIED" || string.IsNullOrWhiteSpace(log.DuLieuMoi))
            return false;

        try
        {
            using var doc = JsonDocument.Parse(log.DuLieuMoi);
            var names = doc.RootElement.EnumerateObject().Select(p => p.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            names.Remove("trangThai");
            names.Remove("ngayCapNhat");
            return names.Count == 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string BuildAuditType(NhatKyKiemToan log) => log.Bang switch
    {
        "GoiThau" => "CAP_NHAT",
        "TaiLieuHoSo" => "TAI_LIEU",
        "HoSoDuThau" => "HO_SO",
        "HopDong" => "HOP_DONG",
        _ => "HE_THONG"
    };

    private static string BuildAuditTitle(NhatKyKiemToan log)
    {
        var action = log.HanhDong;
        return log.Bang switch
        {
            "GoiThau" => "Cập nhật thông tin gói thầu",
            "TaiLieuHoSo" when action == "ADDED" => "Tải tài liệu",
            "TaiLieuHoSo" when action == "DELETED" => "Xóa tài liệu",
            "TaiLieuHoSo" => "Cập nhật tài liệu",
            "HoSoDuThau" when action == "ADDED" => "Thêm hồ sơ dự thầu",
            "HoSoDuThau" => "Cập nhật hồ sơ dự thầu",
            "HopDong" when action == "ADDED" => "Tạo hợp đồng",
            "HopDong" => "Cập nhật hợp đồng",
            _ => "Cập nhật dữ liệu gói thầu"
        };
    }

    private static string BuildAuditContent(NhatKyKiemToan log)
    {
        if (!string.IsNullOrWhiteSpace(log.MoTaChiTiet))
            return log.MoTaChiTiet;

        var table = string.IsNullOrWhiteSpace(log.Bang) ? "dữ liệu" : log.Bang;
        return $"{log.HanhDong} {table}";
    }
}
