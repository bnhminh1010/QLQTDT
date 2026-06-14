using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class StartWorkflowValidator : AbstractValidator<StartWorkflowRequest>
{
    public StartWorkflowValidator()
    {
        RuleFor(x => x.WorkflowId)
            .NotNull().WithMessage("WorkflowId là bắt buộc khi không dùng tự động đề xuất.")
            .GreaterThan(0).WithMessage("WorkflowId phải lớn hơn 0.")
            .When(x => !x.AutoSuggest);
    }
}
