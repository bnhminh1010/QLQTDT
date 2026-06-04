using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class BuocWorkflowCreateRequestValidator : AbstractValidator<BuocWorkflowCreateRequest>
{
    public BuocWorkflowCreateRequestValidator()
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

        RuleFor(x => x.SoNgaySLA)
            .GreaterThanOrEqualTo(0).WithMessage("SoNgaySLA phai >= 0");
    }
}

public class BuocWorkflowUpdateRequestValidator : AbstractValidator<BuocWorkflowUpdateRequest>
{
    public BuocWorkflowUpdateRequestValidator()
    {
        When(x => x.TenBuoc != null, () =>
        {
            RuleFor(x => x.TenBuoc)
                .NotEmpty().WithMessage("TenBuoc khong duoc de trong")
                .MaximumLength(255).WithMessage("TenBuoc toi da 255 ky tu");
        });

        When(x => x.LoaiBuoc != null, () =>
        {
            RuleFor(x => x.LoaiBuoc)
                .NotEmpty().WithMessage("LoaiBuoc khong duoc de trong")
                .MaximumLength(50).WithMessage("LoaiBuoc toi da 50 ky tu");
        });

        When(x => x.SoNgaySLA.HasValue, () =>
        {
            RuleFor(x => x.SoNgaySLA)
                .GreaterThanOrEqualTo(0).WithMessage("SoNgaySLA phai >= 0");
        });
    }
}

public class ChuyenTiepWorkflowCreateRequestValidator : AbstractValidator<ChuyenTiepWorkflowCreateRequest>
{
    public ChuyenTiepWorkflowCreateRequestValidator()
    {
        RuleFor(x => x.TuBuocId)
            .GreaterThan(0).WithMessage("TuBuocId phai lon hon 0");

        RuleFor(x => x.DenBuocId)
            .GreaterThan(0).WithMessage("DenBuocId phai lon hon 0");

        RuleFor(x => x.HanhDong)
            .NotEmpty().WithMessage("HanhDong khong duoc de trong")
            .MaximumLength(50).WithMessage("HanhDong toi da 50 ky tu");

        RuleFor(x => x)
            .Must(x => x.TuBuocId != x.DenBuocId)
            .WithMessage("TuBuocId va DenBuocId phai khac nhau");
    }
}
