namespace QLQTDT.Api.Models.DTOs.Workflow;

public class WorkflowListItemDto
{
    public int Id { get; set; }
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public bool TrangThaiHoatDong { get; set; }
}

public class WorkflowCreateRequest
{
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
}

public class WorkflowCreateResponse
{
    public int Id { get; set; }
    public string TenWorkflow { get; set; } = null!;
}

public class WorkflowUpdateRequest
{
    public string? TenWorkflow { get; set; }
    public int? HinhThucId { get; set; }
    public bool? TrangThaiHoatDong { get; set; }
}
