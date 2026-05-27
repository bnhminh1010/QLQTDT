namespace QLQTDT.Api.Models.Entities;

public class NguoiDungKhoaPhongVaiTro
{
    public int Id { get; set; }

    public int NguoiDungId { get; set; }
    public NguoiDung NguoiDung { get; set; } = null!;

    public int? KhoaPhongId { get; set; }
    public KhoaPhong? KhoaPhong { get; set; }

    public int VaiTroId { get; set; }
    public VaiTro VaiTro { get; set; } = null!;

    public bool LaChinh { get; set; } = true;
}
