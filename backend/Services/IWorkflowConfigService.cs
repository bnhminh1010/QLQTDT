using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowConfigService
{
    Task<PagedResult<WorkflowListItemDto>> GetWorkflowsAsync(string? search, int page, int pageSize);
    Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request);
    Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request);
    Task DeleteWorkflowAsync(int id);
}
