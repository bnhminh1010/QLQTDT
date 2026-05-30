namespace QLQTDT.Api.Models.DTOs.Workflow;

public class WorkflowListItemDto
{
    public int Id { get; set; }
    public string TenWorkflow { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? HinhThucDauThauId { get; set; }
    public bool TrangThaiHoatDong { get; set; }
}

public class WorkflowCreateRequest
{
    public string TenWorkflow { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? HinhThucDauThauId { get; set; }
}

public class WorkflowCreateResponse
{
    public int Id { get; set; }
    public string TenWorkflow { get; set; } = null!;
}

public class WorkflowUpdateRequest
{
    public string? TenWorkflow { get; set; }
    public string? MoTa { get; set; }
    public int? HinhThucDauThauId { get; set; }
    public bool? TrangThaiHoatDong { get; set; }
}
