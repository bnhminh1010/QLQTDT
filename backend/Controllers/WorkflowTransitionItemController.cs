using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PHONG_QLDT")]
[Route("api/workflows/transitions")]
public class WorkflowTransitionItemController : ControllerBase
{
    private readonly IBuocWorkflowService _buocWorkflowService;

    public WorkflowTransitionItemController(IBuocWorkflowService buocWorkflowService)
    {
        _buocWorkflowService = buocWorkflowService;
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _buocWorkflowService.DeleteTransitionAsync(id);
        return Ok(ApiResponse.Ok("Transition deleted successfully"));
    }
}
