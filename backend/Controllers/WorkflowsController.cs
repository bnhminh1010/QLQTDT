using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/workflows")]
public class WorkflowsController : ControllerBase
{
	private readonly IWorkflowConfigService _workflowService;

	public WorkflowsController(IWorkflowConfigService workflowService)
	{
		_workflowService = workflowService;
	}

	[HttpGet]
	public async Task<ActionResult<ApiResponse<List<WorkflowListItemDto>>>> GetAll()
	{
		var items = await _workflowService.GetWorkflowsAsync();
		return Ok(ApiResponse<List<WorkflowListItemDto>>.Ok(items));
	}

	[HttpPost]
	public async Task<ActionResult<ApiResponse<WorkflowCreateResponse>>> Create([FromBody] WorkflowCreateRequest request)
	{
		var created = await _workflowService.CreateWorkflowAsync(request);
		return StatusCode(StatusCodes.Status201Created,
			ApiResponse<WorkflowCreateResponse>.Ok(created, "Workflow created successfully"));
	}

	[HttpPut("{id}")]
	public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] WorkflowUpdateRequest request)
	{
		await _workflowService.UpdateWorkflowAsync(id, request);
		return Ok(ApiResponse.Ok("Workflow updated successfully"));
	}

	[HttpDelete("{id}")]
	public async Task<ActionResult<ApiResponse>> Delete(int id)
	{
		await _workflowService.DeleteWorkflowAsync(id);
		return Ok(ApiResponse.Ok("Workflow deleted successfully"));
	}
}
