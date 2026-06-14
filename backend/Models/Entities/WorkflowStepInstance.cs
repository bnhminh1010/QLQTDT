namespace QLQTDT.Api.Models.Entities;

public class WorkflowStepInstance
{
    public long Id { get; set; }
    public long WorkflowInstanceId { get; set; }
    public int BuocWorkflowId { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public int? NguoiXuLyId { get; set; }
    public string? GhiChu { get; set; }
    public byte[]? RowVersion { get; set; }

    // Navigation
    public WorkflowInstance? WorkflowInstance { get; set; }
    public BuocWorkflow? BuocWorkflow { get; set; }
    public NguoiDung? NguoiXuLy { get; set; }
    public ICollection<WorkflowAssignment> WorkflowAssignments { get; set; } = [];
}
