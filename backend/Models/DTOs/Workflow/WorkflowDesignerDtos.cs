namespace QLQTDT.Api.Models.DTOs.Workflow;

/// <summary>Template summary for list view</summary>
public class WorkflowTemplateSummaryDto
{
    public int Id { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public string? LoaiHinhDauThau { get; set; }
    public string? MoTaNgan { get; set; }
    public int SoBuoc { get; set; }
}

/// <summary>Template preview detail</summary>
public class WorkflowTemplatePreviewDto
{
    public int Id { get; set; }
    public string TenWorkflow { get; set; } = null!;
    public string? LoaiHinhDauThau { get; set; }
    public List<BuocWorkflowListItemDto> Steps { get; set; } = [];
    public List<ChuyenTiepWorkflowListItemDto> Transitions { get; set; } = [];
    public List<ParallelGroupDto> ParallelGroups { get; set; } = [];
}

/// <summary>Generate workflow from template request</summary>
public class GenerateWorkflowFromTemplateRequest
{
    public int TemplateWorkflowId { get; set; }
    public string TenWorkflow { get; set; } = null!;
    public string? LoaiHinhDauThau { get; set; }
}

/// <summary>Save a full workflow design in one request</summary>
public class WorkflowDesignSaveRequest
{
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public string? LoaiHinhDauThau { get; set; }
    public List<WorkflowDesignStepRequest> Steps { get; set; } = [];
    public List<WorkflowDesignParallelGroupRequest> ParallelGroups { get; set; } = [];
}

public class WorkflowDesignStepRequest
{
    public string Id { get; set; } = null!;
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int ThuTu { get; set; }
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public string? NhomSongSong { get; set; }
    public bool LaBuocJoin { get; set; }
    public string? NhomGiaiDoan { get; set; }
    public string? MoTa { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? DonViKyHoSoId { get; set; }
    public bool BatBuocGhiChu { get; set; }
    public bool BatBuocTaiLieu { get; set; }
    public bool BatBuocKyTruocChuyenBuoc { get; set; }
    public bool BatBuocDungSLA { get; set; }
    public string? NhanhId { get; set; }
    public string? HuongXuLyKhongDuyet { get; set; }
    public bool ChoPhepTuChoi { get; set; } = true;
    public bool ChoPhepBoQua { get; set; }
}

public class WorkflowDesignParallelGroupRequest
{
    public string Id { get; set; } = null!;
    public string BuocTachNhanhId { get; set; } = null!;
    public string TenNhom { get; set; } = null!;
    public string DieuKienHopNhat { get; set; } = "ALL";
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public string BuocSauHopNhatId { get; set; } = null!;
    public List<WorkflowDesignParallelBranchRequest> Branches { get; set; } = [];
}

public class WorkflowDesignParallelBranchRequest
{
    public string Id { get; set; } = null!;
    public string MaNhanh { get; set; } = null!;
    public string TenNhanh { get; set; } = null!;
    public int ThuTu { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public decimal ThoiHanNgay { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public List<string> StepIds { get; set; } = [];
}

/// <summary>Insert step after another step</summary>
public class InsertStepAfterRequest
{
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = "THUC_HIEN";
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public bool CreateDefaultTransition { get; set; } = true;
    public bool BatBuocGhiChu { get; set; }
    public bool BatBuocTaiLieu { get; set; }
    public bool BatBuocKyTruocChuyenBuoc { get; set; } = true;
    public bool BatBuocDungSLA { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? DonViKyHoSoId { get; set; }
}

/// <summary>Clone step request</summary>
public class CloneStepRequest
{
    public string MaBuocMoi { get; set; } = null!;
    public string TenBuocMoi { get; set; } = null!;
}

/// <summary>Reorder steps request</summary>
public class ReorderStepsRequest
{
    public List<StepOrderDto> Steps { get; set; } = [];
}

public class StepOrderDto
{
    public int Id { get; set; }
    public int ThuTu { get; set; }
}

/// <summary>Parallel group DTO</summary>
public class ParallelGroupDto
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public int BuocTachNhanhId { get; set; }
    public string TenNhom { get; set; } = null!;
    public string DieuKienHopNhat { get; set; } = "ALL";
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public int BuocSauHopNhatId { get; set; }
    public List<ParallelBranchDto> Branches { get; set; } = [];
}

public class ParallelGroupCreateRequest
{
    public int BuocTachNhanhId { get; set; }
    public string TenNhom { get; set; } = null!;
    public string DieuKienHopNhat { get; set; } = "ALL";
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public int BuocSauHopNhatId { get; set; }
}

public class ParallelGroupUpdateRequest
{
    public string? TenNhom { get; set; }
    public string? DieuKienHopNhat { get; set; }
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public int? BuocSauHopNhatId { get; set; }
}

/// <summary>Branch DTO</summary>
public class ParallelBranchDto
{
    public int Id { get; set; }
    public int NhomNhanhWorkflowId { get; set; }
    public string MaNhanh { get; set; } = null!;
    public string TenNhanh { get; set; } = null!;
    public int ThuTu { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public decimal ThoiHanNgay { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public int BuocDauTienId { get; set; }
}

public class ParallelBranchCreateRequest
{
    public string MaNhanh { get; set; } = null!;
    public string TenNhanh { get; set; } = null!;
    public int ThuTu { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public decimal ThoiHanNgay { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public int BuocDauTienId { get; set; }
}

public class ParallelBranchUpdateRequest
{
    public string? TenNhanh { get; set; }
    public int? ThuTu { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public decimal? ThoiHanNgay { get; set; }
    public string? LoaiHan { get; set; }
    public int? BuocDauTienId { get; set; }
}
