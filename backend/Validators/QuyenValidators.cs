using FluentValidation;
using QLQTDT.Api.Models.DTOs.Quyen;

namespace QLQTDT.Api.Validators;

/// <summary>
/// Validator cho CreateQuyenDto
/// </summary>
public class CreateQuyenValidator : AbstractValidator<CreateQuyenDto>
{
    public CreateQuyenValidator()
    {
        RuleFor(x => x.MaQuyen)
            .NotEmpty().WithMessage("Mã quyền không được để trống")
            .MaximumLength(100).WithMessage("Mã quyền tối đa 100 ký tự")
            .Matches(@"^[A-Za-z][A-Za-z0-9_.]*$")
                .WithMessage("Mã quyền phải bắt đầu bằng chữ cái, chỉ chứa chữ cái, số, dấu gạch dưới và dấu chấm");

        RuleFor(x => x.TenQuyen)
            .NotEmpty().WithMessage("Tên quyền không được để trống")
            .MaximumLength(255).WithMessage("Tên quyền tối đa 255 ký tự");
    }
}

/// <summary>
/// Validator cho UpdateQuyenDto
/// </summary>
public class UpdateQuyenValidator : AbstractValidator<UpdateQuyenDto>
{
    public UpdateQuyenValidator()
    {
        RuleFor(x => x.TenQuyen)
            .NotEmpty().WithMessage("Tên quyền không được để trống")
            .MaximumLength(255).WithMessage("Tên quyền tối đa 255 ký tự");
    }
}
