namespace QLQTDT.Api.Models.DTOs.Auth;

public class LoginRequestDto
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = null!;
}

public class ResetPasswordDto
{
    public string Token { get; set; } = null!;
    public string MatKhauMoi { get; set; } = null!;
    public string ConfirmMatKhau { get; set; } = null!;
}

public class UpdatePasswordDto
{
    public string MatKhauHienTai { get; set; } = null!;
    public string MatKhauMoi { get; set; } = null!;
    public string ConfirmMatKhau { get; set; } = null!;
}
