using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models.DTOs.ThongBao;
using QLQTDT.Api.Services;
using System.Security.Claims;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/thong-bao")]
[Authorize]
public class ThongBaoController : ControllerBase
{
    private readonly IThongBaoService _thongBaoService;

    public ThongBaoController(IThongBaoService thongBaoService)
    {
        _thongBaoService = thongBaoService;
    }

    [HttpGet]
    public async Task<ActionResult<ThongBaoListResponse>> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? daDoc = null)
    {
        var userId = GetCurrentUserId();
        var result = await _thongBaoService.GetListAsync(userId, page, pageSize, daDoc);
        return Ok(result);
    }

    [HttpPost("{idCongKhai:guid}/mark-read")]
    public async Task<IActionResult> MarkRead(Guid idCongKhai)
    {
        var userId = GetCurrentUserId();
        await _thongBaoService.MarkReadAsync(idCongKhai, userId);
        return Ok(new { message = "Đã đánh dấu thông báo đã đọc." });
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetCurrentUserId();
        var count = await _thongBaoService.MarkAllReadAsync(userId);
        return Ok(new { message = $"Đã đánh dấu {count} thông báo đã đọc.", count });
    }

    [HttpPost("admin/send")]
    [HasPermission("USER.VIEW_ALL")]
    public async Task<IActionResult> SendAdmin([FromBody] CreateAdminThongBaoRequest request)
    {
        var count = await _thongBaoService.SendAdminAsync(request);
        return Ok(new { message = $"Đã gửi {count} thông báo.", count });
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Không thể xác định người dùng hiện tại.");
        return id;
    }
}
