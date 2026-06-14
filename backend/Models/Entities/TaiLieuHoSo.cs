namespace QLQTDT.Api.Models.Entities;

public static class LoaiTaiLieu
{
    public const string HOSO_DUTHAU = "HOSO_DUTHAU";
    public const string HOP_DONG = "HOP_DONG";
    public const string PHU_LUC_HOP_DONG = "PHU_LUC_HOP_DONG";
    public const string NGHIEM_THU = "NGHIEM_THU";
    public const string QUYET_TOAN = "QUYET_TOAN";
    public const string BAO_CAO = "BAO_CAO";
    public const string HO_SO_NANG_LUC = "HO_SO_NANG_LUC";
    public const string KHAC = "KHAC";

    public static readonly string[] All = [HOSO_DUTHAU, HOP_DONG, PHU_LUC_HOP_DONG, NGHIEM_THU, QUYET_TOAN, BAO_CAO, HO_SO_NANG_LUC, KHAC];

    // Các loại tài liệu hợp lệ khi đính kèm vào hợp đồng
    public static readonly string[] HopDongTypes = [HOP_DONG, PHU_LUC_HOP_DONG, NGHIEM_THU, QUYET_TOAN];
}

public class TaiLieuHoSo : IBaseEntity, ISoftDeletable
{
    public int Id { get; set; }
    public int? GoiThauId { get; set; }
    public int? HoSoDuThauId { get; set; }
    public int? HopDongId { get; set; }
    public string TenFile { get; set; } = null!;
    public string DuongDanFtp { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public int? NguoiUploadId { get; set; }
    public DateTime NgayTao { get; set; }
    public bool DaXoa { get; set; } = false;
}
