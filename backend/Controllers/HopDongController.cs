using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HopDong;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/hop-dong")]
[Authorize]
public class HopDongController : ControllerBase
{
    private readonly IHopDongService _service;

    public HopDongController(IHopDongService service)
    {
        _service = service;
    }

    /// <summary>
    /// Tạo hợp đồng cho gói thầu đã chọn nhà thầu
    /// POST /api/hop-dong
    /// </summary>
    [HttpPost]
    [HasPermission("HOPDONG.CREATE")]
    public async Task<ActionResult<ApiResponse<HopDongDetailDto>>> Create(
        [FromBody] CreateHopDongRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<HopDongDetailDto>.Ok(result, "Tạo hợp đồng thành công"));
    }

    /// <summary>
    /// Danh sách hợp đồng theo gói thầu
    /// GET /api/hop-dong?goiThauId=1&amp;page=1&amp;pageSize=20
    /// </summary>
    [HttpGet]
    [HasPermission("HOPDONG.VIEW")]
    public async Task<ActionResult<ApiResponse<PagedResult<HopDongListItemDto>>>> GetByGoiThau(
        [FromQuery] int goiThauId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetByGoiThauAsync(goiThauId, page, pageSize);
        return Ok(ApiResponse<PagedResult<HopDongListItemDto>>.Ok(result));
    }

    /// <summary>
    /// Chi tiết hợp đồng
    /// GET /api/hop-dong/{id}
    /// </summary>
    [HttpGet("{id}")]
    [HasPermission("HOPDONG.VIEW")]
    public async Task<ActionResult<ApiResponse<HopDongDetailDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<HopDongDetailDto>.Ok(result));
    }
}
