namespace QLQTDT.Api.Models.Entities;

public static class GoiThauTrangThai
{
    public const string DU_THAO = "DU_THAO";
    public const string DANG_XU_LY = "DANG_XU_LY";
    public const string HOAN_THANH = "HOAN_THANH";
    public const string HUY_BO = "HUY_BO";

    public static readonly string[] All = [DU_THAO, DANG_XU_LY, HOAN_THANH, HUY_BO];
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
    public const string PENDING = "PENDING";
    public const string APPROVED = "APPROVED";
    public const string REJECTED = "REJECTED";
    public const string SKIPPED = "SKIPPED";
    public const string ROLLED_BACK = "ROLLED_BACK";

    public static readonly string[] All = [PENDING, APPROVED, REJECTED, SKIPPED, ROLLED_BACK];
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
}
