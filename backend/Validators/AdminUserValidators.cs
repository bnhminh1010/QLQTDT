using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Controllers;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Validators;

public class CreateAdminUserRequestValidator : AbstractValidator<CreateAdminUserRequest>
{
    public CreateAdminUserRequestValidator(AppDbContext db)
    {
        RuleFor(x => x.HoTen)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Họ tên không được chỉ là khoảng trắng.")
            .MinimumLength(2).WithMessage("Họ tên phải có ít nhất 2 ký tự.")
            .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự.")
            .Must(v => v.Any(char.IsLetter)).WithMessage("Họ tên phải chứa ít nhất một chữ cái.")
            .Must(v => !v.Trim().All(char.IsDigit)).WithMessage("Họ tên không được toàn là số.");

        RuleFor(x => x.TenDangNhap)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Username không được để trống.")
            .MinimumLength(3).WithMessage("Username phải có ít nhất 3 ký tự.")
            .MaximumLength(50).WithMessage("Username tối đa 50 ký tự.")
            .Matches("^[A-Za-z0-9._]+$").WithMessage("Username chỉ được chứa chữ không dấu, số, dấu chấm hoặc gạch dưới.")
            .Must(v => !v.Any(char.IsWhiteSpace)).WithMessage("Username không được chứa khoảng trắng.")
            .MustAsync(async (username, ct) =>
            {
                var normalized = username.Trim().ToLower();
                return !await db.NguoiDungs.AnyAsync(u => u.TenDangNhap.ToLower() == normalized && !u.DaXoa, ct);
            }).WithMessage("Username đã tồn tại trong hệ thống.");

        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(255).WithMessage("Email tối đa 255 ký tự.")
            .MustAsync(async (email, ct) =>
            {
                var normalized = email.Trim().ToLower();
                return !await db.NguoiDungs.AnyAsync(u => u.Email.ToLower() == normalized && !u.DaXoa, ct);
            }).WithMessage("Email đã được sử dụng trong hệ thống.");

        RuleFor(x => x.MatKhau)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .Matches("[A-Z]").WithMessage("Mật khẩu phải có ít nhất một chữ hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu phải có ít nhất một chữ thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải có ít nhất một chữ số.");

        RuleFor(x => x.SoDienThoai)
            .Matches("^[0-9]{10,11}$").WithMessage("Số điện thoại phải là 10-11 chữ số.")
            .When(x => !string.IsNullOrWhiteSpace(x.SoDienThoai));

        RuleFor(x => x.KhoaPhongId)
            .GreaterThan(0).WithMessage("Khoa/phòng không hợp lệ.")
            .When(x => x.KhoaPhongId.HasValue);

        RuleFor(x => x.VaiTroId)
            .GreaterThan(0).WithMessage("Vai trò không hợp lệ.")
            .When(x => x.VaiTroId.HasValue);

        RuleFor(x => x)
            .Must(x => x.KhoaPhongId.HasValue == x.VaiTroId.HasValue)
            .WithMessage("Khoa/phòng và vai trò phải được chọn cùng nhau.");
    }
}

public class UpdateAdminUserRequestValidator : AbstractValidator<UpdateAdminUserRequest>
{
    public UpdateAdminUserRequestValidator()
    {
        RuleFor(x => x.HoTen)
            .Cascade(CascadeMode.Stop)
            .Must(v => v is null || !string.IsNullOrWhiteSpace(v))
            .WithMessage("Họ tên không được chỉ là khoảng trắng.")
            .Must(v => v is null || v.Trim().Length >= 2)
            .WithMessage("Họ tên phải có ít nhất 2 ký tự.")
            .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự.")
            .Must(v => v is null || v.Any(char.IsLetter))
            .WithMessage("Họ tên phải chứa ít nhất một chữ cái.")
            .Must(v => v is null || !v.Trim().All(char.IsDigit))
            .WithMessage("Họ tên không được toàn là số.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(255).WithMessage("Email tối đa 255 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.SoDienThoai)
            .Matches("^[0-9]{10,11}$").WithMessage("Số điện thoại phải là 10-11 chữ số.")
            .When(x => !string.IsNullOrWhiteSpace(x.SoDienThoai));
    }
}
