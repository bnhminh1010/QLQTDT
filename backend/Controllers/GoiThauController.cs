using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/goi-thau")]
[Authorize]
public class GoiThauController : BaseController<GoiThau, IGoiThauService>
{
    public GoiThauController(IGoiThauService service) : base(service) { }

    [NonAction]
    public override Task<ActionResult<ApiResponse<PagedResult<GoiThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => throw new NotSupportedException();

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<GoiThauDto>>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var trangThai = HttpContext.Request.Query["trangThai"].FirstOrDefault();
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

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Create(GoiThau entity)
        => throw new NotSupportedException("Sử dụng CreateGoiThauDto.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Update(int id, GoiThau entity)
        => throw new NotSupportedException("Sử dụng UpdateGoiThauDto.");
}
