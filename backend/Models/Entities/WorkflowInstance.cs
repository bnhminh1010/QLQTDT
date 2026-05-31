namespace QLQTDT.Api.Models.Entities;

public class WorkflowInstance
{
    public long Id { get; set; }
    public long GoiThauId { get; set; }
    public int WorkflowId { get; set; }
    public int? BuocHienTaiId { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }

    public Workflow? Workflow { get; set; }
}
