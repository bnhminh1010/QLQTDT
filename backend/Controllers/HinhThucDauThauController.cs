using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HinhThucDauThau;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/hinh-thuc-dau-thau")]
[Authorize(Roles = "ADMIN")]
public class HinhThucDauThauController : BaseController<HinhThucDauThau, IHinhThucDauThauService>
{
    private readonly ILogger<HinhThucDauThauController> _logger;

    public HinhThucDauThauController(
        IHinhThucDauThauService service,
        ILogger<HinhThucDauThauController> logger) : base(service)
    {
        _logger = logger;
    }

    [HttpGet]
    public override async Task<ActionResult<ApiResponse<PagedResult<HinhThucDauThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var search = HttpContext.Request.Query["search"].FirstOrDefault();
        var result = await _service.SearchAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<HinhThucDauThau>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<HinhThucDauThau>>> CreateHinhThuc(
        [FromBody] CreateHinhThucDauThauDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<HinhThucDauThau>.Ok(created, "Tạo hình thức đấu thầu thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<HinhThucDauThau>>> UpdateHinhThuc(
        int id, [FromBody] UpdateHinhThucDauThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<HinhThucDauThau>.Ok(updated, "Cập nhật hình thức đấu thầu thành công"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> DeleteHinhThuc(int id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return Ok(ApiResponse.Ok("Xóa hình thức đấu thầu thành công"));
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete bidding method {HinhThucId}", id);
            return Conflict(ApiResponse.Fail("Không thể xóa hình thức đấu thầu đang được sử dụng."));
        }
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<HinhThucDauThau>>> Create(HinhThucDauThau entity)
        => throw new NotSupportedException("Sử dụng CreateHinhThucDauThauDto thay vì entity trực tiếp.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<HinhThucDauThau>>> Update(int id, HinhThucDauThau entity)
        => throw new NotSupportedException("Sử dụng UpdateHinhThucDauThauDto thay vì entity trực tiếp.");

    [NonAction]
    public override Task<ActionResult<ApiResponse>> Delete(int id)
        => throw new NotSupportedException("Sử dụng DeleteHinhThuc thay vì Delete trực tiếp.");
}
