using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Quyen;
using QLQTDT.Api.Models.Entities;
using System.Linq.Expressions;

namespace QLQTDT.Api.Services;

/// <summary>
/// Service for managing Quyen (Permission) entities
/// Implements search, DTO-based create/update, unique MaQuyen validation
/// </summary>
public class QuyenService : BaseService<Quyen>, IQuyenService
{
    public QuyenService(AppDbContext db) : base(db)
    {
    }

    /// <summary>
    /// Tìm kiếm quyền theo MaQuyen hoặc TenQuyen, chỉ trả records chưa xoá
    /// </summary>
    public async Task<PagedResult<Quyen>> SearchAsync(int page, int pageSize, string? search)
    {
        Expression<Func<Quyen, bool>> filter = q => !q.DaXoa;

        if (!string.IsNullOrWhiteSpace(search))
        {
            filter = q => !q.DaXoa &&
                (q.MaQuyen.Contains(search) || q.TenQuyen.Contains(search));
        }

        return await base.GetAllAsync(page, pageSize, filter,
            q => q.OrderBy(x => x.MaQuyen));
    }

    /// <summary>
    /// Tạo quyền mới — validate MaQuyen unique (chỉ trong records chưa xoá)
    /// </summary>
    public async Task<Quyen> CreateAsync(CreateQuyenDto dto)
    {
        var exists = await _set.AnyAsync(q => q.MaQuyen == dto.MaQuyen);
        if (exists)
            throw new ConflictException($"Mã quyền '{dto.MaQuyen}' đã tồn tại");

        var entity = new Quyen
        {
            MaQuyen = dto.MaQuyen,
            TenQuyen = dto.TenQuyen
        };

        return await base.CreateAsync(entity);
    }

    /// <summary>
    /// Cập nhật quyền — chỉ cho phép sửa TenQuyen
    /// </summary>
    public async Task<Quyen> UpdateAsync(int id, UpdateQuyenDto dto)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy quyền với Id = {id}");

        if (existing.DaXoa)
            throw new NotFoundException($"Không tìm thấy quyền với Id = {id}");

        existing.TenQuyen = dto.TenQuyen;
        await _db.SaveChangesAsync();
        return existing;
    }
}
