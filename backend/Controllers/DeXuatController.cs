using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.DeXuat;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/de-xuat")]
public class DeXuatController : ControllerBase
{
    private readonly IDeXuatService _deXuatService;

    public DeXuatController(IDeXuatService deXuatService)
    {
        _deXuatService = deXuatService;
    }

    /// <summary>Lấy danh sách đề xuất (filter theo khoa/phòng user)</summary>
    [HttpGet]
    [HasPermission("DEXUAT.VIEW")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<DeXuatResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] DeXuatQueryParams queryParams)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.GetAllAsync(queryParams, userId);
        return Ok(ApiResponse<PagedResult<DeXuatResponseDto>>.Ok(result));
    }

    /// <summary>Lấy chi tiết 1 đề xuất (kèm danh sách vật tư)</summary>
    [HttpGet("{id}")]
    [HasPermission("DEXUAT.VIEW")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(long id)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.GetByIdAsync(id, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result));
    }

    /// <summary>Tạo đề xuất mua sắm mới</summary>
    [HttpPost]
    [HasPermission("DEXUAT.CREATE")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateDeXuatDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<DeXuatResponseDto>.Ok(result, "Tạo đề xuất thành công"));
    }

    /// <summary>Cập nhật đề xuất (chỉ khi DRAFT và là owner)</summary>
    [HttpPut("{id}")]
    [HasPermission("DEXUAT.EDIT")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateDeXuatDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.UpdateAsync(id, dto, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result, "Cập nhật đề xuất thành công"));
    }

    /// <summary>Xóa đề xuất — soft delete (chỉ khi DRAFT và là owner)</summary>
    [HttpDelete("{id}")]
    [HasPermission("DEXUAT.DELETE")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(long id)
    {
        var userId = GetCurrentUserId();
        await _deXuatService.DeleteAsync(id, userId);
        return Ok(ApiResponse.Ok("Xóa đề xuất thành công"));
    }

    /// <summary>Trình duyệt đề xuất (DRAFT -> PENDING)</summary>
    [HttpPost("{id}/submit")]
    [HasPermission("DEXUAT.SUBMIT")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Submit(long id)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.SubmitAsync(id, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result, "Đã trình duyệt đề xuất"));
    }

    /// <summary>Phê duyệt đề xuất (PENDING -> APPROVED)</summary>
    [HttpPost("{id}/approve")]
    [HasPermission("DEXUAT.APPROVE")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Approve(long id, [FromBody] ApproveDeXuatDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.ApproveAsync(id, dto, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result, "Phê duyệt đề xuất thành công"));
    }

    /// <summary>Từ chối đề xuất (PENDING -> REJECTED)</summary>
    [HttpPost("{id}/reject")]
    [HasPermission("DEXUAT.APPROVE")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reject(long id, [FromBody] RejectDeXuatDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.RejectAsync(id, dto, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result, "Đã từ chối đề xuất"));
    }

    /// <summary>Lấy danh sách chi tiết vật tư của 1 đề xuất</summary>
    [HttpGet("{id}/chi-tiet")]
    [HasPermission("DEXUAT.VIEW")]
    [ProducesResponseType(typeof(ApiResponse<List<ChiTietResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChiTiet(long id)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.GetChiTietAsync(id, userId);
        return Ok(ApiResponse<List<ChiTietResponseDto>>.Ok(result));
    }

    // === Helpers ===

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
    }
}
