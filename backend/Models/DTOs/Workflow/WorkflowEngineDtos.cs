namespace QLQTDT.Api.Models.DTOs.Workflow;

public class StartWorkflowRequest
{
    public int? WorkflowId { get; set; }
    public bool AutoSuggest { get; set; }
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

public class ProcessStepRequest
{
    public string HanhDong { get; set; } = null!;
    public string? GhiChu { get; set; }
    public int? NguoiDuocGiaoId { get; set; }
    public byte[]? RowVersion { get; set; }
}

public class ProcessStepResponse
{
    public long? CurrentStepId { get; set; }
    public string? TenBuocHienTai { get; set; }
    public long? NewStepId { get; set; }
    public string? TenBuocMoi { get; set; }
    public string WorkflowTrangThai { get; set; } = null!;
    public string? GoiThauTrangThai { get; set; }
    public string HanhDong { get; set; } = null!;
    public string Message { get; set; } = null!;
    public byte[]? NewRowVersion { get; set; }
}