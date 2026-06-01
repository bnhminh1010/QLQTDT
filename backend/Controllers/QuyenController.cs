using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Quyen;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

/// <summary>
/// Controller for managing Quyen (Permission) entities
/// Chỉ ADMIN mới được thao tác CRUD
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class QuyenController : BaseController<Quyen, IQuyenService>
{
    public QuyenController(IQuyenService service) : base(service)
    {
    }

    /// <summary>
    /// Danh sách quyền (phân trang + tìm kiếm)
    /// GET /api/quyen?page=1&amp;pageSize=20&amp;search=DeXuat
    /// </summary>
    [HttpGet]
    public override async Task<ActionResult<ApiResponse<PagedResult<Quyen>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var search = HttpContext.Request.Query["search"].FirstOrDefault();
        var result = await _service.SearchAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<Quyen>>.Ok(result));
    }

    /// <summary>
    /// Tạo quyền mới
    /// POST /api/quyen → { maQuyen, tenQuyen }
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Quyen>>> CreateQuyen(
        [FromBody] CreateQuyenDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<Quyen>.Ok(created, "Tạo quyền thành công"));
    }

    /// <summary>
    /// Cập nhật quyền
    /// PUT /api/quyen/{id} → { tenQuyen }
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<Quyen>>> UpdateQuyen(
        int id, [FromBody] UpdateQuyenDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<Quyen>.Ok(updated, "Cập nhật quyền thành công"));
    }

    // ──────────────────────────────────────────────────────────
    // Vô hiệu hoá base actions nhận raw Entity để tránh:
    //   1. Ambiguous route (2 actions cùng [HttpPost] / [HttpPut])
    //   2. Bypass DTO validation — client có thể sửa MaQuyen, DaXoa
    // ──────────────────────────────────────────────────────────

    /// <summary>
    /// [DISABLED] Không cho phép tạo trực tiếp bằng entity raw.
    /// Sử dụng POST /api/quyen với body { maQuyen, tenQuyen } thay thế.
    /// </summary>
    [NonAction]
    public override Task<ActionResult<ApiResponse<Quyen>>> Create(Quyen entity)
        => throw new NotSupportedException("Sử dụng CreateQuyenDto thay vì entity trực tiếp.");

    /// <summary>
    /// [DISABLED] Không cho phép cập nhật trực tiếp bằng entity raw.
    /// Sử dụng PUT /api/quyen/{id} với body { tenQuyen } thay thế.
    /// </summary>
    [NonAction]
    public override Task<ActionResult<ApiResponse<Quyen>>> Update(int id, Quyen entity)
        => throw new NotSupportedException("Sử dụng UpdateQuyenDto thay vì entity trực tiếp.");
}