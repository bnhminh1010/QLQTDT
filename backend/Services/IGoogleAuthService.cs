using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Services;

public interface IGoogleAuthService
{
    /// <summary>
    /// Xác minh Google ID Token, tìm hoặc tạo tài khoản, trả JWT
    /// </summary>
    Task<LoginResponseDto> GoogleLoginAsync(string idToken);
}
