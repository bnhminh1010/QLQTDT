using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly LoginAttemptGuard _loginGuard;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthService> _logger;
    private readonly IPermissionService _permissionService;

    private const int ForgotPasswordMaxRequests = 3;
    private static readonly TimeSpan ForgotPasswordWindow = TimeSpan.FromHours(1);

    public AuthService(
        AppDbContext context,
        JwtService jwtService,
        IEmailService emailService,
        LoginAttemptGuard loginGuard,
        IMemoryCache cache,
        ILogger<AuthService> logger,
        IPermissionService permissionService)
    {
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
        _loginGuard = loginGuard;
        _cache = cache;
        _logger = logger;
        _permissionService = permissionService;
    }


    /// <summary>Max concurrent sessions per user (revoke oldest when exceeded).</summary>
    private const int MaxConcurrentSessions = 5;

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string clientIp, string? userAgent)
    {
        // Normalize: lowercase + trim tránh bypass bằng cách đổi casing username
        var lockoutKey = $"{clientIp}:{dto.TenDangNhap.Trim().ToLowerInvariant()}";

        if (await _loginGuard.IsLockedOutAsync(lockoutKey))
            throw new TooManyRequestsException("Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");

        var user = await _context.NguoiDungs
            .FirstOrDefaultAsync(u => u.TenDangNhap == dto.TenDangNhap);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.MatKhau, user.MatKhauHash))
        {
            await _loginGuard.RecordFailedAttemptAsync(lockoutKey);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (user.DaXoa || !user.TrangThaiHoatDong)
            throw new ForbiddenException("Tài khoản đang chờ quản trị viên phê duyệt, đã bị khóa hoặc đã bị xóa.");

        await _loginGuard.ResetAttemptsAsync(lockoutKey);

        // Cập nhật lần đăng nhập gần nhất
        user.NgayDangNhapCuoi = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Lấy danh sách roles và permissions
        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.MaVaiTro ?? r.TenVaiTro).Distinct().ToList();
        var permissionSet = await _permissionService.GetPermissionsAsync(user.Id);

        var token = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames, permissionSet);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        // ─── Session management ─────────────────────────────────
        var jti = ExtractJti(token);
        var refreshTokenHash = HashToken(refreshToken);

        // Enforce concurrent session limit: revoke oldest if exceeded
        var activeSessions = await _context.UserSessions
            .Where(s => s.NguoiDungId == user.Id && s.RevokedAt == null)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        if (activeSessions.Count >= MaxConcurrentSessions)
        {
            var toRemove = activeSessions.Count - MaxConcurrentSessions + 1;
            foreach (var oldSession in activeSessions.Take(toRemove))
            {
                oldSession.RevokedAt = DateTime.UtcNow;
                _logger.LogInformation("Session revoked (concurrent limit): SessionId={Id}, UserId={UserId}", oldSession.Id, user.Id);
            }
        }

        _context.UserSessions.Add(new UserSession
        {
            NguoiDungId = user.Id,
            Jti = jti,
            DiaChiIP = clientIp,
            UserAgent = userAgent,
            RefreshTokenHash = refreshTokenHash,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var permissionList = permissionSet.OrderBy(q => q).ToList();

        return new LoginResponseDto
        {
            Message = "Đăng nhập thành công",
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                IdCongKhai = user.IdCongKhai,
                TenDangNhap = user.TenDangNhap,
                HoTen = user.HoTen,
                Email = user.Email,
                TrangThaiHoatDong = user.TrangThaiHoatDong,
                NgayTao = user.NgayTao,
                NgayDangNhapCuoi = user.NgayDangNhapCuoi,
                NgayCapNhat = user.NgayCapNhat,
                AvatarUrl = user.AvatarUrl,
                Roles = userRoles,
                Quyen = permissionList
            }
        };
    }

    public async Task<RefreshTokenResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.NguoiDung)
            .FirstOrDefaultAsync(rt => rt.Token == tokenHash)
            ?? throw new UnauthorizedException("Refresh token không hợp lệ.");

        // ─── Reuse detection: token da bi revoked → attacker dang dung token cu ───
        if (storedToken.RevokedAt != null)
        {
            _logger.LogWarning(
                "REFRESH TOKEN REUSE DETECTED — TokenId={Id}, UserId={UserId}, FamilyId={Family}, RevokedAt={RevokedAt}",
                storedToken.Id, storedToken.NguoiDungId, storedToken.TokenFamilyId, storedToken.RevokedAt);

            // Revoke ca family (chain): attacker co token, legit user co token moi → ca 2 bi vo hieu
            await RevokeTokenFamilyAsync(storedToken.TokenFamilyId, storedToken.NguoiDungId);
            throw new UnauthorizedException("Refresh token không hợp lệ.");
        }

        if (storedToken.IsExpired)
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc đã bị thu hồi.");

        // Revoke old refresh token (rotation)
        storedToken.RevokedAt = DateTime.UtcNow;

        var user = storedToken.NguoiDung!;
        if (user.DaXoa || !user.TrangThaiHoatDong)
            throw new ForbiddenException("Tài khoản đã bị khóa hoặc đã bị xóa.");

        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.MaVaiTro ?? r.TenVaiTro).Distinct().ToList();
        var permissionSet = await _permissionService.GetPermissionsAsync(user.Id);

        var newToken = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames, permissionSet);
        // Tao refresh token moi, link vao family + predecessor
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id, storedToken.TokenFamilyId, storedToken.Id);

        await _context.SaveChangesAsync();

        var permissionList = permissionSet.OrderBy(q => q).ToList();

        return new RefreshTokenResponseDto
        {
            Message = "Cấp token mới thành công",
            Token = newToken,
            RefreshToken = newRefreshToken,
            User = new UserDto
            {
                IdCongKhai = user.IdCongKhai,
                TenDangNhap = user.TenDangNhap,
                HoTen = user.HoTen,
                Email = user.Email,
                TrangThaiHoatDong = user.TrangThaiHoatDong,
                NgayTao = user.NgayTao,
                NgayDangNhapCuoi = user.NgayDangNhapCuoi,
                NgayCapNhat = user.NgayCapNhat,
                AvatarUrl = user.AvatarUrl,
                Roles = userRoles,
                Quyen = permissionList
            }
        };
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == tokenHash);

        if (storedToken != null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private async Task RevokeAllRefreshTokensAsync(int userId)
    {
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.NguoiDungId == userId && rt.RevokedAt == null && !rt.IsExpired)
            .ToListAsync();

        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;
    }

    /// <summary>Revoke all tokens in a family chain (reuse detection).</summary>
    private async Task RevokeTokenFamilyAsync(Guid familyId, int userId)
    {
        var familyTokens = await _context.RefreshTokens
            .Where(rt => rt.TokenFamilyId == familyId && rt.NguoiDungId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in familyTokens)
            token.RevokedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogWarning(
            "Revoked entire token family — FamilyId={FamilyId}, UserId={UserId}, Count={Count}",
            familyId, userId, familyTokens.Count);
    }

    private async Task<string> CreateRefreshTokenAsync(int userId, Guid? familyId = null, int? replacedTokenId = null)
    {
        var tokenString = _jwtService.GenerateRefreshToken();
        _context.RefreshTokens.Add(new RefreshToken
        {
            Token = HashToken(tokenString),
            NguoiDungId = userId,
            TokenFamilyId = familyId ?? Guid.NewGuid(),
            ReplacedTokenId = replacedTokenId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return tokenString;
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _context.NguoiDungs.FindAsync(userId)
            ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        var userRoles = await GetUserRoles(user.Id);
        var permissions = (await _permissionService.GetPermissionsAsync(user.Id))
            .OrderBy(q => q)
            .ToList();


        return new UserDto
        {
            IdCongKhai = user.IdCongKhai,
            TenDangNhap = user.TenDangNhap,
            HoTen = user.HoTen,
            Email = user.Email,
            TrangThaiHoatDong = user.TrangThaiHoatDong,
            NgayTao = user.NgayTao,
            NgayDangNhapCuoi = user.NgayDangNhapCuoi,
            NgayCapNhat = user.NgayCapNhat,
            AvatarUrl = user.AvatarUrl,
            Roles = userRoles,
            Quyen = permissions
        };
    }

    public async Task<IReadOnlyCollection<string>> GetPermissionsAsync(int userId)
    {
        var permissions = await _permissionService.GetPermissionsAsync(userId);
        return permissions.OrderBy(q => q).ToList();
    }
    public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        // Rate limit: 3 lần / giờ / email
        var rateLimitKey = $"forgot-pwd:{normalizedEmail}";
        var count = _cache.GetOrCreate(rateLimitKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ForgotPasswordWindow;
            return 0;
        });
        if (count >= ForgotPasswordMaxRequests)
            throw new TooManyRequestsException("Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.");

        _cache.Set(rateLimitKey, count + 1, ForgotPasswordWindow);

        var user = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            // Email Enumeration Protection — không tiết lộ email không tồn tại
            _logger.LogInformation("Forgot password requested for a non-existent email account.");
            return;
        }

        var token = Guid.NewGuid().ToString();
        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            Token = token,
            NguoiDungId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            Used = false,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.HoTen, token);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(t => t.NguoiDung)
            .FirstOrDefaultAsync(t => t.Token == dto.Token);

        if (resetToken == null || resetToken.Used || resetToken.ExpiresAt < DateTime.UtcNow)
            throw new BadRequestException("Token đặt lại mật khẩu không hợp lệ, đã sử dụng hoặc đã hết hạn.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            resetToken.NguoiDung.MatKhauHash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhauMoi);
            resetToken.Used = true;
            await RevokeAllRefreshTokensAsync(resetToken.NguoiDungId);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task UpdatePasswordAsync(int userId, UpdatePasswordDto dto)
    {
        var user = await _context.NguoiDungs.FindAsync(userId)
            ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        if (!BCrypt.Net.BCrypt.Verify(dto.MatKhauHienTai, user.MatKhauHash))
            throw new UnauthorizedException("Mật khẩu hiện tại không chính xác.");

        user.MatKhauHash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhauMoi);
        await RevokeAllRefreshTokensAsync(userId);
        await _context.SaveChangesAsync();
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var user = await _context.NguoiDungs.FindAsync(userId)
            ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        if (dto.HoTen != null) user.HoTen = dto.HoTen;
        if (dto.Email != null) user.Email = dto.Email;
        if (dto.SoDienThoai != null) user.SoDienThoai = dto.SoDienThoai;

        await _context.SaveChangesAsync();

        return await GetCurrentUserAsync(userId);
    }

    // ═══════════════════════════════════════════════
    // Session management
    // ═══════════════════════════════════════════════

    public async Task<List<UserSessionDto>> GetSessionsAsync(int userId, string? currentJti = null)
    {
        return await _context.UserSessions
            .Where(s => s.NguoiDungId == userId && s.RevokedAt == null)
            .OrderByDescending(s => s.LastActivityAt ?? s.CreatedAt)
            .Select(s => new UserSessionDto
            {
                Id = s.Id,
                DiaChiIP = s.DiaChiIP ?? "",
                UserAgent = s.UserAgent,
                CreatedAt = s.CreatedAt,
                LastActivityAt = s.LastActivityAt,
                IsActive = s.RevokedAt == null,
                IsCurrent = s.Jti == currentJti
            })
            .ToListAsync();
    }

    public async Task RevokeSessionAsync(int userId, int sessionId)
    {
        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.NguoiDungId == userId);

        if (session == null)
            throw new NotFoundException("Session không tồn tại.");

        session.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task RevokeAllSessionsAsync(int userId, int? excludeSessionId = null)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.NguoiDungId == userId && s.RevokedAt == null)
            .ToListAsync();

        foreach (var s in sessions)
        {
            if (excludeSessionId.HasValue && s.Id == excludeSessionId.Value)
                continue;
            s.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>Extract JTI from a JWT token string.</summary>
    private static string ExtractJti(string token)
    {
        try
        {
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            return jwt.Id;
        }
        catch
        {
            return Guid.NewGuid().ToString(); // fallback
        }
    }

    private async Task<List<UserRoleDto>> GetUserRoles(int userId)
    {
        return await _context.NguoiDungKhoaPhongVaiTros
            .Where(r => r.NguoiDungId == userId)
            .Include(r => r.KhoaPhong)
            .Include(r => r.VaiTro).ThenInclude(v => v.NhomVaiTro)
            .Select(r => new UserRoleDto
            {
                KhoaPhongId = r.KhoaPhongId,
                TenKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.TenKhoaPhong : null,
                MaKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.MaKhoaPhong : null,
                VaiTroId = r.VaiTroId,
                TenVaiTro = r.VaiTro.TenVaiTro,
                MaVaiTro = r.VaiTro.MaVaiTro,
                LaChinh = r.LaChinh,
                DoUuTien = r.VaiTro.NhomVaiTro != null ? r.VaiTro.NhomVaiTro.DoUuTien : null
            })
            .ToListAsync();
    }


}
