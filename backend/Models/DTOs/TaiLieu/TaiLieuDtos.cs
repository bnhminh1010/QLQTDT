namespace QLQTDT.Api.Models.DTOs.TaiLieu;

public class TaiLieuUploadResultDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = null!;
    public long Size { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
}

public class TaiLieuDto
{
    public int Id { get; set; }
    public string TenFile { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public int? GoiThauId { get; set; }
    public int? NguoiUploadId { get; set; }
    public DateTime NgayTao { get; set; }
}
