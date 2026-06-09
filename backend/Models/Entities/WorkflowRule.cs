namespace QLQTDT.Api.Models.Entities;

public class WorkflowRule
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;
    public string? DieuKien { get; set; }
    public int DoUuTien { get; set; }
    public bool ChoPhepTuChon { get; set; }
}
