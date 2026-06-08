using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/ho-so-du-thau")]
[Authorize]
public class HoSoDuThauController : ControllerBase
{
    private readonly IHoSoDuThauService _service;

    public HoSoDuThauController(IHoSoDuThauService service)
    {
        _service = service;
    }

    /// <summary>
    /// Nộp hồ sơ dự thầu
    /// POST /api/ho-so-du-thau
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<HoSoDuThauDetailDto>>> Create(
        [FromBody] CreateHoSoDuThauRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<HoSoDuThauDetailDto>.Ok(result, "Nộp hồ sơ dự thầu thành công"));
    }

    /// <summary>
    /// Danh sách hồ sơ theo gói thầu
    /// GET /api/ho-so-du-thau?goiThauId=1&amp;page=1&amp;pageSize=20
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<HoSoDuThauListItemDto>>>> GetByGoiThau(
        [FromQuery] int goiThauId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetByGoiThauAsync(goiThauId, page, pageSize);
        return Ok(ApiResponse<PagedResult<HoSoDuThauListItemDto>>.Ok(result));
    }

    /// <summary>
    /// Chi tiết hồ sơ dự thầu
    /// GET /api/ho-so-du-thau/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<HoSoDuThauDetailDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<HoSoDuThauDetailDto>.Ok(result));
    }

    /// <summary>
    /// Cập nhật trạng thái hồ sơ
    /// PATCH /api/ho-so-du-thau/{id}/trang-thai
    /// </summary>
    [HttpPatch("{id}/trang-thai")]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateTrangThai(
        int id, [FromBody] UpdateTrangThaiHoSoRequest request)
    {
        await _service.UpdateTrangThaiAsync(id, request);
        return Ok(ApiResponse<object?>.Ok(null, "Cập nhật trạng thái thành công"));
    }
}
