using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
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
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Update(
        int id,
        [FromBody] BuocWorkflowUpdateRequest request,
        [FromServices] IValidator<BuocWorkflowUpdateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        await _buocWorkflowService.UpdateStepAsync(id, request);
        return Ok(ApiResponse.Ok("Step updated successfully"));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
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
