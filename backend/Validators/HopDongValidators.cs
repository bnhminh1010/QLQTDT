using FluentValidation;
using QLQTDT.Api.Models.DTOs.HopDong;

namespace QLQTDT.Api.Validators;

public class CreateHopDongValidator : AbstractValidator<CreateHopDongRequest>
{
    public CreateHopDongValidator()
    {
        RuleFor(x => x.GoiThauId)
            .GreaterThan(0).WithMessage("GoiThauId không hợp lệ");

        RuleFor(x => x.SoHopDong)
            .NotEmpty().WithMessage("Số hợp đồng không được để trống")
            .MaximumLength(100).WithMessage("Số hợp đồng tối đa 100 ký tự");

        RuleFor(x => x.TongGiaTri)
            .GreaterThan(0).WithMessage("Tổng giá trị hợp đồng phải lớn hơn 0");

        RuleFor(x => x.NgayKy)
            .NotEmpty().WithMessage("Ngày ký không được để trống");

        // FileIds không được null nếu có gửi — nhưng có thể là list rỗng
        RuleFor(x => x.FileIds)
            .NotNull().WithMessage("FileIds không được null");

        RuleFor(x => x.FileIds)
            .Must(ids => ids!.All(id => id > 0)).WithMessage("FileIds chứa giá trị không hợp lệ")
            .When(x => x.FileIds is { Count: > 0 });
    }
}
