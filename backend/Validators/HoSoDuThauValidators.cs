using FluentValidation;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Validators;

public class CreateHoSoDuThauValidator : AbstractValidator<CreateHoSoDuThauRequest>
{
    public CreateHoSoDuThauValidator()
    {
        RuleFor(x => x.GoiThauId)
            .GreaterThan(0).WithMessage("GoiThauId không hợp lệ");

        RuleFor(x => x.NhaThauId)
            .GreaterThan(0).WithMessage("NhaThauId không hợp lệ");

        RuleFor(x => x.GiaDuThau)
            .GreaterThan(0).WithMessage("Giá dự thầu phải lớn hơn 0");

        RuleFor(x => x.FileIds)
            .NotNull().WithMessage("FileIds không được null")
            .Must(ids => ids.All(id => id > 0)).WithMessage("FileIds chứa giá trị không hợp lệ")
            .When(x => x.FileIds != null && x.FileIds.Count > 0);

        RuleFor(x => x.GhiChu)
            .MaximumLength(1000).WithMessage("Ghi chú tối đa 1000 ký tự")
            .When(x => x.GhiChu != null);
    }
}

public class UpdateTrangThaiHoSoValidator : AbstractValidator<UpdateTrangThaiHoSoRequest>
{
    public UpdateTrangThaiHoSoValidator()
    {
        RuleFor(x => x.TrangThai)
            .NotEmpty().WithMessage("Trạng thái không được để trống")
            .Must(t => HoSoDuThauTrangThai.CoTheCapNhat.Contains(t))
            .WithMessage($"Trạng thái không hợp lệ. Các giá trị được phép: {string.Join(", ", HoSoDuThauTrangThai.CoTheCapNhat)}");
    }
}

public class AwardGoiThauValidator : AbstractValidator<AwardGoiThauRequest>
{
    public AwardGoiThauValidator()
    {
        RuleFor(x => x.HoSoDuThauId)
            .GreaterThan(0).WithMessage("HoSoDuThauId không hợp lệ");

        RuleFor(x => x.GiaTrungThau)
            .GreaterThan(0).WithMessage("Giá trúng thầu phải lớn hơn 0");
    }
}
