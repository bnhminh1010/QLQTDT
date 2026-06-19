namespace QLQTDT.Api.Models.DTOs.Workflow;

public class BuocWorkflowListItemDto
{
    public int Id { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;

    // 2-pha fields
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public string? NhomSongSong { get; set; }
    public bool LaBuocJoin { get; set; }

    public bool ChoPhepTuChoi { get; set; }
    public bool ChoPhepBoQua { get; set; }
}

public class BuocWorkflowCreateRequest
{
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = "APPROVAL";

    // 2-pha fields
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";
    public string? NhomSongSong { get; set; }
    public bool LaBuocJoin { get; set; }

    public bool ChoPhepTuChoi { get; set; } = true;
    public bool ChoPhepBoQua { get; set; }
}

public class BuocWorkflowUpdateRequest
{
    public string? TenBuoc { get; set; }
    public string? LoaiBuoc { get; set; }

    // 2-pha fields
    public int? VaiTroXuLyHoSoId { get; set; }
    public int? SoNgayLapHoSo { get; set; }
    public int? VaiTroKyDuyetId { get; set; }
    public int? SoNgayXuLy { get; set; }
    public string? LoaiHan { get; set; }
    public string? NhomSongSong { get; set; }
    public bool? LaBuocJoin { get; set; }

    public bool? ChoPhepTuChoi { get; set; }
    public bool? ChoPhepBoQua { get; set; }
}

public class ChuyenTiepWorkflowListItemDto
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}

public class ChuyenTiepWorkflowCreateRequest
{
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}
