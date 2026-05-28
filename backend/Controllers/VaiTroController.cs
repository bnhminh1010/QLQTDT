using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/vai-tro")]
[Authorize(Roles = "ADMIN")]
public class VaiTroController : ControllerBase
{
    private readonly IVaiTroService _vaiTroService;

    public VaiTroController(IVaiTroService vaiTroService)
    {
        _vaiTroService = vaiTroService;
    }

    /// <summary>
    /// Gán danh sách quyền cho vai trò (bulk replace)
    /// </summary>
    [HttpPost("{id:int}/quyen")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GanQuyen(int id, [FromBody] GanQuyenRequest request)
    {
        await _vaiTroService.GanQuyenAsync(id, request.PermissionIds!);
        return Ok(new MessageResponse { Message = "Gán quyền cho vai trò thành công." });
    }

    /// <summary>
    /// Lấy danh sách quyền của vai trò
    /// </summary>
    [HttpGet("{id:int}/quyen")]
    [ProducesResponseType(typeof(List<QuyenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuyen(int id)
    {
        var result = await _vaiTroService.GetQuyenAsync(id);
        return Ok(result);
    }
}
