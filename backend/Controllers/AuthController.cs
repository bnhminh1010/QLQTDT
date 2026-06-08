using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QLQTDT.Api.Config;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly JwtConfig _jwtConfig;
    private readonly IHostEnvironment _env;

    public AuthController(IAuthService authService, IOptions<JwtConfig> jwtConfig, IHostEnvironment env)
    {
        _authService = authService;
        _jwtConfig = jwtConfig.Value;
        _env = env;
    }

    /// <summary>Đăng nhập hệ thống</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto dto,
        [FromServices] IValidator<LoginRequestDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _authService.LoginAsync(dto, clientIp);

        // Set JWT vào HttpOnly Cookie
        Response.Cookies.Append(_jwtConfig.CookieName, result.Token, CreateCookieOptions());
        return Ok(result);
    }

    /// <summary>Đăng nhập hệ thống bằng Google</summary>
    [HttpPost("google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginDto dto,
        [FromServices] IGoogleAuthService googleAuthService,
        [FromServices] IValidator<GoogleLoginDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var result = await googleAuthService.GoogleLoginAsync(dto.IdToken);

        Response.Cookies.Append(_jwtConfig.CookieName, result.Token, CreateCookieOptions());
        return Ok(result);
    }

    /// <summary>Đăng xuất hệ thống</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(_jwtConfig.CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            Path = "/"
        });
        return Ok(new MessageResponse { Message = "Đăng xuất thành công" });
    }

    /// <summary>Lấy thông tin người dùng hiện tại</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetCurrentUserId();
        var user = await _authService.GetCurrentUserAsync(userId);
        return Ok(user);
    }

    /// <summary>Quên mật khẩu</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordDto dto,
        [FromServices] IValidator<ForgotPasswordDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        await _authService.ForgotPasswordAsync(dto);
        return Ok(new MessageResponse
        {
            Message = "Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi."
        });
    }

    /// <summary>Đặt lại mật khẩu mới bằng token</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordDto dto,
        [FromServices] IValidator<ResetPasswordDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        await _authService.ResetPasswordAsync(dto);
        return Ok(new MessageResponse { Message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
    }

    /// <summary>Đổi mật khẩu (user đã đăng nhập)</summary>
    [HttpPost("update-password")]
    [Authorize]
    public async Task<IActionResult> UpdatePassword(
        [FromBody] UpdatePasswordDto dto,
        [FromServices] IValidator<UpdatePasswordDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var userId = GetCurrentUserId();
        await _authService.UpdatePasswordAsync(userId, dto);
        return Ok(new MessageResponse { Message = "Đổi mật khẩu thành công." });
    }

    // === Helpers ===

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : throw new Exceptions.UnauthorizedException("Yêu cầu chưa được xác thực.");
    }

    private CookieOptions CreateCookieOptions() => new()
    {
        HttpOnly = true,
        Secure = !_env.IsDevelopment(),
        SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
        Path = "/",
        MaxAge = TimeSpan.FromMinutes(_jwtConfig.ExpiryMinutes)
    };

    private static ApiErrorResponse ToValidationError(FluentValidation.Results.ValidationResult result) => new()
    {
        Timestamp = DateTime.UtcNow,
        Status = 400,
        Error = "Validation Failed",
        Errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                g => g.First().ErrorMessage)
    };
}
