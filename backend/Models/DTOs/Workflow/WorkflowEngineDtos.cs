namespace QLQTDT.Api.Models.DTOs.Workflow;

public class StartWorkflowRequest
{
    public int WorkflowId { get; set; }
}

public class WorkflowInstanceDto
{
    public long Id { get; set; }
    public int GoiThauId { get; set; }
    public string TrangThai { get; set; } = null!;
    public int? BuocHienTaiId { get; set; }
    public string? TenBuocHienTai { get; set; }
    public DateTime NgayBatDau { get; set; }
    public List<WorkflowStepInstanceDto> Steps { get; set; } = [];
}

public class WorkflowStepInstanceDto
{
    public long Id { get; set; }
    public int BuocWorkflowId { get; set; }
    public string TenBuoc { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public DateTime NgayBatDau { get; set; }
    public List<WorkflowAssignmentDto> Assignments { get; set; } = [];
}

public class WorkflowAssignmentDto
{
    public long Id { get; set; }
    public int NguoiDuocGiaoId { get; set; }
    public string? TenNguoiDuocGiao { get; set; }
    public bool DaXuLy { get; set; }
}
