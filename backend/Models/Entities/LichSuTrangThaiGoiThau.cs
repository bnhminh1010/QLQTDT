namespace QLQTDT.Api.Models.Entities;

public class LichSuTrangThaiGoiThau
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string? TrangThaiCu { get; set; }
    public string TrangThaiMoi { get; set; } = null!;
    public int? NguoiThayDoiId { get; set; }
    public DateTime ThoiGianThayDoi { get; set; }
}
