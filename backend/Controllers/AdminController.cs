using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

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
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow
        };
        _db.NguoiDungs.Add(entity);
        await _db.SaveChangesAsync();
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

        await _db.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "Cập nhật người dùng thành công." });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.NguoiDungs.FindAsync(id);
        if (user is null)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy người dùng." });
        user.DaXoa = true;
        await _db.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "Xóa người dùng thành công." });
    }
}

public class CreateAdminUserRequest
{
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
}

public class UpdateAdminUserRequest
{
    public string? HoTen { get; set; }
    public string? Email { get; set; }
}
