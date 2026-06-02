using FluentValidation;
using QLQTDT.Api.Models.DTOs.GoiThau;

namespace QLQTDT.Api.Validators;

public class CreateGoiThauValidator : AbstractValidator<CreateGoiThauDto>
{
    public CreateGoiThauValidator()
    {
        RuleFor(x => x.TenGoiThau)
            .NotEmpty().WithMessage("Tên gói thầu không được để trống.")
            .MaximumLength(255).WithMessage("Tên gói thầu tối đa 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(1000).WithMessage("Mô tả tối đa 1000 ký tự.")
            .When(x => x.MoTa is not null);

        RuleFor(x => x.GiaGoiThau)
            .GreaterThan(0).WithMessage("Giá gói thầu phải lớn hơn 0.")
            .When(x => x.GiaGoiThau.HasValue);

        RuleFor(x => x.DeXuatId)
            .GreaterThan(0).WithMessage("DeXuatId không hợp lệ.")
            .When(x => x.DeXuatId.HasValue);
    }
}

public class UpdateGoiThauValidator : AbstractValidator<UpdateGoiThauDto>
{
    public UpdateGoiThauValidator()
    {
        RuleFor(x => x.TenGoiThau)
            .NotEmpty().WithMessage("Tên gói thầu không được để trống.")
            .MaximumLength(255).WithMessage("Tên gói thầu tối đa 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(1000).WithMessage("Mô tả tối đa 1000 ký tự.")
            .When(x => x.MoTa is not null);

        RuleFor(x => x.GiaGoiThau)
            .GreaterThan(0).WithMessage("Giá gói thầu phải lớn hơn 0.")
            .When(x => x.GiaGoiThau.HasValue);
    }
}
