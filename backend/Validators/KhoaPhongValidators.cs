using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Controllers;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Validators;

public class KhoaPhongCreateRequestValidator : AbstractValidator<KhoaPhongCreateRequest>
{
    public KhoaPhongCreateRequestValidator(AppDbContext db)
    {
        RuleFor(x => x.MaKhoaPhong)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mã khoa/phòng không được để trống.")
            .MaximumLength(20).WithMessage("Mã khoa/phòng tối đa 20 ký tự.")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Mã chỉ chứa chữ, số, _ hoặc -.")
            .MustAsync(async (ma, ct) =>
            {
                var normalized = ma.Trim().ToUpper();
                return !await db.KhoaPhongs.AnyAsync(k => k.MaKhoaPhong != null && k.MaKhoaPhong.ToUpper() == normalized && !k.DaXoa, ct);
            }).WithMessage("Mã khoa/phòng đã tồn tại.");

        RuleFor(x => x.TenKhoaPhong)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Tên khoa/phòng không được để trống.")
            .Must(v => !string.IsNullOrWhiteSpace(v)).WithMessage("Tên khoa/phòng không được chỉ là khoảng trắng.")
            .MinimumLength(3).WithMessage("Tên khoa/phòng phải có ít nhất 3 ký tự.")
            .MaximumLength(100).WithMessage("Tên khoa/phòng tối đa 100 ký tự.")
            .MustAsync(async (ten, ct) =>
            {
                var normalized = ten.Trim().ToLower();
                return !await db.KhoaPhongs.AnyAsync(k => k.TenKhoaPhong.ToLower() == normalized && !k.DaXoa, ct);
            }).WithMessage("Tên khoa/phòng đã tồn tại.");
    }
}

public class KhoaPhongUpdateRequestValidator : AbstractValidator<KhoaPhongUpdateRequest>
{
    public KhoaPhongUpdateRequestValidator()
    {
        RuleFor(x => x.MaKhoaPhong)
            .MaximumLength(20).WithMessage("Mã khoa/phòng tối đa 20 ký tự.")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Mã chỉ chứa chữ, số, _ hoặc -.")
            .When(x => !string.IsNullOrWhiteSpace(x.MaKhoaPhong));

        RuleFor(x => x.TenKhoaPhong)
            .Cascade(CascadeMode.Stop)
            .Must(v => v is null || !string.IsNullOrWhiteSpace(v))
            .WithMessage("Tên khoa/phòng không được chỉ là khoảng trắng.")
            .Must(v => v is null || v.Trim().Length >= 3)
            .WithMessage("Tên khoa/phòng phải có ít nhất 3 ký tự.")
            .MaximumLength(100).WithMessage("Tên khoa/phòng tối đa 100 ký tự.");
    }
}
