using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workflow")]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowEngineService _workflowEngine;

    public WorkflowController(IWorkflowEngineService workflowEngine)
    {
        _workflowEngine = workflowEngine;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<List<WorkflowPendingTaskDto>>>> GetPending()
    {
        var result = await _workflowEngine.GetPendingTasksAsync();
        return Ok(ApiResponse<List<WorkflowPendingTaskDto>>.Ok(result));
    }
}
