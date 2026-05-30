using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowConfigService
{
    Task<List<WorkflowListItemDto>> GetWorkflowsAsync();
    Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request);
    Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request);
    Task DeleteWorkflowAsync(int id);
}
