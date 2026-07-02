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
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Security;
using QLQTDT.Api.Services;
using System.Text.Json;

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
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
        var result = await _authService.LoginAsync(dto, clientIp, userAgent);

        Response.Cookies.Append(_jwtConfig.CookieName, result.Token, CreateAccessCookieOptions());
        if (!string.IsNullOrWhiteSpace(result.RefreshToken))
            Response.Cookies.Append(_jwtConfig.RefreshCookieName, result.RefreshToken, CreateRefreshCookieOptions());
        result.CsrfToken = SetXsrfCookie();
        return Ok(result);
    }

    /// <summary>Đăng xuất hệ thống</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue(_jwtConfig.RefreshCookieName, out var refreshToken)
            && !string.IsNullOrWhiteSpace(refreshToken))
        {
            await _authService.RevokeRefreshTokenAsync(refreshToken);
        }

        // Revoke current session
        var userId = GetCurrentUserId();
        var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (jti != null)
        {
            var currentSession = await _db.UserSessions
                .FirstOrDefaultAsync(s => s.NguoiDungId == userId && s.Jti == jti && s.RevokedAt == null);
            if (currentSession != null)
            {
                currentSession.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete(_jwtConfig.CookieName,
            AuthCookieOptionsFactory.CreateDeleteAccessCookieOptions(_env.IsDevelopment()));
        Response.Cookies.Delete(_jwtConfig.RefreshCookieName,
            AuthCookieOptionsFactory.CreateDeleteRefreshCookieOptions(_env.IsDevelopment()));
        Response.Cookies.Delete(AuthCookieOptionsFactory.XsrfCookieName,
            AuthCookieOptionsFactory.CreateDeleteXsrfCookieOptions(_env.IsDevelopment()));
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
        var user = await _db.NguoiDungs
            .FirstOrDefaultAsync(u => u.Id == userId && !u.DaXoa);
        if (user is null)
            return Unauthorized(new ApiErrorResponse { Status = 401, Error = "Yêu cầu chưa được xác thực." });

        var hasPending = await _db.YeuCauThayDoiThongTinNguoiDungs
            .AnyAsync(r => r.NguoiDungId == userId && r.TrangThai == ProfileChangeRequestStatus.Pending);
        if (hasPending)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Bạn đã có yêu cầu thay đổi thông tin đang chờ duyệt." });

        var oldValue = new ProfileChangeSnapshotDto
        {
            HoTen = user.HoTen,
            Email = user.Email,
            SoDienThoai = user.SoDienThoai
        };
        var newValue = new ProfileChangeSnapshotDto
        {
            HoTen = user.HoTen,
            Email = user.Email,
            SoDienThoai = user.SoDienThoai
        };

        var changes = new List<string>();
        if (dto.HoTen is not null)
        {
            var hoTen = dto.HoTen.Trim();
            if (string.IsNullOrWhiteSpace(hoTen))
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Họ tên không được để trống." });
            if (hoTen != user.HoTen)
            {
                newValue.HoTen = hoTen;
                changes.Add($"họ tên: {user.HoTen} → {hoTen}");
            }
        }

        if (dto.Email is not null)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Email không được để trống." });
            if (!string.Equals(email, user.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailExists = await _db.NguoiDungs
                    .AnyAsync(u => u.Id != userId && !u.DaXoa && u.Email.ToLower() == email);
                if (emailExists)
                    return BadRequest(new ApiErrorResponse { Status = 400, Error = "Email đã được sử dụng trong hệ thống." });

                newValue.Email = email;
                changes.Add($"email: {user.Email} → {email}");
            }
        }

        if (dto.SoDienThoai is not null)
        {
            var soDienThoai = string.IsNullOrWhiteSpace(dto.SoDienThoai)
                ? null
                : dto.SoDienThoai.Trim();
            if (soDienThoai != user.SoDienThoai)
            {
                newValue.SoDienThoai = soDienThoai;
                changes.Add($"số điện thoại: {user.SoDienThoai ?? "—"} → {soDienThoai ?? "—"}");
            }
        }

        if (changes.Count == 0)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không có thay đổi nào để gửi duyệt." });

        var adminIds = await _db.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.VaiTro.MaVaiTro == "ADMIN" && nkv.NguoiDung.TrangThaiHoatDong && !nkv.NguoiDung.DaXoa)
            .Select(nkv => nkv.NguoiDungId)
            .Distinct()
            .ToListAsync();
        if (adminIds.Count == 0)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không tìm thấy Quản trị viên để xử lý yêu cầu." });

        await using var transaction = await _db.Database.BeginTransactionAsync();
        var request = new YeuCauThayDoiThongTinNguoiDung
        {
            IdCongKhai = Guid.NewGuid(),
            NguoiDungId = user.Id,
            TrangThai = ProfileChangeRequestStatus.Pending,
            GiaTriCuJson = JsonSerializer.Serialize(oldValue, JsonOptions),
            GiaTriMoiJson = JsonSerializer.Serialize(newValue, JsonOptions),
            NgayTao = DateTime.UtcNow
        };
        _db.YeuCauThayDoiThongTinNguoiDungs.Add(request);
        await _db.SaveChangesAsync();

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
                UrlDieuHuong = $"/nguoi-dung/yeu-cau-thay-doi?requestId={request.IdCongKhai}",
                NotificationKey = $"profile-change-request:{request.Id}:{adminId}",
                NgayTao = DateTime.UtcNow
            });
        }
        await transaction.CommitAsync();

        return Ok(MapProfileChangeRequest(request, user));
    }

    [HttpGet("me/change-request/pending")]
    [Authorize]
    [ProducesResponseType(typeof(ProfileChangeRequestDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingChangeRequest()
    {
        var userId = GetCurrentUserId();
        var request = await _db.YeuCauThayDoiThongTinNguoiDungs
            .Include(r => r.NguoiDung)
            .Include(r => r.NguoiXuLy)
            .Where(r => r.NguoiDungId == userId && r.TrangThai == ProfileChangeRequestStatus.Pending)
            .OrderByDescending(r => r.NgayTao)
            .FirstOrDefaultAsync();

        return Ok(request is null ? null : MapProfileChangeRequest(request, request.NguoiDung!));
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
    [EnableRateLimiting("ForgotPassword")]
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
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = GetRefreshTokenFromCookie();
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
        var result = await _authService.RefreshTokenAsync(refreshToken, clientIp, userAgent);
        Response.Cookies.Append(_jwtConfig.CookieName, result.Token, CreateAccessCookieOptions());
        if (!string.IsNullOrWhiteSpace(result.RefreshToken))
            Response.Cookies.Append(_jwtConfig.RefreshCookieName, result.RefreshToken, CreateRefreshCookieOptions());
        result.CsrfToken = SetXsrfCookie();
        return Ok(result);
    }

    /// <summary>Thu hồi refresh token</summary>
    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke()
    {
        var refreshToken = GetRefreshTokenFromCookie();
        await _authService.RevokeRefreshTokenAsync(refreshToken);
        Response.Cookies.Delete(_jwtConfig.RefreshCookieName,
            AuthCookieOptionsFactory.CreateDeleteRefreshCookieOptions(_env.IsDevelopment()));
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

    // ═══════════════════════════════════════════════
    // Session management
    // ═══════════════════════════════════════════════

    /// <summary>Danh sách session đang hoạt động</summary>
    [HttpGet("sessions")]
    [Authorize]
    [ProducesResponseType(typeof(List<UserSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions()
    {
        var userId = GetCurrentUserId();
        var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        var sessions = await _authService.GetSessionsAsync(userId, jti);
        return Ok(sessions);
    }

    /// <summary>Thu hồi session chỉ định (force logout device khác)</summary>
    [HttpDelete("sessions/{sessionId}")]
    [Authorize]
    public async Task<IActionResult> RevokeSession(int sessionId)
    {
        var userId = GetCurrentUserId();
        await _authService.RevokeSessionAsync(userId, sessionId);
        return Ok(new MessageResponse { Message = "Đã thu hồi session thành công." });
    }

    /// <summary>Thu hồi tất cả session (trừ session hiện tại)</summary>
    [HttpDelete("sessions")]
    [Authorize]
    public async Task<IActionResult> RevokeAllSessions()
    {
        var userId = GetCurrentUserId();
        var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        var currentSession = await _db.UserSessions
            .FirstOrDefaultAsync(s => s.NguoiDungId == userId && s.Jti == jti && s.RevokedAt == null);
        await _authService.RevokeAllSessionsAsync(userId, currentSession?.Id);
        return Ok(new MessageResponse { Message = "Đã thu hồi tất cả session khác." });
    }

    // === Helpers ===

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : throw new Exceptions.UnauthorizedException("Yêu cầu chưa được xác thực.");
    }

    private string GetRefreshTokenFromCookie()
    {
        if (Request.Cookies.TryGetValue(_jwtConfig.RefreshCookieName, out var refreshToken)
            && !string.IsNullOrWhiteSpace(refreshToken))
        {
            return refreshToken;
        }

        throw new Exceptions.UnauthorizedException("Refresh token không hợp lệ.");
    }

    private CookieOptions CreateAccessCookieOptions() =>
        AuthCookieOptionsFactory.CreateAccessCookieOptions(_jwtConfig, _env.IsDevelopment());

    private CookieOptions CreateRefreshCookieOptions() =>
        AuthCookieOptionsFactory.CreateRefreshCookieOptions(_jwtConfig, _env.IsDevelopment());

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static ProfileChangeRequestDto MapProfileChangeRequest(
        YeuCauThayDoiThongTinNguoiDung request,
        NguoiDung user)
    {
        return new ProfileChangeRequestDto
        {
            IdCongKhai = request.IdCongKhai,
            NguoiDungId = request.NguoiDungId,
            TenDangNhap = user.TenDangNhap,
            HoTenNguoiDung = user.HoTen,
            EmailNguoiDung = user.Email,
            TrangThai = request.TrangThai,
            GiaTriCu = DeserializeSnapshot(request.GiaTriCuJson),
            GiaTriMoi = DeserializeSnapshot(request.GiaTriMoiJson),
            NgayTao = request.NgayTao,
            NgayXuLy = request.NgayXuLy,
            NguoiXuLy = request.NguoiXuLy?.HoTen,
            LyDoTuChoi = request.LyDoTuChoi
        };
    }

    private static ProfileChangeSnapshotDto DeserializeSnapshot(string json)
    {
        return JsonSerializer.Deserialize<ProfileChangeSnapshotDto>(json, JsonOptions) ?? new ProfileChangeSnapshotDto();
    }

    private string SetXsrfCookie()
    {
        var token = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(AuthCookieOptionsFactory.XsrfCookieName, token,
            AuthCookieOptionsFactory.CreateXsrfCookieOptions(_jwtConfig, _env.IsDevelopment()));
        return token;
    }

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
