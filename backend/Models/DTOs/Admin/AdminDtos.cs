using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Models.DTOs.Admin;

/// <summary>
/// Response phân trang danh sách người dùng cho Admin
/// </summary>
public class AdminUserListDto
{
    public List<AdminUserItemDto> Data { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// Thông tin tóm tắt 1 user trong danh sách
/// </summary>
public class AdminUserItemDto
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public DateTime NgayTao { get; set; }
    public List<UserRoleDto> Roles { get; set; } = [];
    public List<string> Quyen { get; set; } = [];

    // Thông tin nhà thầu (nếu có)
    public string? TenCongTy { get; set; }
    public string? MaSoThue { get; set; }
}

/// <summary>
/// Chi tiết đầy đủ 1 user bao gồm thông tin nhà thầu
/// </summary>
public class AdminUserDetailDto
{
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public DateTime NgayTao { get; set; }
    public string? AvatarUrl { get; set; }
    public List<UserRoleDto> Roles { get; set; } = [];
    public List<string> Quyen { get; set; } = [];

    // Thông tin nhà thầu đầy đủ (nếu user là nhà thầu)
    public AdminNhaThauDto? NhaThau { get; set; }
}

/// <summary>
/// Thông tin nhà thầu liên kết với user
/// </summary>
public class AdminNhaThauDto
{
    public string MaSoThue { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? NguoiDaiDien { get; set; }
    public bool TrangThaiHoatDong { get; set; }
}
