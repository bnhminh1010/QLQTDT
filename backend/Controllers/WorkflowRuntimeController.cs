using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workflow")]
public class WorkflowRuntimeController : ControllerBase
{
    private readonly IWorkflowRuntimeService _runtimeService;

    public WorkflowRuntimeController(IWorkflowRuntimeService runtimeService)
    {
        _runtimeService = runtimeService;
    }

    /// <summary>Danh sách pending tasks của user hiện tại</summary>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(ApiResponse<List<PendingTaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingTasks()
    {
        var userId = GetCurrentUserId();
        var result = await _runtimeService.GetPendingTasksAsync(userId);
        return Ok(ApiResponse<List<PendingTaskDto>>.Ok(result));
    }

    /// <summary>Danh sách steps quá hạn (admin)</summary>
    [HttpGet("overdue")]
    [HasPermission("WORKFLOW.PROCESS")]
    [ProducesResponseType(typeof(ApiResponse<List<OverdueTaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverdueTasks()
    {
        var result = await _runtimeService.GetOverdueTasksAsync();
        return Ok(ApiResponse<List<OverdueTaskDto>>.Ok(result));
    }

    /// <summary>Chi tiết workflow instance kèm lịch sử hành động</summary>
    [HttpGet("{instanceId}")]
    [HasPermission("WORKFLOW.PROCESS")]
    [ProducesResponseType(typeof(ApiResponse<WorkflowInstanceDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInstance(long instanceId)
    {
        var result = await _runtimeService.GetInstanceAsync(instanceId);
        return Ok(ApiResponse<WorkflowInstanceDetailDto>.Ok(result));
    }

    /// <summary>Danh sách steps + trạng thái của instance</summary>
    [HttpGet("{instanceId}/steps")]
    [HasPermission("WORKFLOW.PROCESS")]
    [ProducesResponseType(typeof(ApiResponse<List<WorkflowStepInstanceDetailDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInstanceSteps(long instanceId)
    {
        var result = await _runtimeService.GetInstanceStepsAsync(instanceId);
        return Ok(ApiResponse<List<WorkflowStepInstanceDetailDto>>.Ok(result));
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : throw new Exceptions.UnauthorizedException("Yêu cầu chưa được xác thực.");
    }
}
