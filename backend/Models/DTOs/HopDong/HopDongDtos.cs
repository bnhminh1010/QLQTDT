namespace QLQTDT.Api.Models.DTOs.HopDong;

public class CreateHopDongRequest
{
    public int GoiThauId { get; set; }
    public string SoHopDong { get; set; } = null!;
    public decimal TongGiaTri { get; set; }
    public DateTime NgayKy { get; set; }
    public List<int>? FileIds { get; set; }
}

public class HopDongListItemDto
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string TenGoiThau { get; set; } = null!;
    public string SoHopDong { get; set; } = null!;
    public decimal TongGiaTri { get; set; }
    public DateTime NgayKy { get; set; }
    public DateTime NgayTao { get; set; }
}

public class HopDongDetailDto
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string TenGoiThau { get; set; } = null!;
    public string SoHopDong { get; set; } = null!;
    public decimal TongGiaTri { get; set; }
    public DateTime NgayKy { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public List<TaiLieuTomTatDto> TaiLieus { get; set; } = [];
}

public class TaiLieuTomTatDto
{
    public int Id { get; set; }
    public string TenFile { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string ContentType { get; set; } = null!;
}
