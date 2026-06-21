using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;
using System.Security.Claims;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workflows/{workflowId}/parallel-groups")]
public class ParallelGroupsController : ControllerBase
{
    private readonly IParallelGroupService _parallelGroupService;

    public ParallelGroupsController(IParallelGroupService parallelGroupService)
    {
        _parallelGroupService = parallelGroupService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ParallelGroupDto>>>> GetAll(int workflowId)
    {
        var items = await _parallelGroupService.GetGroupsAsync(workflowId);
        return Ok(ApiResponse<List<ParallelGroupDto>>.Ok(items));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ParallelGroupDto>>> Create(
        int workflowId,
        [FromBody] ParallelGroupCreateRequest request,
        [FromServices] IValidator<ParallelGroupCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _parallelGroupService.CreateGroupAsync(workflowId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ParallelGroupDto>.Ok(created, "Tạo nhóm nhánh song song thành công"));
    }

    [HttpPut("{groupId}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(
        int workflowId, int groupId,
        [FromBody] ParallelGroupUpdateRequest request,
        [FromServices] IValidator<ParallelGroupUpdateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        await _parallelGroupService.UpdateGroupAsync(workflowId, groupId, request);
        return Ok(ApiResponse.Ok("Cập nhật nhóm nhánh thành công"));
    }

    [HttpDelete("{groupId}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse>> Delete(int workflowId, int groupId)
    {
        await _parallelGroupService.DeleteGroupAsync(workflowId, groupId);
        return Ok(ApiResponse.Ok("Xóa nhóm nhánh thành công"));
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
[Authorize(Roles = "ADMIN")]
[Route("api/parallel-groups/{groupId}/branches")]
public class ParallelBranchesController : ControllerBase
{
    private readonly IParallelGroupService _parallelGroupService;

    public ParallelBranchesController(IParallelGroupService parallelGroupService)
    {
        _parallelGroupService = parallelGroupService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ParallelBranchDto>>> Create(
        int groupId,
        [FromBody] ParallelBranchCreateRequest request,
        [FromServices] IValidator<ParallelBranchCreateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        var created = await _parallelGroupService.CreateBranchAsync(groupId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ParallelBranchDto>.Ok(created, "Tạo nhánh thành công"));
    }

    [NonAction]
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
[Authorize(Roles = "ADMIN")]
[Route("api/parallel-branches/{branchId}")]
public class ParallelBranchItemController : ControllerBase
{
    private readonly IParallelGroupService _parallelGroupService;

    public ParallelBranchItemController(IParallelGroupService parallelGroupService)
    {
        _parallelGroupService = parallelGroupService;
    }

    [HttpPut]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(
        int branchId,
        [FromBody] ParallelBranchUpdateRequest request,
        [FromServices] IValidator<ParallelBranchUpdateRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToValidationError(validation));

        await _parallelGroupService.UpdateBranchAsync(branchId, request);
        return Ok(ApiResponse.Ok("Cập nhật nhánh thành công"));
    }

    [HttpDelete]
    public async Task<ActionResult<ApiResponse>> Delete(int branchId)
    {
        await _parallelGroupService.DeleteBranchAsync(branchId);
        return Ok(ApiResponse.Ok("Xóa nhánh thành công"));
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
