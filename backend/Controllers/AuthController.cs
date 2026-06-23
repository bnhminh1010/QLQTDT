using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QLQTDT.Api.Config;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("Global")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IThongBaoService _thongBaoService;
    private readonly JwtConfig _jwtConfig;
    private readonly IHostEnvironment _env;
    private readonly AppDbContext _db;

    public AuthController(IAuthService authService, IThongBaoService thongBaoService, IOptions<JwtConfig> jwtConfig, IHostEnvironment env, AppDbContext db)
    {
        _authService = authService;
        _thongBaoService = thongBaoService;
        _jwtConfig = jwtConfig.Value;
        _env = env;
        _db = db;
    }

    /// <summary>Đăng nhập hệ thống</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("Login")]
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

    /// <summary>Cập nhật thông tin người dùng hiện tại</summary>
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var user = await _authService.UpdateProfileAsync(userId, dto);
        return Ok(user);
    }

    /// <summary>Gửi yêu cầu thay đổi thông tin (non-admin) → thông báo cho admin</summary>
    [HttpPost("me/change-request")]
    [Authorize]
    public async Task<IActionResult> SendChangeRequest([FromBody] UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var user = await _authService.GetCurrentUserAsync(userId);

        // Tạo noti cho tất cả admin
        var adminIds = await _db.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.VaiTro.MaVaiTro == "ADMIN")
            .Select(nkv => nkv.NguoiDungId)
            .Distinct()
            .ToListAsync();

        var changes = new List<string>();
        if (dto.HoTen != null && dto.HoTen != user.HoTen) changes.Add($"họ tên: {user.HoTen} → {dto.HoTen}");
        if (dto.Email != null && dto.Email != user.Email) changes.Add($"email: {user.Email} → {dto.Email}");
        if (dto.SoDienThoai != null) changes.Add($"số điện thoại: {dto.SoDienThoai}");

        var noiDung = $"Người dùng {user.HoTen} ({user.TenDangNhap}) yêu cầu thay đổi: {string.Join(", ", changes)}";

        foreach (var adminId in adminIds)
        {
            await _thongBaoService.CreateAsync(new ThongBao
            {
                IdCongKhai = Guid.NewGuid(),
                NguoiDungId = adminId,
                LoaiThongBao = "PROFILE_CHANGE_REQUEST",
                TieuDe = "Yêu cầu thay đổi thông tin cá nhân",
                NoiDung = noiDung,
                DaDoc = false,
                UrlDieuHuong = "/nguoi-dung",
                NgayTao = DateTime.UtcNow
            });
        }

        return Ok(new { message = "Yêu cầu đã được gửi đến Quản trị viên." });
    }

    /// <summary>Lấy danh sách quyền của người dùng hiện tại</summary>
    [HttpGet("permissions")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyCollection<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPermissions()
    {
        var userId = GetCurrentUserId();
        var permissions = await _authService.GetPermissionsAsync(userId);
        return Ok(permissions);
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

    /// <summary>Cấp lại access token mới bằng refresh token</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequestDto dto,
        [FromServices] IValidator<RefreshTokenRequestDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
        Response.Cookies.Append(_jwtConfig.CookieName, result.Token, CreateCookieOptions());
        return Ok(result);
    }

    /// <summary>Thu hồi refresh token</summary>
    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequestDto dto)
    {
        await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
        return Ok(new MessageResponse { Message = "Thu hồi refresh token thành công." });
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
