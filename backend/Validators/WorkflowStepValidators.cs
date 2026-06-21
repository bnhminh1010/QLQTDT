using FluentValidation;
using QLQTDT.Api.Models.DTOs.Workflow;

namespace QLQTDT.Api.Validators;

public class BuocWorkflowCreateRequestValidator : AbstractValidator<BuocWorkflowCreateRequest>
{
    public BuocWorkflowCreateRequestValidator()
    {
        RuleFor(x => x.MaBuoc)
            .NotEmpty().WithMessage("MaBuoc khong duoc de trong")
            .MaximumLength(50).WithMessage("MaBuoc toi da 50 ky tu");

        RuleFor(x => x.TenBuoc)
            .NotEmpty().WithMessage("TenBuoc khong duoc de trong")
            .MaximumLength(255).WithMessage("TenBuoc toi da 255 ky tu");

        RuleFor(x => x.LoaiBuoc)
            .NotEmpty().WithMessage("LoaiBuoc khong duoc de trong")
            .MaximumLength(50).WithMessage("LoaiBuoc toi da 50 ky tu");

        RuleFor(x => x.SoNgayLapHoSo)
            .GreaterThanOrEqualTo(0).WithMessage("SoNgayLapHoSo phai >= 0");

        RuleFor(x => x.SoNgayXuLy)
            .GreaterThanOrEqualTo(0).WithMessage("SoNgayXuLy phai >= 0");

        RuleFor(x => x.LoaiHan)
            .NotEmpty().WithMessage("LoaiHan khong duoc de trong")
            .Must(v => v == "BAT_BUOC" || v == "CANH_BAO")
            .WithMessage("LoaiHan phai la 'BAT_BUOC' hoac 'CANH_BAO'");

        RuleFor(x => x.NhomSongSong)
            .MaximumLength(50).WithMessage("NhomSongSong toi da 50 ky tu");

        RuleFor(x => x.NhomGiaiDoan)
            .MaximumLength(100).WithMessage("NhomGiaiDoan toi da 100 ky tu");

        RuleFor(x => x.MoTa)
            .MaximumLength(1000).WithMessage("MoTa toi da 1000 ky tu");

        When(x => x.LaBuocJoin, () =>
        {
            RuleFor(x => x.NhomSongSong)
                .NotEmpty().WithMessage("NhomSongSong la bat buoc khi LaBuocJoin = true");
        });
    }
}

public class BuocWorkflowUpdateRequestValidator : AbstractValidator<BuocWorkflowUpdateRequest>
{
    public BuocWorkflowUpdateRequestValidator()
    {
        When(x => x.TenBuoc != null, () =>
        {
            RuleFor(x => x.TenBuoc)
                .NotEmpty().WithMessage("TenBuoc khong duoc de trong")
                .MaximumLength(255).WithMessage("TenBuoc toi da 255 ky tu");
        });

        When(x => x.LoaiBuoc != null, () =>
        {
            RuleFor(x => x.LoaiBuoc)
                .NotEmpty().WithMessage("LoaiBuoc khong duoc de trong")
                .MaximumLength(50).WithMessage("LoaiBuoc toi da 50 ky tu");
        });

        When(x => x.SoNgayLapHoSo.HasValue, () =>
        {
            RuleFor(x => x.SoNgayLapHoSo)
                .GreaterThanOrEqualTo(0).WithMessage("SoNgayLapHoSo phai >= 0");
        });

        When(x => x.SoNgayXuLy.HasValue, () =>
        {
            RuleFor(x => x.SoNgayXuLy)
                .GreaterThanOrEqualTo(0).WithMessage("SoNgayXuLy phai >= 0");
        });

        When(x => x.LoaiHan != null, () =>
        {
            RuleFor(x => x.LoaiHan)
                .Must(v => v == "BAT_BUOC" || v == "CANH_BAO")
                .WithMessage("LoaiHan phai la 'BAT_BUOC' hoac 'CANH_BAO'");
        });

        When(x => x.NhomSongSong != null, () =>
        {
            RuleFor(x => x.NhomSongSong)
                .MaximumLength(50).WithMessage("NhomSongSong toi da 50 ky tu");
        });

        When(x => x.NhomGiaiDoan != null, () =>
        {
            RuleFor(x => x.NhomGiaiDoan)
                .MaximumLength(100).WithMessage("NhomGiaiDoan toi da 100 ky tu");
        });

        When(x => x.MoTa != null, () =>
        {
            RuleFor(x => x.MoTa)
                .MaximumLength(1000).WithMessage("MoTa toi da 1000 ky tu");
        });

        When(x => x.LaBuocJoin == true, () =>
        {
            RuleFor(x => x.NhomSongSong)
                .NotEmpty().WithMessage("NhomSongSong la bat buoc khi LaBuocJoin = true");
        });
    }
}

public class ChuyenTiepWorkflowCreateRequestValidator : AbstractValidator<ChuyenTiepWorkflowCreateRequest>
{
    public ChuyenTiepWorkflowCreateRequestValidator()
    {
        RuleFor(x => x.TuBuocId)
            .GreaterThan(0).WithMessage("TuBuocId phai lon hon 0");

        RuleFor(x => x.DenBuocId)
            .GreaterThan(0).WithMessage("DenBuocId phai lon hon 0");

        RuleFor(x => x.HanhDong)
            .NotEmpty().WithMessage("HanhDong khong duoc de trong")
            .MaximumLength(50).WithMessage("HanhDong toi da 50 ky tu");

        RuleFor(x => x)
            .Must(x => x.TuBuocId != x.DenBuocId)
            .WithMessage("TuBuocId va DenBuocId phai khac nhau");

        // Designer validation rules
        RuleFor(x => x.DieuKienKichHoat)
            .Must(v => v == "LUON" || v == "THEO_KET_QUA" || v == "THEO_VAI_TRO")
            .WithMessage("DieuKienKichHoat phai la 'LUON', 'THEO_KET_QUA' hoac 'THEO_VAI_TRO'");

        When(x => x.DieuKienKichHoat == "THEO_KET_QUA", () =>
        {
            RuleFor(x => x.KetQuaApDung)
                .NotEmpty().WithMessage("KetQuaApDung la bat buoc khi DieuKienKichHoat = THEO_KET_QUA");
        });

        When(x => x.DieuKienKichHoat == "THEO_VAI_TRO", () =>
        {
            RuleFor(x => x.VaiTroApDungId)
                .GreaterThan(0).WithMessage("VaiTroApDungId la bat buoc khi DieuKienKichHoat = THEO_VAI_TRO");
        });

        RuleFor(x => x.HuongXuLyKhongDuyet)
            .Must(v => string.IsNullOrEmpty(v) || v == "TRA_VE_BUOC_TRUOC" || v == "DUNG_QUY_TRINH")
            .WithMessage("HuongXuLyKhongDuyet phai la 'TRA_VE_BUOC_TRUOC' hoac 'DUNG_QUY_TRINH'");
    }
}
