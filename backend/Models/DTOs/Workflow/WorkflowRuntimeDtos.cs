namespace QLQTDT.Api.Models.DTOs.Workflow;

public class PendingTaskDto
{
    public long StepInstanceId { get; set; }
    public long WorkflowInstanceId { get; set; }
    public int GoiThauId { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public DateTime NgayGiao { get; set; }
    public DateTime? HanXuLy { get; set; }
    public bool QuaHan { get; set; }
}

public class OverdueTaskDto
{
    public long WorkflowInstanceId { get; set; }
    public long StepInstanceId { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public int? NguoiXuLyId { get; set; }
    public DateTime? HanXuLy { get; set; }
    public int SoNgayQuaHan { get; set; }
}

public class WorkflowInstanceDetailDto
{
    public long Id { get; set; }
    public int GoiThauId { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public int? BuocHienTaiId { get; set; }
    public string? TenBuocHienTai { get; set; }
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public List<WorkflowActionHistoryDto> LichSuHanhDong { get; set; } = [];
}

public class WorkflowStepInstanceDetailDto
{
    public long Id { get; set; }
    public int BuocWorkflowId { get; set; }
    public string TenBuoc { get; set; } = null!;
    public int SoThuTu { get; set; }
    public string TrangThai { get; set; } = null!;
    public int? NguoiXuLyId { get; set; }
    public string? TenNguoiXuLy { get; set; }
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public List<WorkflowAssignmentDto> Assignments { get; set; } = [];
}

public class WorkflowActionHistoryDto
{
    public long Id { get; set; }
    public string HanhDong { get; set; } = null!;
    public int NguoiThucHienId { get; set; }
    public string? TenNguoiThucHien { get; set; }
    public string? GhiChu { get; set; }
    public DateTime ThoiGian { get; set; }
}
