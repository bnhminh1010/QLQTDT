namespace QLQTDT.Api.Models.Entities;

public class WorkflowVersionHistory
{
    public long Id { get; set; }
    public int WorkflowId { get; set; }
    public int VersionNumber { get; set; }
    public string SnapshotData { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public int? NguoiTaoId { get; set; }

    public Workflow? Workflow { get; set; }
    public NguoiDung? NguoiTao { get; set; }
}
