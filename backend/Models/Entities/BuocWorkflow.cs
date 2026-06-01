namespace QLQTDT.Api.Models.Entities;

public class BuocWorkflow : IBaseEntity
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int? VaiTroXuLyId { get; set; }
    public int? KhoaPhongXuLyId { get; set; }
    public int SoNgaySLA { get; set; }
    public bool ChoPhepTuChoi { get; set; } = true;
    public bool ChoPhepBoQua { get; set; }

    public Workflow? Workflow { get; set; }
    public VaiTro? VaiTroXuLy { get; set; }
    public KhoaPhong? KhoaPhongXuLy { get; set; }
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDi { get; set; } = [];
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDen { get; set; } = [];
}
