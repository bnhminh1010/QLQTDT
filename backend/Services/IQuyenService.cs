using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Quyen;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

/// <summary>
/// Interface for Quyen service — extends base service with search + DTO-based CRUD
/// </summary>
public interface IQuyenService : IBaseService<Quyen>
{
    /// <summary>
    /// Tìm kiếm quyền theo MaQuyen hoặc TenQuyen, phân trang, lọc DaXoa
    /// </summary>
    Task<PagedResult<Quyen>> SearchAsync(int page, int pageSize, string? search);

    /// <summary>
    /// Tạo quyền mới từ DTO (validate MaQuyen unique)
    /// </summary>
    Task<Quyen> CreateAsync(CreateQuyenDto dto);

    /// <summary>
    /// Cập nhật quyền từ DTO (chỉ sửa TenQuyen)
    /// </summary>
    Task<Quyen> UpdateAsync(int id, UpdateQuyenDto dto);
}