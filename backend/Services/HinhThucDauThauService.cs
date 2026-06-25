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
        Expression<Func<HinhThucDauThau, bool>> filter = h => true;

        if (!string.IsNullOrWhiteSpace(search))
        {
            filter = h => h.MaHinhThuc.Contains(search) || h.TenHinhThuc.Contains(search);
        }

        var result = await base.GetAllAsync(page, pageSize, filter,
            h => h.OrderBy(x => x.MaHinhThuc));

        // Gán SoGoi cho từng item
        var hinhThucIds = result.Items.Select(h => h.Id).ToList();
        var counts = await _db.GoiThaus
            .Where(g => g.TrangThaiHoatDong && g.HinhThucId.HasValue && hinhThucIds.Contains(g.HinhThucId.Value))
            .GroupBy(g => g.HinhThucId!.Value)
            .Select(g => new { HinhThucId = g.Key, SoLuong = g.Count() })
            .ToDictionaryAsync(x => x.HinhThucId, x => x.SoLuong);

        foreach (var item in result.Items)
        {
            counts.TryGetValue(item.Id, out var soLuong);
            item.SoGoi = soLuong;
        }

        return result;
    }

    public override async Task<HinhThucDauThau?> GetByIdAsync(int id)
    {
        var entity = await _set.FindAsync(id);
        if (entity is null)
            return null;

        entity.SoGoi = await _db.GoiThaus.CountAsync(g => g.TrangThaiHoatDong && g.HinhThucId == id);
        return entity;
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

        if (dto.TenHinhThuc != null) existing.TenHinhThuc = dto.TenHinhThuc;
        if (dto.HanMucToiDa.HasValue) existing.HanMucToiDa = dto.HanMucToiDa;
        if (dto.TrangThaiHoatDong.HasValue) existing.TrangThaiHoatDong = dto.TrangThaiHoatDong.Value;
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

        var activeGoiThauCount = await _db.GoiThaus
            .CountAsync(g => g.TrangThaiHoatDong && g.HinhThucId == id);

        if (activeGoiThauCount > 0)
        {
            throw new ConflictException(
                $"Không thể xóa hình thức đấu thầu '{entity.TenHinhThuc}' " +
                $"vì đang được sử dụng bởi {activeGoiThauCount} gói thầu.");
        }

        var activeWorkflowCount = await _db.Workflows
            .CountAsync(w => w.TrangThaiHoatDong && w.HinhThucId == id);

        if (activeWorkflowCount > 0)
        {
            throw new ConflictException(
                $"Không thể xóa hình thức đấu thầu '{entity.TenHinhThuc}' " +
                $"vì đang được sử dụng bởi {activeWorkflowCount} quy trình.");
        }

        entity.TrangThaiHoatDong = false;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                $"Không thể xóa hình thức đấu thầu '{entity.TenHinhThuc}' vì đang được sử dụng.");
        }
    }
}
