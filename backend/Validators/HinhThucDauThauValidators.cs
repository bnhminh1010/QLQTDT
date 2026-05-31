using FluentValidation;
using QLQTDT.Api.Models.DTOs.HinhThucDauThau;

namespace QLQTDT.Api.Validators;

public class CreateHinhThucDauThauValidator : AbstractValidator<CreateHinhThucDauThauDto>
{
    public CreateHinhThucDauThauValidator()
    {
        RuleFor(x => x.MaHinhThuc)
            .NotEmpty().MaximumLength(50)
            .Matches(@"^[A-Za-z][A-Za-z0-9_]*$")
                .WithMessage("Mã hình thức phải bắt đầu bằng chữ cái, chỉ chứa chữ cái, số và dấu gạch dưới");

        RuleFor(x => x.TenHinhThuc)
            .NotEmpty().MaximumLength(255);

        RuleFor(x => x.HanMucToiDa)
            .GreaterThanOrEqualTo(0).When(x => x.HanMucToiDa.HasValue);
    }
}

public class UpdateHinhThucDauThauValidator : AbstractValidator<UpdateHinhThucDauThauDto>
{
    public UpdateHinhThucDauThauValidator()
    {
        RuleFor(x => x.TenHinhThuc)
            .NotEmpty().MaximumLength(255);

        RuleFor(x => x.HanMucToiDa)
            .GreaterThanOrEqualTo(0).When(x => x.HanMucToiDa.HasValue);
    }
}
