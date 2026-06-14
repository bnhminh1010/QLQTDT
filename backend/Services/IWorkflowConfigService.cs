using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowConfigService
{
    Task<PagedResult<WorkflowListItemDto>> GetWorkflowsAsync(string? search, int page, int pageSize);
    Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request, int? nguoiTaoId);
    Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request, int? nguoiTaoId);
    Task DeleteWorkflowAsync(int id);
    Task<List<WorkflowVersionListItemDto>> GetVersionsAsync(int workflowId);
    Task<WorkflowVersionDetailDto> GetVersionByIdAsync(int workflowId, long versionId);
}
