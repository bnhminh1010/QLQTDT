using FluentValidation;
using QLQTDT.Api.Models.DTOs.DeXuat;

namespace QLQTDT.Api.Validators;

public class CreateDeXuatValidator : AbstractValidator<CreateDeXuatDto>
{
    public CreateDeXuatValidator()
    {
        RuleFor(x => x.TieuDe)
            .NotEmpty().WithMessage("Tiêu đề không được để trống")
            .MaximumLength(500).WithMessage("Tiêu đề tối đa 500 ký tự");

        RuleFor(x => x.KhoaPhongId)
            .GreaterThan(0).WithMessage("KhoaPhongId phải lớn hơn 0");

        RuleFor(x => x.ChiTiet)
            .NotEmpty().WithMessage("Phải có ít nhất 1 vật tư trong chi tiết đề xuất");

        RuleForEach(x => x.ChiTiet).ChildRules(item =>
        {
            item.RuleFor(i => i.MaVatTu)
                .NotEmpty().WithMessage("Mã vật tư không được để trống")
                .MaximumLength(50).WithMessage("Mã vật tư tối đa 50 ký tự");

            item.RuleFor(i => i.TenVatTu)
                .NotEmpty().WithMessage("Tên vật tư không được để trống")
                .MaximumLength(255).WithMessage("Tên vật tư tối đa 255 ký tự");

            item.RuleFor(i => i.DonViTinh)
                .MaximumLength(50).WithMessage("Đơn vị tính tối đa 50 ký tự")
                .When(i => i.DonViTinh != null);

            item.RuleFor(i => i.SoLuong)
                .GreaterThan(0).WithMessage("Số lượng phải lớn hơn 0");

            item.RuleFor(i => i.DonGiaDuToan)
                .GreaterThan(0).WithMessage("Đơn giá dự toán phải lớn hơn 0");
        });
    }
}

public class UpdateDeXuatValidator : AbstractValidator<UpdateDeXuatDto>
{
    public UpdateDeXuatValidator()
    {
        RuleFor(x => x.TieuDe)
            .NotEmpty().WithMessage("Tiêu đề không được để trống")
            .MaximumLength(500).WithMessage("Tiêu đề tối đa 500 ký tự");

        RuleFor(x => x.ChiTiet)
            .NotEmpty().WithMessage("Phải có ít nhất 1 vật tư trong chi tiết đề xuất");

        RuleForEach(x => x.ChiTiet).ChildRules(item =>
        {
            item.RuleFor(i => i.MaVatTu)
                .NotEmpty().WithMessage("Mã vật tư không được để trống")
                .MaximumLength(50).WithMessage("Mã vật tư tối đa 50 ký tự");

            item.RuleFor(i => i.TenVatTu)
                .NotEmpty().WithMessage("Tên vật tư không được để trống")
                .MaximumLength(255).WithMessage("Tên vật tư tối đa 255 ký tự");

            item.RuleFor(i => i.DonViTinh)
                .MaximumLength(50).WithMessage("Đơn vị tính tối đa 50 ký tự")
                .When(i => i.DonViTinh != null);

            item.RuleFor(i => i.SoLuong)
                .GreaterThan(0).WithMessage("Số lượng phải lớn hơn 0");

            item.RuleFor(i => i.DonGiaDuToan)
                .GreaterThan(0).WithMessage("Đơn giá dự toán phải lớn hơn 0");
        });
    }
}

public class RejectDeXuatValidator : AbstractValidator<RejectDeXuatDto>
{
    public RejectDeXuatValidator()
    {
        RuleFor(x => x.LyDo)
            .NotEmpty().WithMessage("Ly do tu choi khong duoc de trong")
            .MaximumLength(1000).WithMessage("Ly do tu choi toi da 1000 ky tu");
    }
}
