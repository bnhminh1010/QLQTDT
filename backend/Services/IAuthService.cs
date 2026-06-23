using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string clientIp);
    Task<RefreshTokenResponseDto> RefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task<UserDto> GetCurrentUserAsync(int userId);
    Task<IReadOnlyCollection<string>> GetPermissionsAsync(int userId);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task UpdatePasswordAsync(int userId, UpdatePasswordDto dto);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto dto);
}
