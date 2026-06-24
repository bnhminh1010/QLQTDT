using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowRuntimeService
{
    /// <summary>Danh sách pending tasks của user hiện tại</summary>
    Task<List<PendingTaskDto>> GetPendingTasksAsync(int userId);

    /// <summary>Danh sách steps quá hạn (admin)</summary>
    Task<List<OverdueTaskDto>> GetOverdueTasksAsync();

    /// <summary>Chi tiết workflow instance kèm lịch sử hành động</summary>
    Task<WorkflowInstanceDetailDto> GetInstanceAsync(long instanceId);

    /// <summary>Danh sách steps + trạng thái của instance</summary>
    Task<List<WorkflowStepInstanceDetailDto>> GetInstanceStepsAsync(long instanceId);
}
