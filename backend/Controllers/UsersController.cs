using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Rbac;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "ADMIN")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>Gán vai trò cho user trong khoa/phòng</summary>
    [HttpPost("{id}/assign-role")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AssignRole(int id, [FromBody] AssignRoleRequest request)
    {
        await _userService.AssignRoleAsync(id, request);
        return Ok(new MessageResponse { Message = "Phân vai trò thành công" });
    }

    /// <summary>Lấy danh sách vai trò của user</summary>
    [HttpGet("{id}/roles")]
    [ProducesResponseType(typeof(List<UserRoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoles(int id)
    {
        var roles = await _userService.GetRolesAsync(id);
        return Ok(roles);
    }

    /// <summary>Xoá phân vai trò</summary>
    [HttpDelete("roles/{assignmentId}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRole(int assignmentId)
    {
        await _userService.RemoveRoleAsync(assignmentId);
        return Ok(new MessageResponse { Message = "Xoá phân vai trò thành công" });
    }
}
