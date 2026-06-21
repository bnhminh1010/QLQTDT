using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workflow-templates")]
public class WorkflowTemplatesController : ControllerBase
{
    private readonly IWorkflowTemplateService _templateService;

    public WorkflowTemplatesController(IWorkflowTemplateService templateService)
    {
        _templateService = templateService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<WorkflowTemplateSummaryDto>>>> GetAll(
        [FromQuery] string? loaiHinh)
    {
        var items = await _templateService.GetTemplatesAsync(loaiHinh);
        return Ok(ApiResponse<List<WorkflowTemplateSummaryDto>>.Ok(items));
    }

    [HttpGet("{id}/preview")]
    public async Task<ActionResult<ApiResponse<WorkflowTemplatePreviewDto>>> Preview(int id)
    {
        var preview = await _templateService.PreviewAsync(id);
        return Ok(ApiResponse<WorkflowTemplatePreviewDto>.Ok(preview));
    }
}
