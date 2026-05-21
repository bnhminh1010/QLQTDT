using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QLQTDT.Api.Config;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly GoogleAuthConfig _googleConfig;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        AppDbContext context,
        JwtService jwtService,
        IOptions<GoogleAuthConfig> googleConfig,
        ILogger<GoogleAuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _googleConfig = googleConfig.Value;
        _logger = logger;
    }

    public async Task<LoginResponseDto> GoogleLoginAsync(string idToken)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _googleConfig.ClientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID Token");
            throw new UnauthorizedException("Google Token không hợp lệ hoặc đã hết hạn.");
        }

        var normalizedEmail = payload.Email.Trim().ToLowerInvariant();
        var googleId = payload.Subject;

        // Tìm user theo GoogleId trước
        var user = await _context.NguoiDungs
            .FirstOrDefaultAsync(u => u.GoogleId == googleId);

        if (user == null)
        {
            // Thử tìm theo Email nếu user đã đăng ký bằng username/password trước đó
            user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user != null)
            {
                // Liên kết tài khoản
                user.GoogleId = googleId;
                user.AvatarUrl = payload.Picture;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Tạo user mới hoàn toàn
                user = new NguoiDung
                {
                    TenDangNhap = $"google_{googleId}",
                    MatKhauHash = "", // Không có mật khẩu
                    HoTen = payload.Name,
                    Email = normalizedEmail,
                    GoogleId = googleId,
                    AvatarUrl = payload.Picture,
                    TrangThaiHoatDong = true, // Đã verify email qua Google nên cho active luôn
                    NgayTao = DateTime.UtcNow
                };

                _context.NguoiDungs.Add(user);
                await _context.SaveChangesAsync();
                
                // Ghi chú: Chưa gán vai trò gì cho user mới tạo từ Google (vai trò rỗng)
                // Nếu muốn họ có vai trò KHACH mặc định, có thể xử lý ở đây.
            }
        }
        else
        {
            // Cập nhật lại avatar nếu có thay đổi
            if (user.AvatarUrl != payload.Picture)
            {
                user.AvatarUrl = payload.Picture;
                await _context.SaveChangesAsync();
            }
        }

        if (!user.TrangThaiHoatDong)
            throw new ForbiddenException("Tài khoản đang chờ quản trị viên phê duyệt hoặc đã bị khóa.");

        // Lấy roles
        var userRoles = await GetUserRoles(user.Id);
        var roleNames = userRoles.Select(r => r.TenVaiTro).Distinct().ToList();

        // Sinh JWT
        var token = _jwtService.GenerateToken(user.Id, user.Email, user.HoTen, roleNames);

        return new LoginResponseDto
        {
            Message = "Đăng nhập bằng Google thành công",
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
                Roles = userRoles
            }
        };
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
