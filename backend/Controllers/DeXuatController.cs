using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Exceptions;
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
    [ProducesResponseType(typeof(ApiResponse<PagedResult<DeXuatResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] DeXuatQueryParams queryParams)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.GetAllAsync(queryParams, userId);
        return Ok(ApiResponse<PagedResult<DeXuatResponseDto>>.Ok(result));
    }

    /// <summary>Lấy chi tiết 1 đề xuất (kèm danh sách vật tư)</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(long id)
    {
        var userId = GetCurrentUserId();
        var result = await _deXuatService.GetByIdAsync(id, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result));
    }

    /// <summary>Tạo đề xuất mua sắm mới</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDeXuatDto dto,
        [FromServices] IValidator<CreateDeXuatDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var userId = GetCurrentUserId();
        var result = await _deXuatService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<DeXuatResponseDto>.Ok(result, "Tạo đề xuất thành công"));
    }

    /// <summary>Cập nhật đề xuất (chỉ khi DRAFT và là owner)</summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<DeXuatResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] UpdateDeXuatDto dto,
        [FromServices] IValidator<UpdateDeXuatDto> validator)
    {
        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var userId = GetCurrentUserId();
        var result = await _deXuatService.UpdateAsync(id, dto, userId);
        return Ok(ApiResponse<DeXuatResponseDto>.Ok(result, "Cập nhật đề xuất thành công"));
    }

    /// <summary>Xóa đề xuất — soft delete (chỉ khi DRAFT và là owner)</summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(long id)
    {
        var userId = GetCurrentUserId();
        await _deXuatService.DeleteAsync(id, userId);
        return Ok(ApiResponse.Ok("Xóa đề xuất thành công"));
    }

    /// <summary>Lấy danh sách chi tiết vật tư của 1 đề xuất</summary>
    [HttpGet("{id}/chi-tiet")]
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

    private static Models.DTOs.Common.ApiErrorResponse ToValidationError(
        FluentValidation.Results.ValidationResult result) => new()
    {
        Timestamp = DateTime.UtcNow,
        Status = 400,
        Error = "Validation Failed",
        Errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                g => g.First().ErrorMessage)
    };
}
