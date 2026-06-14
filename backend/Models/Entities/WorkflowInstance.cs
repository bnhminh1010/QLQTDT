namespace QLQTDT.Api.Models.Entities;

public class WorkflowInstance
{
    public long Id { get; set; }
    public int GoiThauId { get; set; }
    public int WorkflowId { get; set; }
    public int? BuocHienTaiId { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public byte[]? RowVersion { get; set; }

    // Navigation
    public Workflow? Workflow { get; set; }
    public GoiThau? GoiThau { get; set; }
    public BuocWorkflow? BuocHienTai { get; set; }
    public ICollection<WorkflowStepInstance> WorkflowStepInstances { get; set; } = [];
    public ICollection<WorkflowActionHistory> WorkflowActionHistories { get; set; } = [];
}
