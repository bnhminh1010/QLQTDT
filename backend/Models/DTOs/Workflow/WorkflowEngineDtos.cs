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
    public string? PhaHienTai { get; set; }
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

    /// <summary>Step instance ID for multi-step (branch) context. Required when multiple active steps exist.</summary>
    public long? WorkflowStepInstanceId { get; set; }

    /// <summary>Tài liệu đính kèm (ghi chú văn bản, không phải file binary).</summary>
    public string? TaiLieuDinhKem { get; set; }

    /// <summary>Tên người ký duyệt — resolve ra NguoiKyDuyetId ở backend.</summary>
    public string? TenNguoiKyDuyet { get; set; }
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

    // Branch-aware fields
    public bool IsSplit { get; set; }
    public bool IsMerge { get; set; }
    public bool IsAwaitingMerge { get; set; }
    public List<long> ActiveStepIds { get; set; } = [];
    public int? TongSoNhanh { get; set; }
    public int? SoNhanhHoanThanh { get; set; }

    // 2-pha response fields
    public string? PhaHienTai { get; set; }
    public bool ChoKyDuyet { get; set; }
    public int? NguoiXuLyId { get; set; }
    public string? TenNguoiXuLy { get; set; }
    public DateTime? NgayXuLy { get; set; }
    public int? NguoiKyDuyetId { get; set; }
    public string? TenNguoiKyDuyet { get; set; }
    public DateTime? NgayKyDuyet { get; set; }
    public string? KetQua { get; set; }
    public string? LyDoKhongDuyet { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public int TongSoBuoc { get; set; }
    public string? TinhTrangTienDo { get; set; }
    public DateTime? HanXuLy { get; set; }
    public bool? QuaHan { get; set; }
}

/// <summary>
/// Workflow state DTO cho endpoint GET /api/goi-thau/{id}/workflow
/// </summary>
public class WorkflowStateDto
{
    public long? WorkflowInstanceId { get; set; }
    public string? WorkflowTen { get; set; }
    public string WorkflowTrangThai { get; set; } = null!;
    public int? BuocHienTaiId { get; set; }
    public string? TenBuocHienTai { get; set; }
    public string? PhaHienTai { get; set; }
    public DateTime NgayBatDau { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public int TongSoBuoc { get; set; }
    public string? TinhTrangTienDo { get; set; }  // "DUNG_TIEN_DO" | "SAP_QUA_HAN" | "QUA_HAN"

    /// <summary>Collection of currently active step instances. Multiple when in parallel branches.</summary>
    public List<CurrentStepDto> CurrentSteps { get; set; } = [];

    public List<WorkflowStepStateDto> Steps { get; set; } = [];
}

/// <summary>Lightweight current-step DTO for parallel-aware state response.</summary>
public class CurrentStepDto
{
    public long StepInstanceId { get; set; }
    public int BuocWorkflowId { get; set; }
    public string TenBuoc { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public string PhaHienTai { get; set; } = null!;
    public long? WorkflowInstanceId { get; set; }
    public string? TenNhanh { get; set; }
    public string? HanhDongChoPhep { get; set; }
    public DateTime? HanXuLy { get; set; }
    public string? TinhTrangTienDo { get; set; }
}

public class WorkflowStepStateDto
{
    public long Id { get; set; }
    public string TenBuoc { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public string? PhaHienTai { get; set; }
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public string? TenNguoiXuLy { get; set; }
    public DateTime? NgayXuLy { get; set; }
    public string? TenNguoiKyDuyet { get; set; }
    public DateTime? NgayKyDuyet { get; set; }
    public string? KetQua { get; set; }
    public string? LyDoKhongDuyet { get; set; }
    public string? TenVaiTroXuLy { get; set; }
    public string? TenVaiTroKyDuyet { get; set; }
    public DateTime? HanXuLy { get; set; }
    public bool? QuaHan { get; set; }
    public string? TinhTrangTienDo { get; set; }
    public byte[]? RowVersion { get; set; }
}

// BA user-driven: Duyệt bước (POST /duyet)
public class DuyetStepRequest
{
    public string? TaiLieuDinhKem { get; set; }
    public string? GhiChu { get; set; }
    public byte[]? RowVersion { get; set; }
}

// BA user-driven: Không duyệt (POST /khong-duyet) — GhiChu bắt buộc
public class KhongDuyetStepRequest
{
    public string? TaiLieuDinhKem { get; set; }
    public string GhiChu { get; set; } = null!;
    public byte[]? RowVersion { get; set; }
}

// BA user-driven: Trả về bước trước (POST /tra-ve) — GhiChu bắt buộc
public class TraVeStepRequest
{
    public string GhiChu { get; set; } = null!;
    public string? TaiLieuDinhKem { get; set; }
    public byte[]? RowVersion { get; set; }
}
