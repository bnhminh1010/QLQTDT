using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models.DTOs.GoiThau;

namespace QLQTDT.Api.Validators;

public class CreateGoiThauValidator : AbstractValidator<CreateGoiThauDto>
{
    public CreateGoiThauValidator(AppDbContext db)
    {
        RuleFor(x => x.TenGoiThau)
            .NotEmpty().WithMessage("Tên gói thầu không được để trống.")
            .MaximumLength(255).WithMessage("Tên gói thầu tối đa 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(1000).WithMessage("Mô tả tối đa 1000 ký tự.")
            .When(x => x.MoTa is not null);

        RuleFor(x => x.NganSach)
            .GreaterThan(0).WithMessage("Giá gói thầu phải lớn hơn 0.")
            .When(x => x.NganSach.HasValue);

        RuleFor(x => x.HinhThucId)
            .GreaterThan(0).WithMessage("Vui lòng chọn hình thức đấu thầu.");

        RuleFor(x => x.HinhThucId)
            .MustAsync(async (id, ct) =>
            {
                return await db.HinhThucDauThaus
                    .AsNoTracking()
                    .AnyAsync(h => h.Id == id && h.TrangThaiHoatDong, ct);
            })
            .WithMessage("Hình thức đấu thầu không hợp lệ hoặc đã bị vô hiệu hóa.");

        RuleFor(x => x.DeXuatId)
            .GreaterThan(0).WithMessage("DeXuatId không hợp lệ.")
            .When(x => x.DeXuatId.HasValue);

        RuleFor(x => x.NguonVon)
            .MaximumLength(200).WithMessage("Nguồn vốn tối đa 200 ký tự.")
            .When(x => x.NguonVon is not null);

        RuleFor(x => x.LoaiGoiThau)
            .MaximumLength(100).WithMessage("Loại gói thầu tối đa 100 ký tự.")
            .When(x => x.LoaiGoiThau is not null);

        RuleFor(x => x.CanCuApDungRutGon)
            .MaximumLength(1000).WithMessage("Căn cứ áp dụng rút gọn tối đa 1000 ký tự.")
            .When(x => x.CanCuApDungRutGon is not null);
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

        RuleFor(x => x.NganSach)
            .GreaterThan(0).WithMessage("Giá gói thầu phải lớn hơn 0.")
            .When(x => x.NganSach.HasValue);

        RuleFor(x => x.HinhThucId)
            .GreaterThan(0).WithMessage("Hình thức đấu thầu không hợp lệ.")
            .When(x => x.HinhThucId.HasValue);

        RuleFor(x => x.NguonVon)
            .MaximumLength(200).WithMessage("Nguồn vốn tối đa 200 ký tự.")
            .When(x => x.NguonVon is not null);

        RuleFor(x => x.LoaiGoiThau)
            .MaximumLength(100).WithMessage("Loại gói thầu tối đa 100 ký tự.")
            .When(x => x.LoaiGoiThau is not null);

        RuleFor(x => x.CanCuApDungRutGon)
            .MaximumLength(1000).WithMessage("Căn cứ áp dụng rút gọn tối đa 1000 ký tự.")
            .When(x => x.CanCuApDungRutGon is not null);
    }
}
