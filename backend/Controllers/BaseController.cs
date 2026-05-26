using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController<TEntity, TService> : ControllerBase
    where TEntity : class, IBaseEntity
    where TService : IBaseService<TEntity>
{
    protected readonly TService _service;

    protected BaseController(TService service)
    {
        _service = service;
    }

    [HttpGet]
    public virtual async Task<ActionResult<ApiResponse<PagedResult<TEntity>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(page, pageSize);
        return Ok(ApiResponse<PagedResult<TEntity>>.Ok(result));
    }

    [HttpGet("{id}")]
    public virtual async Task<ActionResult<ApiResponse<TEntity>>> GetById(int id)
    {
        var entity = await _service.GetByIdAsync(id);
        if (entity is null)
            return NotFound(ApiResponse.Fail($"Không tìm thấy bản ghi với Id = {id}"));

        return Ok(ApiResponse<TEntity>.Ok(entity));
    }

    [HttpPost]
    public virtual async Task<ActionResult<ApiResponse<TEntity>>> Create(TEntity entity)
    {
        var created = await _service.CreateAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<TEntity>.Ok(created, "Tạo thành công"));
    }

    [HttpPut("{id}")]
    public virtual async Task<ActionResult<ApiResponse<TEntity>>> Update(int id, TEntity entity)
    {
        var updated = await _service.UpdateAsync(id, entity);
        return Ok(ApiResponse<TEntity>.Ok(updated, "Cập nhật thành công"));
    }

    [HttpDelete("{id}")]
    public virtual async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Xoá thành công"));
    }
}
