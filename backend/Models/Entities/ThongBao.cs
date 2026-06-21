namespace QLQTDT.Api.Models.Entities;

public class ThongBao
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public int NguoiDungId { get; set; }
    public int? GoiThauId { get; set; }
    public string LoaiThongBao { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public bool DaDoc { get; set; }
    public string? UrlDieuHuong { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayDoc { get; set; }

    // Navigation
    public NguoiDung? NguoiDung { get; set; }
    public GoiThau? GoiThau { get; set; }
}
