using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowEngineService
{
    Task<WorkflowInstanceDto> StartWorkflowAsync(int goiThauId, StartWorkflowRequest request);
    Task<ProcessStepResponse> ProcessStepAsync(int goiThauId, ProcessStepRequest request);
}
