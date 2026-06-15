using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.TaiLieu;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly ITaiLieuService _service;

    public FilesController(ITaiLieuService service)
    {
        _service = service;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(524_288_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 524_288_000)]
    public async Task<ActionResult<ApiResponse<List<TaiLieuUploadResultDto>>>> Upload(
        [FromForm] UploadFormModel model,
        CancellationToken ct)
    {
        var results = await _service.UploadAsync(model.Files, model.GoiThauId, model.LoaiTaiLieu, ct);
        return Ok(ApiResponse<List<TaiLieuUploadResultDto>>.Ok(
            results, $"Upload {results.Count} file thành công"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Download(int id, CancellationToken ct)
    {
        var (stream, fileName, contentType) = await _service.DownloadAsync(id, ct);
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse.Ok("Xóa tài liệu thành công"));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TaiLieuDto>>>> GetList(
        [FromQuery] int? goiThauId,
        [FromQuery] string? loaiTaiLieu)
    {
        var results = await _service.GetListAsync(goiThauId, loaiTaiLieu);
        return Ok(ApiResponse<List<TaiLieuDto>>.Ok(results));
    }
}
