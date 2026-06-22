using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowEngineService
{
    Task<WorkflowInstanceDto> StartWorkflowAsync(int goiThauId, StartWorkflowRequest request);
    Task<ProcessStepResponse> ProcessStepAsync(int goiThauId, ProcessStepRequest request);
    Task<WorkflowStateDto?> GetWorkflowStateAsync(int goiThauId);
    Task<List<WorkflowStepStateDto>> GetWorkflowStepsAsync(int goiThauId);
    Task<WorkflowStepStateDto?> GetWorkflowStepDetailAsync(int goiThauId, long stepId);
}
