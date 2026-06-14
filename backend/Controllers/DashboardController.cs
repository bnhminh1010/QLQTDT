using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Dashboard;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary()
    {
        var result = await _service.GetSummaryAsync();
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(result));
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<ApiResponse<DashboardStatisticsDto>>> GetStatistics(
        [FromQuery] int? nam,
        [FromQuery] int? quy)
    {
        var result = await _service.GetStatisticsAsync(nam, quy);
        return Ok(ApiResponse<DashboardStatisticsDto>.Ok(result));
    }

    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<DashboardPendingDto>>> GetPending()
    {
        var result = await _service.GetPendingAsync();
        return Ok(ApiResponse<DashboardPendingDto>.Ok(result));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string? loai = "excel",
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null)
    {
        var result = await _service.ExportAsync(loai, tuNgay, denNgay);
        return File(result.Content, result.ContentType, result.FileName);
    }
}

