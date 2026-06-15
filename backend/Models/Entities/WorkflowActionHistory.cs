namespace QLQTDT.Api.Models.Entities;

public class WorkflowActionHistory
{
    public long Id { get; set; }
    public long WorkflowInstanceId { get; set; }
    public long? WorkflowStepInstanceId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? GhiChu { get; set; }
    public int NguoiThucHienId { get; set; }
    public DateTime ThoiGian { get; set; }

    // Navigation
    public WorkflowInstance? WorkflowInstance { get; set; }
    public WorkflowStepInstance? WorkflowStepInstance { get; set; }
}
