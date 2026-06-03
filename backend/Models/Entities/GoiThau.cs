namespace QLQTDT.Api.Models.Entities;

public static class GoiThauTrangThai
{
    public const string DU_THAO = "DU_THAO";
    public const string DANG_XU_LY = "DANG_XU_LY";
    public const string HOAN_THANH = "HOAN_THANH";
    public const string HUY_BO = "HUY_BO";

    public static readonly string[] All = [DU_THAO, DANG_XU_LY, HOAN_THANH, HUY_BO];
}

public class GoiThau : IBaseEntity
{
    public int Id { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? DeXuatId { get; set; }
    public decimal? GiaGoiThau { get; set; }
    public string TrangThai { get; set; } = GoiThauTrangThai.DU_THAO;
    public bool TrangThaiHoatDong { get; set; } = true;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
}
