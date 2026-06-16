namespace QLQTDT.Api.Models.Entities;

public class HopDong : IBaseEntity
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string SoHopDong { get; set; } = null!;
    public decimal TongGiaTri { get; set; }
    public DateTime NgayKy { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }

    public GoiThau? GoiThau { get; set; }
    public List<TaiLieuHoSo> TaiLieus { get; set; } = [];
}
