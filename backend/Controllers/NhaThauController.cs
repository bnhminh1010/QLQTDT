using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.NhaThau;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/nha-thau")]
public class NhaThauController : BaseController<NhaThau, INhaThauService>
{
    public NhaThauController(INhaThauService service) : base(service)
    {
    }

    /// <summary>
    /// Danh sách nhà thầu (phân trang + tìm kiếm)
    /// GET /api/nha-thau?page=1&amp;pageSize=20&amp;search=ABC
    /// </summary>
    [HttpGet]
    public override async Task<ActionResult<ApiResponse<PagedResult<NhaThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var search = HttpContext.Request.Query["search"].FirstOrDefault();
        var result = await _service.SearchAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<NhaThau>>.Ok(result));
    }

    /// <summary>
    /// Tạo nhà thầu
    /// POST /api/nha-thau
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<NhaThau>>> CreateNhaThau(
        [FromBody] CreateNhaThauDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<NhaThau>.Ok(created, "Tạo nhà thầu thành công"));
    }

    /// <summary>
    /// Cập nhật nhà thầu
    /// PUT /api/nha-thau/{id}
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<NhaThau>>> UpdateNhaThau(
        int id, [FromBody] UpdateNhaThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<NhaThau>.Ok(updated, "Cập nhật nhà thầu thành công"));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<NhaThau>>> Create(NhaThau entity)
        => throw new NotSupportedException("Sử dụng CreateNhaThauDto thay vì entity trực tiếp.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<NhaThau>>> Update(int id, NhaThau entity)
        => throw new NotSupportedException("Sử dụng UpdateNhaThauDto thay vì entity trực tiếp.");
}
