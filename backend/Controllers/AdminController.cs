using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;
using System.Security.Claims;
using System.Text.Json;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly AppDbContext _db;

    public AdminController(IAdminService adminService, AppDbContext db)
    {
        _adminService = adminService;
        _db = db;
    }

    /// <summary>
    /// Lấy danh sách người dùng (phân trang, filter, tìm kiếm)
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(AdminUserListDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? trangThai = null,
        [FromQuery] string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var result = await _adminService.GetUsersAsync(page, pageSize, trangThai, search);
        return Ok(result);
    }

    [HttpGet("users/{idCongKhai:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDetail(Guid idCongKhai)
    {
        var result = await _adminService.GetUserDetailAsync(idCongKhai);
        return Ok(result);
    }

    [HttpPut("users/{idCongKhai:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid idCongKhai)
    {
        await _adminService.ApproveUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Phê duyệt tài khoản thành công." });
    }

    [HttpPut("users/{idCongKhai:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid idCongKhai)
    {
        await _adminService.BlockUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Khóa tài khoản thành công." });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserRequest request)
    {
        var entity = new NguoiDung
        {
            IdCongKhai = Guid.NewGuid(),
            HoTen = request.HoTen,
            Email = request.Email,
            TenDangNhap = request.TenDangNhap,
            MatKhauHash = BCrypt.Net.BCrypt.HashPassword(request.MatKhau),
            SoDienThoai = request.SoDienThoai,
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow
        };
        _db.NguoiDungs.Add(entity);
        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(entity.Id, "CREATE_USER", "Tạo người dùng");
        return Ok(new MessageResponse { Message = "Tạo người dùng thành công." });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateAdminUserRequest request)
    {
        var user = await _db.NguoiDungs.FindAsync(id);
        if (user is null)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy người dùng." });

        if (request.HoTen != null) user.HoTen = request.HoTen;
        if (request.Email != null) user.Email = request.Email;
        if (request.SoDienThoai != null) user.SoDienThoai = request.SoDienThoai;
        user.NgayCapNhat = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(id, "UPDATE_USER", "Cập nhật thông tin người dùng");
        return Ok(new MessageResponse { Message = "Cập nhật người dùng thành công." });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == id)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không thể xóa tài khoản của chính mình." });

        var user = await _db.NguoiDungs.FindAsync(id);
        if (user is null || user.DaXoa)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy người dùng." });

        var isAdmin = await _db.NguoiDungKhoaPhongVaiTros
            .AnyAsync(r => r.NguoiDungId == id && r.VaiTro.MaVaiTro == "ADMIN");
        if (isAdmin)
        {
            var activeAdminCount = await _db.NguoiDungKhoaPhongVaiTros
                .Where(r => r.VaiTro.MaVaiTro == "ADMIN"
                    && r.NguoiDung.TrangThaiHoatDong
                    && !r.NguoiDung.DaXoa)
                .Select(r => r.NguoiDungId)
                .Distinct()
                .CountAsync();
            if (activeAdminCount <= 1)
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không thể xóa admin cuối cùng của hệ thống." });
        }

        user.DaXoa = true;
        user.TrangThaiHoatDong = false;
        user.NgayCapNhat = DateTime.UtcNow;

        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.NguoiDungId == id && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(id, "DELETE_USER", "Xóa người dùng");
        return Ok(new MessageResponse { Message = "Xóa người dùng thành công." });
    }

    [HttpGet("users/{id}/audit-log")]
    public async Task<ActionResult<ApiResponse<List<UserAuditLogDto>>>> GetUserAuditLog(int id)
    {
        var marker = $"\"nguoiDungId\":{id}";
        var items = await _db.NhatKyKiemToans
            .Where(log => log.MoTaChiTiet.Contains(marker))
            .OrderByDescending(log => log.ThoiGianThucHien)
            .Take(50)
            .Select(log => new UserAuditLogDto
            {
                Id = log.Id,
                HanhDong = log.HanhDong,
                MoTaChiTiet = log.MoTaChiTiet,
                ThoiGianThucHien = log.ThoiGianThucHien,
                NguoiThucHienId = log.NguoiThucHienId,
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserAuditLogDto>>.Ok(items));
    }

    private async Task WriteUserAuditAsync(int userId, string action, string description)
    {
        var actorId = GetCurrentUserId();
        if (!actorId.HasValue) return;

        _db.NhatKyKiemToans.Add(new NhatKyKiemToan
        {
            HanhDong = action,
            MoTaChiTiet = JsonSerializer.Serialize(new
            {
                nguoiDungId = userId,
                moTa = description,
            }),
            NguoiThucHienId = actorId.Value,
            ThoiGianThucHien = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class UserAuditLogDto
{
    public long Id { get; set; }
    public string HanhDong { get; set; } = string.Empty;
    public string MoTaChiTiet { get; set; } = string.Empty;
    public DateTime ThoiGianThucHien { get; set; }
    public int NguoiThucHienId { get; set; }
}

public class CreateAdminUserRequest
{
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public string? SoDienThoai { get; set; }
}

public class UpdateAdminUserRequest
{
    public string? HoTen { get; set; }
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
}
