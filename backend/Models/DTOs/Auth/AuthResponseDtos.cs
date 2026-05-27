namespace QLQTDT.Api.Models.DTOs.Auth;

public class UserDto
{
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool TrangThaiHoatDong { get; set; }
    public DateTime NgayTao { get; set; }
    public string? AvatarUrl { get; set; }
    public List<UserRoleDto> Roles { get; set; } = [];
}

public class UserRoleDto
{
    public int? KhoaPhongId { get; set; }
    public string? TenKhoaPhong { get; set; }
    public string? MaKhoaPhong { get; set; }
    public int VaiTroId { get; set; }
    public string TenVaiTro { get; set; } = null!;
    public bool LaChinh { get; set; }
}

public class RegisterResponseDto
{
    public string Message { get; set; } = null!;
    public RegisterDataDto Data { get; set; } = null!;
}

public class RegisterDataDto
{
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string MaSoThue { get; set; } = null!;
    public bool TrangThaiHoatDong { get; set; }
    public DateTime NgayTao { get; set; }
}

public class LoginResponseDto
{
    public string Message { get; set; } = null!;
    public UserDto User { get; set; } = null!;

    /// <summary>
    /// JWT Token — chỉ dùng nội bộ để set cookie, không serialize ra JSON response
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public string Token { get; set; } = null!;
}
