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

public class DuyetStepValidator : AbstractValidator<DuyetStepRequest>
{
    public DuyetStepValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotNull().WithMessage("RowVersion là bắt buộc để đảm bảo xử lý đồng thời.");

        RuleFor(x => x.GhiChu)
            .MaximumLength(1000).WithMessage("GhiChu không được vượt quá 1000 ký tự.");
    }
}

public class KhongDuyetStepValidator : AbstractValidator<KhongDuyetStepRequest>
{
    public KhongDuyetStepValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotNull().WithMessage("RowVersion là bắt buộc để đảm bảo xử lý đồng thời.");

        RuleFor(x => x.GhiChu)
            .NotEmpty().WithMessage("Lý do từ chối là bắt buộc khi không duyệt bước.")
            .MaximumLength(1000).WithMessage("GhiChu không được vượt quá 1000 ký tự.");
    }
}

public class TraVeStepValidator : AbstractValidator<TraVeStepRequest>
{
    public TraVeStepValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotNull().WithMessage("RowVersion là bắt buộc để đảm bảo xử lý đồng thời.");

        RuleFor(x => x.GhiChu)
            .NotEmpty().WithMessage("Lý do trả về là bắt buộc.")
            .MaximumLength(1000).WithMessage("GhiChu không được vượt quá 1000 ký tự.");
    }
}

public class ProcessStepValidator : AbstractValidator<ProcessStepRequest>
{
    private static readonly string[] AllowedActions =
        ["APPROVE", "REJECT", "ROLLBACK", "SKIP", "REASSIGN", "DUYET", "KHONG_DUYET", "TRA_VE"];

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