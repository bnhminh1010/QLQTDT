using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/goi-thau")]
[Authorize]
public class GoiThauController : BaseController<GoiThau, IGoiThauService>
{
    private readonly IWorkflowEngineService _workflowEngine;

    public GoiThauController(IGoiThauService service, IWorkflowEngineService workflowEngine)
        : base(service)
    {
        _workflowEngine = workflowEngine;
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<PagedResult<GoiThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => throw new NotSupportedException();

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<GoiThauDto>>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? trangThai = null)
    {
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

    [HttpPost("{id}/start-workflow")]
    [HasPermission("WORKFLOW.CHOOSE")]
    public async Task<ActionResult<ApiResponse<WorkflowInstanceDto>>> StartWorkflow(
        int id,
        [FromBody] StartWorkflowRequest request,
        [FromServices] IValidator<StartWorkflowRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            return BadRequest(new ApiErrorResponse
            {
                Timestamp = DateTime.UtcNow,
                Status = 400,
                Error = "Validation Failed",
                Errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                                  g => g.First().ErrorMessage)
            });
        }

        var result = await _workflowEngine.StartWorkflowAsync(id, request);
        return Ok(ApiResponse<WorkflowInstanceDto>.Ok(result, "Khởi tạo workflow thành công"));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Create(GoiThau entity)
        => throw new NotSupportedException("Sử dụng CreateGoiThauDto.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Update(int id, GoiThau entity)
        => throw new NotSupportedException("Sử dụng UpdateGoiThauDto.");
}
