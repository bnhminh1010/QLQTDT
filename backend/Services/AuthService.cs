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


    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string clientIp)
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

        if (!user.TrangThaiHoatDong)
            throw new ForbiddenException("Tài khoản đang chờ quản trị viên phê duyệt hoặc đã bị khóa.");

        await _loginGuard.ResetAttemptsAsync(lockoutKey);

        // Cập nhật lần đăng nhập gần nhất
        user.NgayDangNhapCuoi = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Lấy danh sách roles và permissions
        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.TenVaiTro).Distinct().ToList();
        var permissionSet = await _permissionService.GetPermissionsAsync(user.Id);

        var token = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames, permissionSet);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

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
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.NguoiDung)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken)
            ?? throw new UnauthorizedException("Refresh token không hợp lệ.");

        if (!storedToken.IsActive)
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc đã bị thu hồi.");

        // Revoke old refresh token (rotation)
        storedToken.RevokedAt = DateTime.UtcNow;

        var user = storedToken.NguoiDung!;
        if (!user.TrangThaiHoatDong)
            throw new ForbiddenException("Tài khoản đã bị khóa.");

        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.TenVaiTro).Distinct().ToList();
        var permissionSet = await _permissionService.GetPermissionsAsync(user.Id);

        var newToken = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames, permissionSet);
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id);

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
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken != null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private async Task<string> CreateRefreshTokenAsync(int userId)
    {
        var tokenString = _jwtService.GenerateRefreshToken();
        _context.RefreshTokens.Add(new RefreshToken
        {
            Token = tokenString,
            NguoiDungId = userId,
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
        await _context.SaveChangesAsync();
    }

    private async Task<List<UserRoleDto>> GetUserRoles(int userId)
    {
        return await _context.NguoiDungKhoaPhongVaiTros
            .Where(r => r.NguoiDungId == userId)
            .Include(r => r.KhoaPhong)
            .Include(r => r.VaiTro)
            .Select(r => new UserRoleDto
            {
                KhoaPhongId = r.KhoaPhongId,
                TenKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.TenKhoaPhong : null,
                MaKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.MaKhoaPhong : null,
                VaiTroId = r.VaiTroId,
                TenVaiTro = r.VaiTro.TenVaiTro,
                LaChinh = r.LaChinh
            })
            .ToListAsync();
    }


}
