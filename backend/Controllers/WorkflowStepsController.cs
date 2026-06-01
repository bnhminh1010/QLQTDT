using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
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
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<BuocWorkflowListItemDto>>> Create(
        int workflowId,
        [FromBody] BuocWorkflowCreateRequest request,
        [FromServices] FluentValidation.IValidator<BuocWorkflowCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _buocWorkflowService.CreateStepAsync(workflowId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<BuocWorkflowListItemDto>.Ok(created, "Step created successfully"));
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

[ApiController]
[Route("api/workflows/steps")]
public class WorkflowStepItemController : ControllerBase
{
    private readonly IBuocWorkflowService _buocWorkflowService;

    public WorkflowStepItemController(IBuocWorkflowService buocWorkflowService)
    {
        _buocWorkflowService = buocWorkflowService;
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(
        int id,
        [FromBody] BuocWorkflowUpdateRequest request,
        [FromServices] FluentValidation.IValidator<BuocWorkflowUpdateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        await _buocWorkflowService.UpdateStepAsync(id, request);
        return Ok(ApiResponse.Ok("Step updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _buocWorkflowService.DeleteStepAsync(id);
        return Ok(ApiResponse.Ok("Step deleted successfully"));
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

[ApiController]
[Route("api/workflows/{workflowId}/transitions")]
public class WorkflowTransitionsController : ControllerBase
{
    private readonly IBuocWorkflowService _buocWorkflowService;

    public WorkflowTransitionsController(IBuocWorkflowService buocWorkflowService)
    {
        _buocWorkflowService = buocWorkflowService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ChuyenTiepWorkflowListItemDto>>>> GetAll(int workflowId)
    {
        var items = await _buocWorkflowService.GetTransitionsByWorkflowIdAsync(workflowId);
        return Ok(ApiResponse<List<ChuyenTiepWorkflowListItemDto>>.Ok(items));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ChuyenTiepWorkflowListItemDto>>> Create(
        int workflowId,
        [FromBody] ChuyenTiepWorkflowCreateRequest request,
        [FromServices] FluentValidation.IValidator<ChuyenTiepWorkflowCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _buocWorkflowService.CreateTransitionAsync(workflowId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ChuyenTiepWorkflowListItemDto>.Ok(created, "Transition created successfully"));
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
