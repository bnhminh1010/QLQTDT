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
[Route("api/workflows/{workflowId}/steps")]
public class WorkflowStepsController : ControllerBase
{
    private readonly IBuocWorkflowService _buocWorkflowService;

    public WorkflowStepsController(IBuocWorkflowService buocWorkflowService)
    {
        _buocWorkflowService = buocWorkflowService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<BuocWorkflowListItemDto>>>> GetAll(int workflowId)
    {
        var items = await _buocWorkflowService.GetStepsByWorkflowIdAsync(workflowId);
        return Ok(ApiResponse<List<BuocWorkflowListItemDto>>.Ok(items));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<BuocWorkflowListItemDto>>> Create(
        int workflowId,
        [FromBody] BuocWorkflowCreateRequest request,
        [FromServices] IValidator<BuocWorkflowCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _buocWorkflowService.CreateStepAsync(workflowId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<BuocWorkflowListItemDto>.Ok(created, "Step created successfully"));
    }

    [HttpPost("{stepId}/insert-after")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<BuocWorkflowListItemDto>>> InsertAfter(
        int workflowId, int stepId,
        [FromBody] InsertStepAfterRequest request,
        [FromServices] IValidator<InsertStepAfterRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _buocWorkflowService.InsertStepAfterAsync(workflowId, stepId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<BuocWorkflowListItemDto>.Ok(created, "Chèn bước thành công"));
    }

    [HttpPost("{stepId}/clone")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<BuocWorkflowListItemDto>>> Clone(
        int workflowId, int stepId,
        [FromBody] CloneStepRequest request,
        [FromServices] IValidator<CloneStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _buocWorkflowService.CloneStepAsync(workflowId, stepId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<BuocWorkflowListItemDto>.Ok(created, "Nhân bản bước thành công"));
    }

    [HttpPost("reorder")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Reorder(
        int workflowId,
        [FromBody] ReorderStepsRequest request,
        [FromServices] IValidator<ReorderStepsRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        await _buocWorkflowService.ReorderStepsAsync(workflowId, request);
        return Ok(ApiResponse.Ok("Sắp xếp bước thành công"));
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
