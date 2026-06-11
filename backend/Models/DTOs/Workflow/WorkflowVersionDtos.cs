namespace QLQTDT.Api.Models.DTOs.Workflow;

public class WorkflowVersionListItemDto
{
    public long Id { get; set; }
    public int VersionNumber { get; set; }
    public DateTime NgayTao { get; set; }
    public int? NguoiTaoId { get; set; }
    public string? NguoiTaoHoTen { get; set; }
}

public class WorkflowVersionDetailDto : WorkflowVersionListItemDto
{
    public string SnapshotData { get; set; } = null!;
}

public class WorkflowSnapshotDto
{
    public int WorkflowId { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public List<BuocSnapshotDto> BuocWorkflows { get; set; } = [];
    public List<ChuyenTiepSnapshotDto> ChuyenTiepWorkflows { get; set; } = [];
}

public class BuocSnapshotDto
{
    public int Id { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int? VaiTroXuLyId { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public int SoNgaySLA { get; set; }
    public bool ChoPhepTuChoi { get; set; }
    public bool ChoPhepBoQua { get; set; }
}

public class ChuyenTiepSnapshotDto
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}
