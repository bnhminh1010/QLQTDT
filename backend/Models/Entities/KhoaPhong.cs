namespace QLQTDT.Api.Models.Entities;

public class KhoaPhong
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public string MaKhoaPhong { get; set; } = null!;
    public bool DaXoa { get; set; }

    public ICollection<NguoiDungKhoaPhongVaiTro> NguoiDungKhoaPhongVaiTros { get; set; } = [];
}
