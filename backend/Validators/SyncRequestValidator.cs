using FluentValidation;
using QLQTDT.Api.Models.DTOs.Integration;

namespace QLQTDT.Api.Validators;

public class SyncRequestValidator : AbstractValidator<SyncRequest>
{
    public SyncRequestValidator()
    {
        RuleFor(x => x.HeThong).NotEmpty().WithMessage("Hệ thống không được để trống");
        RuleFor(x => x.LoaiDongBo).NotEmpty().WithMessage("Loại đồng bộ không được để trống");
    }
}
