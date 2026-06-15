using QLQTDT.Api.Models.DTOs.Admin;

namespace QLQTDT.Api.Services;

public interface IAdminService
{
    /// <summary>
    /// Lấy danh sách người dùng (phân trang, filter theo trạng thái, tìm kiếm)
    /// </summary>
    Task<AdminUserListDto> GetUsersAsync(int page, int pageSize, bool? trangThai, string? search);

    /// <summary>
    /// Lấy chi tiết một người dùng theo IdCongKhai
    /// </summary>
    Task<AdminUserDetailDto> GetUserDetailAsync(Guid idCongKhai);

    /// <summary>
    /// Phê duyệt (kích hoạt) tài khoản người dùng
    /// </summary>
    Task ApproveUserAsync(Guid idCongKhai);

    /// <summary>
    /// Khóa tài khoản người dùng
    /// </summary>
    Task BlockUserAsync(Guid idCongKhai);
}
