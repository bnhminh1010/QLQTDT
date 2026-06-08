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

    private const int ForgotPasswordMaxRequests = 3;
    private static readonly TimeSpan ForgotPasswordWindow = TimeSpan.FromHours(1);

    public AuthService(
        AppDbContext context,
        JwtService jwtService,
        IEmailService emailService,
        LoginAttemptGuard loginGuard,
        IMemoryCache cache,
        ILogger<AuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
        _loginGuard = loginGuard;
        _cache = cache;
        _logger = logger;
    }

    public async Task<RegisterResponseDto> RegisterContractorAsync(RegisterContractorDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var normalizedUsername = dto.TenDangNhap.Trim();

        // Kiểm tra trùng lặp
        var existsUser = await _context.NguoiDungs
            .AnyAsync(u => u.TenDangNhap == normalizedUsername || u.Email == normalizedEmail);
        if (existsUser)
            throw new ConflictException("Tên đăng nhập hoặc email đã được sử dụng trên hệ thống.");

        var existsMst = await _context.NhaThaus.AnyAsync(n => n.MaSoThue == dto.MaSoThue);
        if (existsMst)
            throw new ConflictException("Mã số thuế đã được sử dụng trên hệ thống.");

        // Tạo NguoiDung với TrangThaiHoatDong = false (chờ duyệt)
        var nguoiDung = new NguoiDung
        {
            TenDangNhap = normalizedUsername,
            MatKhauHash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhau),
            HoTen = InputSanitizer.Sanitize(dto.HoTen),
            Email = normalizedEmail,
            TrangThaiHoatDong = false,
            NgayTao = DateTime.UtcNow
        };
        _context.NguoiDungs.Add(nguoiDung);
        await _context.SaveChangesAsync();

        // Tạo NhaThau liên kết
        var nhaThau = new NhaThau
        {
            MaSoThue = dto.MaSoThue,
            TenCongTy = InputSanitizer.Sanitize(dto.TenCongTy),
            DiaChi = dto.DiaChi != null ? InputSanitizer.Sanitize(dto.DiaChi) : null,
            NguoiDaiDien = dto.NguoiDaiDien != null ? InputSanitizer.Sanitize(dto.NguoiDaiDien) : null,
            TrangThaiHoatDong = true,
            NguoiDungId = nguoiDung.Id
        };
        _context.NhaThaus.Add(nhaThau);

        // Gán vai trò NHA_THAU (KhoaPhongId = null vì nhà thầu không thuộc khoa/phòng nào)
        var vaiTroNhaThau = await _context.VaiTros.FirstOrDefaultAsync(v => v.TenVaiTro == "NHA_THAU");
        if (vaiTroNhaThau != null)
        {
            _context.NguoiDungKhoaPhongVaiTros.Add(new NguoiDungKhoaPhongVaiTro
            {
                NguoiDungId = nguoiDung.Id,
                KhoaPhongId = null,
                VaiTroId = vaiTroNhaThau.Id,
                LaChinh = true
            });
        }

        await _context.SaveChangesAsync();

        return new RegisterResponseDto
        {
            Message = "Đăng ký tài khoản nhà thầu thành công. Vui lòng chờ quản trị viên phê duyệt.",
            Data = new RegisterDataDto
            {
                IdCongKhai = nguoiDung.IdCongKhai,
                TenDangNhap = nguoiDung.TenDangNhap,
                HoTen = nguoiDung.HoTen,
                Email = nguoiDung.Email,
                TenCongTy = nhaThau.TenCongTy,
                MaSoThue = nhaThau.MaSoThue,
                TrangThaiHoatDong = nguoiDung.TrangThaiHoatDong,
                NgayTao = nguoiDung.NgayTao
            }
        };
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

        // Lấy danh sách roles
        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.TenVaiTro).Distinct().ToList();
        var permissions = await GetUserPermissions(user.Id);

        var token = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames, permissions);

        return new LoginResponseDto
        {
            Message = "Đăng nhập thành công",
            Token = token,
            User = new UserDto
            {
                IdCongKhai = user.IdCongKhai,
                TenDangNhap = user.TenDangNhap,
                HoTen = user.HoTen,
                Email = user.Email,
                TrangThaiHoatDong = user.TrangThaiHoatDong,
                NgayTao = user.NgayTao,
                AvatarUrl = user.AvatarUrl,
                Roles = userRoles,
                Quyen = permissions
            }
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _context.NguoiDungs.FindAsync(userId)
            ?? throw new UnauthorizedException("Yêu cầu chưa được xác thực.");

        var userRoles = await GetUserRoles(user.Id);
        var permissions = await GetUserPermissions(user.Id);

        return new UserDto
        {
            IdCongKhai = user.IdCongKhai,
            TenDangNhap = user.TenDangNhap,
            HoTen = user.HoTen,
            Email = user.Email,
            TrangThaiHoatDong = user.TrangThaiHoatDong,
            NgayTao = user.NgayTao,
            AvatarUrl = user.AvatarUrl,
            Roles = userRoles,
            Quyen = permissions
        };
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
            _logger.LogInformation("Forgot password requested for non-existent email: {Email}", normalizedEmail);
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

    private async Task<List<string>> GetUserPermissions(int userId)
    {
        return await _context.NguoiDungKhoaPhongVaiTros
            .Where(r => r.NguoiDungId == userId && !r.VaiTro.DaXoa)
            .SelectMany(r => r.VaiTro.VaiTroQuyens)
            .Where(rq => !rq.Quyen.DaXoa)
            .Select(rq => rq.Quyen.MaQuyen)
            .Distinct()
            .OrderBy(q => q)
            .ToListAsync();
    }
}
