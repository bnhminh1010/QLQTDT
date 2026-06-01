namespace QLQTDT.Api.Models.DTOs.Workflow;

public class BuocWorkflowListItemDto
{
    public int Id { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int? VaiTroXuLyId { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public bool ChoPhepBoQua { get; set; }
    public int SoNgaySLA { get; set; }
}

public class BuocWorkflowCreateRequest
{
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = "APPROVAL";
    public int? VaiTroXuLyId { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public bool ChoPhepBoQua { get; set; }
    public int SoNgaySLA { get; set; }
}

public class BuocWorkflowUpdateRequest
{
    public string? TenBuoc { get; set; }
    public string? LoaiBuoc { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public bool? ChoPhepBoQua { get; set; }
    public int? SoNgaySLA { get; set; }
}

public class ChuyenTiepWorkflowListItemDto
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}

public class ChuyenTiepWorkflowCreateRequest
{
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}
