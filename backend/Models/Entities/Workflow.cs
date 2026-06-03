namespace QLQTDT.Api.Models.Entities;

public class Workflow : IBaseEntity
{
    public int Id { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public HinhThucDauThau HinhThuc { get; set; } = null!;
    public bool TrangThaiHoatDong { get; set; }

    public ICollection<BuocWorkflow> BuocWorkflows { get; set; } = [];
    public ICollection<WorkflowRule> WorkflowRules { get; set; } = [];
}
