using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class GoiThauService : BaseService<GoiThau>, IGoiThauService
{
    public GoiThauService(AppDbContext db) : base(db) { }

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
                NgayTao = g.NgayTao
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

    public override async Task<GoiThau?> GetByIdAsync(int id)
    {
        var entity = await _set.FindAsync(id);
        if (entity is null || !entity.TrangThaiHoatDong) return null;
        return entity;
    }

    public async Task<GoiThauDetailDto> GetChiTietAsync(int id)
    {
        var entity = await _set.FindAsync(id);
        if (entity is null || !entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        return new GoiThauDetailDto
        {
            Id = entity.Id,
            MaGoiThau = entity.MaGoiThau,
            TenGoiThau = entity.TenGoiThau,
            MoTa = entity.MoTa,
            DeXuatId = entity.DeXuatId,
            NganSach = entity.NganSach,
            TrangThai = entity.TrangThai,
            NgayTao = entity.NgayTao,
            NgayCapNhat = entity.NgayCapNhat
        };
    }

    public async Task<IReadOnlyList<LichSuTrangThaiGoiThauDto>> GetLichSuTrangThaiAsync(int id)
    {
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
                    TrangThai = GoiThauTrangThai.DU_THAO,
                    TrangThaiHoatDong = true,
                    NgayTao = DateTime.UtcNow
                };

                return await base.CreateAsync(entity);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx
                      && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                // Race condition: unique constraint trên MaGoiThau → thử lại
                if (attempt == 3)
                    throw new ConflictException("Không thể tạo mã gói thầu do xung đột đồng thời. Vui lòng thử lại.");
            }
        }

        // Không bao giờ tới đây nhưng compiler cần return path
        throw new ConflictException("Không thể tạo mã gói thầu. Vui lòng thử lại.");
    }

    public async Task<GoiThau> UpdateAsync(int id, UpdateGoiThauDto dto)
    {
        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (entity.TrangThai != GoiThauTrangThai.DU_THAO)
            throw new ConflictException($"Chỉ có thể chỉnh sửa gói thầu ở trạng thái DU_THAO. Trạng thái hiện tại: {entity.TrangThai}");

        entity.TenGoiThau = dto.TenGoiThau;
        entity.MoTa = dto.MoTa;
        entity.NganSach = dto.NganSach;
        entity.NgayCapNhat = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return entity;
    }

    public override async Task DeleteAsync(int id)
    {
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

    private async Task<string> GenerateMaGoiThauAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"GT-{year}-";

        // Lấy record có Id cao nhất trong năm
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
        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {id}");

        entity.TrangThai = GoiThauTrangThai.HUY_BO;
        entity.NgayCapNhat = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
