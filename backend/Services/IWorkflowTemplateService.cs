using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Services;

public interface IWorkflowTemplateService
{
    Task<List<WorkflowTemplateSummaryDto>> GetTemplatesAsync(string? loaiHinh);
    Task<WorkflowTemplatePreviewDto> PreviewAsync(int templateId);
    Task<WorkflowTemplatePreviewDto> GenerateFromTemplateAsync(GenerateWorkflowFromTemplateRequest request, int? nguoiTaoId);
}
