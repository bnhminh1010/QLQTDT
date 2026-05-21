using FluentValidation;
using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Validators;

public class RegisterContractorValidator : AbstractValidator<RegisterContractorDto>
{
    public RegisterContractorValidator()
    {
        RuleFor(x => x.TenDangNhap)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống")
            .MinimumLength(3).WithMessage("Tên đăng nhập phải có ít nhất 3 ký tự")
            .MaximumLength(100).WithMessage("Tên đăng nhập tối đa 100 ký tự")
            .Matches(@"^[a-zA-Z0-9_.]+$").WithMessage("Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch dưới và dấu chấm");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ");

        RuleFor(x => x.MatKhau)
            .NotEmpty().WithMessage("Mật khẩu không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu phải có ít nhất 1 chữ số");

        RuleFor(x => x.ConfirmMatKhau)
            .NotEmpty().WithMessage("Xác nhận mật khẩu không được để trống")
            .Equal(x => x.MatKhau).WithMessage("Xác nhận mật khẩu không trùng khớp");

        RuleFor(x => x.HoTen)
            .NotEmpty().WithMessage("Họ tên không được để trống")
            .MaximumLength(255).WithMessage("Họ tên tối đa 255 ký tự");

        RuleFor(x => x.MaSoThue)
            .NotEmpty().WithMessage("Mã số thuế không được để trống")
            .Matches(@"^\d{10,14}$").WithMessage("Mã số thuế phải từ 10 đến 14 chữ số");

        RuleFor(x => x.TenCongTy)
            .NotEmpty().WithMessage("Tên công ty không được để trống")
            .MaximumLength(255).WithMessage("Tên công ty tối đa 255 ký tự");

        RuleFor(x => x.DiaChi)
            .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự")
            .When(x => x.DiaChi != null);

        RuleFor(x => x.NguoiDaiDien)
            .MaximumLength(100).WithMessage("Người đại diện tối đa 100 ký tự")
            .When(x => x.NguoiDaiDien != null);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.TenDangNhap).NotEmpty().WithMessage("Tên đăng nhập không được để trống");
        RuleFor(x => x.MatKhau).NotEmpty().WithMessage("Mật khẩu không được để trống");
    }
}

public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordDto>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ");
    }
}

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Token không được để trống");

        RuleFor(x => x.MatKhauMoi)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ số");

        RuleFor(x => x.ConfirmMatKhau)
            .NotEmpty().WithMessage("Xác nhận mật khẩu không được để trống")
            .Equal(x => x.MatKhauMoi).WithMessage("Xác nhận mật khẩu không trùng khớp");
    }
}

public class UpdatePasswordValidator : AbstractValidator<UpdatePasswordDto>
{
    public UpdatePasswordValidator()
    {
        RuleFor(x => x.MatKhauHienTai).NotEmpty().WithMessage("Mật khẩu hiện tại không được để trống");

        RuleFor(x => x.MatKhauMoi)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ số")
            .NotEqual(x => x.MatKhauHienTai).WithMessage("Mật khẩu mới không được trùng với mật khẩu cũ");

        RuleFor(x => x.ConfirmMatKhau)
            .NotEmpty().WithMessage("Xác nhận mật khẩu không được để trống")
            .Equal(x => x.MatKhauMoi).WithMessage("Xác nhận mật khẩu không trùng khớp");
    }
}

public class GoogleLoginValidator : AbstractValidator<GoogleLoginDto>
{
    public GoogleLoginValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Google ID Token không được để trống");
    }
}
