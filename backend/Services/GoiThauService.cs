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

        if (!string.IsNullOrWhiteSpace(trangThai) && !GoiThauTrangThai.All.Contains(trangThai))
            throw new BadRequestException($"trangThai không hợp lệ. Giá trị hợp lệ: {string.Join(", ", GoiThauTrangThai.All)}");

        var query = _set.Where(g => g.TrangThaiHoatDong);

        if (!string.IsNullOrWhiteSpace(trangThai))
            query = query.Where(g => g.TrangThai == trangThai);

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
                GiaGoiThau = g.GiaGoiThau,
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
            GiaGoiThau = entity.GiaGoiThau,
            TrangThai = entity.TrangThai,
            NgayTao = entity.NgayTao,
            NgayCapNhat = entity.NgayCapNhat
        };
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
                    GiaGoiThau = dto.GiaGoiThau,
                    TrangThai = GoiThauTrangThai.DU_THAO,
                    TrangThaiHoatDong = true,
                    NgayTao = DateTime.UtcNow
                };

                return await base.CreateAsync(entity);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                when (attempt < 3 && ex.InnerException?.Message.Contains("MaGoiThau") == true)
            {
                // Race condition: 2 request đồng thời sinh cùng mã → thử lại
            }
        }

        throw new ConflictException("Không thể tạo mã gói thầu do xung đột đồng thời. Vui lòng thử lại.");
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
        entity.GiaGoiThau = dto.GiaGoiThau;
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

        // Lấy max seq theo giá trị số, tránh lỗi string sort khi seq > 999
        var maxSeq = await _set
            .Where(g => g.MaGoiThau.StartsWith(prefix))
            .Select(g => g.MaGoiThau.Substring(prefix.Length))
            .ToListAsync();

        var seq = maxSeq
            .Select(s => int.TryParse(s, out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{prefix}{seq:D3}";
    }
}
