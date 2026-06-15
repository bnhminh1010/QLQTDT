using FluentValidation;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models.DTOs.NhaThau;

namespace QLQTDT.Api.Validators;

public class CreateNhaThauValidator : AbstractValidator<CreateNhaThauDto>
{
    public CreateNhaThauValidator()
    {
        RuleFor(x => x.MaSoThue)
            .NotEmpty().WithMessage("Mã số thuế không được để trống")
            .Matches(@"^\d{10,14}$").WithMessage("Mã số thuế phải từ 10 đến 14 chữ số");

        RuleFor(x => x.TenCongTy)
            .NotEmpty().WithMessage("Tên công ty không được để trống")
            .MaximumLength(255).WithMessage("Tên công ty tối đa 255 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Tên công ty chứa ký tự không hợp lệ (HTML/script không được phép)");

        RuleFor(x => x.DiaChi)
            .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Địa chỉ chứa ký tự không hợp lệ (HTML/script không được phép)")
            .When(x => x.DiaChi != null);

        RuleFor(x => x.NguoiDaiDien)
            .MaximumLength(255).WithMessage("Người đại diện tối đa 255 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Người đại diện chứa ký tự không hợp lệ (HTML/script không được phép)")
            .When(x => x.NguoiDaiDien != null);

        RuleFor(x => x.Email)
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ")
            .When(x => x.Email != null);

        RuleFor(x => x.SoDienThoai)
            .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự")
            .Matches(@"^\d{9,20}$").WithMessage("Số điện thoại chỉ gồm chữ số")
            .When(x => x.SoDienThoai != null);
    }
}

public class UpdateNhaThauValidator : AbstractValidator<UpdateNhaThauDto>
{
    public UpdateNhaThauValidator()
    {
        RuleFor(x => x.MaSoThue)
            .NotEmpty().WithMessage("Mã số thuế không được để trống")
            .Matches(@"^\d{10,14}$").WithMessage("Mã số thuế phải từ 10 đến 14 chữ số");

        RuleFor(x => x.TenCongTy)
            .NotEmpty().WithMessage("Tên công ty không được để trống")
            .MaximumLength(255).WithMessage("Tên công ty tối đa 255 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Tên công ty chứa ký tự không hợp lệ (HTML/script không được phép)");

        RuleFor(x => x.DiaChi)
            .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Địa chỉ chứa ký tự không hợp lệ (HTML/script không được phép)")
            .When(x => x.DiaChi != null);

        RuleFor(x => x.NguoiDaiDien)
            .MaximumLength(255).WithMessage("Người đại diện tối đa 255 ký tự")
            .Must(v => !InputSanitizer.ContainsDangerousContent(v))
                .WithMessage("Người đại diện chứa ký tự không hợp lệ (HTML/script không được phép)")
            .When(x => x.NguoiDaiDien != null);

        RuleFor(x => x.Email)
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ")
            .When(x => x.Email != null);

        RuleFor(x => x.SoDienThoai)
            .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự")
            .Matches(@"^\d{9,20}$").WithMessage("Số điện thoại chỉ gồm chữ số")
            .When(x => x.SoDienThoai != null);
    }
}
