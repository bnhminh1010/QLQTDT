using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Dashboard;
using QLQTDT.Api.Services;
using System.Security.Claims;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>GET /api/dashboard/tong-quan — Dashboard tổng quan</summary>
    [HttpGet("tong-quan")]
    public async Task<ActionResult<ApiResponse<DashboardTongQuanDto>>> GetTongQuan()
    {
        var userId = GetCurrentUserId();
        var result = await _dashboardService.GetTongQuanAsync(userId);
        return Ok(ApiResponse<DashboardTongQuanDto>.Ok(result));
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Không thể xác định người dùng hiện tại.");
        return id;
    }
}
