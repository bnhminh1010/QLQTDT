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

public class ProcessStepValidator : AbstractValidator<ProcessStepRequest>
{
    private static readonly string[] AllowedActions =
        ["APPROVE", "REJECT", "ROLLBACK", "SKIP", "REASSIGN"];

    public ProcessStepValidator()
    {
        RuleFor(x => x.HanhDong)
            .NotEmpty().WithMessage("Hành động không được để trống.")
            .Must(a => AllowedActions.Contains(a))
            .WithMessage($"Hành động không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedActions)}.");

        RuleFor(x => x.NguoiDuocGiaoId)
            .GreaterThan(0).WithMessage("NguoiDuocGiaoId phải lớn hơn 0.")
            .When(x => x.HanhDong == "REASSIGN");

        RuleFor(x => x.GhiChu)
            .MaximumLength(1000).WithMessage("GhiChu không được vượt quá 1000 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotNull().WithMessage("RowVersion là bắt buộc để đảm bảo xử lý đồng thời.");
    }
}