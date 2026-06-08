using FluentValidation;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Validators;

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
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ số")
            .Matches(@"[!@#$%^&*()\-_=+\[\]{}|;:'"",.<>?/~\\]").WithMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");

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
            .Matches(@"[!@#$%^&*()\-_=+\[\]{}|;:'"",.<>?/~\\]").WithMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)")
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
