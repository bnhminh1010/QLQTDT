namespace QLQTDT.Api.Models.Entities;

public static class LoaiTaiLieu
{
    public const string HOSO_DUTHAU = "HOSO_DUTHAU";
    public const string HOP_DONG = "HOP_DONG";
    public const string BAO_CAO = "BAO_CAO";
    public const string KHAC = "KHAC";

    public static readonly string[] All = [HOSO_DUTHAU, HOP_DONG, BAO_CAO, KHAC];
}

public class TaiLieuHoSo : IBaseEntity, ISoftDeletable
{
    public int Id { get; set; }
    public int? GoiThauId { get; set; }
    public string TenFile { get; set; } = null!;
    public string DuongDanFtp { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public int? NguoiUploadId { get; set; }
    public DateTime NgayTao { get; set; }
    public bool DaXoa { get; set; } = false;
}
