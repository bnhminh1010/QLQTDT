using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/audit-log")]
[Authorize(Roles = "ADMIN,TONG_PHAP_CHE,VIEN_TRUONG")]
[HasPermission("AUDIT.VIEW_ALL")]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogController(IAuditLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? hanhDong = null,
        [FromQuery] string? bang = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, hanhDong, bang);
        return Ok(ApiResponse<PagedResult<NhatKyKiemToan>>.Ok(result));
    }

    [HttpGet("goi-thau/{id}")]
    public async Task<IActionResult> GetByGoiThau(long id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetByGoiThauAsync(id, page, pageSize);
        return Ok(ApiResponse<PagedResult<NhatKyKiemToan>>.Ok(result));
    }
}
