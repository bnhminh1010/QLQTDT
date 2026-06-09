using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class WorkflowCreateRequestValidator : AbstractValidator<WorkflowCreateRequest>
{
    public WorkflowCreateRequestValidator()
    {
        RuleFor(x => x.TenWorkflow)
            .NotEmpty().WithMessage("Ten workflow khong duoc de trong");

        RuleFor(x => x.HinhThucId)
            .GreaterThan(0).WithMessage("HinhThucId phai lon hon 0");
    }
}

public class WorkflowUpdateRequestValidator : AbstractValidator<WorkflowUpdateRequest>
{
    public WorkflowUpdateRequestValidator()
    {
        RuleFor(x => x.TenWorkflow)
            .NotEmpty().WithMessage("Ten workflow khong duoc de trong")
            .When(x => x.TenWorkflow != null);

        RuleFor(x => x.HinhThucId)
            .GreaterThan(0).WithMessage("HinhThucId phai lon hon 0")
            .When(x => x.HinhThucId.HasValue);
    }
}
