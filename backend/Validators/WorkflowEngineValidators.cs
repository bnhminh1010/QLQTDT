using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

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

        RuleFor(x => x.TaiLieuDinhKem)
            .MaximumLength(500).WithMessage("Tài liệu đính kèm không được vượt quá 500 ký tự.");
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

        RuleFor(x => x.TaiLieuDinhKem)
            .MaximumLength(500).WithMessage("Tài liệu đính kèm không được vượt quá 500 ký tự.");
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

public class SkipBranchRequestValidator : AbstractValidator<SkipBranchRequest>
{
    public SkipBranchRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.BranchId.HasValue || x.ParallelBranchId.HasValue)
            .WithMessage("BranchId hoặc ParallelBranchId là bắt buộc.");

        RuleFor(x => x.BranchId)
            .GreaterThan(0).When(x => x.BranchId.HasValue)
            .WithMessage("BranchId phải lớn hơn 0.");

        RuleFor(x => x.ParallelBranchId)
            .GreaterThan(0).When(x => x.ParallelBranchId.HasValue)
            .WithMessage("ParallelBranchId phải lớn hơn 0.");

        RuleFor(x => x.WorkflowInstanceId)
            .GreaterThan(0).When(x => x.WorkflowInstanceId.HasValue)
            .WithMessage("WorkflowInstanceId phải lớn hơn 0.");

        RuleFor(x => x.GhiChu)
            .MaximumLength(1000).WithMessage("GhiChu không được vượt quá 1000 ký tự.");
    }
}

public class ProcessStepValidator : AbstractValidator<ProcessStepRequest>
{
    private static readonly string[] AllowedActions =
        ["APPROVE", "REJECT", "ROLLBACK", "SKIP", "REASSIGN", "DUYET", "KHONG_DUYET", "TRA_VE"];

    private static bool IsApprovalDecisionAction(string? action)
        => action is WorkflowHanhDong.DUYET or WorkflowHanhDong.KHONG_DUYET;

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

        RuleFor(x => x.NguoiKyDuyet)
            .NotEmpty().WithMessage("Người ký duyệt là bắt buộc khi cập nhật kết quả ký duyệt.")
            .MaximumLength(200).WithMessage("Người ký duyệt không được vượt quá 200 ký tự.")
            .When(x => IsApprovalDecisionAction(x.HanhDong));

        RuleFor(x => x.NgayKyDuyet)
            .NotNull().WithMessage("Ngày ký duyệt là bắt buộc khi cập nhật kết quả ký duyệt.")
            .When(x => IsApprovalDecisionAction(x.HanhDong));
    }
}

public class WorkflowInterveneRequestValidator : AbstractValidator<WorkflowInterveneRequest>
{
    public WorkflowInterveneRequestValidator()
    {
        RuleFor(x => x.CurrentWorkflowStepInstanceId)
            .GreaterThan(0).WithMessage("CurrentWorkflowStepInstanceId phải lớn hơn 0.");

        RuleFor(x => x.TargetWorkflowStepInstanceId)
            .GreaterThan(0).WithMessage("TargetWorkflowStepInstanceId phải lớn hơn 0.");

        RuleFor(x => x.RowVersion)
            .NotNull().WithMessage("RowVersion là bắt buộc để đảm bảo xử lý đồng thời.");

        RuleFor(x => x.LyDo)
            .NotEmpty().WithMessage("Lý do can thiệp là bắt buộc.")
            .MaximumLength(1000).WithMessage("Lý do can thiệp không được vượt quá 1000 ký tự.");
    }
}
