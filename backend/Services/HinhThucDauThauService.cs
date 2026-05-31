using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HinhThucDauThau;
using QLQTDT.Api.Models.Entities;
using System.Linq.Expressions;

namespace QLQTDT.Api.Services;

public class HinhThucDauThauService : BaseService<HinhThucDauThau>, IHinhThucDauThauService
{
    public HinhThucDauThauService(AppDbContext db) : base(db)
    {
    }

    public async Task<PagedResult<HinhThucDauThau>> SearchAsync(int page, int pageSize, string? search)
    {
        Expression<Func<HinhThucDauThau, bool>> filter = h => h.TrangThaiHoatDong;

        if (!string.IsNullOrWhiteSpace(search))
        {
            filter = h => h.TrangThaiHoatDong &&
                (h.MaHinhThuc.Contains(search) || h.TenHinhThuc.Contains(search));
        }

        return await base.GetAllAsync(page, pageSize, filter,
            h => h.OrderBy(x => x.MaHinhThuc));
    }

    public async Task<HinhThucDauThau> CreateAsync(CreateHinhThucDauThauDto dto)
    {
        var exists = await _set.AnyAsync(h => h.MaHinhThuc == dto.MaHinhThuc);
        if (exists)
            throw new ConflictException($"Mã hình thức '{dto.MaHinhThuc}' đã tồn tại");

        var entity = new HinhThucDauThau
        {
            MaHinhThuc = dto.MaHinhThuc,
            TenHinhThuc = dto.TenHinhThuc,
            HanMucToiDa = dto.HanMucToiDa,
            TrangThaiHoatDong = true
        };

        return await base.CreateAsync(entity);
    }

    public async Task<HinhThucDauThau> UpdateAsync(int id, UpdateHinhThucDauThauDto dto)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy hình thức đấu thầu với Id = {id}");

        if (!existing.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy hình thức đấu thầu với Id = {id}");

        existing.TenHinhThuc = dto.TenHinhThuc;
        existing.HanMucToiDa = dto.HanMucToiDa;
        await _db.SaveChangesAsync();
        return existing;
    }

    public override async Task DeleteAsync(int id)
    {
        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy hình thức đấu thầu với Id = {id}");

        if (!entity.TrangThaiHoatDong)
            throw new NotFoundException($"Không tìm thấy hình thức đấu thầu với Id = {id}");

        // FK constraint trong DB tự ngăn xoá nếu có workflow liên quan
        // (Workflow entity sẽ được tạo ở Task 12 — bổ sung check khi đó)

        entity.TrangThaiHoatDong = false;
        await _db.SaveChangesAsync();
    }
}
