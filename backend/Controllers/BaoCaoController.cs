using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.BaoCao;
using QLQTDT.Api.Services;
using System.Security.Claims;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/bao-cao")]
public class BaoCaoController : ControllerBase
{
    private readonly IBaoCaoService _baoCaoService;

    public BaoCaoController(IBaoCaoService baoCaoService)
    {
        _baoCaoService = baoCaoService;
    }

    /// <summary>GET /api/bao-cao/goi-thau — Danh sách gói thầu theo filter</summary>
    [HttpGet("goi-thau")]
    [HasPermission("REPORT.VIEW", "REPORT.VIEW_INTERNAL", "REPORT.VIEW_ALL")]
    public async Task<ActionResult<ApiResponse<BaoCaoGoiThauResponse>>> GetGoiThau(
        [FromQuery] int? khoaPhongId,
        [FromQuery] DateTime? tuNgay,
        [FromQuery] DateTime? denNgay,
        [FromQuery] string? trangThai,
        [FromQuery] int? hinhThucId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var filter = new BaoCaoGoiThauFilterDto
        {
            KhoaPhongId = khoaPhongId,
            TuNgay = tuNgay,
            DenNgay = denNgay,
            TrangThai = trangThai,
            HinhThucId = hinhThucId,
            Page = page,
            PageSize = pageSize
        };

        var result = await _baoCaoService.GetGoiThauListAsync(userId, filter);
        return Ok(ApiResponse<BaoCaoGoiThauResponse>.Ok(result));
    }

    /// <summary>GET /api/bao-cao/tong-hop — Tổng hợp KPI + thống kê (cấp cao/xem toàn BV)</summary>
    [HttpGet("tong-hop")]
    [HasPermission("REPORT.VIEW_ALL", "REPORT.VIEW")]
    public async Task<ActionResult<ApiResponse<BaoCaoTongHopDto>>> GetTongHop(
        [FromQuery] DateTime? tuNgay,
        [FromQuery] DateTime? denNgay,
        [FromQuery] int? hinhThucId)
    {
        var userId = GetCurrentUserId();
        var result = await _baoCaoService.GetTongHopAsync(userId, tuNgay, denNgay, hinhThucId);
        return Ok(ApiResponse<BaoCaoTongHopDto>.Ok(result));
    }

    /// <summary>GET /api/bao-cao/chi-tieu — Chi tiêu giải ngân theo khoa (ADMIN/CAP_CAO)</summary>
    [HttpGet("chi-tieu")]
    [HasPermission("REPORT.VIEW_ALL")]
    public async Task<ActionResult<ApiResponse<List<BaoCaoChiTieuTheoKhoaDto>>>> GetChiTieu(
        [FromQuery] DateTime? tuNgay,
        [FromQuery] DateTime? denNgay,
        [FromQuery] int? hinhThucId)
    {
        var userId = GetCurrentUserId();
        var result = await _baoCaoService.GetChiTieuTheoKhoaAsync(userId, tuNgay, denNgay, hinhThucId);
        return Ok(ApiResponse<List<BaoCaoChiTieuTheoKhoaDto>>.Ok(result));
    }

    /// <summary>GET /api/bao-cao/export — Xuất CSV báo cáo tổng hợp (ADMIN/CAP_CAO)</summary>
    [HttpGet("export")]
    [HasPermission("REPORT.EXPORT")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateTime? tuNgay,
        [FromQuery] DateTime? denNgay,
        [FromQuery] int? hinhThucId)
    {
        var userId = GetCurrentUserId();
        var bytes = await _baoCaoService.ExportCsvAsync(userId, tuNgay, denNgay, hinhThucId);
        var fileName = $"bao-cao-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Không thể xác định người dùng hiện tại.");
        return id;
    }
}
