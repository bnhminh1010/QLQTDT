namespace QLQTDT.Api.Models.DTOs.Auth;

using System.Text.Json.Serialization;

public class UserDto
{
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayDangNhapCuoi { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public string? AvatarUrl { get; set; }
    public List<UserRoleDto> Roles { get; set; } = [];
    public List<string> Quyen { get; set; } = [];
}

public class UserRoleDto
{
    public int? KhoaPhongId { get; set; }
    public string? TenKhoaPhong { get; set; }
    public string? MaKhoaPhong { get; set; }
    public int VaiTroId { get; set; }
    public string TenVaiTro { get; set; } = null!;
    public string? MaVaiTro { get; set; }
    public bool LaChinh { get; set; }
    public int? DoUuTien { get; set; }
}

public class LoginResponseDto
{
    public string Message { get; set; } = null!;
    public UserDto User { get; set; } = null!;

    /// <summary>
    /// Access token for server-side cookie emission only. Never serialize to API clients.
    /// </summary>
    [JsonIgnore]
    public string Token { get; set; } = null!;

    /// <summary>Refresh token for server-side HttpOnly cookie emission only.</summary>
    [JsonIgnore]
    public string? RefreshToken { get; set; }

    public string? CsrfToken { get; set; }
}

public class RefreshTokenRequestDto
{
    public string? RefreshToken { get; set; }
}

public class RefreshTokenResponseDto
{
    public string Message { get; set; } = null!;
    public UserDto User { get; set; } = null!;

    [JsonIgnore]
    public string Token { get; set; } = null!;

    [JsonIgnore]
    public string? RefreshToken { get; set; }

    public string? CsrfToken { get; set; }
}

public class UserSessionDto
{
    public int Id { get; set; }
    public string DiaChiIP { get; set; } = null!;
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public bool IsActive { get; set; }

    /// <summary>true if this session matches current request (for UI highlight).</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public bool IsCurrent { get; set; }
}
