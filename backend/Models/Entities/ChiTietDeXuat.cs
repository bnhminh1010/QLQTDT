namespace QLQTDT.Api.Models.Entities;

public class ChiTietDeXuat
{
    public long Id { get; set; }
    public long DeXuatId { get; set; }
    public string MaVatTu { get; set; } = null!;
    public string TenVatTu { get; set; } = null!;
    public string? DonViTinh { get; set; }
    public decimal SoLuong { get; set; }
    public decimal DonGiaDuToan { get; set; }

    /// <summary>
    /// Computed column: [SoLuong] * [DonGiaDuToan]
    /// Giá trị do DB tính, EF Core chỉ đọc.
    /// </summary>
    public decimal ThanhTien { get; set; }

    // Navigation
    public DeXuatMuaSam DeXuat { get; set; } = null!;
}
