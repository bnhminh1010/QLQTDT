using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Services;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterContractorAsync(RegisterContractorDto dto);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string clientIp);
    Task<UserDto> GetCurrentUserAsync(int userId);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task UpdatePasswordAsync(int userId, UpdatePasswordDto dto);
}
