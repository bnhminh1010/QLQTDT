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

    public static readonly string[] HopDongTypes = [HOP_DONG, PHU_LUC_HOP_DONG, NGHIEM_THU, QUYET_TOAN];
}

public static class DocumentPhase
{
    public const string Processing = "Processing";
    public const string Approval = "Approval";

    public static readonly string[] All = [Processing, Approval];
}

public class TaiLieuHoSo : IBaseEntity, ISoftDeletable
{
    public int Id { get; set; }
    public int? GoiThauId { get; set; }
    public long? WorkflowStepInstanceId { get; set; }
    public int? HoSoDuThauId { get; set; }
    public int? HopDongId { get; set; }
    public string TenFile { get; set; } = null!;
    public string DuongDanFtp { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string? DocumentPhase { get; set; }
    public string ContentType { get; set; } = null!;
    public int? NguoiUploadId { get; set; }
    public DateTime NgayTao { get; set; }
    public bool DaXoa { get; set; } = false;
}
