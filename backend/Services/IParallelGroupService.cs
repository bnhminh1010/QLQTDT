using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IParallelGroupService
{
    Task<List<ParallelGroupDto>> GetGroupsAsync(int workflowId);
    Task<ParallelGroupDto> CreateGroupAsync(int workflowId, ParallelGroupCreateRequest request);
    Task UpdateGroupAsync(int workflowId, int groupId, ParallelGroupUpdateRequest request);
    Task DeleteGroupAsync(int workflowId, int groupId);

    Task<ParallelBranchDto> CreateBranchAsync(int groupId, ParallelBranchCreateRequest request);
    Task UpdateBranchAsync(int branchId, ParallelBranchUpdateRequest request);
    Task DeleteBranchAsync(int branchId);
}
