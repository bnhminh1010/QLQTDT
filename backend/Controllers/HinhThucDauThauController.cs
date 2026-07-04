using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HinhThucDauThau;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/hinh-thuc-dau-thau")]
[Authorize]
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
    [HasPermission("HINHTHUCDAUTHAU.VIEW")]
    public override async Task<ActionResult<ApiResponse<PagedResult<HinhThucDauThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        EnsureCanView();
        var search = HttpContext.Request.Query["search"].FirstOrDefault();
        var result = await _service.SearchAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<HinhThucDauThau>>.Ok(result));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<HinhThucDauThau>>> GetById(int id)
        => throw new NotSupportedException("Sử dụng GetHinhThucById thay vì GetById mặc định.");

    [HttpGet("{id}")]
    [HasPermission("HINHTHUCDAUTHAU.VIEW")]
    public async Task<ActionResult<ApiResponse<HinhThucDauThau>>> GetHinhThucById(int id)
    {
        EnsureCanView();
        var entity = await _service.GetByIdAsync(id);
        if (entity is null)
            return NotFound(ApiResponse.Fail($"Không tìm thấy bản ghi với Id = {id}"));

        return Ok(ApiResponse<HinhThucDauThau>.Ok(entity));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<HinhThucDauThau>>> CreateHinhThuc(
        [FromBody] CreateHinhThucDauThauDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetHinhThucById), new { id = created.Id },
            ApiResponse<HinhThucDauThau>.Ok(created, "Tạo hình thức đấu thầu thành công"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<HinhThucDauThau>>> UpdateHinhThuc(
        int id, [FromBody] UpdateHinhThucDauThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<HinhThucDauThau>.Ok(updated, "Cập nhật hình thức đấu thầu thành công"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
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
    private void EnsureCanView()
    {
        if (IsKhoaPhongUser())
            throw new ForbiddenException("Khoa/phòng không được truy cập danh mục thực hiện.");
    }

    private bool IsKhoaPhongUser()
    {
        return User?.FindAll(ClaimTypes.Role)
            .Any(c => string.Equals(c.Value, "KHOA_PHONG", StringComparison.OrdinalIgnoreCase)) == true;
    }
}
