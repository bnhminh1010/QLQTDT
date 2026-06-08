using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workflows")]
public class WorkflowsController : ControllerBase
{
    private readonly IWorkflowConfigService _workflowService;

    public WorkflowsController(IWorkflowConfigService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<WorkflowListItemDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var items = await _workflowService.GetWorkflowsAsync(search, page, pageSize);
        return Ok(ApiResponse<PagedResult<WorkflowListItemDto>>.Ok(items));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<WorkflowCreateResponse>>> Create(
        [FromBody] WorkflowCreateRequest request,
        [FromServices] IValidator<WorkflowCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        var created = await _workflowService.CreateWorkflowAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<WorkflowCreateResponse>.Ok(created, "Workflow created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(
        int id,
        [FromBody] WorkflowUpdateRequest request,
        [FromServices] IValidator<WorkflowUpdateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid) return BadRequest(ToValidationError(validation));

        await _workflowService.UpdateWorkflowAsync(id, request);
        return Ok(ApiResponse.Ok("Workflow updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _workflowService.DeleteWorkflowAsync(id);
        return Ok(ApiResponse.Ok("Workflow deleted successfully"));
    }

    private static ApiErrorResponse ToValidationError(FluentValidation.Results.ValidationResult result) => new()
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
