namespace QLQTDT.Api.Models.Entities;

public static class GoiThauTrangThai
{
    public const string DU_THAO = "DU_THAO";
    public const string DANG_XU_LY = "DANG_XU_LY";
    public const string HOAN_THANH = "HOAN_THANH";
    public const string HUY_BO = "HUY_BO";
    public const string QUA_HAN = "QUA_HAN";
    public const string DA_CHON_NHA_THAU = "DA_CHON_NHA_THAU";

    public static readonly string[] All = [DU_THAO, DANG_XU_LY, HOAN_THANH, HUY_BO, QUA_HAN, DA_CHON_NHA_THAU];
}

public static class WorkflowHanhDong
{
    public const string START = "START";
    public const string APPROVE = "APPROVE";
    public const string REJECT = "REJECT";
    public const string ROLLBACK = "ROLLBACK";
    public const string SKIP = "SKIP";
    public const string REASSIGN = "REASSIGN";
    public const string RETRY = "RETRY";

    public const string DUYET = "DUYET";
    public const string KHONG_DUYET = "KHONG_DUYET";
    public const string TRA_VE = "TRA_VE";
}

public static class WorkflowTrangThai
{
    public const string ACTIVE = "ACTIVE";
    public const string COMPLETED = "COMPLETED";
    public const string CANCELLED = "CANCELLED";
    public const string REJECTED = "REJECTED";

    public static readonly string[] All = [ACTIVE, COMPLETED, CANCELLED, REJECTED];
}

public static class WorkflowStepTrangThai
{
    public const string DANG_XU_LY = "DANG_XU_LY";
    public const string CHO_DUYET = "CHO_DUYET";
    public const string HOAN_TAT = "HOAN_TAT";
    public const string TRA_VE = "TRA_VE";
    public const string SKIPPED = "SKIPPED";
    public const string YEU_CAU_KIEM_TRA = "YEU_CAU_KIEM_TRA";
    public const string TRE_HAN = "TRE_HAN";

    public const string CHO_LAP_HO_SO = "CHO_LAP_HO_SO";
    public const string CHO_KY_DUYET = "CHO_KY_DUYET";

    public const string PENDING = DANG_XU_LY;
    public const string APPROVED = HOAN_TAT;
    public const string REJECTED = TRA_VE;
    public const string ROLLED_BACK = TRA_VE;

    public static readonly string[] All = [DANG_XU_LY, CHO_DUYET, HOAN_TAT, TRA_VE, SKIPPED, YEU_CAU_KIEM_TRA, TRE_HAN, CHO_LAP_HO_SO, CHO_KY_DUYET];
}

public class GoiThau : IBaseEntity
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? DeXuatId { get; set; }
    public decimal? NganSach { get; set; }
    public int? KhoaPhongId { get; set; }
    public int? NguoiTaoId { get; set; }
    public int? HinhThucId { get; set; }
    public int? WorkflowId { get; set; }
    public string TrangThai { get; set; } = GoiThauTrangThai.DU_THAO;
    public bool TrangThaiHoatDong { get; set; } = true;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }

    /// <summary>Nguồn vốn: Ngân sách Nhà nước, Ngân sách BV, Tự chủ tài chính, Nguồn khác</summary>
    public string? NguonVon { get; set; }

    /// <summary>Loại gói thầu: Hàng hóa, Dịch vụ tư vấn, Dịch vụ phi tư vấn, Xây lắp</summary>
    public string? LoaiGoiThau { get; set; }

    /// <summary>Căn cứ/lý do áp dụng quy trình rút gọn.</summary>
    public string? CanCuApDungRutGon { get; set; }

    /// <summary>JSON array theo dõi: ["Khoa/Phòng mua sắm","BCN"]</summary>
    public string? TheoDoi { get; set; }

    // Navigation properties
    public HinhThucDauThau? HinhThuc { get; set; }
}
