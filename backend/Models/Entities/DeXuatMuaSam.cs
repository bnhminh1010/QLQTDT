namespace QLQTDT.Api.Models.Entities;

public class DeXuatMuaSam
{
    public long Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaDeXuat { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string? MoTa { get; set; }
    public int KhoaPhongId { get; set; }
    public int NguoiDeXuatId { get; set; }
    public decimal TongDuToan { get; set; }
    public string TrangThai { get; set; } = "DRAFT";
    public DateTime NgayDeXuat { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public bool DaXoa { get; set; }

    // Navigation
    public KhoaPhong KhoaPhong { get; set; } = null!;
    public NguoiDung NguoiDeXuat { get; set; } = null!;
    public ICollection<ChiTietDeXuat> ChiTiet { get; set; } = [];
}
