namespace QLQTDT.Api.Models.Entities;

public class WorkflowAssignment
{
    public long Id { get; set; }
    public long WorkflowStepInstanceId { get; set; }
    public int NguoiDuocGiaoId { get; set; }
    public bool DaXuLy { get; set; }
    public DateTime NgayGiao { get; set; }
    public DateTime? NgayXuLy { get; set; }
    public string? GhiChu { get; set; }

    // Navigation
    public WorkflowStepInstance? WorkflowStepInstance { get; set; }
    public NguoiDung? NguoiDuocGiao { get; set; }
}
