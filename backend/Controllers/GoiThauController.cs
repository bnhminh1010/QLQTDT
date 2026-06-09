using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/goi-thau")]
[Authorize]
public class GoiThauController : BaseController<GoiThau, IGoiThauService>
{
    private readonly IHoSoDuThauService _hoSoService;

    public GoiThauController(IGoiThauService service, IHoSoDuThauService hoSoService) : base(service)
    {
        _hoSoService = hoSoService;
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<PagedResult<GoiThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => throw new NotSupportedException();

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<GoiThauDto>>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? trangThai = null)
    {
        var result = await _service.SearchAsync(page, pageSize, trangThai);
        return Ok(ApiResponse<PagedResult<GoiThauDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GoiThau>>> Create(
        [FromBody] CreateGoiThauDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<GoiThau>.Ok(created, "Tạo gói thầu thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<GoiThau>>> Update(
        int id, [FromBody] UpdateGoiThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<GoiThau>.Ok(updated, "Cập nhật gói thầu thành công"));
    }

    [HttpGet("{id}/chi-tiet")]
    public async Task<ActionResult<ApiResponse<GoiThauDetailDto>>> GetChiTiet(int id)
    {
        var detail = await _service.GetChiTietAsync(id);
        return Ok(ApiResponse<GoiThauDetailDto>.Ok(detail));
    }

    [AllowAnonymous]
    [HttpGet("{id}/lich-su-trang-thai")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>>> GetLichSuTrangThai(int id)
    {
        if (User?.Identity?.IsAuthenticated != true)
            return StatusCode(
                StatusCodes.Status401Unauthorized,
                ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Fail("Bạn chưa đăng nhập."));

        var permissionsClaim = User.FindFirstValue("permissions");
        var hasPermission = permissionsClaim?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Contains("GOITHAU.VIEW_STATUS_HISTORY", StringComparer.OrdinalIgnoreCase) == true;

        if (!hasPermission)
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Fail("Bạn không có quyền xem lịch sử trạng thái gói thầu."));

        var result = await _service.GetLichSuTrangThaiAsync(id);
        return Ok(ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Ok(result));
    }

    [HttpPost("{id}/award")]
    [HasPermission("HOSODUTHAU.AWARD")]
    public async Task<ActionResult<ApiResponse<object?>>> Award(
        int id, [FromBody] AwardGoiThauRequest request)
    {
        await _hoSoService.AwardAsync(id, request);
        return Ok(ApiResponse<object?>.Ok(null, "Chọn nhà thầu trúng thầu thành công"));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Create(GoiThau entity)
        => throw new NotSupportedException("Sử dụng CreateGoiThauDto.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Update(int id, GoiThau entity)
        => throw new NotSupportedException("Sử dụng UpdateGoiThauDto.");
}
