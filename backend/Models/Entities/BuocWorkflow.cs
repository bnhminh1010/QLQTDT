namespace QLQTDT.Api.Models.Entities;

public class BuocWorkflow
{
    public int Id { get; set; }
    public int? WorkflowId { get; set; }
    public Workflow? Workflow { get; set; }
    public bool WorkflowDuocChonThuCong { get; set; }
    public string? LyDoChonWorkflow { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int? VaiTroXuLyId { get; set; }
    public VaiTro? VaiTroXuLy { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public KhoaPhong? KhoaPhongXuLy { get; set; }
    public int SoNgaySLA { get; set; }
    public bool ChoPhepTuChoi { get; set; }
    public bool ChoPhepBoQua { get; set; }

    public ICollection<ChuyenTiepWorkflow> ChuyenTiepTus { get; set; } = [];
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDens { get; set; } = [];
}
