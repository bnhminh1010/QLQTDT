using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
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

    [HttpGet]
    [HasPermission("NHATHAU.VIEW")]
    public override async Task<ActionResult<ApiResponse<PagedResult<NhaThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var search = HttpContext.Request.Query["search"].FirstOrDefault();
        var result = await _service.SearchAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<NhaThau>>.Ok(result));
    }

    [HttpGet("{id}")]
    [HasPermission("NHATHAU.VIEW")]
    public override async Task<ActionResult<ApiResponse<NhaThau>>> GetById(int id)
    {
        var entity = await _service.GetByIdAsync(id);
        if (entity is null)
            return NotFound(ApiResponse.Fail($"Khong tim thay nha thau voi Id = {id}"));
        return Ok(ApiResponse<NhaThau>.Ok(entity));
    }

    /// <summary>
    /// Tạo nhà thầu
    /// POST /api/nha-thau
    /// </summary>
    [HttpPost]
    [HasPermission("NHATHAU.CREATE")]
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
    [HasPermission("NHATHAU.EDIT")]
    public async Task<ActionResult<ApiResponse<NhaThau>>> UpdateNhaThau(
        int id, [FromBody] UpdateNhaThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<NhaThau>.Ok(updated, "Cập nhật nhà thầu thành công"));
    }

    /// <summary>
    /// Xóa nhà thầu
    /// DELETE /api/nha-thau/{id}
    /// </summary>
    [HttpDelete("{id}")]
    [HasPermission("NHATHAU.DELETE")]
    public override async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Xoá nhà thầu thành công"));
    }
    /// <summary>
    /// Danh sach ho so nang luc cua nha thau
    /// GET /api/nha-thau/{id}/ho-so-nang-luc
    /// </summary>
    [HttpGet("{id}/ho-so-nang-luc")]
    [HasPermission("HOSONANGLUC.VIEW")]
    public async Task<ActionResult<ApiResponse<List<HoSoNangLucDto>>>> GetHoSoNangLuc(int id)
    {
        var results = await _service.GetHoSoNangLucAsync(id);
        return Ok(ApiResponse<List<HoSoNangLucDto>>.Ok(results));
    }

    /// <summary>
    /// Upload ho so nang luc cua nha thau
    /// POST /api/nha-thau/{id}/ho-so-nang-luc
    /// </summary>
    [HttpPost("{id}/ho-so-nang-luc")]
    [RequestSizeLimit(52_428_800)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    [HasPermission("HOSONANGLUC.CREATE")]
    public async Task<ActionResult<ApiResponse<HoSoNangLucDto>>> UploadHoSoNangLuc(
        int id,
        [FromForm] UploadHoSoNangLucDto dto,
        CancellationToken ct)
    {
        var result = await _service.UploadHoSoNangLucAsync(id, dto, ct);
        return Ok(ApiResponse<HoSoNangLucDto>.Ok(result, "Upload ho so nang luc thanh cong"));
    }

    /// <summary>
    /// Xoa ho so nang luc cua nha thau
    /// DELETE /api/nha-thau/{id}/ho-so-nang-luc/{hoSoId}
    /// </summary>
    [HttpDelete("{id}/ho-so-nang-luc/{hoSoId:long}")]
    [HasPermission("HOSONANGLUC.DELETE")]
    public async Task<ActionResult<ApiResponse>> DeleteHoSoNangLuc(
        int id,
        long hoSoId,
        CancellationToken ct)
    {
        await _service.DeleteHoSoNangLucAsync(id, hoSoId, ct);
        return Ok(ApiResponse.Ok("Xoa ho so nang luc thanh cong"));
    }

    /// <summary>
    /// Lịch sử đấu thầu của nhà thầu
    /// GET /api/nha-thau/{id}/ls-du-thau
    /// </summary>
    [HttpGet("{id}/ls-du-thau")]
    [HasPermission("HOSODUTHAU.VIEW")]
    public async Task<ActionResult<ApiResponse<List<LichSuDauThauItemDto>>>> GetLichSuDauThau(int id)
    {
        var result = await _service.GetLichSuDauThauAsync(id);
        return Ok(ApiResponse<List<LichSuDauThauItemDto>>.Ok(result));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<NhaThau>>> Create(NhaThau entity)
        => throw new NotSupportedException("Sử dụng CreateNhaThauDto thay vì entity trực tiếp.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<NhaThau>>> Update(int id, NhaThau entity)
        => throw new NotSupportedException("Sử dụng UpdateNhaThauDto thay vì entity trực tiếp.");
}
