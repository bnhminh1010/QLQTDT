using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class GenerateWorkflowFromTemplateRequestValidator : AbstractValidator<GenerateWorkflowFromTemplateRequest>
{
    public GenerateWorkflowFromTemplateRequestValidator()
    {
        RuleFor(x => x.TemplateWorkflowId)
            .GreaterThan(0).WithMessage("TemplateWorkflowId phai lon hon 0");

        RuleFor(x => x.TenWorkflow)
            .NotEmpty().WithMessage("TenWorkflow khong duoc de trong")
            .MaximumLength(255).WithMessage("TenWorkflow toi da 255 ky tu");
    }
}

public class InsertStepAfterRequestValidator : AbstractValidator<InsertStepAfterRequest>
{
    public InsertStepAfterRequestValidator()
    {
        RuleFor(x => x.MaBuoc)
            .NotEmpty().WithMessage("MaBuoc khong duoc de trong")
            .MaximumLength(50).WithMessage("MaBuoc toi da 50 ky tu");

        RuleFor(x => x.TenBuoc)
            .NotEmpty().WithMessage("TenBuoc khong duoc de trong")
            .MaximumLength(255).WithMessage("TenBuoc toi da 255 ky tu");

        RuleFor(x => x.LoaiBuoc)
            .NotEmpty().WithMessage("LoaiBuoc khong duoc de trong")
            .MaximumLength(50).WithMessage("LoaiBuoc toi da 50 ky tu");

        RuleFor(x => x.SoNgayLapHoSo)
            .GreaterThanOrEqualTo(0).WithMessage("SoNgayLapHoSo phai >= 0");

        RuleFor(x => x.SoNgayXuLy)
            .GreaterThanOrEqualTo(0).WithMessage("SoNgayXuLy phai >= 0");
    }
}

public class CloneStepRequestValidator : AbstractValidator<CloneStepRequest>
{
    public CloneStepRequestValidator()
    {
        RuleFor(x => x.MaBuocMoi)
            .NotEmpty().WithMessage("MaBuocMoi khong duoc de trong")
            .MaximumLength(50).WithMessage("MaBuocMoi toi da 50 ky tu");

        RuleFor(x => x.TenBuocMoi)
            .NotEmpty().WithMessage("TenBuocMoi khong duoc de trong")
            .MaximumLength(255).WithMessage("TenBuocMoi toi da 255 ky tu");
    }
}

public class ReorderStepsRequestValidator : AbstractValidator<ReorderStepsRequest>
{
    public ReorderStepsRequestValidator()
    {
        RuleFor(x => x.Steps)
            .NotEmpty().WithMessage("Steps khong duoc de trong")
            .Must(list => list.All(s => s.Id > 0)).WithMessage("Tat ca Step.Id phai lon hon 0")
            .Must(list => list.All(s => s.ThuTu >= 0)).WithMessage("Tat ca Step.ThuTu phai >= 0");
    }
}

public class ParallelGroupCreateRequestValidator : AbstractValidator<ParallelGroupCreateRequest>
{
    public ParallelGroupCreateRequestValidator()
    {
        RuleFor(x => x.TenNhom)
            .NotEmpty().WithMessage("TenNhom khong duoc de trong")
            .MaximumLength(255).WithMessage("TenNhom toi da 255 ky tu");

        RuleFor(x => x.BuocTachNhanhId)
            .GreaterThan(0).WithMessage("BuocTachNhanhId phai lon hon 0");

        RuleFor(x => x.BuocSauHopNhatId)
            .GreaterThan(0).WithMessage("BuocSauHopNhatId phai lon hon 0");

        RuleFor(x => x.DieuKienHopNhat)
            .Must(v => v == "ALL" || v == "ANY" || v == "COUNT")
            .WithMessage("DieuKienHopNhat phai la 'ALL', 'ANY' hoac 'COUNT'");

        When(x => x.DieuKienHopNhat == "COUNT", () =>
        {
            RuleFor(x => x.SoNhanhHopNhatToiThieu)
                .GreaterThanOrEqualTo(2).WithMessage("SoNhanhHopNhatToiThieu phai >= 2 khi DieuKienHopNhat = COUNT");
        });
    }
}

public class ParallelGroupUpdateRequestValidator : AbstractValidator<ParallelGroupUpdateRequest>
{
    public ParallelGroupUpdateRequestValidator()
    {
        When(x => x.TenNhom != null, () =>
        {
            RuleFor(x => x.TenNhom)
                .NotEmpty().WithMessage("TenNhom khong duoc de trong")
                .MaximumLength(255).WithMessage("TenNhom toi da 255 ky tu");
        });

        When(x => x.DieuKienHopNhat != null, () =>
        {
            RuleFor(x => x.DieuKienHopNhat)
                .Must(v => v == "ALL" || v == "ANY" || v == "COUNT")
                .WithMessage("DieuKienHopNhat phai la 'ALL', 'ANY' hoac 'COUNT'");
        });

        When(x => x.BuocSauHopNhatId.HasValue, () =>
        {
            RuleFor(x => x.BuocSauHopNhatId)
                .GreaterThan(0).WithMessage("BuocSauHopNhatId phai lon hon 0");
        });
    }
}

public class ParallelBranchCreateRequestValidator : AbstractValidator<ParallelBranchCreateRequest>
{
    public ParallelBranchCreateRequestValidator()
    {
        RuleFor(x => x.MaNhanh)
            .NotEmpty().WithMessage("MaNhanh khong duoc de trong")
            .MaximumLength(50).WithMessage("MaNhanh toi da 50 ky tu");

        RuleFor(x => x.TenNhanh)
            .NotEmpty().WithMessage("TenNhanh khong duoc de trong")
            .MaximumLength(255).WithMessage("TenNhanh toi da 255 ky tu");

        RuleFor(x => x.BuocDauTienId)
            .GreaterThan(0).WithMessage("BuocDauTienId phai lon hon 0");

        RuleFor(x => x.LoaiHan)
            .Must(v => v == "BAT_BUOC" || v == "CANH_BAO")
            .WithMessage("LoaiHan phai la 'BAT_BUOC' hoac 'CANH_BAO'");

        RuleFor(x => x.ThoiHanNgay)
            .GreaterThanOrEqualTo(0).WithMessage("ThoiHanNgay phai >= 0");
    }
}

public class ParallelBranchUpdateRequestValidator : AbstractValidator<ParallelBranchUpdateRequest>
{
    public ParallelBranchUpdateRequestValidator()
    {
        When(x => x.TenNhanh != null, () =>
        {
            RuleFor(x => x.TenNhanh)
                .NotEmpty().WithMessage("TenNhanh khong duoc de trong")
                .MaximumLength(255).WithMessage("TenNhanh toi da 255 ky tu");
        });

        When(x => x.LoaiHan != null, () =>
        {
            RuleFor(x => x.LoaiHan)
                .Must(v => v == "BAT_BUOC" || v == "CANH_BAO")
                .WithMessage("LoaiHan phai la 'BAT_BUOC' hoac 'CANH_BAO'");
        });

        When(x => x.ThoiHanNgay.HasValue, () =>
        {
            RuleFor(x => x.ThoiHanNgay)
                .GreaterThanOrEqualTo(0).WithMessage("ThoiHanNgay phai >= 0");
        });
    }
}
