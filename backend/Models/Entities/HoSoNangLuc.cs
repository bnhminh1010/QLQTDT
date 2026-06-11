namespace QLQTDT.Api.Models.Entities;

public class HoSoNangLuc
{
    public long Id { get; set; }
    public int NhaThauId { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string TenFile { get; set; } = null!;
    public string DuongDanFile { get; set; } = null!;
    public DateTime? NgayHetHan { get; set; }

    public NhaThau? NhaThau { get; set; }
}
