using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.Constants;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;
using System.Security.Claims;

namespace QLQTDT.Api.Services;

public class GoiThauService : BaseService<GoiThau>, IGoiThauService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenderAccessService _tenderAccess;

    public GoiThauService(
        AppDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ITenderAccessService tenderAccess) : base(db)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenderAccess = tenderAccess;
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
            query = scope.OwnOnly
                ? query.Where(g => g.NguoiTaoId == userId)
                : query.Where(g => g.NguoiTaoId == userId || scope.KhoaPhongIds.Contains(g.KhoaPhongId ?? -1));
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
                TenHinhThuc = g.HinhThuc != null ? g.HinhThuc.TenHinhThuc : null,
                TenKhoaPhong = g.KhoaPhongId != null && g.KhoaPhong != null ? g.KhoaPhong.TenKhoaPhong : null,
            })
            .ToListAsync();

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
            .OrderByDescending(l => l.ThoiGianThayDoi)
            .Select(l => new LichSuTrangThaiGoiThauDto
            {
                Id = l.Id,
                GoiThauId = l.GoiThauId,
                TrangThaiCu = l.TrangThaiCu,
                TrangThaiMoi = l.TrangThaiMoi,
                NguoiThayDoiId = l.NguoiThayDoiId,
                ThoiGianThayDoi = l.ThoiGianThayDoi
            })
            .ToListAsync();
    }

    public async Task<GoiThau> CreateAsync(CreateGoiThauDto dto)
    {
        var currentUserId = GetCurrentUserId() ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        // Validate HinhThucDauThau exists and is active
        var hinhThuc = await _db.HinhThucDauThaus
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == dto.HinhThucId && h.TrangThaiHoatDong)
            ?? throw new BadRequestException("Hình thức đấu thầu không hợp lệ hoặc đã bị vô hiệu hóa.");

        ValidateRutGonPolicy(hinhThuc.MaHinhThuc, hinhThuc.TenHinhThuc, dto.NganSach, dto.LoaiGoiThau, dto.CanCuApDungRutGon, hinhThuc.HanMucToiDa);

        // Auto-suggest WorkflowId from active Workflow matching HinhThucId
        int? workflowId = null;
        var workflow = await _db.Workflows
            .AsNoTracking()
            .Where(w => w.HinhThucId == dto.HinhThucId && w.TrangThaiHoatDong)
            .OrderBy(w => w.Id)
            .FirstOrDefaultAsync();
        if (workflow is not null)
            workflowId = workflow.Id;

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
                    HinhThucId = dto.HinhThucId,
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

                return await base.CreateAsync(entity);
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

    public async Task<GoiThau> UpdateAsync(int id, UpdateGoiThauDto dto)
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
        return entity;
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
        await _tenderAccess.EnsureCanEditAsync(userId, id);

        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        entity.TrangThai = GoiThauTrangThai.HUY_BO;
        entity.NgayCapNhat = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
