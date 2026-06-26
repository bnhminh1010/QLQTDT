namespace QLQTDT.Api.Models.DTOs.Workflow;

public class WorkflowVersionListItemDto
{
    public long Id { get; set; }
    public int VersionNumber { get; set; }
    public DateTime NgayTao { get; set; }
    public int? NguoiTaoId { get; set; }
    public string? NguoiTaoHoTen { get; set; }
}

public class WorkflowVersionDetailDto : WorkflowVersionListItemDto
{
    public string SnapshotData { get; set; } = null!;
}

public class WorkflowSnapshotDto
{
    public int WorkflowId { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public List<BuocSnapshotDto> BuocWorkflows { get; set; } = [];
    public List<ChuyenTiepSnapshotDto> ChuyenTiepWorkflows { get; set; } = [];
    public List<ParallelGroupSnapshotDto> ParallelGroups { get; set; } = [];
}

public class BuocSnapshotDto
{
    public int Id { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public string? NhomSongSong { get; set; }
    public bool LaBuocJoin { get; set; }
    public int ThuTu { get; set; }
    public string? NhomGiaiDoan { get; set; }
    public string? MoTa { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? DonViKyHoSoId { get; set; }
    public bool BatBuocGhiChu { get; set; }
    public bool BatBuocTaiLieu { get; set; }
    public bool BatBuocKyTruocChuyenBuoc { get; set; }
    public bool BatBuocDungSLA { get; set; }
    public int? NhanhWorkflowId { get; set; }
    public bool ChoPhepTuChoi { get; set; }
    public bool ChoPhepBoQua { get; set; }
}

public class ChuyenTiepSnapshotDto
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}

public class ParallelGroupSnapshotDto
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public int BuocTachNhanhId { get; set; }
    public string TenNhom { get; set; } = null!;
    public string DieuKienHopNhat { get; set; } = "ALL";
    public int? SoNhanhHopNhatToiThieu { get; set; }
    public int BuocSauHopNhatId { get; set; }
    public List<ParallelBranchSnapshotDto> Branches { get; set; } = [];
}

public class ParallelBranchSnapshotDto
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
    public List<int> StepIds { get; set; } = [];
}
