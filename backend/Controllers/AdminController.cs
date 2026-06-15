using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// Lấy danh sách người dùng (phân trang, filter, tìm kiếm)
    /// </summary>
    /// <param name="page">Trang hiện tại (mặc định: 1)</param>
    /// <param name="pageSize">Số bản ghi mỗi trang (mặc định: 10, tối đa: 50)</param>
    /// <param name="trangThai">Filter theo trạng thái: true = đang hoạt động, false = chờ duyệt/bị khóa, null = tất cả</param>
    /// <param name="search">Tìm kiếm theo họ tên, email, tên đăng nhập</param>
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

    /// <summary>
    /// Xem chi tiết một người dùng
    /// </summary>
    [HttpGet("users/{idCongKhai:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDetail(Guid idCongKhai)
    {
        var result = await _adminService.GetUserDetailAsync(idCongKhai);
        return Ok(result);
    }

    /// <summary>
    /// Phê duyệt (kích hoạt) tài khoản người dùng
    /// </summary>
    [HttpPut("users/{idCongKhai:guid}/approve")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveUser(Guid idCongKhai)
    {
        await _adminService.ApproveUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Phê duyệt tài khoản thành công." });
    }

    /// <summary>
    /// Khóa tài khoản người dùng
    /// </summary>
    [HttpPut("users/{idCongKhai:guid}/block")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BlockUser(Guid idCongKhai)
    {
        await _adminService.BlockUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Khóa tài khoản thành công." });
    }
}
