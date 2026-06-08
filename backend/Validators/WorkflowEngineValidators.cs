using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class StartWorkflowValidator : AbstractValidator<StartWorkflowRequest>
{
    public StartWorkflowValidator()
    {
        RuleFor(x => x.WorkflowId)
            .GreaterThan(0).WithMessage("WorkflowId phải lớn hơn 0.")
            .When(x => !x.AutoSuggest);
    }
}
