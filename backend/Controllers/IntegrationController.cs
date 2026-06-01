using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Integration;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/integration")]
[Authorize(Roles = "ADMIN")]
public class IntegrationController : ControllerBase
{
    private readonly IIntegrationService _service;

    public IntegrationController(IIntegrationService service)
    {
        _service = service;
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync(SyncRequest request)
    {
        var result = await _service.SyncAsync(request);
        return Ok(ApiResponse<IntegrationLog>.Ok(result));
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? heThong = null,
        [FromQuery] string? trangThai = null)
    {
        var result = await _service.GetLogsAsync(page, pageSize, heThong, trangThai);
        return Ok(ApiResponse<PagedResult<IntegrationLog>>.Ok(result));
    }

    [HttpPost("retry/{id}")]
    public async Task<IActionResult> Retry(long id)
    {
        var result = await _service.RetryAsync(id);
        return Ok(ApiResponse<IntegrationLog>.Ok(result));
    }
}
