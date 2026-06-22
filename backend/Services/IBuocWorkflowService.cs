using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IBuocWorkflowService
{
    Task<List<BuocWorkflowListItemDto>> GetStepsByWorkflowIdAsync(int workflowId);
    Task<BuocWorkflowListItemDto> CreateStepAsync(int workflowId, BuocWorkflowCreateRequest request);
    Task UpdateStepAsync(int id, BuocWorkflowUpdateRequest request);
    Task DeleteStepAsync(int id);
    Task<List<ChuyenTiepWorkflowListItemDto>> GetTransitionsByWorkflowIdAsync(int workflowId);
    Task<ChuyenTiepWorkflowListItemDto> CreateTransitionAsync(int workflowId, ChuyenTiepWorkflowCreateRequest request);
    Task DeleteTransitionAsync(int id);

    // Step actions
    Task<BuocWorkflowListItemDto> InsertStepAfterAsync(int workflowId, int stepId, InsertStepAfterRequest request);
    Task<BuocWorkflowListItemDto> CloneStepAsync(int workflowId, int stepId, CloneStepRequest request);
    Task ReorderStepsAsync(int workflowId, ReorderStepsRequest request);
}
