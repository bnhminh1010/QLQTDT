namespace QLQTDT.Api.Models.Entities;

public class NhomNhanhWorkflow
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public int BuocTachNhanhId { get; set; }
    public string TenNhom { get; set; } = null!;
    public string DieuKienHopNhat { get; set; } = "ALL";    // ALL / ANY / COUNT
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public int BuocSauHopNhatId { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }

    // Navigation
    public Workflow? Workflow { get; set; }
    public BuocWorkflow? BuocTachNhanh { get; set; }
    public BuocWorkflow? BuocSauHopNhat { get; set; }
    public ICollection<NhanhWorkflow> Nhanhs { get; set; } = [];
}
